
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─────────────────────────────────────────────
// Token: wCOP on Base (ERC20 with permit, mintable by bridge)
// ─────────────────────────────────────────────

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WrappedCOP is ERC20Permit, Ownable {
    address public bridge;

    constructor(address _bridge)
        ERC20("Wrapped COP", "wCOP")
        ERC20Permit("Wrapped COP")
    {
        bridge = _bridge;
    }

    modifier onlyBridge() {
        require(msg.sender == bridge, "Not bridge");
        _;
    }

    function mint(address to, uint256 amount) external onlyBridge {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyBridge {
        _burn(from, amount);
    }

    function updateBridge(address newBridge) external onlyOwner {
        bridge = newBridge;
    }
}

// ─────────────────────────────────────────────
// Receiver: CCIPReceiver to mint wCOP on Base
// ─────────────────────────────────────────────

import "@chainlink/contracts-ccip/src/v0.8/CCIPReceiver.sol";

contract CCIPReceiverBase is CCIPReceiver {
    WrappedCOP public wCOP;
    mapping(bytes32 => bool) public processedMints;

    event Minted(address indexed to, uint256 amount, bytes32 indexed messageId);

    constructor(address _router, address _wCOP) CCIPReceiver(_router) {
        wCOP = WrappedCOP(_wCOP);
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        (address to, uint256 amount) = abi.decode(message.data, (address, uint256));
        require(to != address(0) && amount > 0, "Invalid message");

        bytes32 messageId = keccak256(abi.encode(to, amount, message.sourceChainSelector, message.sender));
        require(!processedMints[messageId], "Already minted");

        processedMints[messageId] = true;
        wCOP.mint(to, amount);

        emit Minted(to, amount, messageId);
    }
}

// ─────────────────────────────────────────────
// Sender: Base-side to send burn event to Celo
// ─────────────────────────────────────────────

import "@chainlink/contracts-ccip/src/v0.8/CCIPSender.sol";

contract BurnNotifierBase is CCIPSender {
    WrappedCOP public wCOP;
    mapping(bytes32 => bool) public sentBurns;

    event BurnInitiated(address indexed from, uint256 amount, bytes32 indexed burnId);

    constructor(address _router, address _link, address _wCOP) CCIPSender(_router, _link) {
        wCOP = WrappedCOP(_wCOP);
    }

    function burnAndNotify(uint64 destinationChainSelector, address receiver, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        bytes32 burnId = keccak256(abi.encode(msg.sender, amount, block.number));
        require(!sentBurns[burnId], "Already sent");
        sentBurns[burnId] = true;

        wCOP.burn(msg.sender, amount);

        bytes memory message = abi.encode(msg.sender, amount, burnId);
        _sendMessage(destinationChainSelector, receiver, message, address(0), 0);

        emit BurnInitiated(msg.sender, amount, burnId);
    }
}

// ─────────────────────────────────────────────
// Vault (ya implementado anteriormente)
// ─────────────────────────────────────────────

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts-ccip/src/v0.8/CCIPSender.sol";
import "@chainlink/contracts-ccip/src/v0.8/CCIPReceiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CCopVault is CCIPReceiver, CCIPSender, Ownable {
    IERC20 public immutable cCOP;
    mapping(address => uint256) public locked;
    mapping(bytes32 => bool) public processedBurns;

    event Deposited(address indexed user, uint256 amount, bytes32 indexed messageId);
    event Released(address indexed user, uint256 amount);

    constructor(
        address _router,
        address _link,
        address _cCOP
    ) CCIPReceiver(_router) CCIPSender(_router, _link) {
        cCOP = IERC20(_cCOP);
    }

    function deposit(uint64 destinationChainSelector, address receiver, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(cCOP.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        locked[msg.sender] += amount;

        bytes memory message = abi.encode(msg.sender, amount);
        bytes32 messageId = _sendMessage(destinationChainSelector, receiver, message, address(0), 0);

        emit Deposited(msg.sender, amount, messageId);
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        (address user, uint256 amount, bytes32 burnId) = abi.decode(message.data, (address, uint256, bytes32));
        require(!processedBurns[burnId], "Burn already processed");

        processedBurns[burnId] = true;

        require(cCOP.transfer(user, amount), "Release failed");
        emit Released(user, amount);
    }
}
