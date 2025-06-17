// scripts/verify.ts
import { run } from "hardhat";

async function main() {
  await run("verify:verify", {
    address: "0xYourContractAddressHere",
    constructorArguments: [
      "0xRouter", // CCIP Router
      "0xLink",   // LINK token
      "0xCCOP"    // cCOP address
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
