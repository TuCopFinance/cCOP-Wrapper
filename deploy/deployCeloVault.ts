import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const Vault = await ethers.getContractFactory("CCopVault");
  const vault = await Vault.deploy(
    process.env.CCIP_ROUTER_CELO,
    process.env.LINK_TOKEN_CELO,
    process.env.CCOP_ADDRESS
  );

  await vault.deployed();
  console.log("Vault deployed to:", vault.address);
}

main();
