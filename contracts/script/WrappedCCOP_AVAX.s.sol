// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WrappedCCOP} from "../src/WrappedCCOP.sol";

contract WrappedCCOP_AVAX_Script is Script {
    WrappedCCOP public wrappedCCOP;

    address public constant OWNER = 0x5cBf2D4Bbf834912Ad0bD59980355b57695e8309;

    address public constant MAILBOX_AVAX_FUJI =
        0x5b6CFf85442B851A8e6eaBd2A4E4507B5135B3B0; // Mailbox for Base Sepolia (testnet)
    address public constant MAILBOX_AVAX_MAINNET =
        0xFf06aFcaABaDDd1fb08371f9ccA15D73D51FeBD6; // Mailbox for Base Mainnet

    
    uint32 public constant DOMAIN_ID_CELO_SEPOLIA = 44787; // Domain ID for Celo Sepolia
    uint32 public constant DOMAIN_ID_CELO_MAINNET = 42220; // Domain ID for Celo Mainnet

    address public constant TREASURY_ADDRESS =
        0x5Cc112D9634a2D0cB3A0BA8dDC5dC05a010A3D22; // Example treasury address

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        wrappedCCOP = new WrappedCCOP(
            OWNER,
            block.chainid == 43113
                ? MAILBOX_AVAX_FUJI
                : MAILBOX_AVAX_MAINNET,
            block.chainid == 43113
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
