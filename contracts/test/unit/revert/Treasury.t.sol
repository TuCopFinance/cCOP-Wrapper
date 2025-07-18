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

    MockMailbox mockMailbox;

    Treasury treasury;
    WrappedCCOP wrappedCCOP;
    CCOPMock cCOP;

    CCOPMock mockCCOP;

    WrappedCCOP mockWrappedCCOP;
    WrappedCCOP newMockWrappedCCOP;

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
        cCOP.mint(USER1.Address, 10e15);
        _;
    }

    function test_revert_treasury_wrap_noAmountToWrap() public {
        vm.startPrank(USER1.Address);

        cCOP.approve(address(treasury), 10e15);

        uint256 quote = treasury.getQuote(
            domainID.baseMainnet,
            USER1.Address,
            10e15
        );

        vm.stopPrank();

        vm.deal(USER1.Address, quote);

        vm.startPrank(USER1.Address);

        vm.expectRevert();

        treasury.wrap{value: quote}(domainID.baseMainnet, USER1.Address, 10e15);

        vm.stopPrank();

        vm.expectRevert();
        baseMailbox.processNextInboundMessage();

        assertEq(cCOP.balanceOf(USER1.Address), 0);
        assertEq(cCOP.balanceOf(address(treasury)), 0);
        assertEq(wrappedCCOP.balanceOf(USER1.Address), 0);
    }

    function test_revert_treasury_wrap_noAllowance() public mintCCOP {
        uint256 quote = treasury.getQuote(
            domainID.baseMainnet,
            USER1.Address,
            10e15
        );

        vm.deal(USER1.Address, quote);

        vm.startPrank(USER1.Address);

        vm.expectRevert();
        treasury.wrap{value: quote}(domainID.baseMainnet, USER1.Address, 10e15);

        vm.stopPrank();

        vm.expectRevert();
        baseMailbox.processNextInboundMessage();

        assertEq(cCOP.balanceOf(USER1.Address), 10e15);
        assertEq(cCOP.balanceOf(address(treasury)), 0);
        assertEq(wrappedCCOP.balanceOf(USER1.Address), 0);
    }

    function test_revert_treasury_wrap_AmountIsZero() public mintCCOP {
        vm.startPrank(USER1.Address);

        cCOP.approve(address(treasury), 10e15);

        uint256 quote = treasury.getQuote(
            domainID.baseMainnet,
            USER1.Address,
            0
        );

        vm.stopPrank();

        vm.deal(USER1.Address, quote);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.AmountMustBeGreaterThanZero.selector);
        treasury.wrap{value: quote}(domainID.baseMainnet, USER1.Address, 0);

        vm.stopPrank();

        vm.expectRevert();
        baseMailbox.processNextInboundMessage();

        assertEq(wrappedCCOP.balanceOf(USER1.Address), 0);
        assertEq(cCOP.balanceOf(USER1.Address), 10e15);
        assertEq(cCOP.balanceOf(address(treasury)), 0);
    }

    function test_revert_treasury_wrap_WrappedTokenNotSet() public mintCCOP {
        vm.startPrank(USER1.Address);

        cCOP.approve(address(treasury), 10e15);

        uint256 quote = treasury.getQuote(
            domainID.baseMainnet,
            USER1.Address,
            10e15
        );

        vm.stopPrank();

        vm.deal(USER1.Address, quote);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.WrappedTokenNotSet.selector);
        treasury.wrap{value: quote}(1, USER1.Address, 10e15);

        vm.stopPrank();

        vm.expectRevert();
        baseMailbox.processNextInboundMessage();

        assertEq(wrappedCCOP.balanceOf(USER1.Address), 0);
        assertEq(cCOP.balanceOf(USER1.Address), 10e15);
        assertEq(cCOP.balanceOf(address(treasury)), 0);
    }

    /*function test_revert_treasury_wrap_QuoteNotEnough() public mintCCOP {
        vm.startPrank(USER1.Address);

        cCOP.approve(address(treasury), 10e15);

        uint256 quote = treasury.getQuote(
            domainID.baseMainnet,
            USER1.Address,
            10e15
        );

        vm.stopPrank();

        vm.deal(USER1.Address, quote);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.QuoteNotEnough.selector);
        treasury.wrap{value: 0}(domainID.baseMainnet, USER1.Address, 10e15);

        vm.stopPrank();

        vm.expectRevert();
        baseMailbox.processNextInboundMessage();

        assertEq(wrappedCCOP.balanceOf(USER1.Address), 0);
        assertEq(cCOP.balanceOf(USER1.Address), 10e15);
        assertEq(cCOP.balanceOf(address(treasury)), 0);
    }*/

    function test_revert_treasury_wrap_EmergencyStop() public mintCCOP {
        vm.startPrank(ADMIN.Address);
        treasury.toggleFuse();
        vm.stopPrank();

        vm.startPrank(USER1.Address);

        cCOP.approve(address(treasury), 10e15);

        uint256 quote = treasury.getQuote(
            domainID.baseMainnet,
            USER1.Address,
            10e15
        );

        vm.stopPrank();

        vm.deal(USER1.Address, quote);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.EmergencyStop.selector);
        treasury.wrap{value: quote}(domainID.baseMainnet, USER1.Address, 10e15);

        vm.stopPrank();

        vm.expectRevert();
        baseMailbox.processNextInboundMessage();

        assertEq(wrappedCCOP.balanceOf(USER1.Address), 0);
        assertEq(cCOP.balanceOf(USER1.Address), 10e15);
        assertEq(cCOP.balanceOf(address(treasury)), 0);
    }

    function test_revert_treasury_NewAdminProposal_propose_UnauthorizedAccount()
        public
    {
        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.proposeNewAdminProposal(USER1.Address);

        vm.stopPrank();

        Treasury.AddressTypeProposal memory admin = treasury
            .getAdminStructure();

        assertEq(admin.current, ADMIN.Address);
        assertEq(admin.proposal, address(0));
        assertEq(admin.timeToAccept, 0);
    }

    function test_revert_treasury_NewAdminProposal_cancel_UnauthorizedAccount()
        public
    {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewAdminProposal(USER1.Address);

        vm.stopPrank();

        skip(20 minutes);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.cancelNewAdminProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory admin = treasury
            .getAdminStructure();

        assertEq(admin.current, ADMIN.Address);
        assertEq(admin.proposal, USER1.Address);
        assertEq(admin.timeToAccept, block.timestamp + 1 days - 20 minutes);
    }

    function test_revert_treasury_NewAdminProposal_accept_UnauthorizedAccount()
        public
    {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewAdminProposal(USER1.Address);

        vm.stopPrank();

        skip(1 days);

        vm.startPrank(ADMIN.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.acceptNewAdminProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory admin = treasury
            .getAdminStructure();

        assertEq(admin.current, ADMIN.Address);
        assertEq(admin.proposal, USER1.Address);
        assertEq(admin.timeToAccept, block.timestamp);
    }

    function test_revert_treasury_NewAdminProposal_accept_WaitingPeriodNotExpired()
        public
    {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewAdminProposal(USER1.Address);

        vm.stopPrank();

        skip(20 minutes);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.WaitingPeriodNotExpired.selector);
        treasury.acceptNewAdminProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory admin = treasury
            .getAdminStructure();

        assertEq(admin.current, ADMIN.Address);
        assertEq(admin.proposal, USER1.Address);
        assertEq(admin.timeToAccept, block.timestamp + 1 days - 20 minutes);
    }

    function test_revert_treasury_NewWrappedTokenAddress_directAdd_WrappedTokenInvalid()
        public
    {
        vm.startPrank(ADMIN.Address);

        vm.expectRevert(Treasury.WrappedTokenInvalid.selector);
        treasury.proposeNewWrappedTokenAddressProposal(1, address(0));

        vm.stopPrank();

        assertEq(treasury.getWrappedTokenAddress(1), address(0));
    }

    modifier makeMockWrappedCCOP() {
        mockMailbox = new MockMailbox(1);
        newMockWrappedCCOP = new WrappedCCOP(
            ADMIN.Address,
            address(mockMailbox),
            domainID.celoMainnet,
            address(treasury)
        );
        mockWrappedCCOP = new WrappedCCOP(
            ADMIN.Address,
            address(mockMailbox),
            domainID.celoMainnet,
            address(treasury)
        );
        _;
    }

    function test_revert_treasury_NewWrappedTokenAddress_cancel_UnauthorizedAccount()
        public
        makeMockWrappedCCOP
    {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewWrappedTokenAddressProposal(
            1,
            address(mockWrappedCCOP)
        );

        treasury.proposeNewWrappedTokenAddressProposal(
            1,
            address(newMockWrappedCCOP)
        );

        vm.stopPrank();

        skip(20 minutes);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.cancelNewWrappedTokenAddressProposal(1);

        vm.stopPrank();

        Treasury.Bytes32Proposal memory wrappedToken = treasury
            .getWrappedTokenAddressStructure(1);

        assertEq(
            address(uint160(uint256(wrappedToken.current))),
            address(mockWrappedCCOP)
        );
        assertEq(
            address(uint160(uint256(wrappedToken.proposal))),
            address(newMockWrappedCCOP)
        );
        assertEq(
            wrappedToken.timeToAccept,
            block.timestamp + 1 days - 20 minutes
        );
    }

    function test_revert_treasury_NewWrappedTokenAddress_accept_WrappedTokenNotSet()
        public
    {
        vm.startPrank(ADMIN.Address);

        skip(1 days);

        vm.expectRevert(Treasury.WrappedTokenNotSet.selector);
        treasury.acceptNewWrappedTokenAddressProposal(1);

        vm.stopPrank();

        Treasury.Bytes32Proposal memory wrappedToken = treasury
            .getWrappedTokenAddressStructure(1);

        assertEq(
            address(uint160(uint256(wrappedToken.current))),
            address(newMockWrappedCCOP)
        );
        assertEq(wrappedToken.proposal, bytes32(0));
        assertEq(wrappedToken.timeToAccept, 0);
    }

    function test_revert_treasury_NewWrappedTokenAddress_accept_WaitingPeriodNotExpired()
        public
        makeMockWrappedCCOP
    {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewWrappedTokenAddressProposal(
            1,
            address(mockWrappedCCOP)
        );

        treasury.proposeNewWrappedTokenAddressProposal(
            1,
            address(newMockWrappedCCOP)
        );

        skip(20 minutes);

        vm.expectRevert(Treasury.WaitingPeriodNotExpired.selector);
        treasury.acceptNewWrappedTokenAddressProposal(1);

        vm.stopPrank();

        Treasury.Bytes32Proposal memory wrappedToken = treasury
            .getWrappedTokenAddressStructure(1);

        assertEq(
            address(uint160(uint256(wrappedToken.current))),
            address(mockWrappedCCOP)
        );
        assertEq(
            address(uint160(uint256(wrappedToken.proposal))),
            address(newMockWrappedCCOP)
        );
        assertEq(
            wrappedToken.timeToAccept,
            block.timestamp + 1 days - 20 minutes
        );
    }

    function test_revert_treasury_NewWrappedTokenAddress_accept_UnauthorizedAccount()
        public
        makeMockWrappedCCOP
    {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewWrappedTokenAddressProposal(
            1,
            address(mockWrappedCCOP)
        );

        treasury.proposeNewWrappedTokenAddressProposal(
            1,
            address(newMockWrappedCCOP)
        );

        vm.stopPrank();

        skip(1 days);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.acceptNewWrappedTokenAddressProposal(1);

        vm.stopPrank();

        Treasury.Bytes32Proposal memory wrappedToken = treasury
            .getWrappedTokenAddressStructure(1);

        assertEq(
            address(uint160(uint256(wrappedToken.current))),
            address(mockWrappedCCOP)
        );
        assertEq(
            address(uint160(uint256(wrappedToken.proposal))),
            address(newMockWrappedCCOP)
        );
        assertEq(wrappedToken.timeToAccept, block.timestamp);
    }

    function test_revert_treasury_NewMailboxAddress_propose_UnauthorizedAccount()
        public
    {
        mockMailbox = new MockMailbox(domainID.celoMainnet);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.proposeNewMailboxAddressProposal(address(mockMailbox));

        vm.stopPrank();

        Treasury.AddressTypeProposal memory mailboxProposal = treasury
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(celoMailbox));
        assertEq(mailboxProposal.proposal, address(0));
        assertEq(mailboxProposal.timeToAccept, 0);
    }

    function test_revert_treasury_NewMailboxAddress_cancel_UnauthorizedAccount()
        public
    {
        mockMailbox = new MockMailbox(domainID.celoMainnet);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewMailboxAddressProposal(address(mockMailbox));

        vm.stopPrank();

        skip(20 minutes);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.cancelNewMailboxAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory mailboxProposal = treasury
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(celoMailbox));
        assertEq(mailboxProposal.proposal, address(mockMailbox));
        assertEq(
            mailboxProposal.timeToAccept,
            block.timestamp + 1 days - 20 minutes
        );
    }

    function test_revert_treasury_NewMailboxAddress_accept_UnauthorizedAccount()
        public
    {
        mockMailbox = new MockMailbox(domainID.celoMainnet);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewMailboxAddressProposal(address(mockMailbox));

        vm.stopPrank();

        skip(1 days);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.acceptNewMailboxAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory mailboxProposal = treasury
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(celoMailbox));
        assertEq(mailboxProposal.proposal, address(mockMailbox));
        assertEq(mailboxProposal.timeToAccept, block.timestamp);
    }

    function test_revert_treasury_NewMailboxAddress_accept_MailboxAddressNotSet()
        public
    {
        vm.startPrank(ADMIN.Address);

        skip(1 days);

        vm.expectRevert(Treasury.MailboxAddressNotSet.selector);
        treasury.acceptNewMailboxAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory mailboxProposal = treasury
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(celoMailbox));
        assertEq(mailboxProposal.proposal, address(0));
        assertEq(mailboxProposal.timeToAccept, 0);
    }

    function test_revert_treasury_NewMailboxAddress_accept_WaitingPeriodNotExpired()
        public
    {
        mockMailbox = new MockMailbox(domainID.celoMainnet);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewMailboxAddressProposal(address(mockMailbox));

        skip(20 minutes);

        vm.expectRevert(Treasury.WaitingPeriodNotExpired.selector);
        treasury.acceptNewMailboxAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory mailboxProposal = treasury
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(celoMailbox));
        assertEq(mailboxProposal.proposal, address(mockMailbox));
        assertEq(
            mailboxProposal.timeToAccept,
            block.timestamp + 1 days - 20 minutes
        );
    }

    function test_revert_treasury_NewCCOPAddress_propose_UnauthorizedAccount()
        public
    {
        mockCCOP = new CCOPMock(ADMIN.Address);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.proposeNewCCOPAddressProposal(address(mockCCOP));

        vm.stopPrank();

        Treasury.AddressTypeProposal memory ccopProposal = treasury
            .getCCOPAddressStructure();

        assertEq(ccopProposal.current, address(cCOP));
        assertEq(ccopProposal.proposal, address(0));
        assertEq(ccopProposal.timeToAccept, 0);
    }

    function test_revert_treasury_NewCCOPAddress_cancel_UnauthorizedAccount()
        public
    {
        mockCCOP = new CCOPMock(ADMIN.Address);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewCCOPAddressProposal(address(mockCCOP));

        vm.stopPrank();

        skip(20 minutes);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.cancelNewCCOPAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory ccopProposal = treasury
            .getCCOPAddressStructure();

        assertEq(ccopProposal.current, address(cCOP));
        assertEq(ccopProposal.proposal, address(mockCCOP));
        assertEq(
            ccopProposal.timeToAccept,
            block.timestamp + 1 days - 20 minutes
        );
    }

    function test_revert_treasury_NewCCOPAddress_accept_UnauthorizedAccount()
        public
    {
        mockCCOP = new CCOPMock(ADMIN.Address);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewCCOPAddressProposal(address(mockCCOP));

        vm.stopPrank();

        skip(1 days);

        vm.startPrank(USER1.Address);

        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.acceptNewCCOPAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory ccopProposal = treasury
            .getCCOPAddressStructure();

        assertEq(ccopProposal.current, address(cCOP));
        assertEq(ccopProposal.proposal, address(mockCCOP));
        assertEq(ccopProposal.timeToAccept, block.timestamp);
    }

    function test_revert_treasury_NewCCOPAddress_accept_CCOPAddressNotSet()
        public
    {
        skip(1 days);

        vm.startPrank(ADMIN.Address);

        vm.expectRevert(Treasury.CCOPAddressNotSet.selector);
        treasury.acceptNewCCOPAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory ccopProposal = treasury
            .getCCOPAddressStructure();

        assertEq(ccopProposal.current, address(cCOP));
        assertEq(ccopProposal.proposal, address(0));
        assertEq(ccopProposal.timeToAccept, 0);
    }

    function test_revert_treasury_NewCCOPAddress_accept_WaitingPeriodNotExpired()
        public
    {
        mockCCOP = new CCOPMock(ADMIN.Address);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewCCOPAddressProposal(address(mockCCOP));

        skip(20 minutes);

        vm.expectRevert(Treasury.WaitingPeriodNotExpired.selector);
        treasury.acceptNewCCOPAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory ccopProposal = treasury
            .getCCOPAddressStructure();

        assertEq(ccopProposal.current, address(cCOP));
        assertEq(ccopProposal.proposal, address(mockCCOP));
        assertEq(
            ccopProposal.timeToAccept,
            block.timestamp + 1 days - 20 minutes
        );
    }

    function test_revert_treasury_toggleFuse_UnauthorizedAccount() public {
        vm.startPrank(USER1.Address);
        vm.expectRevert(Treasury.UnauthorizedAccount.selector);
        treasury.toggleFuse();
        vm.stopPrank();

        assertEq(treasury.getFuse(), true);
    }
}
