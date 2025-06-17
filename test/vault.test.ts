import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("CCopVault", function () {
  let vault: Contract;
  let mockCCOP: Contract;
  let owner: any, user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockCCOP = await MockERC20.deploy("Test COP", "TCOP", 18);
    await mockCCOP.deployed();

    const Vault = await ethers.getContractFactory("CCopVault");
    vault = await Vault.deploy(owner.address, mockCCOP.address, mockCCOP.address); // using token as link placeholder
    await vault.deployed();

    await mockCCOP.mint(user.address, 1000);
    await mockCCOP.connect(user).approve(vault.address, 1000);
  });

  it("should deposit and emit event", async function () {
    await expect(vault.connect(user).deposit(123, owner.address, 500))
      .to.emit(vault, "Deposited")
      .withArgs(user.address, 500);

    expect(await mockCCOP.balanceOf(vault.address)).to.equal(500);
  });

  it("should release tokens upon valid burn proof", async function () {
    const burnId = ethers.keccak256(ethers.toUtf8Bytes("burn-1"));
    await mockCCOP.connect(user).transfer(vault.address, 500);

    const payload = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes32"],
      [user.address, 500, burnId]
    );

    const message = {
      data: payload
    };

    await expect(vault.connect(owner)._ccipReceive(message))
      .to.emit(vault, "Released")
      .withArgs(user.address, 500);

    expect(await mockCCOP.balanceOf(user.address)).to.equal(500);
  });
});
