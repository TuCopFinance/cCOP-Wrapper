import { expect } from "chai";
import { ethers } from "hardhat";

describe("WrappedCOP", function () {
  it("should deploy and mint/burn", async function () {
    const [owner, user] = await ethers.getSigners();
    const WrappedCOP = await ethers.getContractFactory("WrappedCOP");
    const bridge = owner.address;
    const wcop = await WrappedCOP.deploy(bridge);
    await wcop.deployed();

    await wcop.mint(user.address, 1000);
    expect(await wcop.balanceOf(user.address)).to.equal(1000);

    await wcop.connect(owner).burn(user.address, 500);
    expect(await wcop.balanceOf(user.address)).to.equal(500);
  });
});
