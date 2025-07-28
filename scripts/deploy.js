const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", await deployer.getAddress());

  // Deploy TokenA
  const TokenA = await ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy(1000000);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("TokenA deployed to:", tokenAAddress);

  // Deploy TokenB
  const TokenB = await ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy(1000000);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("TokenB deployed to:", tokenBAddress);

  // Deploy SimpleDEX
  const DEX = await ethers.getContractFactory("SimpleDEX");
  const dex = await DEX.deploy(tokenAAddress, tokenBAddress);
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log("SimpleDEX deployed to:", dexAddress);

  // Mint tokens to DEX owner for future liquidity
  const mintAmount = ethers.parseEther("1000");
  await tokenA.mint(await deployer.getAddress(), mintAmount);
  await tokenB.mint(await deployer.getAddress(), mintAmount);
  console.log("Minted tokens to deployer.");

  // Approve DEX to handle tokens
  await tokenA.approve(dexAddress, mintAmount);
  await tokenB.approve(dexAddress, mintAmount);
  console.log("Approved DEX to spend tokens.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
