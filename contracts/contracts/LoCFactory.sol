// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./LineOfCredit.sol";

/**
 * @title LoCFactory
 * @notice Factory for deploying Line of Credit contracts
 * @dev UUPS upgradeable contract with role-based access control
 */
contract LoCFactory is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    address public implementation;
    address public asset;
    address public creditRegistry;

    mapping(address => address) public userCreditLines;
    mapping(address => bool) public creditLines;

    event CreditLineCreated(address indexed user, address creditLine, uint256 limit);
    event ImplementationUpdated(address indexed oldImplementation, address indexed newImplementation);

    error LoCFactory_InvalidImplementation();
    error LoCFactory_InvalidLimit();
    error LoCFactory_Unauthorized();
    error LoCFactory_CreditLineExists();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _asset, address _creditRegistry, address _admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(FACTORY_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);

        asset = _asset;
        creditRegistry = _creditRegistry;
    }

    /**
     * @notice Create a new Line of Credit for user
     * @param user The user's address
     * @param limit The credit limit
     * @return The deployed credit line address
     */
    function createCreditLine(address user, uint256 limit) external onlyRole(FACTORY_ROLE) returns (address) {
        if (limit < 100 ether || limit > 10000 ether) revert LoCFactory_InvalidLimit();
        if (userCreditLines[user] != address(0)) revert LoCFactory_CreditLineExists();

        address creditLine = Clones.clone(implementation);
        LineOfCredit(creditLine).initialize(asset, creditRegistry, address(this));

        userCreditLines[user] = creditLine;
        creditLines[creditLine] = true;

        emit CreditLineCreated(user, creditLine, limit);

        return creditLine;
    }

    /**
     * @notice Get credit line for a user
     * @param user The user's address
     * @return The credit line address
     */
    function getCreditLineByUser(address user) external view returns (address) {
        return userCreditLines[user];
    }

    /**
     * @notice Check if address is a valid credit line
     * @param creditLine The credit line address
     * @return True if valid credit line
     */
    function isValidCreditLine(address creditLine) external view returns (bool) {
        return creditLines[creditLine];
    }

    /**
     * @notice Set implementation address
     * @param _implementation The new implementation address
     */
    function setImplementation(address _implementation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_implementation == address(0)) revert LoCFactory_InvalidImplementation();
        
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