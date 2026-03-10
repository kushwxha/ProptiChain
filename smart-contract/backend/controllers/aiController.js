/**
 * aiController.js
 * Handles AI valuation hash and risk hash submission to the smart contract.
 */
const { ethers } = require("ethers");
const { getContract } = require("../blockchain");

/**
 * POST /ai/valuation
 * Body: { signerIndex, propertyId, valuationData }
 * valuationData — the raw JSON string whose keccak256 hash will be stored on-chain.
 */
async function submitValuation(req, res) {
  try {
    const { signerIndex, propertyId, valuationData } = req.body;
    if (!propertyId || !valuationData) {
      return res.status(400).json({ error: "propertyId and valuationData are required." });
    }
    const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(valuationData)));
    const contract = await getContract(signerIndex || 0);
    const tx = await contract.submitValuationHash(propertyId, hash);
    const receipt = await tx.wait();
    res.json({
      message: "Valuation hash submitted.",
      txHash: receipt.hash,
      valuationHash: hash,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /ai/risk
 * Body: { signerIndex, propertyId, riskData }
 * riskData — the raw JSON string whose keccak256 hash will be stored on-chain.
 */
async function submitRisk(req, res) {
  try {
    const { signerIndex, propertyId, riskData } = req.body;
    if (!propertyId || !riskData) {
      return res.status(400).json({ error: "propertyId and riskData are required." });
    }
    const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(riskData)));
    const contract = await getContract(signerIndex || 0);
    const tx = await contract.submitRiskHash(propertyId, hash);
    const receipt = await tx.wait();
    res.json({
      message: "Risk hash submitted.",
      txHash: receipt.hash,
      riskHash: hash,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { submitValuation, submitRisk };
