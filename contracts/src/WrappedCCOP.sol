// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";

contract WrappedCCOP is ERC20, Ownable {
    error mailboxNotAuthorized();
    error senderNotAuthorized();
    error chainIdNotAuthorized();
    error amountMustBeGreaterThanZero();
    error unwrappedTokenNotSet();

    struct TreasuryMetadata {
        bytes32 Address;
        uint32 DomainID;
    }

    TreasuryMetadata private treasury;
    address private mailboxAddress;

    constructor(
        address _initialOwner,
        address _mailbox
    ) ERC20("Wrapped Celo Colombian Peso", "wcCOP") Ownable(_initialOwner) {
        mailboxAddress = _mailbox;
    }

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _data
    ) external payable virtual {
        if (msg.sender != mailboxAddress) revert mailboxNotAuthorized();

        if (_sender != treasury.Address) revert senderNotAuthorized();

        if (_origin != treasury.DomainID) revert chainIdNotAuthorized();

        (address to, uint256 amount) = abi.decode(_data, (address, uint256));

        _mint(to, amount);
    }

    function unwrap(
        address receiver,
        uint256 amount
    ) external payable returns (bytes32) {
        if (amount == 0) revert amountMustBeGreaterThanZero();

        if (treasury.Address == bytes32(0)) revert unwrappedTokenNotSet();

        bytes memory payload = abi.encode(receiver, amount);

        uint256 quote = getQuote(receiver, amount);

        bytes32 messageId = IMailbox(mailboxAddress).dispatch{value: quote}(
            treasury.DomainID,
            treasury.Address,
            payload
        );

        _burn(msg.sender, amount);

        return messageId;
    }

    function decimals() public view override returns (uint8) {
        return 15;
    }

    function setTreasury(
        address _address,
        uint32 _domainId
    ) external onlyOwner {
        treasury = TreasuryMetadata({
            Address: bytes32(uint256(uint160(_address))),
            DomainID: _domainId
        });
    }

    function changeMailbox(address _mailbox) external onlyOwner {
        mailboxAddress = _mailbox;
    }

    function getQuote(
        address receiver,
        uint256 amount
    ) public view returns (uint256) {
        bytes memory payload = abi.encode(receiver, amount);
        return
            IMailbox(mailboxAddress).quoteDispatch(
                treasury.DomainID,
                treasury.Address,
                payload
            );
    }

    function getTreasury() external view returns (TreasuryMetadata memory) {
        return treasury;
    }

    function getMailbox() external view returns (address) {
        return mailboxAddress;
    }

    function getTreasuryAddress() external view returns (bytes32) {
        return treasury.Address;
    }
}
