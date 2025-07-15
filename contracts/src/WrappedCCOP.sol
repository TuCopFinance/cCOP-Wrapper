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
 * @notice ERC20 wrapper for the Celo Colombian Peso (cCOP) token, enabling secure cross-chain 
 *         transfers and management via Hyperlane.
 */

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";

contract WrappedCCOP is ERC20 {
    //🬥🬱🬢🬽🬺🬰🬑🬰🬚🬄🬓🬨🬘🬪🬠🬹🬥🬁🬱🬎🬅🬟🬢🬞🬔🬷🬁🬶🬸🬔🬴🬥 Events 🬏🬏🬢🬺🬱🬋🬿🬪🬙🬒🬽🬃🬢🬻🬠🬥🬑🬬🬄🬳🬥🬠🬷🬕🬆🬳🬜🬼🬓🬷🬬🬴
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);

    //🬳🬀🬮🬣🬭🬸🬦🬐🬤🬨🬯🬲🬠🬰🬒🬓🬩🬅🬓🬮🬦🬠🬇🬨🬖🬧🬵🬬🬨🬌🬥🬨 Errors 🬂🬹🬾🬁🬬🬫🬸🬸🬉🬼🬅🬩🬂🬤🬶🬨🬣🬴🬙🬑🬽🬧🬠🬷🬭🬊🬽🬢🬜🬏🬹🬹
    error MailboxNotAuthorized(); // Only the authorized mailbox can call this function
    error SenderNotAuthorized(); // Only the authorized sender can call this function
    error ChainIdNotAuthorized(); // Chain ID is not authorized
    error AmountMustBeGreaterThanZero(); // Amount must be greater than zero
    error UnwrappedTokenNotSet(); // Unwrapped token address is not set
    error UnauthorizedAccount(); // Caller is not authorized
    error EmergencyStop(); // Contract is paused
    error WaitingPeriodNotExpired(); // Waiting period has not expired

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
    Bytes32Proposal private treasuryAddress;
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
     *  @param _treasuryAddress The address of the treasury contract.
     */
    constructor(
        address _initialAdmin,
        address _mailbox,
        uint32 _domainId,
        address _treasuryAddress
    ) ERC20("Wrapped Celo Colombian Peso", "wcCOP") {
        admin.current = _initialAdmin;
        mailboxAddress.current = _mailbox;
        cCOPDomainId.current = _domainId;
        treasuryAddress.current = bytes32(uint256(uint160(_treasuryAddress)));
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
        if (msg.sender != mailboxAddress.current) revert MailboxNotAuthorized();

        if (_sender != treasuryAddress.current) revert SenderNotAuthorized();

        if (_origin != cCOPDomainId.current) revert ChainIdNotAuthorized();

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
        if (amount == 0) revert AmountMustBeGreaterThanZero();

        bytes memory payload = abi.encode(receiver, amount);

        uint256 quote = getQuote(receiver, amount);

        _burn(msg.sender, amount);

        messageId = IMailbox(mailboxAddress.current).dispatch{value: quote}(
            cCOPDomainId.current,
            treasuryAddress.current,
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
                treasuryAddress.current,
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
     * @notice Proposes a new treasury address.
     * @dev Only the current admin can call this. Sets the candidate and the acceptance time.
     * @param _newAddress The proposed new treasury address.
     */
    function proposeNewTreasuryAddressProposal(
        address _newAddress
    ) external onlyAdmin {
        treasuryAddress.proposal = bytes32(uint256(uint160(_newAddress)));
        treasuryAddress.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    /**
     * @notice Cancels the current treasury address proposal.
     * @dev Only the current admin can call this. Resets the proposal and acceptance time.
     */
    function cancelTreasuryAddressProposal() external onlyAdmin {
        treasuryAddress.proposal = bytes32(0);
        treasuryAddress.timeToAccept = 0;
    }

    /**
     * @notice Accepts the treasury address proposal after the waiting period has expired.
     * @dev Only the admin can call this. Changes the treasury address if the waiting period has passed.
     */
    function acceptTreasuryAddressProposal() external onlyAdmin {
        if (block.timestamp < treasuryAddress.timeToAccept) {
            revert WaitingPeriodNotExpired();
        }

        treasuryAddress = Bytes32Proposal({
            current: treasuryAddress.proposal,
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
    /**
     * @notice Returns the current admin structure.
     * @dev Provides the current, proposed, and acceptance time for the admin address.
     * @return The AddressTypeProposal struct for the admin.
     */
    function getAdminStructure()
        external
        view
        returns (AddressTypeProposal memory)
    {
        return admin;
    }

    /**
     * @notice Returns the current treasury address structure.
     * @dev Provides the current, proposed, and acceptance time for the treasury address.
     * @return The Bytes32Proposal struct for the treasury address.
     */
    function getTreasuryAddressStructure()
        external
        view
        returns (Bytes32Proposal memory)
    {
        return treasuryAddress;
    }

    /**
     * @notice Returns the current cCOP domain ID structure.
     * @dev Provides the current, proposed, and acceptance time for the cCOP domain ID.
     * @return The Uint32Proposal struct for the cCOP domain ID.
     */
    function getCCOPDomainIdStructure()
        external
        view
        returns (Uint32Proposal memory)
    {
        return cCOPDomainId;
    }

    /**
     * @notice Returns the current mailbox address structure.
     * @dev Provides the current, proposed, and acceptance time for the mailbox address.
     * @return The AddressTypeProposal struct for the mailbox address.
     */
    function getMailboxAddressStructure()
        external
        view
        returns (AddressTypeProposal memory)
    {
        return mailboxAddress;
    }

    /**
     * @notice Returns the current state of the fuse.
     * @dev Indicates whether the emergency stop mechanism is active.
     * @return True if the fuse is on, false otherwise.
     */
    function getFuse() external view returns (bool) {
        return fuse;
    }

    /**
     * @notice Returns the number of decimals used by the token.
     * @dev Overrides the ERC20 decimals function to return 15.
     * @return The number of decimals (15).
     */
    function decimals() public view override returns (uint8) {
        return 15;
    }
}
