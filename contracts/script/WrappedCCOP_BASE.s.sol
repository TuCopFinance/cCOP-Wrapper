// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WrappedCCOP} from "../src/WrappedCCOP.sol";

contract WrappedCCOP_Base_Script is Script {
    WrappedCCOP public wrappedCCOP;

    address public constant OWNER = 0x5cBf2D4Bbf834912Ad0bD59980355b57695e8309; // Mailbox for Base Sepolia (testnet)

    address public constant MAILBOX_BASE_SEPOLIA =
        0x6966b0E55883d49BFB24539356a2f8A673E02039; // Mailbox for Base Sepolia (testnet)
    address public constant MAILBOX_BASE_MAINNET =
        0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D; // Mailbox for Base Mainnet

    
    uint32 public constant DOMAIN_ID_CELO_SEPOLIA = 44787; // Domain ID for Celo Sepolia
    uint32 public constant DOMAIN_ID_CELO_MAINNET = 42220; // Domain ID for Celo Mainnet

    address public constant TREASURY_ADDRESS =
        0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22; // Example treasury address

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        wrappedCCOP = new WrappedCCOP(
            OWNER,
            block.chainid == 84532
                ? MAILBOX_BASE_SEPOLIA
                : MAILBOX_BASE_MAINNET,
            block.chainid == 84532
                ? DOMAIN_ID_CELO_SEPOLIA
                : DOMAIN_ID_CELO_MAINNET,
            TREASURY_ADDRESS
        );

        /*
        wrappedCCOP.setTreasury(
            treasuryAddress, // treasury address
            block.chainid == 84532 ? 44787 : 42220 // domain ID for Base Sepolia or Base Mainnet
        );
        */

        vm.stopBroadcast();
    }
}
