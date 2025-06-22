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
            
            block.chainid == 84532
                ? 0x6966b0E55883d49BFB24539356a2f8A673E02039 // mailbox for Base Sepolia (testnet)
                : 0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D  // mailbox for Base Mainnet
        );

        vm.stopBroadcast();
    }
}
