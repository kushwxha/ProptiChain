/**
 * deploy.js
 * Deploys ProptiChainRegistry to the configured network and prints the address.
 */
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Factory = await ethers.getContractFactory("ProptiChainRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("ProptiChainRegistry deployed to:", address);

  // Write address to a file so the backend can read it
  const fs = require("fs");
  const path = require("path");
  const deployData = {
    address: address,
    deployer: deployer.address,
    network: "localhost",
    timestamp: new Date().toISOString(),
  };
  const outDir = path.join(__dirname, "..", "backend");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "deploy.json"),
    JSON.stringify(deployData, null, 2)
  );
  console.log("Deploy info saved to backend/deploy.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
