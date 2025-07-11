// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Treasury is Ownable {
    error mailboxNotAuthorized();
    error senderNotAuthorized();
    error amountMustBeGreaterThanZero();
    error wrappedTokenNotSet();

    address private mailboxAddress;
    address private cCOPAddress;

    mapping(uint32 DomainID => bytes32 WrappedTokenAddress) public wrappedToken;

    constructor(
        address _initialOwner,
        address _mailbox,
        address _cCOP
    ) Ownable(_initialOwner) {
        mailboxAddress = _mailbox;
        cCOPAddress = _cCOP;
    }

    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _data
    ) external payable virtual {
        if (msg.sender != mailboxAddress) revert mailboxNotAuthorized();

        if (_sender != wrappedToken[_origin]) revert senderNotAuthorized();

        (address to, uint256 amount) = abi.decode(_data, (address, uint256));

        IERC20(cCOPAddress).transfer(to, amount);
    }

    function wrap(
        uint32 domainID,
        address receiver,
        uint256 amount
    ) external payable returns (bytes32) {
        if (amount == 0) revert amountMustBeGreaterThanZero();

        if (wrappedToken[domainID] == bytes32(0)) revert wrappedTokenNotSet();

        bytes memory payload = abi.encode(receiver, amount);

        uint256 quote = getQuote(domainID, receiver, amount);

        bytes32 messageId = IMailbox(mailboxAddress).dispatch{value: quote}(
            domainID,
            wrappedToken[domainID],
            payload
        );

        IERC20(cCOPAddress).transferFrom(msg.sender, address(this), amount);

        return messageId;
    }

    function setWrappedToken(
        uint32 domainID,
        address _address
    ) external onlyOwner {
        wrappedToken[domainID] = bytes32(uint256(uint160(_address)));
    }

    function changeMailbox(address _mailbox) external onlyOwner {
        mailboxAddress = _mailbox;
    }

    function getQuote(
        uint32 domainID,
        address receiver,
        uint256 amount
    ) public view returns (uint256) {
        bytes memory payload = abi.encode(receiver, amount);
        return
            IMailbox(mailboxAddress).quoteDispatch(
                domainID,
                wrappedToken[domainID],
                payload
            );
    }

    function getMailbox() external view returns (address) {
        return mailboxAddress;
    }

    function getCCOPAddress() external view returns (address) {
        return cCOPAddress;
    }
}
