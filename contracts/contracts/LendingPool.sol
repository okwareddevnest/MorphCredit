// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./CreditRegistry.sol";

/**
 * @title LendingPool
 * @notice ERC4626-like two-tranche liquidity pool with interest accrual and reserve management
 * @dev UUPS upgradeable contract with role-based access control
 */
contract LendingPool is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    bytes32 public constant POOL_ROLE = keccak256("POOL_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct PoolState {
        uint256 totalAssets;      // Total assets in pool
        uint256 totalShares;      // Total shares minted
        uint256 seniorShares;     // Senior tranche shares
        uint256 juniorShares;     // Junior tranche shares
        uint256 reserve;          // Reserve buffer
        uint256 lastAccrual;      // Last interest accrual timestamp
        uint256 utilization;      // Current utilization ratio (basis points)
        uint256 totalBorrowed;    // Total amount borrowed
    }

    struct TrancheConfig {
        uint256 seniorRatio;      // Senior tranche ratio (basis points)
        uint256 reserveRatio;     // Reserve ratio (basis points)
        uint256 maxUtilization;   // Maximum utilization (basis points)
        uint256 minReserve;       // Minimum reserve amount
    }

    IERC20 public asset;
    CreditRegistry public creditRegistry;

    PoolState public poolState;
    TrancheConfig public config;

    mapping(address => uint256) public shares;
    mapping(address => uint256) public borrowed;

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MIN_SENIOR_RATIO = 6000; // 60%
    uint256 public constant MAX_SENIOR_RATIO = 8000; // 80%
    uint256 public constant DEFAULT_RESERVE_RATIO = 2500; // 25%
    uint256 public constant MAX_UTILIZATION = 8500; // 85%

    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event InterestAccrued(uint256 amount, uint256 timestamp);
    event ReserveUpdated(uint256 oldReserve, uint256 newReserve);
    event UtilizationUpdated(uint256 oldUtilization, uint256 newUtilization);

    error LendingPool_InvalidAmount();
    error LendingPool_InsufficientLiquidity();
    error LendingPool_ExceedsUtilization();
    error LendingPool_Unauthorized();
    error LendingPool_InvalidConfig();
    error LendingPool_InvalidTrancheRatio();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _asset,
        address _creditRegistry,
        address _admin
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(POOL_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);

        asset = IERC20(_asset);
        creditRegistry = CreditRegistry(_creditRegistry);

        _initializeConfig();
        poolState.lastAccrual = block.timestamp;
    }

    /**
     * @notice Deposit assets and receive shares
     * @param assets Amount of assets to deposit
     * @param receiver Address to receive shares
     * @return sharesAmount Amount of shares minted
     */
    function deposit(uint256 assets, address receiver) external nonReentrant returns (uint256 sharesAmount) {
        if (assets == 0) revert LendingPool_InvalidAmount();
        if (receiver == address(0)) revert LendingPool_InvalidAmount();

        _accrueInterest();

        sharesAmount = _convertToShares(assets);
        if (sharesAmount == 0) revert LendingPool_InvalidAmount();

        poolState.totalAssets += assets;
        poolState.totalShares += sharesAmount;
        poolState.seniorShares += sharesAmount;

        _mint(receiver, sharesAmount);
        asset.safeTransferFrom(msg.sender, address(this), assets);

        emit Deposit(receiver, assets, sharesAmount);
    }

    /**
     * @notice Withdraw assets by burning shares
     * @param sharesAmount Amount of shares to burn
     * @param receiver Address to receive assets
     * @return assets Amount of assets withdrawn
     */
    function withdraw(uint256 sharesAmount, address receiver) external nonReentrant returns (uint256 assets) {
        if (sharesAmount == 0) revert LendingPool_InvalidAmount();
        if (receiver == address(0)) revert LendingPool_InvalidAmount();
        if (sharesAmount > shares[msg.sender]) revert LendingPool_InsufficientLiquidity();

        _accrueInterest();

        assets = _convertToAssets(sharesAmount);
        if (assets == 0) revert LendingPool_InvalidAmount();

        // Check reserve requirements
        uint256 newReserve = poolState.reserve;
        if (assets > poolState.totalAssets - newReserve) revert LendingPool_InsufficientLiquidity();

        poolState.totalAssets -= assets;
        poolState.totalShares -= sharesAmount;
        poolState.seniorShares -= sharesAmount;

        _burn(msg.sender, sharesAmount);
        asset.safeTransfer(receiver, assets);

        emit Withdraw(receiver, assets, sharesAmount);
    }

    /**
     * @notice Borrow assets from the pool
     * @param amount Amount to borrow
     */
    function borrow(uint256 amount) external nonReentrant {
        if (amount == 0) revert LendingPool_InvalidAmount();
        if (!creditRegistry.canBorrow(msg.sender, amount)) revert LendingPool_Unauthorized();

        _accrueInterest();

        // Check utilization limits
        uint256 newUtilization = _calculateUtilization(amount);
        if (newUtilization > config.maxUtilization) revert LendingPool_ExceedsUtilization();

        // Check liquidity
        uint256 availableLiquidity = poolState.totalAssets - poolState.reserve;
        if (amount > availableLiquidity) revert LendingPool_InsufficientLiquidity();

        poolState.totalBorrowed += amount;
        borrowed[msg.sender] += amount;

        // Update credit registry
        creditRegistry.updateUtilization(msg.sender, amount, true);

        asset.safeTransfer(msg.sender, amount);

        emit Borrow(msg.sender, amount);
    }

    /**
     * @notice Repay borrowed amount
     * @param amount Amount to repay
     */
    function repay(uint256 amount) external nonReentrant {
        if (amount == 0) revert LendingPool_InvalidAmount();
        if (amount > borrowed[msg.sender]) revert LendingPool_InvalidAmount();

        _accrueInterest();

        poolState.totalBorrowed -= amount;
        borrowed[msg.sender] -= amount;

        // Update credit registry
        creditRegistry.updateUtilization(msg.sender, amount, false);

        asset.safeTransferFrom(msg.sender, address(this), amount);

        emit Repay(msg.sender, amount);
    }

    /**
     * @notice Get current utilization ratio
     * @return Utilization ratio in basis points
     */
    function utilization() external view returns (uint256) {
        return poolState.utilization;
    }

    /**
     * @notice Get total assets in pool
     * @return Total assets
     */
    function totalAssets() external view returns (uint256) {
        return poolState.totalAssets;
    }

    /**
     * @notice Get total shares
     * @return Total shares
     */
    function totalShares() external view returns (uint256) {
        return poolState.totalShares;
    }

    /**
     * @notice Convert assets to shares
     * @param assets Amount of assets
     * @return sharesAmount Amount of shares
     */
    function convertToShares(uint256 assets) external view returns (uint256 sharesAmount) {
        return _convertToShares(assets);
    }

    /**
     * @notice Convert shares to assets
     * @param sharesAmount Amount of shares
     * @return assets Amount of assets
     */
    function convertToAssets(uint256 sharesAmount) external view returns (uint256 assets) {
        return _convertToAssets(sharesAmount);
    }

    /**
     * @notice Get pool state
     * @return Current pool state
     */
    function getPoolState() external view returns (PoolState memory) {
        return poolState;
    }

    /**
     * @notice Set pool configuration
     * @param seniorRatio Senior tranche ratio
     * @param reserveRatio Reserve ratio
     * @param maxUtilization Maximum utilization
     */
    function setConfig(uint256 seniorRatio, uint256 reserveRatio, uint256 maxUtilization) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (seniorRatio < MIN_SENIOR_RATIO || seniorRatio > MAX_SENIOR_RATIO) revert LendingPool_InvalidTrancheRatio();
        if (reserveRatio > BASIS_POINTS) revert LendingPool_InvalidConfig();
        if (maxUtilization > MAX_UTILIZATION) revert LendingPool_InvalidConfig();

        config.seniorRatio = seniorRatio;
        config.reserveRatio = reserveRatio;
        config.maxUtilization = maxUtilization;
    }

    /**
     * @dev Accrue interest on borrowed amounts
     */
    function _accrueInterest() internal {
        uint256 timeElapsed = block.timestamp - poolState.lastAccrual;
        if (timeElapsed == 0) return;

        uint256 interestAccrued = _calculateInterest(timeElapsed);
        if (interestAccrued > 0) {
            poolState.totalAssets += interestAccrued;
            poolState.lastAccrual = block.timestamp;

            emit InterestAccrued(interestAccrued, block.timestamp);
        }
    }

    /**
     * @dev Calculate interest for time period
     */
    function _calculateInterest(uint256 timeElapsed) internal view returns (uint256) {
        if (poolState.totalBorrowed == 0) return 0;

        // Simple interest calculation (can be enhanced with compound interest)
        uint256 avgAPR = 1500; // 15% average APR
        return (poolState.totalBorrowed * avgAPR * timeElapsed) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }

    /**
     * @dev Convert assets to shares
     */
    function _convertToShares(uint256 assets) internal view returns (uint256) {
        if (poolState.totalAssets == 0) return assets;
        return assets.mulDiv(poolState.totalShares, poolState.totalAssets, Math.Rounding.Floor);
    }

    /**
     * @dev Convert shares to assets
     */
    function _convertToAssets(uint256 sharesAmount) internal view returns (uint256) {
        if (poolState.totalShares == 0) return 0;
        return sharesAmount.mulDiv(poolState.totalAssets, poolState.totalShares, Math.Rounding.Floor);
    }

    /**
     * @dev Calculate utilization with new borrow
     */
    function _calculateUtilization(uint256 newBorrow) internal view returns (uint256) {
        uint256 totalBorrowed = poolState.totalBorrowed + newBorrow;
        if (poolState.totalAssets == 0) return 0;
        return (totalBorrowed * BASIS_POINTS) / poolState.totalAssets;
    }

    /**
     * @dev Mint shares to address
     */
    function _mint(address to, uint256 amount) internal {
        shares[to] += amount;
    }

    /**
     * @dev Burn shares from address
     */
    function _burn(address from, uint256 amount) internal {
        shares[from] -= amount;
    }

    /**
     * @dev Initialize default configuration
     */
    function _initializeConfig() internal {
        config = TrancheConfig({
            seniorRatio: 7000,    // 70% senior tranche
            reserveRatio: 2500,   // 25% reserve
            maxUtilization: 8500, // 85% max utilization
            minReserve: 1000 ether
        });
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