// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FrollBnb {
    IERC20 public frollToken; // Address of the FROLL token contract
    address public owner; // Contract owner

    // Events
    event SwapFROLLForBNB(address indexed user, uint256 amount);
    event SwapBNBForFROLL(address indexed user, uint256 amount);
    event DepositFROLL(address indexed owner, uint256 amount);
    event WithdrawFROLL(address indexed owner, uint256 amount);
    event DepositBNB(address indexed owner, uint256 amount);
    event WithdrawBNB(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(IERC20 _frollToken) {
        frollToken = _frollToken;
        owner = msg.sender;
    }

    // Swap FROLL for BNB
    function swapFROLLForBNB(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(address(this).balance >= amount, "Insufficient BNB in contract");

        // Transfer FROLL from user to contract
        require(
            frollToken.transferFrom(msg.sender, address(this), amount),
            "FROLL transfer failed"
        );

        // Send BNB to user
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "BNB transfer failed");

        emit SwapFROLLForBNB(msg.sender, amount);
    }

    // Swap BNB for FROLL
    function swapBNBForFROLL() external payable {
        uint256 amount = msg.value;
        require(amount > 0, "Amount must be greater than zero");
        require(
            frollToken.balanceOf(address(this)) >= amount,
            "Insufficient FROLL in contract"
        );

        // Transfer FROLL to user
        require(
            frollToken.transfer(msg.sender, amount),
            "FROLL transfer failed"
        );

        emit SwapBNBForFROLL(msg.sender, amount);
    }

    // Deposit FROLL into the contract
    function depositFROLL(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");

        // Transfer FROLL from owner to contract
        require(
            frollToken.transferFrom(msg.sender, address(this), amount),
            "FROLL transfer failed"
        );

        emit DepositFROLL(msg.sender, amount);
    }

    // Withdraw FROLL from the contract
    function withdrawFROLL(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(
            frollToken.balanceOf(address(this)) >= amount,
            "Insufficient FROLL in contract"
        );

        // Transfer FROLL to owner
        require(
            frollToken.transfer(msg.sender, amount),
            "FROLL transfer failed"
        );

        emit WithdrawFROLL(msg.sender, amount);
    }

    // Deposit BNB into the contract
    function depositBNB() external payable onlyOwner {
        require(msg.value > 0, "Amount must be greater than zero");
        emit DepositBNB(msg.sender, msg.value);
    }

    // Withdraw BNB from the contract
    function withdrawBNB(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(address(this).balance >= amount, "Insufficient BNB in contract");

        // Send BNB to owner
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "BNB transfer failed");

        emit WithdrawBNB(msg.sender, amount);
    }

    // Fallback function to receive BNB
    receive() external payable {}
}
