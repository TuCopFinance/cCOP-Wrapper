// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Constants} from "../../Constants.sol";
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

    modifier wrapCCOP() {
        cCOP.mint(USER1.Address, 10e15);

        vm.startPrank(USER1.Address);

        cCOP.approve(address(treasury), 10e15);

        vm.stopPrank();

        uint256 quote = treasury.getQuote(
            domainID.baseMainnet,
            USER1.Address,
            10e15
        );

        vm.deal(USER1.Address, quote);

        vm.startPrank(USER1.Address);

        treasury.wrap{value: quote}(domainID.baseMainnet, USER1.Address, 10e15);

        vm.stopPrank();

        baseMailbox.processNextInboundMessage();
        assertEq(wrappedCCOP.balanceOf(USER1.Address), 10e15);

        _;
    }

    function test_correct_wrappedCCOP_unwrap() public wrapCCOP {
        uint256 quoteUnwrap = wrappedCCOP.getQuote(USER1.Address, 10e15);

        vm.deal(USER1.Address, quoteUnwrap);

        vm.startPrank(USER1.Address);

        wrappedCCOP.unwrap{value: quoteUnwrap}(USER1.Address, 10e15);

        vm.stopPrank();

        celoMailbox.processNextInboundMessage();

        assertEq(cCOP.balanceOf(USER1.Address), 10e15);
    }

    function test_correct_wrappedCCOP_NewAdminProposal_propose() public {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewAdminProposal(USER1.Address);

        vm.stopPrank();

        WrappedCCOP.AddressTypeProposal memory admin = wrappedCCOP
            .getAdminStructure();

        assertEq(admin.current, ADMIN.Address);
        assertEq(admin.proposal, USER1.Address);
        assertEq(admin.timeToAccept, block.timestamp + 1 days);
    }

    function test_correct_wrappedCCOP_NewAdminProposal_cancel() public {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewAdminProposal(USER1.Address);

        skip(20 minutes);

        wrappedCCOP.cancelNewAdminProposal();

        vm.stopPrank();

        WrappedCCOP.AddressTypeProposal memory admin = wrappedCCOP
            .getAdminStructure();

        assertEq(admin.current, ADMIN.Address);
        assertEq(admin.proposal, address(0));
        assertEq(admin.timeToAccept, 0);
    }

    function test_correct_wrappedCCOP_NewAdminProposal_accept() public {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewAdminProposal(USER1.Address);

        vm.stopPrank();

        skip(1 days);

        vm.startPrank(USER1.Address);

        wrappedCCOP.acceptNewAdminProposal();

        vm.stopPrank();

        WrappedCCOP.AddressTypeProposal memory admin = wrappedCCOP
            .getAdminStructure();

        assertEq(admin.current, USER1.Address);
        assertEq(admin.proposal, address(0));
        assertEq(admin.timeToAccept, 0);
    }

    modifier setNewTreasury() {
        newTreasury = new Treasury(
            ADMIN.Address,
            address(celoMailbox),
            address(cCOP)
        );

        _;
    }

    function test_correct_wrappedCCOP_NewTreasuryProposal_propose()
        public
        setNewTreasury
    {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewTreasuryAddressProposal(address(newTreasury));

        vm.stopPrank();

        WrappedCCOP.Bytes32Proposal memory treasuryProposal = wrappedCCOP
            .getTreasuryAddressStructure();

        assertEq(
            address(uint160(uint256(treasuryProposal.current))),
            address(treasury)
        );
        assertEq(
            address(uint160(uint256(treasuryProposal.proposal))),
            address(newTreasury)
        );
        assertEq(treasuryProposal.timeToAccept, block.timestamp + 1 days);
    }

    function test_correct_wrappedCCOP_NewTreasuryProposal_cancel()
        public
        setNewTreasury
    {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewTreasuryAddressProposal(address(newTreasury));

        skip(20 minutes);

        wrappedCCOP.cancelNewTreasuryAddressProposal();

        vm.stopPrank();

        WrappedCCOP.Bytes32Proposal memory treasuryProposal = wrappedCCOP
            .getTreasuryAddressStructure();

        assertEq(
            address(uint160(uint256(treasuryProposal.current))),
            address(treasury)
        );
        assertEq(treasuryProposal.proposal, bytes32(0));
        assertEq(treasuryProposal.timeToAccept, 0);
    }

    function test_correct_wrappedCCOP_NewTreasuryProposal_accept()
        public
        setNewTreasury
    {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewTreasuryAddressProposal(address(newTreasury));

        vm.stopPrank();

        skip(1 days);

        vm.startPrank(ADMIN.Address);

        wrappedCCOP.acceptNewTreasuryAddressProposal();

        vm.stopPrank();

        WrappedCCOP.Bytes32Proposal memory treasuryProposal = wrappedCCOP
            .getTreasuryAddressStructure();

        assertEq(
            address(uint160(uint256(treasuryProposal.current))),
            address(newTreasury)
        );
        assertEq(treasuryProposal.proposal, bytes32(0));
        assertEq(treasuryProposal.timeToAccept, 0);
    }

    function test_correct_wrappedCCOP_NewCCOPDomainIdProposal_propose() public {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewCCOPDomainIdProposal(100);

        vm.stopPrank();

        WrappedCCOP.Uint32Proposal memory cCOPDomainIdProposal = wrappedCCOP
            .getCCOPDomainIdStructure();

        assertEq(cCOPDomainIdProposal.current, domainID.celoMainnet);
        assertEq(cCOPDomainIdProposal.proposal, 100);
        assertEq(cCOPDomainIdProposal.timeToAccept, block.timestamp + 1 days);
    }

    function test_correct_wrappedCCOP_NewCCOPDomainIdProposal_cancel() public {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewCCOPDomainIdProposal(100);

        skip(20 minutes);

        wrappedCCOP.cancelNewCCOPDomainIdProposal();

        vm.stopPrank();

        WrappedCCOP.Uint32Proposal memory cCOPDomainIdProposal = wrappedCCOP
            .getCCOPDomainIdStructure();

        assertEq(cCOPDomainIdProposal.current, domainID.celoMainnet);
        assertEq(cCOPDomainIdProposal.proposal, 0);
        assertEq(cCOPDomainIdProposal.timeToAccept, 0);
    }

    function test_correct_wrappedCCOP_NewCCOPDomainIdProposal_accept() public {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewCCOPDomainIdProposal(100);

        vm.stopPrank();

        skip(1 days);

        vm.startPrank(ADMIN.Address);

        wrappedCCOP.acceptNewCCOPDomainIdProposal();

        vm.stopPrank();

        WrappedCCOP.Uint32Proposal memory cCOPDomainIdProposal = wrappedCCOP
            .getCCOPDomainIdStructure();

        assertEq(cCOPDomainIdProposal.current, 100);
        assertEq(cCOPDomainIdProposal.proposal, 0);
        assertEq(cCOPDomainIdProposal.timeToAccept, 0);
    }

    modifier setNewMailbox() {
        newMailbox = new MockMailbox(domainID.baseMainnet);

        _;
    }

    function test_correct_wrappedCCOP_MailboxAddressProposal_propose()
        public
        setNewMailbox
    {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewMailboxAddressProposal(address(newMailbox));

        vm.stopPrank();

        WrappedCCOP.AddressTypeProposal memory mailboxProposal = wrappedCCOP
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(baseMailbox));
        assertEq(mailboxProposal.proposal, address(newMailbox));
        assertEq(mailboxProposal.timeToAccept, block.timestamp + 1 days);
    }

    function test_correct_wrappedCCOP_MailboxAddressProposal_cancel()
        public
        setNewMailbox
    {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewMailboxAddressProposal(address(newMailbox));

        skip(20 minutes);

        wrappedCCOP.cancelNewMailboxAddressProposal();

        vm.stopPrank();

        WrappedCCOP.AddressTypeProposal memory mailboxProposal = wrappedCCOP
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(baseMailbox));
        assertEq(mailboxProposal.proposal, address(0));
        assertEq(mailboxProposal.timeToAccept, 0);
    }

    function test_correct_wrappedCCOP_MailboxAddressProposal_accept()
        public
        setNewMailbox
    {
        vm.startPrank(ADMIN.Address);

        wrappedCCOP.proposeNewMailboxAddressProposal(address(newMailbox));

        vm.stopPrank();

        skip(1 days);

        vm.startPrank(ADMIN.Address);

        wrappedCCOP.acceptNewMailboxAddressProposal();

        vm.stopPrank();

        WrappedCCOP.AddressTypeProposal memory mailboxProposal = wrappedCCOP
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(newMailbox));
        assertEq(mailboxProposal.proposal, address(0));
        assertEq(mailboxProposal.timeToAccept, 0);
    }

    function test_correct_toggleFuse() public wrapCCOP {
        vm.startPrank(ADMIN.Address);
        wrappedCCOP.toggleFuse();
        vm.stopPrank();
        assertEq(wrappedCCOP.getFuse(), false);
    }

}
