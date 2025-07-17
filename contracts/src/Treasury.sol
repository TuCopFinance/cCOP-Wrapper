// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

/**
  ______                                     
 /_  __________  ____ ________  _________  __
  / / / ___/ _ \/ __ `/ ___/ / / / ___/ / / /
 / / / /  /  __/ /_/ (__  / /_/ / /  / /_/ / 
/_/ /_/   \___/\__,_/____/\__,_/_/   \__, /  
                                    /____/   

 * @title Treasury for Celo Colombian Peso (cCOP)
 * @author jistro.eth
 * @notice Manages the wrapping of cCOP tokens and cross-chain transfers using Hyperlane.
 */

import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury {
    //🬜🬫🬲🬆🬡🬜🬬🬔🬱🬵🬿🬣🬝🬭🬟🬙🬳🬓🬖🬃🬟🬢🬶🬰🬍🬰🬍🬫🬜🬚🬓🬈 Events 🬓🬐🬆🬢🬀🬼🬵🬆🬑🬼🬄🬶🬞🬚🬊🬖🬳🬋🬨🬺🬢🬵🬨🬯🬼🬙🬸🬈🬾🬆🬾🬟
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);

    //🬾🬍🬾🬱🬃🬆🬠🬿🬶🬽🬒🬖🬱🬘🬦🬭🬓🬼🬜🬁🬚🬛🬋🬪🬡🬥🬟🬆🬇🬭🬄🬉 Errors 🬌🬱🬨🬼🬝🬽🬩🬩🬰🬩🬋🬈🬶🬛🬦🬗🬠🬂🬇🬉🬭🬿🬴🬚🬿🬫🬭🬜🬰🬺🬢🬈
    error MailboxNotAuthorized(); // Only the authorized mailbox can call this function
    error SenderNotAuthorized(); // Only the authorized sender can call this function
    error ChainIdNotAuthorized(); // Chain ID is not authorized
    error AmountMustBeGreaterThanZero(); // Amount must be greater than zero
    error WrappedTokenNotSet(); // Wrapped token address is not set
    error UnauthorizedAccount(); // Caller is not authorized
    error EmergencyStop(); // Contract is paused
    error WaitingPeriodNotExpired(); // Waiting period has not expired
    error MailboxAddressNotSet(); // Mailbox address is not set
    error CCOPAddressNotSet(); // cCOP address is not set
    error QuoteNotEnough(); // The provided quote is not enough to cover the cross-chain message fee

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

    //🬢🬣🬚🬡🬺🬍🬏🬬🬃🬚🬀🬈🬩🬝🬳🬇🬑🬜🬾🬢🬧🬇🬖🬥🬵🬬🬬🬲 State Variables 🬓🬿🬬🬌🬪🬒🬔🬸🬁🬔🬹🬫🬾🬿🬡🬴🬅🬷🬶🬍🬁🬺🬛🬒🬮🬭🬟🬩
    uint256 private constant WAITING_PERIOD = 1 days;
    AddressTypeProposal private admin;
    AddressTypeProposal private mailboxAddress;
    AddressTypeProposal private cCOPAddress;
    bool private fuse = true;
    mapping(uint32 DomainID => Bytes32Proposal WrappedTokenAddress)
        public wrappedToken;

    //🬟🬡🬁🬓🬝🬰🬬🬮🬋🬆🬚🬦🬪🬠🬻🬉🬘🬜🬸🬘🬭🬚🬜🬦🬃🬳🬖🬓🬝🬵🬔 Modifier 🬞🬖🬜🬠🬨🬃🬗🬩🬭🬂🬱🬸🬏🬉🬞🬙🬮🬧🬀🬔🬐🬏🬶🬘🬉🬩🬜🬓🬍🬷🬈
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

    //🬩🬋🬍🬠🬥🬻🬡🬤🬣🬺🬔🬞🬬🬉🬙🬛🬤🬾🬤🬌🬽🬯🬙🬦🬘🬥🬇🬬🬣🬈 Constructor 🬤🬣🬟🬈🬒🬨🬚🬢🬉🬒🬾🬹🬒🬀🬣🬘🬵🬇🬟🬍🬌🬽🬬🬧🬢🬏🬢🬠🬫🬄
    constructor(address _initialAdmin, address _mailbox, address _cCopAddress) {
        admin.current = _initialAdmin;
        mailboxAddress.current = _mailbox;
        cCOPAddress.current = _cCopAddress;
    }

    //🬨🬟🬣🬡🬋🬴🬹🬉🬮🬣🬆🬫🬨🬺🬊🬠🬒🬛🬀🬱🬱🬐🬘🬃🬑🬶🬬🬔🬛 Token Handling 🬜🬲🬁🬜🬻🬻🬀🬃🬺🬊🬆🬩🬡🬈🬻🬮🬅🬬🬰🬐🬳🬥🬱🬼🬲🬝🬟🬺🬺
    /**
     *  @notice Handles the incoming cross-chain message to give back cCOP tokens
     *          after unwrapping.
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

        if (_sender != wrappedToken[_origin].current)
            revert SenderNotAuthorized();

        (address to, uint256 amount) = abi.decode(_data, (address, uint256));

        IERC20(cCOPAddress.current).transfer(to, amount);
    }

    /**
     * @notice Handles the wrapping of cCOP tokens and dispatches a cross-chain message.
     * @dev Burns cCOP from the sender, encodes the payload, and sends it via Hyperlane mailbox.
     *      Reverts if the amount is zero or the wrapped token is not set for the domain.
     * @param domainID The destination domain ID.
     * @param receiver The address to receive the wrapped tokens on the destination chain.
     * @param amount The amount of cCOP to wrap and send.
     * @return The message ID of the dispatched cross-chain message.
     */
    function wrap(
        uint32 domainID,
        address receiver,
        uint256 amount
    ) external payable returns (bytes32) {
        if (amount == 0) revert AmountMustBeGreaterThanZero();

        if (wrappedToken[domainID].current == bytes32(0))
            revert WrappedTokenNotSet();

        uint256 quote = getQuote(domainID, receiver, amount);

        if (msg.value < quote) revert QuoteNotEnough();

        bytes memory payload = abi.encode(receiver, amount);

        bytes32 messageId = IMailbox(mailboxAddress.current).dispatch{
            value: quote
        }(domainID, wrappedToken[domainID].current, payload);

        IERC20(cCOPAddress.current).transferFrom(
            msg.sender,
            address(this),
            amount
        );

        return messageId;
    }

    /**
     * @notice Gets the quote for dispatching a cross-chain wrap message.
     * @dev Calculates the required fee for sending the message to the destination domain.
     * @param domainID The destination domain ID.
     * @param receiver The address to receive the wrapped tokens on the destination chain.
     * @param amount The amount of cCOP to wrap and send.
     * @return The required fee for the cross-chain message dispatch.
     */
    function getQuote(
        uint32 domainID,
        address receiver,
        uint256 amount
    ) public view returns (uint256) {
        bytes memory payload = abi.encode(receiver, amount);
        return
            IMailbox(mailboxAddress.current).quoteDispatch(
                domainID,
                wrappedToken[domainID].current,
                payload
            );
    }

    //🬒🬾🬖🬹🬸🬠🬪🬛🬪🬛🬈🬍🬸🬃🬣🬁🬏🬔🬹🬡🬂🬞🬘🬩🬗🬫🬌🬶 Admin Functions 🬋🬣🬼🬆🬓🬄🬳🬆🬬🬶🬀🬸🬪🬄🬄🬰🬁🬍🬗🬯🬚🬏🬎🬭🬪🬣🬃🬽
    /**
     * @dev These functions allow some vital variables to be changed by the admin.
     *      They include:
     *      - Admin address
     *      - Wrapped token addresses for different domains
     *      - Mailbox address
     *      - cCOP address
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
    function cancelNewAdminProposal() external onlyAdmin {
        admin.proposal = address(0);
        admin.timeToAccept = 0;
    }

    /**
     * @notice Accepts the admin proposal after the waiting period has expired.
     * @dev Only the proposed admin can call this. Changes the admin if the waiting period has passed.
     */
    function acceptNewAdminProposal() external {
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
     *  @notice Proposes a new wrapped token address for a specific domain.
     *  @dev Only the current admin can call this. Sets the candidate and the acceptance time.
     *       If the current address is not set, it initializes it with the new address skipping the waiting period.
     * @param _domainID The domain ID of the wrapped token.
     * @param _newAddress The address of the new wrapped token.
     */
    function proposeNewWrappedTokenAddressProposal(
        uint32 _domainID,
        address _newAddress
    ) external onlyAdmin {
        if (
            wrappedToken[_domainID].current ==
            bytes32(uint256(uint160(address(0))))
        ) {
            wrappedToken[_domainID].current = bytes32(
                uint256(uint160(_newAddress))
            );
        } else {
            wrappedToken[_domainID].proposal = bytes32(
                uint256(uint160(_newAddress))
            );
            wrappedToken[_domainID].timeToAccept =
                block.timestamp +
                WAITING_PERIOD;
        }
    }

    /**
     * @notice Cancels the current wrapped token proposal for a specific domain.
     * @dev Only the current admin can call this. Resets the proposal and acceptance time.
     * @param _domainID The domain ID of the wrapped token.
     */
    function cancelNewWrappedTokenAddressProposal(
        uint32 _domainID
    ) external onlyAdmin {
        wrappedToken[_domainID].proposal = bytes32(0);
        wrappedToken[_domainID].timeToAccept = 0;
    }

    /**
     * @notice Accepts the wrapped token proposal after the waiting period has expired.
     * @dev Only the proposed admin can call this. Changes the wrapped token if the waiting period has passed.
     * @param _domainID The domain ID of the wrapped token.
     */
    function acceptNewWrappedTokenAddressProposal(
        uint32 _domainID
    ) external onlyAdmin {
        if (
            wrappedToken[_domainID].proposal ==
            bytes32(uint256(uint160(address(0))))
        ) {
            revert WrappedTokenNotSet();
        }
        if (block.timestamp < wrappedToken[_domainID].timeToAccept) {
            revert WaitingPeriodNotExpired();
        }

        wrappedToken[_domainID] = Bytes32Proposal({
            current: wrappedToken[_domainID].proposal,
            proposal: bytes32(0),
            timeToAccept: 0
        });
    }

    /**
     * @notice Proposes a new mailbox address.
     * @dev Only the current admin can call this. Sets the candidate and the acceptance time.
     * @param _newAddress The proposed new mailbox address.
     */
    function proposeNewMailboxAddressProposal(
        address _newAddress
    ) external onlyAdmin {
        mailboxAddress.proposal = _newAddress;
        mailboxAddress.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    /**
     * @notice Cancels the current mailbox address proposal.
     * @dev Only the current admin can call this. Resets the proposal and acceptance time.
     */
    function cancelNewMailboxAddressProposal() external onlyAdmin {
        mailboxAddress.proposal = address(0);
        mailboxAddress.timeToAccept = 0;
    }

    /**
     * @notice Accepts the mailbox address proposal after the waiting period has expired.
     * @dev Only the current admin can call this. Changes the mailbox address if the waiting period has passed.
     */
    function acceptNewMailboxAddressProposal() external onlyAdmin {
        if (mailboxAddress.proposal == address(0)) {
            revert MailboxAddressNotSet();
        }
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
     * @notice Proposes a new cCOP address.
     * @dev Only the current admin can call this. Sets the candidate and the acceptance time.
     * @param _newAddress The proposed new cCOP address.
     */
    function proposeNewCCOPAddressProposal(
        address _newAddress
    ) external onlyAdmin {
        cCOPAddress.proposal = _newAddress;
        cCOPAddress.timeToAccept = block.timestamp + WAITING_PERIOD;
    }

    /**
     * @notice Cancels the current cCOP address proposal.
     * @dev Only the current admin can call this. Resets the proposal and acceptance time.
     */
    function cancelNewCCOPAddressProposal() external onlyAdmin {
        cCOPAddress.proposal = address(0);
        cCOPAddress.timeToAccept = 0;
    }

    /**
     * @notice Accepts the cCOP address proposal after the waiting period has expired.
     * @dev Only the current admin can call this. Changes the cCOP address if the waiting period has passed.
     */
    function acceptNewCCOPAddressProposal() external onlyAdmin {
        if (cCOPAddress.proposal == address(0)) {
            revert CCOPAddressNotSet();
        }
        if (block.timestamp < cCOPAddress.timeToAccept) {
            revert WaitingPeriodNotExpired();
        }

        cCOPAddress = AddressTypeProposal({
            current: cCOPAddress.proposal,
            proposal: address(0),
            timeToAccept: 0
        });
    }

    /**
     * @notice Toggles the emergency stop (fuse) state.
     * @dev Only the current admin can call this. If fuse is true, it sets it to false and vice versa.
     */
    function toggleFuse() external onlyAdmin {
        fuse = !fuse;
    }

    //🬳🬳🬦🬳🬒🬏🬺🬸🬳🬘🬒🬥🬟🬱🬍🬭🬳🬒🬴🬈🬆🬮🬛🬌🬢🬳🬲🬺🬕🬙🬠🬭 Getters 🬕🬋🬣🬲🬡🬉🬍🬹🬸🬱🬷🬔🬠🬭🬡🬜🬥🬃🬃🬢🬀🬳🬜🬿🬏🬘🬋🬋🬗🬆🬬🬎
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
     * @notice Returns the current cCOP address structure.
     * @dev Provides the current, proposed, and acceptance time for the cCOP address.
     * @return The AddressTypeProposal struct for the cCOP address.
     */
    function getCCOPAddressStructure()
        external
        view
        returns (AddressTypeProposal memory)
    {
        return cCOPAddress;
    }

    /**
     * @notice Returns the wrapped token address structure for a specific domain.
     * @dev Provides the current, proposed, and acceptance time for the wrapped token address.
     * @param _domainID The domain ID of the wrapped token.
     * @return The Bytes32Proposal struct for the wrapped token address.
     */
    function getWrappedTokenAddressStructure(
        uint32 _domainID
    ) external view returns (Bytes32Proposal memory) {
        return wrappedToken[_domainID];
    }

    /**
     * @notice Returns the current wrapped token address for a specific domain.
     * @dev Provides the current wrapped token address as an address type.
     * @param _domainID The domain ID of the wrapped token.
     * @return The current wrapped token address as an address type.
     */
    function getWrappedTokenAddress(
        uint32 _domainID
    ) external view returns (address) {
        return address(uint160(uint256(wrappedToken[_domainID].current)));
    }

    /**
     * @notice Returns the current state of the fuse (emergency stop).
     * @dev Provides a boolean indicating whether the contract is paused or not.
     * @return The current state of the fuse.
     */
    function getFuse() external view returns (bool) {
        return fuse;
    }
}
