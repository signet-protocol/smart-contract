const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("RTSProxyWallet", function () {
  async function deployContract() {
    const [owner, addr1] = await ethers.getSigners();
    const RTSProxyWallet = await ethers.getContractFactory("RTSProxyWallet");
    const hardhatRTSProxyWallet = await RTSProxyWallet.deploy();
    const proxyWalletAddress = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
    const proxyWalletAddress2 = "0xf0d9A38494b40b72dcd7A5CA109fd59d80b88337";
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const ownerAddress = await addr1.getAddress();
    return { hardhatRTSProxyWallet, owner, addr1, proxyWalletAddress, proxyWalletAddress2, zeroAddress, ownerAddress };
  }
  it("Should create a proxy wallet mapping", async function () {
    const { hardhatRTSProxyWallet, owner, addr1, proxyWalletAddress, ownerAddress } = await loadFixture(deployContract);
    await hardhatRTSProxyWallet.connect(addr1).setProxyWallet(proxyWalletAddress);
    const proxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress);
    expect(proxyWalletOwner).to.equal(ownerAddress);
  });
  it("Should create and then delete a proxy wallet mapping", async function () {
    const { hardhatRTSProxyWallet, owner, addr1, zeroAddress, proxyWalletAddress } = await loadFixture(deployContract);
    await hardhatRTSProxyWallet.connect(addr1).setProxyWallet(proxyWalletAddress);
    await hardhatRTSProxyWallet.connect(addr1).revokeProxyWallet(proxyWalletAddress);

    const proxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress);
    expect(proxyWalletOwner).to.equal(zeroAddress);
  });
  it("Should fail to remove a proxy wallet", async function () {
    const { hardhatRTSProxyWallet, owner, addr1, proxyWalletAddress, ownerAddress } = await loadFixture(deployContract);
    await hardhatRTSProxyWallet.connect(addr1).setProxyWallet(proxyWalletAddress);
    try {
      await hardhatRTSProxyWallet.connect(addr2).revokeProxyWallet(proxyWalletAddress);
    } catch (error) {}

    const proxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress);
    expect(proxyWalletOwner).to.equal(ownerAddress);
  });
  it("Should change the proxy wallet", async function () {
    const { hardhatRTSProxyWallet, owner, addr1, zeroAddress, proxyWalletAddress2, proxyWalletAddress, ownerAddress } = await loadFixture(deployContract);
    await hardhatRTSProxyWallet.connect(addr1).setProxyWallet(proxyWalletAddress);
    await hardhatRTSProxyWallet.connect(addr1).changeProxyWallet(proxyWalletAddress, proxyWalletAddress2);

    const oldProxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress);
    const newProxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress2);
    expect(oldProxyWalletOwner).to.equal(zeroAddress);
    expect(newProxyWalletOwner).to.equal(ownerAddress);
  });
  it("Sould create a proxy wallet from signature", async function () {
    const { hardhatRTSProxyWallet, owner, addr1, proxyWalletAddress, ownerAddress } = await loadFixture(deployContract);
    const nonce = await hardhatRTSProxyWallet.nonces(ownerAddress);
    const messageHash = ethers.utils.solidityKeccak256(['address', 'uint'], [proxyWalletAddress, nonce]);
    const signature = await addr1.signMessage(ethers.utils.arrayify(messageHash));
    const r = signature.slice(0, 66);
    const s = "0x" + signature.slice(66, 130);
    const v = parseInt(signature.slice(130, 132), 16);
    await hardhatRTSProxyWallet.setProxyWalletFromSignature(proxyWalletAddress, ownerAddress, nonce, v, r, s);
    const proxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress);
    expect(proxyWalletOwner).to.equal(ownerAddress);
  });
  it("Sould create and then revoke a proxy wallet from signature", async function () {
    const { hardhatRTSProxyWallet, owner, addr1, proxyWalletAddress, zeroAddress, ownerAddress } = await loadFixture(deployContract);
    let nonce = await hardhatRTSProxyWallet.nonces(ownerAddress);
    let messageHash = ethers.utils.solidityKeccak256(['address', 'uint'], [proxyWalletAddress, nonce]);
    let signature = await addr1.signMessage(ethers.utils.arrayify(messageHash));
    let r = signature.slice(0, 66);
    let s = "0x" + signature.slice(66, 130);
    let v = parseInt(signature.slice(130, 132), 16);
    await hardhatRTSProxyWallet.setProxyWalletFromSignature(proxyWalletAddress, ownerAddress, nonce, v, r, s);
    let proxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress);
    expect(proxyWalletOwner).to.equal(ownerAddress);
    // Revoke
    nonce = await hardhatRTSProxyWallet.nonces(ownerAddress);
    messageHash = ethers.utils.solidityKeccak256(['address', 'uint'], [proxyWalletAddress, nonce]);
    signature = await addr1.signMessage(ethers.utils.arrayify(messageHash));
    r = signature.slice(0, 66);
    s = "0x" + signature.slice(66, 130);
    v = parseInt(signature.slice(130, 132), 16);
    await hardhatRTSProxyWallet.revokeProxyWalletFromSignature(proxyWalletAddress, ownerAddress, nonce, v, r, s);
    proxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress);
    expect(proxyWalletOwner).to.equal(zeroAddress);
  });
  it("Sould change a proxy wallet from signature", async function () {
    const { hardhatRTSProxyWallet, owner, addr1, proxyWalletAddress, proxyWalletAddress2, zeroAddress, ownerAddress } = await loadFixture(deployContract);
    let nonce = await hardhatRTSProxyWallet.nonces(ownerAddress);
    let messageHash = ethers.utils.solidityKeccak256(['address', 'uint'], [proxyWalletAddress, nonce]);
    let signature = await addr1.signMessage(ethers.utils.arrayify(messageHash));
    let r = signature.slice(0, 66);
    let s = "0x" + signature.slice(66, 130);
    let v = parseInt(signature.slice(130, 132), 16);
    await hardhatRTSProxyWallet.setProxyWalletFromSignature(proxyWalletAddress, ownerAddress, nonce, v, r, s);
    let proxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress);
    expect(proxyWalletOwner).to.equal(ownerAddress);
    // Change
    nonce = await hardhatRTSProxyWallet.nonces(ownerAddress);
    messageHash = ethers.utils.solidityKeccak256(['address', 'address', 'uint'], [proxyWalletAddress, proxyWalletAddress2, nonce]);
    signature = await addr1.signMessage(ethers.utils.arrayify(messageHash));
    r = signature.slice(0, 66);
    s = "0x" + signature.slice(66, 130);
    v = parseInt(signature.slice(130, 132), 16);
    await hardhatRTSProxyWallet.changeProxyWalletFromSignature(proxyWalletAddress, proxyWalletAddress2, ownerAddress, nonce, v, r, s);
    proxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress2);
    oldProxyWalletOwner = await hardhatRTSProxyWallet.proxyWallets(proxyWalletAddress);
    expect(proxyWalletOwner).to.equal(ownerAddress);
    expect(oldProxyWalletOwner).to.equal(zeroAddress);
  });
});
