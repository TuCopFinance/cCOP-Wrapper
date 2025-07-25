// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {GasFeeSponsorship} from "../src/GasFeeSponsorship.sol";

contract GasFeeSponsorshipScript is Script {
    GasFeeSponsorship public gfe;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        gfe = new GasFeeSponsorship(
            0x68c931C9a534D37aa78094877F46fE46a49F1A51,
            0x5cBf2D4Bbf834912Ad0bD59980355b57695e8309
        );


        vm.stopBroadcast();
    }
}
