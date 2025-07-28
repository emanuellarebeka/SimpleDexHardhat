const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleDEX with TokenA and TokenB", function () {
  let owner, user;
  let tokenA, tokenB, dex;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy TokenA and TokenB with mint and burn
    const TokenA = await ethers.getContractFactory("TokenA");
    const TokenB = await ethers.getContractFactory("TokenB");

    tokenA = await TokenA.deploy(10000);
    tokenB = await TokenB.deploy(10000);

    // Mint tokens to user
    await tokenA.mint(user.getAddress(), ethers.parseEther("1000"));
    await tokenB.mint(user.getAddress(), ethers.parseEther("1000"));

    // Deploy DEX
    const DEX = await ethers.getContractFactory("SimpleDEX");
    dex = await DEX.deploy(tokenA.getAddress(), tokenB.getAddress());

    // Owner approves DEX
    await tokenA.approve(dex.getAddress(), ethers.parseEther("1000"));
    await tokenB.approve(dex.getAddress(), ethers.parseEther("1000"));

    // User approves DEX
    await tokenA.connect(user).approve(dex.getAddress(), ethers.parseEther("1000"));
    await tokenB.connect(user).approve(dex.getAddress(), ethers.parseEther("1000"));
  });

  it("adds liquidity", async () => {
    await dex.addLiquidity(ethers.parseEther("100"), ethers.parseEther("200"));
    expect(await tokenA.balanceOf(dex.getAddress())).to.equal(ethers.parseEther("100"));
    expect(await tokenB.balanceOf(dex.getAddress())).to.equal(ethers.parseEther("200"));
  });

  it("removes liquidity", async () => {
    await dex.addLiquidity(ethers.parseEther("100"), ethers.parseEther("200"));
    await dex.removeLiquidity(ethers.parseEther("50"), ethers.parseEther("100"));
    expect(await tokenA.balanceOf(dex.getAddress())).to.equal(ethers.parseEther("50"));
    expect(await tokenB.balanceOf(dex.getAddress())).to.equal(ethers.parseEther("100"));
  });

  it("swaps A for B", async () => {
    await dex.addLiquidity(ethers.parseEther("100"), ethers.parseEther("200"));
    const before = await tokenB.balanceOf(user.getAddress());
    await dex.connect(user).swapAforB(ethers.parseEther("10"));
    const after = await tokenB.balanceOf(user.getAddress());
    expect(after).to.be.gt(before);
  });

  it("swaps B for A", async () => {
    await dex.addLiquidity(ethers.parseEther("100"), ethers.parseEther("200"));
    const before = await tokenA.balanceOf(user.getAddress());
    await dex.connect(user).swapBforA(ethers.parseEther("20"));
    const after = await tokenA.balanceOf(user.getAddress());
    expect(after).to.be.gt(before);
  });

  it("gets correct price", async () => {
    await dex.addLiquidity(ethers.parseEther("100"), ethers.parseEther("200"));
    const priceA = await dex.getPrice(tokenA.getAddress());
    const priceB = await dex.getPrice(tokenB.getAddress());
    expect(priceA).to.equal(ethers.parseEther("2"));
    expect(priceB).to.equal(ethers.parseEther("0.5"));
  });
});
