// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Treasury} from "../src/Treasury.sol";

contract TreasuryScript is Script {
    Treasury public treasury;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        treasury = new Treasury(
            msg.sender,
            address(0), // mailbox address
            address(0)  // cCOP address
        );

        vm.stopBroadcast();
    }
}
