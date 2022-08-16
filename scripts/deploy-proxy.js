const { ethers, upgrades } = require('hardhat');

async function main () {
  const SignetRegistry = await ethers.getContractFactory('SignetRegistry');
  console.log('Deploying Signet Registry...');
  const signetRegistry = await upgrades.deployProxy(SignetRegistry);
  await signetRegistry.deployed();
  console.log('Signet Registry deployed to:', signetRegistry.address);
}

main();
