// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Constants} from "../Constants.sol";
import {MockMailbox} from "@hyperlane-xyz/core/contracts/mock/MockMailbox.sol";
import {Treasury} from "@cCOP_wrapper/Treasury.sol";
import {WrappedCCOP} from "@cCOP_wrapper/WrappedCCOP.sol";
import {CCOPMock} from "@cCOP_wrapper/CCOPMock.sol";

contract WrappedCCOPTest is Test, Constants {
    MockMailbox baseMailbox;
    MockMailbox celoMailbox;
    Treasury treasury;
    WrappedCCOP wrappedCCOP;
    CCOPMock cCOP;

    Treasury newTreasury;
    MockMailbox newMailbox;

    function setUp() public {
        celoMailbox = new MockMailbox(domainID.celoMainnet);
        baseMailbox = new MockMailbox(domainID.baseMainnet);

        celoMailbox.addRemoteMailbox(domainID.baseMainnet, baseMailbox);
        baseMailbox.addRemoteMailbox(domainID.celoMainnet, celoMailbox);

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

    modifier wrapCCOP(address user, uint64 amountCCOP) {
        vm.assume(user != address(0));
        vm.assume(amountCCOP > 0);
        
        cCOP.mint(user, amountCCOP);

        vm.startPrank(user);

        cCOP.approve(address(treasury), amountCCOP);

        vm.stopPrank();

        uint256 quote = treasury.getQuote(
            domainID.baseMainnet,
            user,
            amountCCOP
        );

        vm.deal(user, quote);

        vm.startPrank(user);

        treasury.wrap{value: quote}(domainID.baseMainnet, user, amountCCOP);

        vm.stopPrank();

        baseMailbox.processNextInboundMessage();
        assertEq(wrappedCCOP.balanceOf(user), amountCCOP);

        _;
    }

    function test_fuzz_wrappedCCOP_unwrap(
        address user,
        uint64 amountCCOP
    ) public wrapCCOP(user, amountCCOP) {
        uint256 quoteUnwrap = wrappedCCOP.getQuote(user, amountCCOP);

        vm.deal(user, quoteUnwrap);

        vm.startPrank(user);

        wrappedCCOP.unwrap{value: quoteUnwrap}(user, amountCCOP);

        vm.stopPrank();

        celoMailbox.processNextInboundMessage();

        assertEq(cCOP.balanceOf(user), amountCCOP);
        assertEq(cCOP.balanceOf(address(treasury)), 0);
        assertEq(wrappedCCOP.balanceOf(user), 0);
    }
}
