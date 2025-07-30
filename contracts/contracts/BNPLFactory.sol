// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./BNPLAgreement.sol";

/**
 * @title BNPLFactory
 * @notice Factory for deploying BNPL agreements
 * @dev UUPS upgradeable contract with role-based access control
 */
contract BNPLFactory is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    address public implementation;
    address public asset;
    address public lendingPool;

    mapping(address => address[]) public userAgreements;
    mapping(address => bool) public agreements;

    event AgreementCreated(address indexed borrower, address indexed merchant, address agreement, uint256 principal);
    event ImplementationUpdated(address indexed oldImplementation, address indexed newImplementation);

    error BNPLFactory_InvalidImplementation();
    error BNPLFactory_InvalidAmount();
    error BNPLFactory_InvalidInstallments();
    error BNPLFactory_Unauthorized();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _asset, address _lendingPool, address _admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(FACTORY_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);

        asset = _asset;
        lendingPool = _lendingPool;
    }

    /**
     * @notice Create a new BNPL agreement
     * @param borrower The borrower's address
     * @param merchant The merchant's address
     * @param principal The principal amount
     * @param installments The number of installments
     * @param apr The annual percentage rate
     * @return The deployed agreement address
     */
    function createAgreement(
        address borrower,
        address merchant,
        uint256 principal,
        uint256 installments,
        uint256 apr
    ) external onlyRole(FACTORY_ROLE) returns (address) {
        if (principal == 0) revert BNPLFactory_InvalidAmount();
        if (installments == 0 || installments > 12) revert BNPLFactory_InvalidInstallments();
        if (apr > 5000) revert BNPLFactory_InvalidAmount(); // Max 50% APR

        address agreement = Clones.clone(implementation);
        BNPLAgreement(agreement).initialize(
            asset,
            lendingPool,
            borrower,
            merchant,
            principal,
            installments,
            apr,
            address(this)
        );

        userAgreements[borrower].push(agreement);
        agreements[agreement] = true;

        emit AgreementCreated(borrower, merchant, agreement, principal);

        return agreement;
    }

    /**
     * @notice Get all agreements for a user
     * @param user The user's address
     * @return Array of agreement addresses
     */
    function getAgreementsByUser(address user) external view returns (address[] memory) {
        return userAgreements[user];
    }

    /**
     * @notice Check if address is a valid agreement
     * @param agreement The agreement address
     * @return True if valid agreement
     */
    function isValidAgreement(address agreement) external view returns (bool) {
        return agreements[agreement];
    }

    /**
     * @notice Set implementation address
     * @param _implementation The new implementation address
     */
    function setImplementation(address _implementation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_implementation == address(0)) revert BNPLFactory_InvalidImplementation();
        
        address oldImplementation = implementation;
        implementation = _implementation;
        
        emit ImplementationUpdated(oldImplementation, _implementation);
    }

    /**
     * @notice Get implementation address
     * @return The implementation address
     */
    function getImplementation() external view returns (address) {
        return implementation;
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