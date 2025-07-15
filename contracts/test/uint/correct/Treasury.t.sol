// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Constants} from "../../Constants.sol";
import {MockMailbox} from "@hyperlane-xyz/core/contracts/mock/MockMailbox.sol";
import {Treasury} from "@cCOP_wrapper/Treasury.sol";
import {WrappedCCOP} from "@cCOP_wrapper/WrappedCCOP.sol";
import {CCOPMock} from "@cCOP_wrapper/CCOPMock.sol";

contract TreasuryTest is Test, Constants {
    MockMailbox baseMailbox;
    MockMailbox celoMailbox;
    Treasury treasury;
    WrappedCCOP wrappedCCOP;
    CCOPMock cCOP;

    function setUp() public {
        baseMailbox = new MockMailbox(domainID.baseMainnet);
        celoMailbox = new MockMailbox(domainID.celoMainnet);
        baseMailbox.addRemoteMailbox(domainID.celoMainnet, celoMailbox);
        celoMailbox.addRemoteMailbox(domainID.baseMainnet, baseMailbox);

        cCOP = new CCOPMock(ADMIN.Address);
        treasury = new Treasury(
            ADMIN.Address,
            address(celoMailbox),
            address(cCOP)
        );
        wrappedCCOP = new WrappedCCOP(
            ADMIN.Address,
            address(baseMailbox),
            domainID.celoMainnet,
            address(treasury)
        );
        vm.startPrank(ADMIN.Address);
        treasury.proposeNewWrappedTokenAddressProposal(
            domainID.baseMainnet,
            address(wrappedCCOP)
        );
        vm.stopPrank();
    }

    modifier mintCCOP() {
        cCOP.mint(ADMIN.Address, 10e15);
        _;
    }

    function test_wrap() public mintCCOP {
        vm.startPrank(ADMIN.Address);

        cCOP.approve(address(treasury), 10e15);

        uint256 quote = treasury.getQuote(
            domainID.baseMainnet,
            ADMIN.Address,
            10e15
        );

        vm.stopPrank();

        vm.deal(ADMIN.Address, quote + 1);

        vm.startPrank(ADMIN.Address);

        treasury.wrap{value: quote + 1}(
            domainID.baseMainnet,
            ADMIN.Address,
            10e15
        );

        vm.stopPrank();

        baseMailbox.processNextInboundMessage();

        assertEq(wrappedCCOP.balanceOf(ADMIN.Address), 10e15);
    }

    function test_NewAdminProposal_propose() public mintCCOP {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewAdminProposal(USER1.Address);

        vm.stopPrank();

        Treasury.AddressTypeProposal memory admin = treasury
            .getAdminStructure();

        assertEq(admin.current, ADMIN.Address);
        assertEq(admin.proposal, USER1.Address);
        assertEq(admin.timeToAccept, block.timestamp + 1 days);
    }
}
