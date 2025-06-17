// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals) ERC20(name, symbol) {
        _mint(msg.sender, 1_000_000 ether);
        _setupDecimals(decimals);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function _setupDecimals(uint8 decimals) internal {
        assembly {
            sstore(0x1, decimals)
        }
    }
}
