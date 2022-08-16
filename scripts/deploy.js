const ethers = require('ethers');
require('dotenv').config();

async function main() {

  const url = process.env.MUMBAI_URL;

  // woah, we just cut out the whole compile.js flow with this!
  let artifacts = await hre.artifacts.readArtifact("SignetRegistry");

  const provider = new ethers.providers.JsonRpcProvider(url);

  let privateKey = process.env.PRIVATE_KEY;

  let wallet = new ethers.Wallet(privateKey, provider);

  let factory = new ethers.ContractFactory(artifacts.abi, artifacts.bytecode, wallet);

  let permissionsContract = await factory.deploy();

  console.log("Contract address:", permissionsContract.address);

  await permissionsContract.deployed();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
});
