// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {CCOPMock} from "../src/CCOPMock.sol";

contract CCOPMockScript is Script {
    CCOPMock public token;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        token = new CCOPMock(
            0x5cBf2D4Bbf834912Ad0bD59980355b57695e8309
        );

        vm.stopBroadcast();
    }
}
