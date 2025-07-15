// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

/**
 _       __                                __        __________  ____ 
| |     / _________ _____  ____  ___  ____/ /  _____/ ____/ __ \/ __ \
| | /| / / ___/ __ `/ __ \/ __ \/ _ \/ __  /  / ___/ /   / / / / /_/ /
| |/ |/ / /  / /_/ / /_/ / /_/ /  __/ /_/ /  / /__/ /___/ /_/ / ____/ 
|__/|__/_/   \__,_/ .___/ .___/\___/\__,_/   \___/\____/\____/_/      
                 /_/   /_/                                            

 * @title Wrapped Celo Colombian Peso (wcCOP)
 * @author jistro.eth
 * @notice This contract wraps the Celo Colombian Peso (COP) token for cross-chain transfers.
 */

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";

contract WrappedCCOP is ERC20 {
    //🬥🬱🬢🬽🬺🬰🬑🬰🬚🬄🬓🬨🬘🬪🬠🬹🬥🬁🬱🬎🬅🬟🬢🬞🬔🬷🬁🬶🬸🬔🬴🬥 Events 🬏🬏🬢🬺🬱🬋🬿🬪🬙🬒🬽🬃🬢🬻🬠🬥🬑🬬🬄🬳🬥🬠🬷🬕🬆🬳🬜🬼🬓🬷🬬🬴
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);

    //🬳🬀🬮🬣🬭🬸🬦🬐🬤🬨🬯🬲🬠🬰🬒🬓🬩🬅🬓🬮🬦🬠🬇🬨🬖🬧🬵🬬🬨🬌🬥🬨 Errors 🬂🬹🬾🬁🬬🬫🬸🬸🬉🬼🬅🬩🬂🬤🬶🬨🬣🬴🬙🬑🬽🬧🬠🬷🬭🬊🬽🬢🬜🬏🬹🬹
    error mailboxNotAuthorized();
    error senderNotAuthorized();
    error chainIdNotAuthorized();
    error amountMustBeGreaterThanZero();
    error unwrappedTokenNotSet();
    error UnauthorizedAccount();
    error EmergencyStop();
    error WaitingPeriodNotExpired();

    //🬘🬾🬹🬠🬓🬺🬎🬋🬉🬲🬂🬯🬚🬉🬯🬜🬏🬃🬿🬋🬅🬲🬽🬯🬊🬃🬒🬏🬮🬰🬌🬥 Structs 🬻🬗🬍🬎🬠🬷🬹🬅🬧🬡🬥🬞🬈🬨🬑🬉🬢🬯🬹🬚🬊🬏🬥🬭🬕🬡🬯🬵🬥🬘🬝🬉

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

    //🬡🬂🬱🬿🬒🬐🬳🬳🬳🬍🬎🬍🬯🬸🬵🬝🬈🬺🬌🬎🬋🬯🬈🬙🬝🬟🬴🬍 State Variables 🬄🬩🬐🬕🬚🬮🬤🬴🬖🬵🬶🬔🬄🬩🬪🬸🬿🬆🬽🬠🬳🬰🬁🬻🬼🬀🬳🬝

    uint256 private constant WAITING_PERIOD = 1 days;
    AddressTypeProposal private admin;
    Bytes32Proposal private cCOPAddress;
    Uint32Proposal private cCOPDomainId;
    AddressTypeProposal private mailboxAddress;
    bool private fuse = true;

    //🬦🬧🬷🬑🬣🬺🬭🬽🬍🬩🬭🬱🬛🬩🬎🬇🬪🬕🬲🬇🬈🬤🬁🬗🬱🬰🬍🬊🬎🬐🬆 Modifier 🬷🬓🬤🬭🬹🬢🬶🬇🬟🬲🬘🬑🬖🬼🬂🬭🬧🬝🬒🬨🬂🬄🬼🬌🬖🬤🬟🬓🬍🬻🬹

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

    //🬩🬂🬆🬪🬖🬀🬨🬇🬳🬂🬶🬼🬪🬥🬃🬤🬈🬥🬢🬿🬉🬵🬄🬑🬅🬕🬄🬀🬖🬬 Constructor 🬤🬶🬍🬣🬇🬍🬴🬷🬻🬵🬘🬧🬇🬈🬔🬎🬽🬕🬞🬤🬡🬲🬖🬡🬛🬂🬞🬞🬧🬔
    /**
     *  @notice Constructor to initialize the WrappedCCOP contract.
     *  @dev Sets the initial admin, mailbox address, Celo Colombian Peso domain ID
     *  @param _initialAdmin The address of the initial admin.
     *  @param _mailbox The address of the hyperlane mailbox contract.
     *  @param _domainId The domain ID of the Celo Colombian Peso.
     *  @param _address The address of the Celo Colombian Peso token.
     */
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

    //🬨🬟🬣🬡🬋🬴🬹🬉🬮🬣🬆🬫🬨🬺🬊🬠🬒🬛🬀🬱🬱🬐🬘🬃🬑🬶🬬🬔🬛 Token Handling 🬜🬲🬁🬜🬻🬻🬀🬃🬺🬊🬆🬩🬡🬈🬻🬮🬅🬬🬰🬐🬳🬥🬱🬼🬲🬝🬟🬺🬺

    /**
     *  @notice Handles incoming messages from the Hyperlane mailbox.
     *  @param _origin The origin domain ID of the message.
     *  @param _sender The address of the sender.
     *  @param _data The data payload of the message.
     */
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

    /**
     *  @notice Unwraps the Wrapped Celo Colombian Peso (wcCOP) and sends the underlying COP to
     *          the specified receiver.
     *  @dev This function burns the wcCOP tokens from the sender's balance and dispatches a message
     *         to the Hyperlane mailbox to transfer the underlying cCOP to the receiver.
     *  @param receiver The address of the receiver.
     *  @param amount The amount of wcCOP to unwrap.
     */
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

    /**
     *  @notice Gets the quote for dispatching a message to unwrap wcCOP.
     *  @dev This function calculates the quote for the message dispatch based on the receiver and amount
     *  @param receiver The address of the receiver.
     *  @param amount The amount of wcCOP to unwrap.
     */
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

    //🬆🬛🬆🬍🬢🬇🬖🬉🬼🬆🬊🬤🬙🬼🬩🬣🬼🬽🬑🬐🬚🬬🬃🬁🬝🬀🬯🬻 Admin Functions 🬿🬫🬉🬣🬡🬝🬴🬉🬻🬩🬛🬬🬫🬔🬈🬺🬊🬤🬔🬲🬥🬬🬼🬠🬘🬵🬱🬝

    /**
     * @dev These functions allow some vital variables to be changed by the admin.
     *      They include:
     *      - Admin address
     *      - Celo Colombian Peso address
     *      - Celo Colombian Peso domain ID
     *      - Mailbox address
     * 
     *      Each function goes through the following steps:
     *      1. Propose a new value.
     *      2. Set a waiting period for the proposal to be accepted.
     *      3. Cancel the proposal if needed.
     *      4. Accept the proposal after the waiting period has expired.
     */

    /**
     * @notice Proposes a new admin address.
     * @dev Only the current admin can call this. Sets the candidate and the acceptance time.
     * @param _newAdmin Address of the proposed new admin.
     */
    function proposeNewAdminProposal(address _newAdmin) external onlyAdmin {
        admin.proposal = _newAdmin;
        admin.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    /**
     * @notice Cancels the current admin proposal.
     * @dev Only the current admin can call this. Resets the proposal and acceptance time.
     */
    function cancelAdminProposal() external onlyAdmin {
        admin.proposal = address(0);
        admin.timeToAccept = 0;
    }

    /**
     * @notice Accepts the admin proposal after the waiting period has expired.
     * @dev Only the proposed admin can call this. Changes the admin if the waiting period has passed.
     */
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

    /**
     * @notice Proposes a new cCOP token address.
     * @dev Only the current admin can call this. Sets the candidate and the acceptance time.
     * @param _newAddress The proposed new cCOP token address (as bytes32).
     */
    function proposeNewCCOPAddressProposal(
        bytes32 _newAddress
    ) external onlyAdmin {
        cCOPAddress.proposal = _newAddress;
        cCOPAddress.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    /**
     * @notice Cancels the current cCOP address proposal.
     * @dev Only the current admin can call this. Resets the proposal and acceptance time.
     */
    function cancelCCOPAddressProposal() external onlyAdmin {
        cCOPAddress.proposal = bytes32(0);
        cCOPAddress.timeToAccept = 0;
    }

    /**
     * @notice Accepts the cCOP address proposal after the waiting period has expired.
     * @dev Only the admin can call this. Changes the cCOP address if the waiting period has passed.
     */
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

    /**
     * @notice Proposes a new cCOP domain ID.
     * @dev Only the current admin can call this. Sets the candidate and the acceptance time.
     * @param _newDomainId The proposed new domain ID.
     */
    function proposeNewCCOPDomainIdProposal(
        uint32 _newDomainId
    ) external onlyAdmin {
        cCOPDomainId.proposal = _newDomainId;
        cCOPDomainId.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    /**
     * @notice Cancels the current cCOP domain ID proposal.
     * @dev Only the current admin can call this. Resets the proposal and acceptance time.
     */
    function cancelCCOPDomainIdProposal() external onlyAdmin {
        cCOPDomainId.proposal = 0;
        cCOPDomainId.timeToAccept = 0;
    }

    /**
     * @notice Accepts the cCOP domain ID proposal after the waiting period has expired.
     * @dev Only the admin can call this. Changes the domain ID if the waiting period has passed.
     */
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

    /**
     * @notice Proposes a new mailbox address.
     * @dev Only the current admin can call this. Sets the candidate and the acceptance time.
     * @param _newMailbox The proposed new mailbox address.
     */
    function proposeNewMailboxAddressProposal(
        address _newMailbox
    ) external onlyAdmin {
        mailboxAddress.proposal = _newMailbox;
        mailboxAddress.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    /**
     * @notice Cancels the current mailbox address proposal.
     * @dev Only the current admin can call this. Resets the proposal and acceptance time.
     */
    function cancelMailboxAddressProposal() external onlyAdmin {
        mailboxAddress.proposal = address(0);
        mailboxAddress.timeToAccept = 0;
    }

    /**
     * @notice Accepts the mailbox address proposal after the waiting period has expired.
     * @dev Only the admin can call this. Changes the mailbox address if the waiting period has passed.
     */
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

    /**
     * @notice Toggles the fuse state of the contract.
     * @dev When the fuse is on, certain functions are restricted to prevent
     *      actions like unwrapping tokens. This is an emergency stop mechanism.
     *      When the fuse is off, all unwrapping functions are disabled.
     *      This function can only be called by the admin.
     */
    function setFuse() external onlyAdmin {
        fuse = !fuse;
    }

    //🬺🬸🬌🬬🬨🬒🬒🬥🬞🬍🬱🬎🬜🬻🬧🬯🬝🬁🬃🬏🬿🬯🬄🬫🬭🬒🬍🬍🬬🬁🬝🬒 Getters 🬑🬚🬡🬿🬭🬙🬕🬪🬜🬐🬒🬽🬣🬉🬬🬓🬱🬕🬤🬒🬐🬨🬻🬻🬂🬉🬉🬴🬔🬄🬁🬙

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

    //🬏🬘🬹🬚🬣🬔🬂🬆🬌🬚🬏🬬🬢🬊🬯🬷🬍🬲🬩🬂🬐🬪🬳🬠🬷🬺🬛🬅 ERC20 Overrides 🬌🬊🬸🬆🬀🬀🬥🬊🬻🬞🬿🬾🬸🬪🬶🬄🬸🬦🬹🬈🬌🬘🬼🬸🬚🬕🬣🬪
    function decimals() public view override returns (uint8) {
        return 15;
    }
}
