// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CreditRegistry.sol";

/**
 * @title LineOfCredit
 * @notice Minimal revolving credit facility with role-gated access
 * @dev UUPS upgradeable contract with role-based access control
 */
contract LineOfCredit is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant REGISTRY_ROLE = keccak256("REGISTRY_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct CreditLine {
        uint256 limit;             // Credit limit
        uint256 drawn;             // Amount currently drawn
        uint256 apr;               // Annual percentage rate (basis points)
        uint256 lastDraw;          // Last draw timestamp
        uint256 lastRepayment;     // Last repayment timestamp
        bool isActive;             // Whether credit line is active
        uint256 gracePeriod;       // Grace period for repayments
        uint256 penaltyRate;       // Penalty rate for late payments
    }

    IERC20 public asset;
    CreditRegistry public creditRegistry;

    mapping(address => CreditLine) public creditLines;
    mapping(address => uint256) public totalInterestAccrued;

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DEFAULT_GRACE_PERIOD = 30 days;
    uint256 public constant DEFAULT_PENALTY_RATE = 500; // 5% penalty
    uint256 public constant MIN_CREDIT_LIMIT = 100 ether;
    uint256 public constant MAX_CREDIT_LIMIT = 10000 ether;

    event CreditLineOpened(address indexed user, uint256 limit, uint256 apr);
    event CreditLineDrawn(address indexed user, uint256 amount);
    event CreditLineRepaid(address indexed user, uint256 amount);
    event CreditLineClosed(address indexed user);
    event InterestAccrued(address indexed user, uint256 amount);

    error LineOfCredit_InvalidLimit();
    error LineOfCredit_InvalidAmount();
    error LineOfCredit_Unauthorized();
    error LineOfCredit_CreditLineNotActive();
    error LineOfCredit_InsufficientCredit();
    error LineOfCredit_ExceedsLimit();
    error LineOfCredit_NoCreditLine();
    error LineOfCredit_AlreadyActive();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _asset, address _creditRegistry, address _admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REGISTRY_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);

        asset = IERC20(_asset);
        creditRegistry = CreditRegistry(_creditRegistry);
    }

    /**
     * @notice Open a credit line for user (role-gated)
     * @param user The user's address
     * @param limit The credit limit
     */
    function openCreditLine(address user, uint256 limit) external onlyRole(REGISTRY_ROLE) nonReentrant {
        if (limit < MIN_CREDIT_LIMIT || limit > MAX_CREDIT_LIMIT) revert LineOfCredit_InvalidLimit();
        if (creditLines[user].isActive) revert LineOfCredit_AlreadyActive();

        // Get user's credit state from registry
        CreditRegistry.CreditState memory state = creditRegistry.getState(user);
        if (!state.isActive) revert LineOfCredit_Unauthorized();

        // Use registry's APR
        uint256 apr = state.apr;

        creditLines[user] = CreditLine({
            limit: limit,
            drawn: 0,
            apr: apr,
            lastDraw: 0,
            lastRepayment: 0,
            isActive: true,
            gracePeriod: DEFAULT_GRACE_PERIOD,
            penaltyRate: DEFAULT_PENALTY_RATE
        });

        emit CreditLineOpened(user, limit, apr);
    }

    /**
     * @notice Draw from credit line
     * @param amount Amount to draw
     */
    function draw(uint256 amount) external nonReentrant {
        if (amount == 0) revert LineOfCredit_InvalidAmount();
        if (!creditLines[msg.sender].isActive) revert LineOfCredit_CreditLineNotActive();

        CreditLine storage line = creditLines[msg.sender];
        
        if (line.drawn + amount > line.limit) revert LineOfCredit_ExceedsLimit();

        // Accrue interest before drawing
        _accrueInterest(msg.sender);

        line.drawn += amount;
        line.lastDraw = block.timestamp;

        // Transfer assets to user
        asset.safeTransfer(msg.sender, amount);

        emit CreditLineDrawn(msg.sender, amount);
    }

    /**
     * @notice Repay credit line
     * @param amount Amount to repay
     */
    function repay(uint256 amount) external nonReentrant {
        if (amount == 0) revert LineOfCredit_InvalidAmount();
        if (!creditLines[msg.sender].isActive) revert LineOfCredit_CreditLineNotActive();

        CreditLine storage line = creditLines[msg.sender];
        
        if (amount > line.drawn) revert LineOfCredit_InvalidAmount();

        // Accrue interest before repayment
        _accrueInterest(msg.sender);

        // Transfer assets from user
        asset.safeTransferFrom(msg.sender, address(this), amount);

        line.drawn -= amount;
        line.lastRepayment = block.timestamp;

        emit CreditLineRepaid(msg.sender, amount);
    }

    /**
     * @notice Close credit line
     */
    function close() external nonReentrant {
        CreditLine storage line = creditLines[msg.sender];
        if (!line.isActive) revert LineOfCredit_NoCreditLine();
        if (line.drawn > 0) revert LineOfCredit_InsufficientCredit();

        line.isActive = false;

        emit CreditLineClosed(msg.sender);
    }

    /**
     * @notice Get credit line details
     * @param user The user's address
     * @return The credit line struct
     */
    function getCreditLine(address user) external view returns (CreditLine memory) {
        return creditLines[user];
    }

    /**
     * @notice Get available credit for user
     * @param user The user's address
     * @return Available credit amount
     */
    function getAvailableCredit(address user) external view returns (uint256) {
        CreditLine memory line = creditLines[user];
        if (!line.isActive) return 0;
        return line.limit > line.drawn ? line.limit - line.drawn : 0;
    }

    /**
     * @notice Calculate accrued interest for user
     * @param user The user's address
     * @return Accrued interest amount
     */
    function calculateAccruedInterest(address user) external view returns (uint256) {
        return _calculateAccruedInterest(user);
    }

    /**
     * @notice Get total outstanding balance including interest
     * @param user The user's address
     * @return Total outstanding balance
     */
    function getOutstandingBalance(address user) external view returns (uint256) {
        CreditLine memory line = creditLines[user];
        if (!line.isActive) return 0;
        
        uint256 accruedInterest = _calculateAccruedInterest(user);
        return line.drawn + accruedInterest;
    }

    /**
     * @notice Update credit line limit (role-gated)
     * @param user The user's address
     * @param newLimit The new credit limit
     */
    function updateCreditLimit(address user, uint256 newLimit) external onlyRole(REGISTRY_ROLE) {
        if (newLimit < MIN_CREDIT_LIMIT || newLimit > MAX_CREDIT_LIMIT) revert LineOfCredit_InvalidLimit();
        
        CreditLine storage line = creditLines[user];
        if (!line.isActive) revert LineOfCredit_NoCreditLine();
        if (newLimit < line.drawn) revert LineOfCredit_InvalidLimit();

        line.limit = newLimit;
    }

    /**
     * @notice Update credit line APR (role-gated)
     * @param user The user's address
     * @param newAPR The new APR in basis points
     */
    function updateAPR(address user, uint256 newAPR) external onlyRole(REGISTRY_ROLE) {
        if (newAPR > 5000) revert LineOfCredit_InvalidAmount(); // Max 50% APR
        
        CreditLine storage line = creditLines[user];
        if (!line.isActive) revert LineOfCredit_NoCreditLine();

        line.apr = newAPR;
    }

    /**
     * @notice Check if user can draw amount
     * @param user The user's address
     * @param amount The amount to draw
     * @return True if user can draw
     */
    function canDraw(address user, uint256 amount) external view returns (bool) {
        CreditLine memory line = creditLines[user];
        return line.isActive && (line.drawn + amount) <= line.limit;
    }

    /**
     * @dev Accrue interest for user
     */
    function _accrueInterest(address user) internal {
        CreditLine storage line = creditLines[user];
        if (!line.isActive || line.drawn == 0) return;

        uint256 accruedInterest = _calculateAccruedInterest(user);
        if (accruedInterest > 0) {
            totalInterestAccrued[user] += accruedInterest;
            emit InterestAccrued(user, accruedInterest);
        }
    }

    /**
     * @dev Calculate accrued interest for user
     */
    function _calculateAccruedInterest(address user) internal view returns (uint256) {
        CreditLine memory line = creditLines[user];
        if (!line.isActive || line.drawn == 0) return 0;

        uint256 lastActivity = line.lastDraw > line.lastRepayment ? line.lastDraw : line.lastRepayment;
        if (lastActivity == 0) return 0;

        uint256 timeElapsed = block.timestamp - lastActivity;
        if (timeElapsed == 0) return 0;

        // Simple interest calculation
        uint256 interest = (line.drawn * line.apr * timeElapsed) / (BASIS_POINTS * 365 days);
        return interest;
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