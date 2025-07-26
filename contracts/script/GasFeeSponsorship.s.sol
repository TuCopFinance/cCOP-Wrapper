// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {GasFeeSponsorship} from "../src/GasFeeSponsorship.sol";

contract GasFeeSponsorshipScript is Script {
    GasFeeSponsorship public gfe;

    address public constant OWNER = 0x5cBf2D4Bbf834912Ad0bD59980355b57695e8309; // Owner address for the Treasury contract

    address public constant IDENTITY_VERIFICATION_HUB_CELO_ALFAJORES =
        0x68c931C9a534D37aa78094877F46fE46a49F1A51; // Identity Verification Hub for Celo Alfajores (testnet)
    address public constant IDENTITY_VERIFICATION_HUB_CELO_MAINNET =
        0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF; // Identity Verification Hub for Celo Mainnet

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        gfe = new GasFeeSponsorship(
            block.chainid == 44787
                ? IDENTITY_VERIFICATION_HUB_CELO_ALFAJORES
                : IDENTITY_VERIFICATION_HUB_CELO_MAINNET,
            OWNER
        );

        vm.stopBroadcast();
    }
}
