// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Constants} from "../Constants.sol";
import {MockMailbox} from "@hyperlane-xyz/core/contracts/mock/MockMailbox.sol";
import {Treasury} from "@cCOP_wrapper/Treasury.sol";
import {WrappedCCOP} from "@cCOP_wrapper/WrappedCCOP.sol";
import {CCOPMock} from "@cCOP_wrapper/CCOPMock.sol";

contract TreasuryTest is Test, Constants {
    MockMailbox baseMailbox;
    MockMailbox celoMailbox;
    MockMailbox arbMailbox;

    MockMailbox mockMailbox;

    Treasury treasury;

    WrappedCCOP wrappedCCOP_base;
    WrappedCCOP wrappedCCOP_arb;

    CCOPMock cCOP;

    CCOPMock mockCCOP;

    WrappedCCOP mockWrappedCCOP;
    WrappedCCOP newMockWrappedCCOP;

    function setUp() public {
        baseMailbox = new MockMailbox(domainID.baseMainnet);
        celoMailbox = new MockMailbox(domainID.celoMainnet);
        arbMailbox = new MockMailbox(domainID.arbitrumMainnet);

        baseMailbox.addRemoteMailbox(domainID.celoMainnet, celoMailbox);
        baseMailbox.addRemoteMailbox(domainID.arbitrumMainnet, arbMailbox);

        celoMailbox.addRemoteMailbox(domainID.baseMainnet, baseMailbox);
        celoMailbox.addRemoteMailbox(domainID.arbitrumMainnet, arbMailbox);

        arbMailbox.addRemoteMailbox(domainID.celoMainnet, celoMailbox);
        arbMailbox.addRemoteMailbox(domainID.baseMainnet, baseMailbox);

        cCOP = new CCOPMock(ADMIN.Address);

        treasury = new Treasury(
            ADMIN.Address,
            address(celoMailbox),
            address(cCOP)
        );

        wrappedCCOP_base = new WrappedCCOP(
            ADMIN.Address,
            address(baseMailbox),
            domainID.celoMainnet,
            address(treasury)
        );

        wrappedCCOP_arb = new WrappedCCOP(
            ADMIN.Address,
            address(arbMailbox),
            domainID.celoMainnet,
            address(treasury)
        );

        vm.startPrank(ADMIN.Address);
        treasury.proposeNewWrappedTokenAddressProposal(
            domainID.baseMainnet,
            address(wrappedCCOP_base)
        );
        treasury.proposeNewWrappedTokenAddressProposal(
            domainID.arbitrumMainnet,
            address(wrappedCCOP_arb)
        );
        vm.stopPrank();
    }

    function test_fuzz_treasury_wrap(
        address user,
        uint64 amountCCOP,
        bool chainSelector
    ) public {
        vm.assume(user != address(0));
        vm.assume(amountCCOP > 0);

        cCOP.mint(user, amountCCOP);

        vm.startPrank(user);

        cCOP.approve(address(treasury), amountCCOP);

        uint256 quote = treasury.getQuote(
            chainSelector ? domainID.baseMainnet : domainID.arbitrumMainnet,
            user,
            amountCCOP
        );

        vm.stopPrank();

        vm.deal(user, quote);

        vm.startPrank(user);

        treasury.wrap{value: quote}(
            chainSelector ? domainID.baseMainnet : domainID.arbitrumMainnet,
            user,
            amountCCOP
        );

        vm.stopPrank();

        if (chainSelector) {
            baseMailbox.processNextInboundMessage();

            assertEq(wrappedCCOP_base.balanceOf(user), amountCCOP);
            assertEq(cCOP.balanceOf(user), 0);
            assertEq(cCOP.balanceOf(address(treasury)), amountCCOP);
        } else {
            arbMailbox.processNextInboundMessage();

            assertEq(wrappedCCOP_arb.balanceOf(user), amountCCOP);
            assertEq(cCOP.balanceOf(user), 0);
            assertEq(cCOP.balanceOf(address(treasury)), amountCCOP);
        }
    }
}
