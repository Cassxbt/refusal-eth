// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RefusalGateway — verdict-gated settlement for ENS agent namespaces
/// @notice No valid ALLOW verdict signature from verdictKey = no execution. Revocation enforced onchain.
/// @dev ENSv2 resolution happens offchain (viem, Sepolia). REF-02/REF-03 originate in the
///  TEE receipt; this contract enforces REF-01 + verdict authenticity as second layer.
///  Error naming: offchain receipts use hyphen form ("REF-01"); Solidity errors use
///  underscore form (REF_01_*). `YieldRefused.reason` is ASCII bytes4: 'RF01'..'RF04'.
contract RefusalGateway {
    error REF_01_REVOKED_NAME();
    error REF_02_SEALED_LIMIT_BREACH(uint256 amount, uint256 sealedMax);
    error REF_03_ALLOWLIST_MISS(address to);
    error REF_04_HUMAN_DENIED_TIMEOUT();
    error BAD_VERDICT();
    error REPLAY();
    error ZERO_VERDICT_KEY();
    error EMPTY_AGENT_NAME();
    error DEADLINE_EXPIRED(uint256 deadline);
    error NONCE_USED();
    error LEGACY_EXECUTE_DISABLED();

    event YieldAllowed(bytes32 indexed proofId, string agentENS, address to, uint256 amount, bytes verdictSig);
    event YieldRefused(bytes32 indexed proofId, string agentENS, address to, uint256 amount, bytes4 reason);

    address public owner;
    address public verdictKey;
    mapping(string => bool) public revoked;
    mapping(bytes32 => bool) public revokedByNameHash;
    mapping(bytes32 => bool) public used;
    mapping(bytes32 => bool) public usedNonces;

    constructor(address _verdictKey) {
        if (_verdictKey == address(0)) revert ZERO_VERDICT_KEY();
        owner = msg.sender;
        verdictKey = _verdictKey;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    function revoke(string calldata agentENS) external onlyOwner {
        if (bytes(agentENS).length == 0) revert EMPTY_AGENT_NAME();
        revoked[agentENS] = true;
        bytes32 nameHash = _canonicalNameHash(agentENS);
        revokedByNameHash[nameHash] = true;
        emit NameRevoked(nameHash, agentENS);
    }

    event NameRevoked(bytes32 indexed nameHash, string agentENS);

    /// @notice Execute only with a fresh ALLOW verdict signature over the intent hash.
    /// @dev proofId binds agentENS+to+amount+chain+contract; single-use (replay-safe).
    function execute(
        string calldata,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes32 proofId) {
        // A signature without an expiry can remain valid forever. Keep the
        // selector for ABI compatibility, but disable the unsafe path before
        // deployment; callers must use executeWithDeadline instead.
        revert LEGACY_EXECUTE_DISABLED();
    }

    /// @notice Deadline- and nonce-bound variant for signed verdicts.
    /// @dev The original execute API remains available for compatibility. New callers should use this variant.
    function executeWithDeadline(
        string calldata agentENS,
        address to,
        uint256 amount,
        uint256 deadline,
        bytes32 nonce,
        bytes calldata verdictSig
    ) external returns (bytes32 proofId) {
        if (block.timestamp > deadline) revert DEADLINE_EXPIRED(deadline);
        if (usedNonces[nonce]) revert NONCE_USED();
        proofId = keccak256(abi.encodePacked(agentENS, to, amount, deadline, nonce, block.chainid, address(this)));
        _execute(agentENS, to, amount, proofId, verdictSig);
        usedNonces[nonce] = true;
    }

    function _execute(
        string calldata agentENS,
        address to,
        uint256 amount,
        bytes32 proofId,
        bytes calldata verdictSig
    ) internal {
        if (bytes(agentENS).length == 0) revert EMPTY_AGENT_NAME();
        if (revoked[agentENS] || revokedByNameHash[_canonicalNameHash(agentENS)]) revert REF_01_REVOKED_NAME();
        if (used[proofId]) revert REPLAY();
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", proofId));
        require(verdictSig.length == 65, "BAD_SIG_LEN");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(verdictSig.offset)
            s := calldataload(add(verdictSig.offset, 32))
            v := byte(0, calldataload(add(verdictSig.offset, 64)))
        }
        if (v < 27) v += 27;
        if (ecrecover(ethHash, v, r, s) != verdictKey) revert BAD_VERDICT();
        used[proofId] = true;
        emit YieldAllowed(proofId, agentENS, to, amount, verdictSig);
    }

    /// @dev Lowercases ASCII A-Z before hashing. ENS normalization (including Unicode)
    /// remains the responsibility of the ENS client before names reach this gateway.
    function _canonicalNameHash(string memory agentENS) internal pure returns (bytes32) {
        bytes memory raw = bytes(agentENS);
        for (uint256 i; i < raw.length; ++i) {
            uint8 c = uint8(raw[i]);
            if (c >= 0x41 && c <= 0x5A) raw[i] = bytes1(c + 0x20);
        }
        return keccak256(raw);
    }
}
