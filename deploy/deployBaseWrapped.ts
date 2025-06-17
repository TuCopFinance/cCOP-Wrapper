import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const WrappedCOP = await ethers.getContractFactory("WrappedCOP");
  const wcop = await WrappedCOP.deploy(process.env.CCIP_BRIDGE_BASE);
  await wcop.deployed();
  console.log("WrappedCOP deployed to:", wcop.address);
}

main();
