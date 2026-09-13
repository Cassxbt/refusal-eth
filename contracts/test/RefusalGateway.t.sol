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

    function _sign(bytes32 proofId, uint256 key) internal view returns (bytes memory) {
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", proofId));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, ethHash);
        return abi.encodePacked(r, s, v);
    }

    function _intentHash() internal view returns (bytes32) {
        return keccak256(abi.encodePacked(AGENT, TO, uint256(2), block.chainid, address(gw)));
    }

    function testExecuteValidVerdict() external {
        bytes32 pid = gw.execute(AGENT, TO, 2, _sign(_intentHash(), KEY));
        assertEq(pid, _intentHash(), "proofId mismatch");
        assertTrue(gw.used(pid), "not marked used");
    }

    function testReplayReverts() external {
        bytes memory sig = _sign(_intentHash(), KEY);
        gw.execute(AGENT, TO, 2, sig);
        vm.expectRevert(RefusalGateway.REPLAY.selector);
        gw.execute(AGENT, TO, 2, sig);
    }

    function testBadVerdictReverts() external {
        vm.expectRevert(RefusalGateway.BAD_VERDICT.selector);
        gw.execute(AGENT, TO, 2, _sign(_intentHash(), 0x9999));
    }

    function testRevokedRefuses() external {
        gw.revoke(AGENT);
        vm.expectRevert(RefusalGateway.REF_01_REVOKED_NAME.selector);
        gw.execute(AGENT, TO, 2, _sign(_intentHash(), KEY));
    }

    function testRevokeNonOwnerReverts() external {
        vm.prank(address(0xBEEF));
        vm.expectRevert(bytes("NOT_OWNER"));
        gw.revoke(AGENT);
    }

}
