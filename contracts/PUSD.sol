// SPDX-License-Identifier: MIT

pragma solidity  ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PUSD is ERC20 {
    constructor() ERC20("TEST_PUSD","PUSD"){
        _mint(msg.sender, 1000 *  10** 18);
    }
}