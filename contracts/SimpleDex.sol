
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleDEX is Ownable {
    IERC20 public tokenA;
    IERC20 public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);
    event Swap(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    constructor(address _tokenA, address _tokenB) Ownable(msg.sender) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA > 0 && amountB > 0, "Amounts must be > 0");

        if (reserveA > 0 && reserveB > 0) {
            uint256 expectedB = (amountA * reserveB) / reserveA;
            require(amountB == expectedB, "Invalid ratio");
        }

        reserveA += amountA;
        reserveB += amountB;

        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    function removeLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA > 0 && amountB > 0, "Amounts must be > 0");
        require(reserveA >= amountA && reserveB >= amountB, "Insufficient reserves");

        uint256 expectedB = (amountA * reserveB) / reserveA;
        require(amountB == expectedB, "Invalid ratio");

        reserveA -= amountA;
        reserveB -= amountB;

        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB);
    }

    function swapAforB(uint256 amountAIn) external {
        require(amountAIn > 0, "Invalid amount");
        require(reserveA > 0 && reserveB > 0, "Pool not initialized");

        uint256 amountBOut = (amountAIn * reserveB) / (reserveA + amountAIn);
        require(amountBOut <= reserveB, "Not enough TokenB");

        reserveA += amountAIn;
        reserveB -= amountBOut;

        tokenA.transferFrom(msg.sender, address(this), amountAIn);
        tokenB.transfer(msg.sender, amountBOut);

        emit Swap(msg.sender, address(tokenA), amountAIn, amountBOut);
    }

    function swapBforA(uint256 amountBIn) external {
        require(amountBIn > 0, "Invalid amount");
        require(reserveA > 0 && reserveB > 0, "Pool not initialized");

        uint256 amountAOut = (amountBIn * reserveA) / (reserveB + amountBIn);
        require(amountAOut <= reserveA, "Not enough TokenA");

        reserveB += amountBIn;
        reserveA -= amountAOut;

        tokenB.transferFrom(msg.sender, address(this), amountBIn);
        tokenA.transfer(msg.sender, amountAOut);

        emit Swap(msg.sender, address(tokenB), amountBIn, amountAOut);
    }

    function getPrice(address _token) external view returns (uint256) {
        require(reserveA > 0 && reserveB > 0, "Pool not initialized");
        if (_token == address(tokenA)) {
            return (reserveB * 1e18) / reserveA;
        } else if (_token == address(tokenB)) {
            return (reserveA * 1e18) / reserveB;
        } else {
            revert("Invalid token");
        }
    }
}
