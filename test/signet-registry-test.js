const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("SignetRegistry", function () {
  async function deployContract() {
    const [owner, addr1] = await ethers.getSigners();
    const SignetRegistry = await ethers.getContractFactory("SignetRegistry");
    const hardhatSignetRegistry = await SignetRegistry.deploy();
    const signetAddress = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
    const signetAddress2 = "0xf0d9A38494b40b72dcd7A5CA109fd59d80b88337";
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const ownerAddress = await addr1.getAddress();
    const domain = {
        name: 'Signet',
        version: '1',
        chainId: "31337"
    };
    const types = {
        Message: [
            { name: 'signet', type: 'address' },
            { name: 'nonce', type: 'uint256' },
        ],
    };
    const changeTypes = {
        Message: [
            { name: 'oldSignet', type: 'address' },
            { name: 'signet', type: 'address' },
            { name: 'nonce', type: 'uint256' },
        ],
    };
    return { hardhatSignetRegistry, owner, addr1, signetAddress, signetAddress2, zeroAddress, ownerAddress, domain, types, changeTypes };
  }
  it("Should register a signet", async function () {
    const { hardhatSignetRegistry, owner, addr1, signetAddress, ownerAddress } = await loadFixture(deployContract);
    await hardhatSignetRegistry.connect(addr1).registerSignet(signetAddress);
    const signetOwner = await hardhatSignetRegistry.signets(signetAddress);
    expect(signetOwner).to.equal(ownerAddress);
  });
  it("Should register and then revoke a signet", async function () {
    const { hardhatSignetRegistry, owner, addr1, zeroAddress, signetAddress } = await loadFixture(deployContract);
    await hardhatSignetRegistry.connect(addr1).registerSignet(signetAddress);
    await hardhatSignetRegistry.connect(addr1).revokeSignet(signetAddress);

    const signetOwner = await hardhatSignetRegistry.signets(signetAddress);
    expect(signetOwner).to.equal(zeroAddress);
  });
  it("Should fail to revoke a signet", async function () {
    const { hardhatSignetRegistry, owner, addr1, signetAddress, ownerAddress } = await loadFixture(deployContract);
    await hardhatSignetRegistry.connect(addr1).registerSignet(signetAddress);
    try {
      await hardhatSignetRegistry.connect(addr2).revokeSignet(signetAddress);
    } catch (error) {}

    const signetOwner = await hardhatSignetRegistry.signets(signetAddress);
    expect(signetOwner).to.equal(ownerAddress);
  });
  it("Should change the signet", async function () {
    const { hardhatSignetRegistry, owner, addr1, zeroAddress, signetAddress2, signetAddress, ownerAddress } = await loadFixture(deployContract);
    await hardhatSignetRegistry.connect(addr1).registerSignet(signetAddress);
    await hardhatSignetRegistry.connect(addr1).changeSignet(signetAddress, signetAddress2);

    const oldsignetOwner = await hardhatSignetRegistry.signets(signetAddress);
    const newsignetOwner = await hardhatSignetRegistry.signets(signetAddress2);
    expect(oldsignetOwner).to.equal(zeroAddress);
    expect(newsignetOwner).to.equal(ownerAddress);
  });
  it("Sould register a signet from signature", async function () {
    const { hardhatSignetRegistry, owner, addr1, signetAddress, ownerAddress, domain, types } = await loadFixture(deployContract);
    const nonce = await hardhatSignetRegistry.nonces(ownerAddress);
    const value = {
        signet: signetAddress,
        nonce: nonce
    };
    const signature = await addr1._signTypedData(domain, types, value);
    const r = signature.slice(0, 66);
    const s = "0x" + signature.slice(66, 130);
    const v = parseInt(signature.slice(130, 132), 16);
    await hardhatSignetRegistry.registerSignetFromSignature(signetAddress, ownerAddress, nonce, v, r, s);
    const signetOwner = await hardhatSignetRegistry.signets(signetAddress);
    expect(signetOwner).to.equal(ownerAddress);
  });
  it("Sould register and then revoke a signet from signature", async function () {
    const { hardhatSignetRegistry, owner, addr1, signetAddress, zeroAddress, ownerAddress, domain, types } = await loadFixture(deployContract);
    let nonce = await hardhatSignetRegistry.nonces(ownerAddress);
    let value = {
        signet: signetAddress,
        nonce: nonce
    };
    let signature = await addr1._signTypedData(domain, types, value);
    let r = signature.slice(0, 66);
    let s = "0x" + signature.slice(66, 130);
    let v = parseInt(signature.slice(130, 132), 16);
    await hardhatSignetRegistry.registerSignetFromSignature(signetAddress, ownerAddress, nonce, v, r, s);
    let signetOwner = await hardhatSignetRegistry.signets(signetAddress);
    expect(signetOwner).to.equal(ownerAddress);
    // Revoke
    nonce = await hardhatSignetRegistry.nonces(ownerAddress);
    value = {
        signet: signetAddress,
        nonce: nonce
    };
    signature = await addr1._signTypedData(domain, types, value);
    r = signature.slice(0, 66);
    s = "0x" + signature.slice(66, 130);
    v = parseInt(signature.slice(130, 132), 16);
    await hardhatSignetRegistry.revokeSignetFromSignature(signetAddress, ownerAddress, nonce, v, r, s);
    signetOwner = await hardhatSignetRegistry.signets(signetAddress);
    expect(signetOwner).to.equal(zeroAddress);
  });
  it("Sould change a signet from signature", async function () {
    const { hardhatSignetRegistry, owner, addr1, signetAddress, signetAddress2, zeroAddress, ownerAddress, domain, types, changeTypes } = await loadFixture(deployContract);
    let nonce = await hardhatSignetRegistry.nonces(ownerAddress);
    let value = {
        signet: signetAddress,
        nonce: nonce
    };
    let signature = await addr1._signTypedData(domain, types, value);
    let r = signature.slice(0, 66);
    let s = "0x" + signature.slice(66, 130);
    let v = parseInt(signature.slice(130, 132), 16);
    await hardhatSignetRegistry.registerSignetFromSignature(signetAddress, ownerAddress, nonce, v, r, s);
    let signetOwner = await hardhatSignetRegistry.signets(signetAddress);
    expect(signetOwner).to.equal(ownerAddress);
    // Change
    nonce = await hardhatSignetRegistry.nonces(ownerAddress);
    value = {
        oldSignet: signetAddress,
        signet: signetAddress2,
        nonce: nonce
    };
    signature = await addr1._signTypedData(domain, changeTypes, value);
    r = signature.slice(0, 66);
    s = "0x" + signature.slice(66, 130);
    v = parseInt(signature.slice(130, 132), 16);
    await hardhatSignetRegistry.changeSignetFromSignature(signetAddress, signetAddress2, ownerAddress, nonce, v, r, s);
    signetOwner = await hardhatSignetRegistry.signets(signetAddress2);
    oldsignetOwner = await hardhatSignetRegistry.signets(signetAddress);
    expect(signetOwner).to.equal(ownerAddress);
    expect(oldsignetOwner).to.equal(zeroAddress);
  });
});
