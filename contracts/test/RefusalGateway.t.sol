// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../RefusalGateway.sol";

/// @notice Mirrors the demo claims: valid verdict executes once, anything else refuses.
contract RefusalGatewayTest is Test {
    RefusalGateway gw;
    uint256 constant KEY = 0x1234567890123456789012345678901234567890123456789012345678901234;
    address verdict;
    string constant AGENT = "demo.alice.refusal.eth";
    address constant TO = 0x000000000000000000000000000000000000dEaD;

    function setUp() external {
        verdict = vm.addr(KEY);
        gw = new RefusalGateway(verdict);
    }

    function testZeroVerdictKeyRejected() external {
        vm.expectRevert(RefusalGateway.ZERO_VERDICT_KEY.selector);
        new RefusalGateway(address(0));
    }

    function _sign(bytes32 proofId, uint256 key) internal view returns (bytes memory) {
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", proofId));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function testExecuteValidVerdict() external {
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 nonce = keccak256("valid");
        bytes32 pid = gw.executeWithDeadline(AGENT, TO, 2, deadline, nonce, _sign(_timedIntentHash(deadline, nonce), KEY));
        assertEq(pid, _timedIntentHash(deadline, nonce), "proofId mismatch");
        assertTrue(gw.used(pid), "not marked used");
    }

    function testReplayReverts() external {
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 nonce = keccak256("replay");
        bytes memory sig = _sign(_timedIntentHash(deadline, nonce), KEY);
        gw.executeWithDeadline(AGENT, TO, 2, deadline, nonce, sig);
        vm.expectRevert(RefusalGateway.NONCE_USED.selector);
        gw.executeWithDeadline(AGENT, TO, 2, deadline, nonce, sig);
    }

    function testBadVerdictReverts() external {
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 nonce = keccak256("bad");
        vm.expectRevert(RefusalGateway.BAD_VERDICT.selector);
        gw.executeWithDeadline(AGENT, TO, 2, deadline, nonce, _sign(_timedIntentHash(deadline, nonce), 0x9999));
    }

    function testRevokedRefuses() external {
        gw.revoke(AGENT);
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 nonce = keccak256("revoked");
        vm.expectRevert(RefusalGateway.REF_01_REVOKED_NAME.selector);
        gw.executeWithDeadline(AGENT, TO, 2, deadline, nonce, _sign(_timedIntentHash(deadline, nonce), KEY));
    }

    function testRevocationIsCaseInsensitiveForAsciiENS() external {
        gw.revoke("Demo.Alice.Refusal.ETH");
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 nonce = keccak256("case");
        vm.expectRevert(RefusalGateway.REF_01_REVOKED_NAME.selector);
        gw.executeWithDeadline(AGENT, TO, 2, deadline, nonce, _sign(_timedIntentHash(deadline, nonce), KEY));
    }

    function testEmptyENSRejected() external {
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 nonce = keccak256("empty");
        vm.expectRevert(RefusalGateway.EMPTY_AGENT_NAME.selector);
        gw.executeWithDeadline("", TO, 2, deadline, nonce, _sign(keccak256(abi.encodePacked("", TO, uint256(2), deadline, nonce, block.chainid, address(gw))), KEY));
    }

    function testLegacyExecuteDisabled() external {
        vm.expectRevert(RefusalGateway.LEGACY_EXECUTE_DISABLED.selector);
        gw.execute(AGENT, TO, 2, bytes("") );
    }

    function _timedIntentHash(uint256 deadline, bytes32 nonce) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(AGENT, TO, uint256(2), deadline, nonce, block.chainid, address(gw)));
    }

    function testDeadlineNonceVariantExecutesOnce() external {
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 nonce = keccak256("nonce-1");
        bytes memory sig = _sign(_timedIntentHash(deadline, nonce), KEY);
        bytes32 pid = gw.executeWithDeadline(AGENT, TO, 2, deadline, nonce, sig);
        assertTrue(gw.used(pid), "not marked used");
        vm.expectRevert(RefusalGateway.NONCE_USED.selector);
        gw.executeWithDeadline(AGENT, TO, 2, deadline, nonce, sig);
    }

    function testExpiredDeadlineRejected() external {
        uint256 deadline = block.timestamp - 1;
        bytes32 nonce = keccak256("nonce-expired");
        vm.expectRevert(abi.encodeWithSelector(RefusalGateway.DEADLINE_EXPIRED.selector, deadline));
        gw.executeWithDeadline(AGENT, TO, 2, deadline, nonce, bytes("") );
    }

    function testRevokeNonOwnerReverts() external {
        vm.prank(address(0xBEEF));
        vm.expectRevert(bytes("NOT_OWNER"));
        gw.revoke(AGENT);
    }

}
