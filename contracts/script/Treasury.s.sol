// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Treasury} from "../src/Treasury.sol";

contract TreasuryScript is Script {
    Treasury public treasury;
    address public constant OWNER = 0x5cBf2D4Bbf834912Ad0bD59980355b57695e8309; // Owner address for the Treasury contract
    address public constant MAILBOX_CELO_ALFAJORES = 0xEf9F292fcEBC3848bF4bB92a96a04F9ECBb78E59; // Mailbox for Celo Alfajores (testnet)
    address public constant MAILBOX_CELO_MAINNET = 0x50da3B3907A08a24fe4999F4Dcf337E8dC7954bb; // Mailbox for Celo Mainnet
    address public constant CCOP_CELO_ALFAJORES = 0xeF760Ba3281205ec8baB0E63Be0c74a734D11825; // cCOP address for Celo Alfajores (testnet)
    address public constant CCOP_CELO_MAINNET = 0x8A567e2aE79CA692Bd748aB832081C45de4041eA; // cCOP address for Celo Mainnet

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        treasury = new Treasury(
            OWNER,
            // si el id es 44787 usa MAILBOX_CELO_ALFAJORES
            block.chainid == 44787
                ? MAILBOX_CELO_ALFAJORES  // mailbox for celo alfajores (testnet)
                : MAILBOX_CELO_MAINNET, // mailbox for celo mainnet
            block.chainid == 44787
            ? CCOP_CELO_ALFAJORES // cCOP address for celo alfajores (testnet)
            : CCOP_CELO_MAINNET // cCOP address for celo mainnet
        );

        vm.stopBroadcast();
    }
}
