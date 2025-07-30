// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./LendingPool.sol";

/**
 * @title BNPLAgreement
 * @notice Per-purchase installment contract with merchant payment
 * @dev UUPS upgradeable contract with role-based access control
 */
contract BNPLAgreement is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct Agreement {
        uint256 principal;           // Total principal amount
        address borrower;            // Borrower address
        address merchant;            // Merchant address
        uint256 installments;        // Number of installments
        uint256 installmentAmount;   // Amount per installment
        uint256 apr;                 // Annual percentage rate (basis points)
        uint256 penaltyRate;         // Late payment penalty rate (basis points)
        uint256[] dueDates;          // Due dates for each installment
        AgreementStatus status;      // Current status
        uint256 paidInstallments;    // Number of paid installments
        uint256 lastPaymentDate;     // Last payment timestamp
        uint256 gracePeriod;         // Grace period in seconds
        uint256 writeOffPeriod;      // Write-off period in seconds
    }

    struct Installment {
        uint256 id;                  // Installment ID
        uint256 amount;              // Amount due
        uint256 dueDate;             // Due date
        bool isPaid;                 // Payment status
        uint256 paidAt;              // Payment timestamp
        uint256 penaltyAccrued;      // Penalty amount accrued
    }

    enum AgreementStatus {
        Pending,    // Agreement created, not funded
        Active,     // Agreement funded, active
        Completed,  // All installments paid
        Defaulted,  // Past write-off period
        WrittenOff  // Written off due to default
    }

    IERC20 public asset;
    LendingPool public lendingPool;
    address public factory;

    Agreement public agreement;
    mapping(uint256 => Installment) public installments;

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DEFAULT_GRACE_PERIOD = 5 days;
    uint256 public constant DEFAULT_WRITE_OFF_PERIOD = 60 days;
    uint256 public constant DEFAULT_PENALTY_RATE = 1000; // 10% penalty

    event AgreementFunded(address indexed borrower, address indexed merchant, uint256 principal);
    event InstallmentPaid(address indexed borrower, uint256 installmentId, uint256 amount);
    event AgreementCompleted(address indexed borrower);
    event AgreementDefaulted(address indexed borrower);
    event AgreementWrittenOff(address indexed borrower);

    error BNPLAgreement_InvalidAmount();
    error BNPLAgreement_InvalidInstallments();
    error BNPLAgreement_InvalidAPR();
    error BNPLAgreement_Unauthorized();
    error BNPLAgreement_AlreadyFunded();
    error BNPLAgreement_NotFunded();
    error BNPLAgreement_InvalidInstallment();
    error BNPLAgreement_InstallmentAlreadyPaid();
    error BNPLAgreement_AgreementCompleted();
    error BNPLAgreement_AgreementDefaulted();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _asset,
        address _lendingPool,
        address _borrower,
        address _merchant,
        uint256 _principal,
        uint256 _installments,
        uint256 _apr,
        address _factory
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _factory);
        _grantRole(FACTORY_ROLE, _factory);
        _grantRole(UPGRADER_ROLE, _factory);

        asset = IERC20(_asset);
        lendingPool = LendingPool(_lendingPool);
        factory = _factory;

        if (_principal == 0) revert BNPLAgreement_InvalidAmount();
        if (_installments == 0 || _installments > 12) revert BNPLAgreement_InvalidInstallments();
        if (_apr > 5000) revert BNPLAgreement_InvalidAPR(); // Max 50% APR

        uint256 installmentAmount = _principal / _installments;
        uint256[] memory dueDates = new uint256[](_installments);

        // Calculate due dates (bi-weekly)
        for (uint256 i = 0; i < _installments; i++) {
            dueDates[i] = block.timestamp + (i + 1) * 14 days;
        }

        agreement = Agreement({
            principal: _principal,
            borrower: _borrower,
            merchant: _merchant,
            installments: _installments,
            installmentAmount: installmentAmount,
            apr: _apr,
            penaltyRate: DEFAULT_PENALTY_RATE,
            dueDates: dueDates,
            status: AgreementStatus.Pending,
            paidInstallments: 0,
            lastPaymentDate: 0,
            gracePeriod: DEFAULT_GRACE_PERIOD,
            writeOffPeriod: DEFAULT_WRITE_OFF_PERIOD
        });

        _initializeInstallments();
    }

    /**
     * @notice Fund the agreement and pay merchant
     */
    function fund() external nonReentrant {
        if (agreement.status != AgreementStatus.Pending) revert BNPLAgreement_AlreadyFunded();
        if (msg.sender != agreement.borrower) revert BNPLAgreement_Unauthorized();

        // Borrow from lending pool
        lendingPool.borrow(agreement.principal);

        // Pay merchant
        asset.safeTransfer(agreement.merchant, agreement.principal);

        agreement.status = AgreementStatus.Active;
        agreement.lastPaymentDate = block.timestamp;

        emit AgreementFunded(agreement.borrower, agreement.merchant, agreement.principal);
    }

    /**
     * @notice Pay a specific installment
     * @param installmentId The installment ID to pay
     */
    function repay(uint256 installmentId) external nonReentrant {
        if (agreement.status != AgreementStatus.Active) revert BNPLAgreement_NotFunded();
        if (installmentId >= agreement.installments) revert BNPLAgreement_InvalidInstallment();
        if (installments[installmentId].isPaid) revert BNPLAgreement_InstallmentAlreadyPaid();

        Installment storage installment = installments[installmentId];
        uint256 amountDue = installment.amount;
        uint256 penalty = _calculatePenalty(installmentId);
        uint256 totalAmount = amountDue + penalty;

        // Transfer payment from borrower
        asset.safeTransferFrom(msg.sender, address(this), totalAmount);

        // Mark installment as paid
        installment.isPaid = true;
        installment.paidAt = block.timestamp;
        installment.penaltyAccrued = penalty;

        agreement.paidInstallments++;
        agreement.lastPaymentDate = block.timestamp;

        // Repay lending pool
        lendingPool.repay(amountDue);

        emit InstallmentPaid(agreement.borrower, installmentId, amountDue);

        // Check if agreement is completed
        if (agreement.paidInstallments == agreement.installments) {
            agreement.status = AgreementStatus.Completed;
            emit AgreementCompleted(agreement.borrower);
        }
    }

    /**
     * @notice Get agreement details
     * @return The agreement struct
     */
    function getAgreement() external view returns (Agreement memory) {
        return agreement;
    }

    /**
     * @notice Get installment details
     * @param id The installment ID
     * @return The installment struct
     */
    function getInstallment(uint256 id) external view returns (Installment memory) {
        return installments[id];
    }

    /**
     * @notice Get all installments
     * @return Array of all installments
     */
    function getAllInstallments() external view returns (Installment[] memory) {
        Installment[] memory allInstallments = new Installment[](agreement.installments);
        for (uint256 i = 0; i < agreement.installments; i++) {
            allInstallments[i] = installments[i];
        }
        return allInstallments;
    }

    /**
     * @notice Check if installment is overdue
     * @param installmentId The installment ID
     * @return True if overdue
     */
    function isOverdue(uint256 installmentId) external view returns (bool) {
        if (installmentId >= agreement.installments) return false;
        if (installments[installmentId].isPaid) return false;

        Installment memory installment = installments[installmentId];
        return block.timestamp > installment.dueDate + agreement.gracePeriod;
    }

    /**
     * @notice Calculate penalty for overdue installment
     * @param installmentId The installment ID
     * @return Penalty amount
     */
    function calculatePenalty(uint256 installmentId) external view returns (uint256) {
        return _calculatePenalty(installmentId);
    }

    /**
     * @notice Get next due installment
     * @return Next installment ID and due date
     */
    function getNextDueInstallment() external view returns (uint256, uint256) {
        for (uint256 i = 0; i < agreement.installments; i++) {
            if (!installments[i].isPaid) {
                return (i, installments[i].dueDate);
            }
        }
        return (type(uint256).max, 0);
    }

    /**
     * @notice Check if agreement should be defaulted
     * @return True if should be defaulted
     */
    function shouldDefault() external view returns (bool) {
        if (agreement.status != AgreementStatus.Active) return false;

        for (uint256 i = 0; i < agreement.installments; i++) {
            Installment memory installment = installments[i];
            if (!installment.isPaid && 
                block.timestamp > installment.dueDate + agreement.writeOffPeriod) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Mark agreement as defaulted (called by factory)
     */
    function markDefaulted() external onlyRole(FACTORY_ROLE) {
        if (agreement.status != AgreementStatus.Active) revert BNPLAgreement_AgreementCompleted();
        
        agreement.status = AgreementStatus.Defaulted;
        emit AgreementDefaulted(agreement.borrower);
    }

    /**
     * @notice Write off defaulted agreement (called by factory)
     */
    function writeOff() external onlyRole(FACTORY_ROLE) {
        if (agreement.status != AgreementStatus.Defaulted) revert BNPLAgreement_AgreementDefaulted();
        
        agreement.status = AgreementStatus.WrittenOff;
        emit AgreementWrittenOff(agreement.borrower);
    }

    /**
     * @dev Initialize installments
     */
    function _initializeInstallments() internal {
        for (uint256 i = 0; i < agreement.installments; i++) {
            installments[i] = Installment({
                id: i,
                amount: agreement.installmentAmount,
                dueDate: agreement.dueDates[i],
                isPaid: false,
                paidAt: 0,
                penaltyAccrued: 0
            });
        }
    }

    /**
     * @dev Calculate penalty for overdue installment
     */
    function _calculatePenalty(uint256 installmentId) internal view returns (uint256) {
        Installment memory installment = installments[installmentId];
        if (installment.isPaid) return 0;

        uint256 overdueTime = 0;
        if (block.timestamp > installment.dueDate + agreement.gracePeriod) {
            overdueTime = block.timestamp - installment.dueDate - agreement.gracePeriod;
        }

        if (overdueTime == 0) return 0;

        // Simple penalty calculation (can be enhanced)
        uint256 penaltyRate = agreement.penaltyRate;
        uint256 penalty = (installment.amount * penaltyRate * overdueTime) / (BASIS_POINTS * 365 days);

        return penalty;
    }

    /**
     * @dev Required by the OZ UUPS module
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Required by the OZ AccessControl module
     */
    function supportsInterface(bytes4 interfaceId) public view override(AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 