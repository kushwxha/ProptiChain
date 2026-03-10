/**
 * blockchain.js
 * Shared Ethers.js provider, signer helpers, and contract instance.
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load deployed contract address
const deployPath = path.join(__dirname, "deploy.json");
if (!fs.existsSync(deployPath)) {
  console.error(
    "deploy.json not found. Run `npm run deploy:local` first."
  );
  process.exit(1);
}
const { address: CONTRACT_ADDRESS } = JSON.parse(
  fs.readFileSync(deployPath, "utf8")
);

// Load compiled ABI
const artifactPath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "ProptiChainRegistry.sol",
  "ProptiChainRegistry.json"
);
if (!fs.existsSync(artifactPath)) {
  console.error(
    "Contract artifact not found. Run `npm run compile` first."
  );
  process.exit(1);
}
const { abi: CONTRACT_ABI } = JSON.parse(
  fs.readFileSync(artifactPath, "utf8")
);

// Provider — connects to local Hardhat / Ganache node
const PROVIDER_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

/**
 * Return a signer for the given Hardhat account index (0-19).
 * Index 0 is the deployer / ADMIN by convention.
 */
async function getSigner(accountIndex = 0) {
  const accounts = await provider.listAccounts();
  return accounts[accountIndex];
}

/**
 * Return a contract instance connected to a specific signer.
 */
async function getContract(signerIndex = 0) {
  const signer = await getSigner(signerIndex);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

module.exports = { provider, getSigner, getContract, CONTRACT_ADDRESS, CONTRACT_ABI };
