// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WrappedCCOP} from "../src/WrappedCCOP.sol";

contract WrappedCCOPScript is Script {
    WrappedCCOP public wrappedCCOP;
    address public treasuryAddress = 0xAF4387cC9105C9B716B9B84F673996dCa7ac5150; // Example treasury address
    
    address public constant OWNER = 0x5cBf2D4Bbf834912Ad0bD59980355b57695e8309; // Mailbox for Base Sepolia (testnet)
    address public constant MAILBOX_BASE_SEPOLIA = 0x6966b0E55883d49BFB24539356a2f8A673E02039; // Mailbox for Base Sepolia (testnet)
    address public constant MAILBOX_BASE_MAINNET = 0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D; // Mailbox for Base Mainnet

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        wrappedCCOP = new WrappedCCOP(
            OWNER,
            block.chainid == 84532
                ? MAILBOX_BASE_SEPOLIA // mailbox for Base Sepolia (testnet)
                : MAILBOX_BASE_MAINNET // mailbox for Base Mainnet
        );

        wrappedCCOP.setTreasury(
            treasuryAddress, // treasury address
            block.chainid == 84532 ? 44787 : 42220 // domain ID for Base Sepolia or Base Mainnet
        );

        vm.stopBroadcast();
    }
}
