// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";

contract WrappedCCOP is ERC20 {
    //🬥🬱🬢🬽🬺🬰🬑🬰🬚🬄🬓🬨🬘🬪🬹🬥🬁🬱🬎🬅🬟🬞🬔🬷🬁🬶🬸🬔🬴🬥 Events 🬏🬏🬢🬺🬱🬋🬿🬪🬙🬒🬽🬃🬻🬥🬑🬬🬄🬳🬥🬠🬷🬕🬆🬳🬜🬼🬓🬷🬬🬴
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);

    //🬳🬀🬮🬣🬭🬦🬐🬤🬨🬯🬲🬰🬒🬓🬩🬅🬓🬮🬦🬠🬇🬨🬖🬧🬵🬬🬨🬌🬥🬨 Errors 🬂🬹🬾🬁🬬🬫🬸🬉🬼🬅🬩🬂🬤🬶🬨🬣🬴🬙🬑🬽🬧🬷🬭🬊🬽🬢🬜🬏🬹🬹
    error mailboxNotAuthorized();
    error senderNotAuthorized();
    error chainIdNotAuthorized();
    error amountMustBeGreaterThanZero();
    error unwrappedTokenNotSet();
    error UnauthorizedAccount();
    error EmergencyStop();
    error WaitingPeriodNotExpired();

    //🬘🬾🬠🬓🬺🬎🬋🬲🬂🬯🬚🬉🬯🬜🬏🬃🬿🬋🬅🬲🬽🬯🬊🬃🬒🬏🬮🬰🬌🬥 Structs 🬻🬗🬍🬎🬠🬷🬹🬅🬧🬡🬥🬞🬈🬨🬑🬢🬯🬚🬊🬏🬥🬭🬕🬡🬯🬵🬥🬘🬝🬉

    struct AddressTypeProposal {
        address current;
        address proposal;
        uint256 timeToAccept;
    }

    struct Bytes32Proposal {
        bytes32 current;
        bytes32 proposal;
        uint256 timeToAccept;
    }

    struct Uint32Proposal {
        uint32 current;
        uint32 proposal;
        uint256 timeToAccept;
    }

    //🬡🬂🬱🬿🬒🬐🬳🬳🬳🬍🬎🬍🬯🬸🬵🬝🬈🬺🬌🬌🬎🬋🬯🬈🬈🬙🬝🬟🬴🬍 State Variables 🬄🬩🬐🬕🬚🬮🬤🬴🬖🬵🬶🬔🬄🬩🬪🬸🬿🬆🬽🬠🬳🬰🬁🬻🬼🬀🬳🬝🬹🬞

    uint256 private constant WAITING_PERIOD = 1 days;
    AddressTypeProposal private admin;
    Bytes32Proposal private cCOPAddress;
    Uint32Proposal private cCOPDomainId;
    AddressTypeProposal private mailboxAddress;
    bool private fuse = true;

    //🬦🬧🬷🬑🬣🬺🬭🬽🬍🬩🬱🬛🬩🬎🬇🬪🬕🬲🬇🬈🬤🬁🬗🬱🬰🬍🬊🬎🬐🬆 Modifier 🬷🬓🬤🬭🬹🬢🬶🬇🬟🬲🬘🬑🬖🬼🬂🬧🬝🬒🬨🬂🬄🬼🬌🬖🬤🬟🬓🬍🬻🬹

    modifier onlyAdmin() {
        if (msg.sender != admin.current) {
            revert UnauthorizedAccount();
        }
        _;
    }

    modifier checkFuse() {
        if (!fuse) {
            revert EmergencyStop();
        }
        _;
    }

    // 🬩🬂🬆🬪🬖🬀🬨🬇🬳🬂🬶🬼🬪🬥🬃🬤🬈🬥🬢🬿🬉🬵🬄🬑🬅🬕🬄🬀🬖🬬 Constructor 🬤🬶🬍🬣🬇🬍🬴🬷🬻🬵🬘🬧🬇🬈🬔🬎🬽🬕🬞🬤🬡🬲🬖🬡🬛🬂🬞🬞🬧🬔

    constructor(
        address _initialAdmin,
        address _mailbox,
        uint32 _domainId,
        address _address
    ) ERC20("Wrapped Celo Colombian Peso", "wcCOP") {
        admin.current = _initialAdmin;
        mailboxAddress.current = _mailbox;
        cCOPDomainId.current = _domainId;
        cCOPAddress.current = bytes32(uint256(uint160(_address)));
    }

    //🬨🬟🬣🬡🬋🬴🬹🬉🬮🬣🬆🬫🬨🬺🬊🬠🬒🬛🬀🬧🬱🬱🬐🬘🬃🬑🬶🬬🬔🬛 Token Handling 🬜🬲🬁🬜🬻🬻🬀🬃🬺🬊🬆🬩🬡🬈🬻🬮🬅🬬🬰🬐🬳🬥🬱🬼🬲🬝🬟🬺🬺🬥

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _data
    ) external payable virtual {
        if (msg.sender != mailboxAddress.current) revert mailboxNotAuthorized();

        if (_sender != cCOPAddress.current) revert senderNotAuthorized();

        if (_origin != cCOPDomainId.current) revert chainIdNotAuthorized();

        (address to, uint256 amount) = abi.decode(_data, (address, uint256));

        _mint(to, amount);
    }

    function unwrap(
        address receiver,
        uint256 amount
    ) external payable checkFuse returns (bytes32 messageId) {
        if (amount == 0) revert amountMustBeGreaterThanZero();

        bytes memory payload = abi.encode(receiver, amount);

        uint256 quote = getQuote(receiver, amount);

        _burn(msg.sender, amount);

        messageId = IMailbox(mailboxAddress.current).dispatch{value: quote}(
            cCOPDomainId.current,
            cCOPAddress.current,
            payload
        );
    }

    function getQuote(
        address receiver,
        uint256 amount
    ) public view returns (uint256) {
        bytes memory payload = abi.encode(receiver, amount);
        return
            IMailbox(mailboxAddress.current).quoteDispatch(
                cCOPDomainId.current,
                cCOPAddress.current,
                payload
            );
    }

    //🬆🬛🬆🬩🬍🬢🬇🬖🬉🬼🬆🬊🬤🬙🬼🬩🬣🬼🬽🬽🬑🬐🬚🬬🬃🬁🬝🬀🬯🬻 Admin Functions 🬿🬫🬉🬣🬡🬝🬴🬉🬻🬩🬛🬬🬫🬔🬈🬺🬊🬤🬔🬲🬥🬬🬺🬼🬠🬘🬵🬱🬝🬾

    function proposeNewAdminProposal(address _newAdmin) external onlyAdmin {
        admin.proposal = _newAdmin;
        admin.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    function cancelAdminProposal() external onlyAdmin {
        admin.proposal = address(0);
        admin.timeToAccept = 0;
    }

    function acceptAdminProposal() external {
        if (msg.sender != admin.proposal) {
            revert UnauthorizedAccount();
        }
        if (block.timestamp < admin.timeToAccept) {
            revert WaitingPeriodNotExpired();
        }

        address previousAdmin = admin.current;
        admin = AddressTypeProposal({
            current: admin.proposal,
            proposal: address(0),
            timeToAccept: 0
        });

        emit AdminChanged(previousAdmin, admin.current);
    }

    function proposeNewCCOPAddressProposal(
        bytes32 _newAddress
    ) external onlyAdmin {
        cCOPAddress.proposal = _newAddress;
        cCOPAddress.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    function cancelCCOPAddressProposal() external onlyAdmin {
        cCOPAddress.proposal = bytes32(0);
        cCOPAddress.timeToAccept = 0;
    }

    function acceptCCOPAddressProposal() external onlyAdmin {
        if (block.timestamp < cCOPAddress.timeToAccept) {
            revert WaitingPeriodNotExpired();
        }

        cCOPAddress = Bytes32Proposal({
            current: cCOPAddress.proposal,
            proposal: bytes32(0),
            timeToAccept: 0
        });
    }

    function proposeNewCCOPDomainIdProposal(
        uint32 _newDomainId
    ) external onlyAdmin {
        cCOPDomainId.proposal = _newDomainId;
        cCOPDomainId.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    function cancelCCOPDomainIdProposal() external onlyAdmin {
        cCOPDomainId.proposal = 0;
        cCOPDomainId.timeToAccept = 0;
    }

    function acceptCCOPDomainIdProposal() external onlyAdmin {
        if (block.timestamp < cCOPDomainId.timeToAccept) {
            revert WaitingPeriodNotExpired();
        }

        cCOPDomainId = Uint32Proposal({
            current: cCOPDomainId.proposal,
            proposal: 0,
            timeToAccept: 0
        });
    }

    function proposeNewMailboxAddressProposal(
        address _newMailbox
    ) external onlyAdmin {
        mailboxAddress.proposal = _newMailbox;
        mailboxAddress.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    function cancelMailboxAddressProposal() external onlyAdmin {
        mailboxAddress.proposal = address(0);
        mailboxAddress.timeToAccept = 0;
    }

    function acceptMailboxAddressProposal() external onlyAdmin {
        if (block.timestamp < mailboxAddress.timeToAccept) {
            revert WaitingPeriodNotExpired();
        }

        mailboxAddress = AddressTypeProposal({
            current: mailboxAddress.proposal,
            proposal: address(0),
            timeToAccept: 0
        });
    }

    function setFuse() external onlyAdmin {
        fuse = !fuse;
    }

    //🬺🬸🬌🬬🬨🬒🬒🬥🬞🬍🬎🬜🬻🬧🬯🬝🬁🬃🬏🬿🬯🬄🬫🬒🬍🬍🬬🬁🬝🬒 Getters 🬑🬚🬡🬿🬙🬕🬪🬜🬐🬒🬽🬣🬉🬓🬱🬕🬤🬒🬐🬨🬻🬻🬂🬉🬉🬴🬔🬄🬁🬙

    function getAdminStructure()
        external
        view
        returns (AddressTypeProposal memory)
    {
        return admin;
    }

    function getCCOPAddressStructure()
        external
        view
        returns (Bytes32Proposal memory)
    {
        return cCOPAddress;
    }

    function getCCOPDomainIdStructure()
        external
        view
        returns (Uint32Proposal memory)
    {
        return cCOPDomainId;
    }

    function getMailboxAddressStructure()
        external
        view
        returns (AddressTypeProposal memory)
    {
        return mailboxAddress;
    }

    function getFuse() external view returns (bool) {
        return fuse;
    }

    //🬏🬘🬽🬹🬚🬣🬔🬂🬆🬌🬚🬏🬬🬢🬊🬯🬨🬷🬍🬲🬩🬂🬐🬪🬳🬠🬷🬺🬛🬅 ERC20 Overrides 🬌🬊🬸🬆🬀🬀🬥🬊🬻🬞🬾🬿🬾🬸🬪🬶🬄🬸🬦🬹🬈🬌🬘🬼🬸🬚🬕🬣🬪🬙
    function decimals() public view override returns (uint8) {
        return 15;
    }
}
