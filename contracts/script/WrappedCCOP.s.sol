// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WrappedCCOP} from "../src/WrappedCCOP.sol";

contract WrappedCCOPScript is Script {
    WrappedCCOP public wrappedCCOP;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        wrappedCCOP = new WrappedCCOP(
            msg.sender,
            address(0) // mailbox address
        );

        vm.stopBroadcast();
    }
}
