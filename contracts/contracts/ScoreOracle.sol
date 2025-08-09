// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ScoreOracle
 * @notice Stores signed credit scores with ECDSA verification
 * @dev Simple non-upgradeable version for testing
 */
contract ScoreOracle is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct ScoreReport {
        uint16 score;         // 300..900
        uint16 pd_bps;        // 0..10000 (basis points)
        bytes32 featuresRoot; // Merkle root of feature commitments
        uint64 expiry;        // unix timestamp (30-day validity)
        bytes sig;           // ECDSA oracle signature
    }

    mapping(address => ScoreReport) public scores;
    address public oracleSigner;

    event ScoreSet(address indexed user, uint16 score, uint16 pd_bps, uint64 expiry);
    event OracleSignerUpdated(address indexed oldSigner, address indexed newSigner);

    error ScoreOracle_InvalidSignature();
    error ScoreOracle_ScoreExpired();
    error ScoreOracle_InvalidScore();
    error ScoreOracle_InvalidPD();
    error ScoreOracle_InvalidExpiry();

    constructor(address _oracleSigner, address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ORACLE_ROLE, _admin);
        oracleSigner = _oracleSigner;
    }

    /**
     * @notice Set a user's credit score with ECDSA signature verification
     * @param user The user's address
     * @param sr The signed score report
     */
    function setScore(address user, ScoreReport calldata sr) external onlyRole(ORACLE_ROLE) {
        _validateScoreReport(sr);
        _verifySignature(user, sr);
        scores[user] = sr;
        emit ScoreSet(user, sr.score, sr.pd_bps, sr.expiry);
    }

    /**
     * @notice Get a user's credit score
     * @param user The user's address
     * @return The user's score report
     */
    function getScore(address user) external view returns (ScoreReport memory) {
        ScoreReport memory score = scores[user];
        if (score.expiry == 0) revert ScoreOracle_ScoreExpired();
        if (block.timestamp > score.expiry) revert ScoreOracle_ScoreExpired();
        return score;
    }

    /**
     * @notice Check if a user has a valid score
     * @param user The user's address
     * @return True if user has valid score
     */
    function hasValidScore(address user) external view returns (bool) {
        ScoreReport memory score = scores[user];
        return score.expiry > 0 && block.timestamp <= score.expiry;
    }

    /**
     * @notice Update the oracle signer address
     * @param newSigner The new oracle signer address
     */
    function setOracleSigner(address newSigner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newSigner == address(0)) revert ScoreOracle_InvalidSignature();
        
        address oldSigner = oracleSigner;
        oracleSigner = newSigner;
        
        emit OracleSignerUpdated(oldSigner, newSigner);
    }

    /**
     * @notice Get the current oracle signer address
     * @return The oracle signer address
     */
    function getOracleSigner() external view returns (address) {
        return oracleSigner;
    }

    /**
     * @dev Validates the score report parameters
     */
    function _validateScoreReport(ScoreReport calldata sr) internal view {
        if (sr.score < 300 || sr.score > 900) revert ScoreOracle_InvalidScore();
        if (sr.pd_bps > 10000) revert ScoreOracle_InvalidPD();
        if (sr.expiry <= block.timestamp) revert ScoreOracle_InvalidExpiry();
    }

    /**
     * @dev Verifies the ECDSA signature of the score report
     */
    function _verifySignature(address user, ScoreReport calldata sr) internal view {
        bytes32 messageHash = keccak256(abi.encodePacked(
            "MorphCredit Score Report",
            user,
            sr.score,
            sr.pd_bps,
            sr.featuresRoot,
            sr.expiry
        ));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, sr.sig);
        if (recoveredSigner != oracleSigner) revert ScoreOracle_InvalidSignature();
    }
} 