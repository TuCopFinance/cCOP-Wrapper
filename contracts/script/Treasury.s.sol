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
            // si el id es 44787 usa 0xEf9F292fcEBC3848bF4bB92a96a04F9ECBb78E59
            block.chainid == 44787
                ? 0xEf9F292fcEBC3848bF4bB92a96a04F9ECBb78E59  // mailbox for celo alfajores (testnet)
                : 0x50da3B3907A08a24fe4999F4Dcf337E8dC7954bb, // mailbox for celo mainnet
            block.chainid == 44787
            ? 0xeF760Ba3281205ec8baB0E63Be0c74a734D11825 // cCOP address for celo alfajores (testnet)
            : 0x8A567e2aE79CA692Bd748aB832081C45de4041eA // cCOP address for celo mainnet
        );

        vm.stopBroadcast();
    }
}
