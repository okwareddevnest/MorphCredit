// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @dev Thin wrapper so Hardhat has an artifact for getContractFactory
contract ERC1967ProxyWrapper is ERC1967Proxy {
    constructor(address _logic, bytes memory _data) ERC1967Proxy(_logic, _data) {}
}


