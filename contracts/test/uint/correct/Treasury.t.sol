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

    function test_NewAdminProposal_cancel() public mintCCOP {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewAdminProposal(USER1.Address);

        skip(20 minutes);

        treasury.cancelNewAdminProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory admin = treasury
            .getAdminStructure();

        assertEq(admin.current, ADMIN.Address);
        assertEq(admin.proposal, address(0));
        assertEq(admin.timeToAccept, 0);
    }

    function test_NewAdminProposal_accept() public mintCCOP {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewAdminProposal(USER1.Address);

        vm.stopPrank();

        skip(1 days);

        vm.startPrank(USER1.Address);

        treasury.acceptNewAdminProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory admin = treasury
            .getAdminStructure();

        assertEq(admin.current, USER1.Address);
        assertEq(admin.proposal, address(0));
        assertEq(admin.timeToAccept, 0);
    }

    function test_NewWrappedTokenAddress_directAdd() public mintCCOP {
        mockMailbox = new MockMailbox(1);
        mockWrappedCCOP = new WrappedCCOP(
            ADMIN.Address,
            address(mockMailbox),
            domainID.celoMainnet,
            address(treasury)
        );

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewWrappedTokenAddressProposal(
            1,
            address(mockWrappedCCOP)
        );

        vm.stopPrank();

        assertEq(treasury.getWrappedTokenAddress(1), address(mockWrappedCCOP));
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

    function test_NewWrappedTokenAddress_propose() public makeMockWrappedCCOP {
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
        assertEq(wrappedToken.timeToAccept, block.timestamp + 1 days);
    }

    function test_NewWrappedTokenAddress_cancel() public makeMockWrappedCCOP {
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

        treasury.cancelNewWrappedTokenAddressProposal(1);

        vm.stopPrank();

        Treasury.Bytes32Proposal memory wrappedToken = treasury
            .getWrappedTokenAddressStructure(1);

        assertEq(
            address(uint160(uint256(wrappedToken.current))),
            address(mockWrappedCCOP)
        );
        assertEq(address(uint160(uint256(wrappedToken.proposal))), address(0));
        assertEq(wrappedToken.timeToAccept, 0);
    }

    function test_NewWrappedTokenAddress_accept() public makeMockWrappedCCOP {
        vm.startPrank(ADMIN.Address);

        treasury.proposeNewWrappedTokenAddressProposal(
            1,
            address(mockWrappedCCOP)
        );

        treasury.proposeNewWrappedTokenAddressProposal(
            1,
            address(newMockWrappedCCOP)
        );

        skip(1 days);

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

    function test_NewMailboxAddress_propose() public {
        mockMailbox = new MockMailbox(domainID.celoMainnet);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewMailboxAddressProposal(address(mockMailbox));

        vm.stopPrank();

        Treasury.AddressTypeProposal memory mailboxProposal = treasury
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(celoMailbox));
        assertEq(mailboxProposal.proposal, address(mockMailbox));
        assertEq(mailboxProposal.timeToAccept, block.timestamp + 1 days);
    }

    function test_NewMailboxAddress_cancel() public {
        mockMailbox = new MockMailbox(domainID.celoMainnet);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewMailboxAddressProposal(address(mockMailbox));

        skip(20 minutes);

        treasury.cancelNewMailboxAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory mailboxProposal = treasury
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(celoMailbox));
        assertEq(mailboxProposal.proposal, address(0));
        assertEq(mailboxProposal.timeToAccept, 0);
    }

    function test_NewMailboxAddress_accept() public {
        mockMailbox = new MockMailbox(domainID.celoMainnet);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewMailboxAddressProposal(address(mockMailbox));

        skip(1 days);

        treasury.acceptNewMailboxAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory mailboxProposal = treasury
            .getMailboxAddressStructure();

        assertEq(mailboxProposal.current, address(mockMailbox));
        assertEq(mailboxProposal.proposal, address(0));
        assertEq(mailboxProposal.timeToAccept, 0);
    }


    function test_NewCCOPAddress_propose() public {
        mockCCOP = new CCOPMock(ADMIN.Address);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewCCOPAddressProposal(address(mockCCOP));

        vm.stopPrank();

        Treasury.AddressTypeProposal memory ccopProposal = treasury
            .getCCOPAddressStructure();

        assertEq(ccopProposal.current, address(cCOP));
        assertEq(ccopProposal.proposal, address(mockCCOP));
        assertEq(ccopProposal.timeToAccept, block.timestamp + 1 days);
    }

    function test_NewCCOPAddress_cancel() public {
        mockCCOP = new CCOPMock(ADMIN.Address);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewCCOPAddressProposal(address(mockCCOP));

        skip(20 minutes);

        treasury.cancelNewCCOPAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory ccopProposal = treasury
            .getCCOPAddressStructure();

        assertEq(ccopProposal.current, address(cCOP));
        assertEq(ccopProposal.proposal, address(0));
        assertEq(ccopProposal.timeToAccept, 0);
    }

    function test_NewCCOPAddress_accept() public {
        mockCCOP = new CCOPMock(ADMIN.Address);

        vm.startPrank(ADMIN.Address);

        treasury.proposeNewCCOPAddressProposal(address(mockCCOP));

        skip(1 days);

        treasury.acceptNewCCOPAddressProposal();

        vm.stopPrank();

        Treasury.AddressTypeProposal memory ccopProposal = treasury
            .getCCOPAddressStructure();

        assertEq(ccopProposal.current, address(mockCCOP));
        assertEq(ccopProposal.proposal, address(0));
        assertEq(ccopProposal.timeToAccept, 0);
    }

    function test_toggleFuse() public {
        vm.startPrank(ADMIN.Address);
        treasury.toggleFuse();
        vm.stopPrank();

        assertEq(treasury.getFuse(), false);
    }

}
