// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockStable
 * @notice ERC20 test token for development
 * @dev Mintable, burnable, 6 decimals like USDC
 */
contract MockStable is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    constructor(address initialOwner) ERC20("Mock USDC", "mUSDC") Ownable(initialOwner) {}

    /**
     * @notice Mint tokens to address
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from address
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @notice Get token decimals
     * @return Number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }
} 