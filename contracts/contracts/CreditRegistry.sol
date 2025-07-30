// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./ScoreOracle.sol";

/**
 * @title CreditRegistry
 * @notice Computes credit limits and APRs based on PD and pool utilization
 * @dev UUPS upgradeable contract with role-based access control
 */
contract CreditRegistry is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    bytes32 public constant REGISTRY_ROLE = keccak256("REGISTRY_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct CreditState {
        uint256 limit;        // Credit limit in wei
        uint256 apr;          // Annual percentage rate (basis points)
        uint256 utilization;  // Current utilization in wei
        uint256 lastUpdate;   // Last update timestamp
        bool isActive;        // Whether credit line is active
    }

    struct TierConfig {
        uint256 baseLimit;    // Base credit limit for tier
        uint256 baseAPR;      // Base APR for tier (basis points)
        uint256 maxUtilization; // Maximum utilization ratio (basis points)
    }

    ScoreOracle public scoreOracle;
    address public lendingPool;

    mapping(address => CreditState) public states;
    mapping(uint16 => TierConfig) public tierConfigs; // score tier -> config
    mapping(uint16 => uint256) public tierLimits;     // score -> limit
    mapping(uint16 => uint256) public baseAPRs;       // score -> base APR

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_APR = 5000; // 50% max APR
    uint256 public constant MIN_APR = 500;  // 5% min APR
    uint256 public constant UTILIZATION_MULTIPLIER = 2000; // 20% APR increase per 100% utilization

    event CreditStateUpdated(address indexed user, uint256 limit, uint256 apr, uint256 utilization);
    event TierConfigUpdated(uint16 score, uint256 baseLimit, uint256 baseAPR, uint256 maxUtilization);
    event LendingPoolUpdated(address indexed oldPool, address indexed newPool);

    error CreditRegistry_InvalidScore();
    error CreditRegistry_InvalidAPR();
    error CreditRegistry_InvalidLimit();
    error CreditRegistry_InvalidUtilization();
    error CreditRegistry_NoValidScore();
    error CreditRegistry_Unauthorized();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _scoreOracle, address _admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REGISTRY_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);

        scoreOracle = ScoreOracle(_scoreOracle);
        _initializeTierConfigs();
    }

    /**
     * @notice Get a user's complete credit state
     * @param user The user's address
     * @return The user's credit state
     */
    function getState(address user) external view returns (CreditState memory) {
        return states[user];
    }

    /**
     * @notice Compute credit limit from score
     * @param score The user's credit score (300-900)
     * @param pd_bps The probability of default in basis points
     * @return The computed credit limit
     */
    function computeLimit(uint16 score, uint16 pd_bps) external view returns (uint256) {
        if (score < 300 || score > 900) revert CreditRegistry_InvalidScore();
        
        uint16 tier = _getTier(score);
        TierConfig memory config = tierConfigs[tier];
        
        // Base limit from tier
        uint256 baseLimit = config.baseLimit;
        
        // Adjust for PD (higher PD = lower limit)
        uint256 pdAdjustment = BASIS_POINTS - uint256(pd_bps);
        uint256 adjustedLimit = (baseLimit * pdAdjustment) / BASIS_POINTS;
        
        return adjustedLimit;
    }

    /**
     * @notice Compute APR from PD and utilization
     * @param pd_bps The probability of default in basis points
     * @param utilization The pool utilization ratio (basis points)
     * @return The computed APR in basis points
     */
    function computeAPR(uint16 pd_bps, uint256 utilization) external pure returns (uint256) {
        if (pd_bps > BASIS_POINTS) revert CreditRegistry_InvalidAPR();
        if (utilization > BASIS_POINTS) revert CreditRegistry_InvalidUtilization();
        
        // Base APR from PD (higher PD = higher APR)
        uint256 baseAPR = MIN_APR + (uint256(pd_bps) * (MAX_APR - MIN_APR) / BASIS_POINTS);
        
        // Utilization adjustment (higher utilization = higher APR)
        uint256 utilizationAdjustment = (utilization * UTILIZATION_MULTIPLIER) / BASIS_POINTS;
        
        uint256 totalAPR = baseAPR + utilizationAdjustment;
        
        // Cap at maximum APR
        if (totalAPR > MAX_APR) totalAPR = MAX_APR;
        
        return totalAPR;
    }

    /**
     * @notice Update user's credit state based on score
     * @param user The user's address
     */
    function updateCreditState(address user) external onlyRole(REGISTRY_ROLE) nonReentrant {
        ScoreOracle.ScoreReport memory scoreReport = scoreOracle.getScore(user);
        
        uint256 limit = this.computeLimit(scoreReport.score, scoreReport.pd_bps);
        uint256 utilization = states[user].utilization;
        uint256 poolUtilization = _getPoolUtilization();
        uint256 apr = this.computeAPR(scoreReport.pd_bps, poolUtilization);
        
        states[user] = CreditState({
            limit: limit,
            apr: apr,
            utilization: utilization,
            lastUpdate: block.timestamp,
            isActive: true
        });
        
        emit CreditStateUpdated(user, limit, apr, utilization);
    }

    /**
     * @notice Update user's utilization
     * @param user The user's address
     * @param amount The amount to add/subtract
     * @param isBorrow True if borrowing, false if repaying
     */
    function updateUtilization(address user, uint256 amount, bool isBorrow) external onlyRole(REGISTRY_ROLE) nonReentrant {
        CreditState storage state = states[user];
        
        if (isBorrow) {
            state.utilization += amount;
            if (state.utilization > state.limit) revert CreditRegistry_InvalidUtilization();
        } else {
            if (amount > state.utilization) {
                state.utilization = 0;
            } else {
                state.utilization -= amount;
            }
        }
        
        state.lastUpdate = block.timestamp;
        
        emit CreditStateUpdated(user, state.limit, state.apr, state.utilization);
    }

    /**
     * @notice Set tier configuration
     * @param score The score threshold
     * @param baseLimit The base credit limit
     * @param baseAPR The base APR in basis points
     * @param maxUtilization The maximum utilization ratio
     */
    function setTierConfig(uint16 score, uint256 baseLimit, uint256 baseAPR, uint256 maxUtilization) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (baseAPR > MAX_APR) revert CreditRegistry_InvalidAPR();
        if (maxUtilization > BASIS_POINTS) revert CreditRegistry_InvalidUtilization();
        
        tierConfigs[score] = TierConfig({
            baseLimit: baseLimit,
            baseAPR: baseAPR,
            maxUtilization: maxUtilization
        });
        
        emit TierConfigUpdated(score, baseLimit, baseAPR, maxUtilization);
    }

    /**
     * @notice Set lending pool address
     * @param _lendingPool The lending pool address
     */
    function setLendingPool(address _lendingPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_lendingPool == address(0)) revert CreditRegistry_Unauthorized();
        
        address oldPool = lendingPool;
        lendingPool = _lendingPool;
        
        emit LendingPoolUpdated(oldPool, _lendingPool);
    }

    /**
     * @notice Check if user can borrow amount
     * @param user The user's address
     * @param amount The amount to borrow
     * @return True if user can borrow
     */
    function canBorrow(address user, uint256 amount) external view returns (bool) {
        CreditState memory state = states[user];
        return state.isActive && (state.utilization + amount) <= state.limit;
    }

    /**
     * @notice Get available credit for user
     * @param user The user's address
     * @return Available credit amount
     */
    function getAvailableCredit(address user) external view returns (uint256) {
        CreditState memory state = states[user];
        if (!state.isActive) return 0;
        return state.limit > state.utilization ? state.limit - state.utilization : 0;
    }

    /**
     * @dev Get tier from score
     */
    function _getTier(uint16 score) internal pure returns (uint16) {
        if (score >= 800) return 800; // Tier A
        if (score >= 700) return 700; // Tier B
        if (score >= 600) return 600; // Tier C
        if (score >= 500) return 500; // Tier D
        return 400; // Tier E
    }

    /**
     * @dev Get pool utilization from lending pool
     */
    function _getPoolUtilization() internal view returns (uint256) {
        if (lendingPool == address(0)) return 0;
        
        // This would call the lending pool's utilization function
        // For now, return a default value
        return 5000; // 50% default utilization
    }

    /**
     * @dev Initialize default tier configurations
     */
    function _initializeTierConfigs() internal {
        // Tier A (800-900): High limit, low APR
        tierConfigs[800] = TierConfig({
            baseLimit: 10000 ether,
            baseAPR: 800,  // 8%
            maxUtilization: 8000 // 80%
        });
        
        // Tier B (700-799): Medium-high limit, low-medium APR
        tierConfigs[700] = TierConfig({
            baseLimit: 5000 ether,
            baseAPR: 1200, // 12%
            maxUtilization: 7500 // 75%
        });
        
        // Tier C (600-699): Medium limit, medium APR
        tierConfigs[600] = TierConfig({
            baseLimit: 2500 ether,
            baseAPR: 1800, // 18%
            maxUtilization: 7000 // 70%
        });
        
        // Tier D (500-599): Low-medium limit, high APR
        tierConfigs[500] = TierConfig({
            baseLimit: 1000 ether,
            baseAPR: 2500, // 25%
            maxUtilization: 6500 // 65%
        });
        
        // Tier E (300-499): Low limit, very high APR
        tierConfigs[400] = TierConfig({
            baseLimit: 500 ether,
            baseAPR: 3500, // 35%
            maxUtilization: 6000 // 60%
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