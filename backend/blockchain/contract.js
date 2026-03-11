/**
 * blockchain/contract.js
 * Ethers.js helpers to interact with the deployed ProptiChainRegistry contract.
 * Reads ABI and address from the smart-contract folder.
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// ── Paths ──
const DEPLOY_JSON = path.join(__dirname, "..", "..", "smart-contract", "backend", "deploy.json");
const ARTIFACT_JSON = path.join(
  __dirname, "..", "..", "smart-contract",
  "artifacts", "contracts", "ProptiChainRegistry.sol", "ProptiChainRegistry.json"
);

// ── Load contract address ──
function loadAddress() {
  if (!fs.existsSync(DEPLOY_JSON)) {
    throw new Error("deploy.json not found. Deploy the smart contract first.");
  }
  return JSON.parse(fs.readFileSync(DEPLOY_JSON, "utf8")).address;
}

// ── Load ABI ──
function loadABI() {
  if (!fs.existsSync(ARTIFACT_JSON)) {
    throw new Error("Contract artifact not found. Compile the smart contract first.");
  }
  return JSON.parse(fs.readFileSync(ARTIFACT_JSON, "utf8")).abi;
}

// ── Provider ──
const PROVIDER_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);

/**
 * Get a signer by Hardhat account index (0-19).
 */
async function getSigner(index = 0) {
  const accounts = await provider.listAccounts();
  return accounts[index];
}

/**
 * Get a contract instance connected to the signer at the given index.
 */
async function getContract(signerIndex = 0) {
  const signer = await getSigner(signerIndex);
  const address = loadAddress();
  const abi = loadABI();
  return new ethers.Contract(address, abi, signer);
}

module.exports = { provider, getSigner, getContract };
