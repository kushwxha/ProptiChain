/**
 * controllers/aiController.js
 * Full AI → Hash → Blockchain pipeline.
 *
 * 1. Receives property features from the frontend.
 * 2. Calls the FastAPI AI service for valuation + risk.
 * 3. Hashes the AI output (keccak256).
 * 4. Submits both hashes to the smart contract.
 * 5. Returns predicted price, risk score, and blockchain tx hash.
 */
const { ethers } = require("ethers");
const { getAIPrediction } = require("../ai/aiClient");
const { getContract } = require("../blockchain/contract");

/**
 * POST /ai/evaluate
 * Body: { signerIndex, propertyId, propertyData }
 *   signerIndex  — Hardhat account index for the AI_ORACLE signer
 *   propertyId   — on-chain property ID to attach the hashes to
 *   propertyData — object matching the FastAPI PropertyInput schema
 */
async function evaluate(req, res) {
  try {
    const { signerIndex, propertyId, propertyData } = req.body;

    // ── Validate ──
    if (!propertyId || !propertyData) {
      return res.status(400).json({ error: "propertyId and propertyData are required." });
    }

    // ── Step 1: Call AI service ──
    const aiResult = await getAIPrediction(propertyData);
    const { predicted_price, risk_score, risk_label, confidence_interval } = aiResult;

    // ── Step 2: Generate keccak256 hashes ──
    const valuationPayload = JSON.stringify({ predicted_price, confidence_interval });
    const riskPayload = JSON.stringify({ risk_score, risk_label });

    const valuationHash = ethers.keccak256(ethers.toUtf8Bytes(valuationPayload));
    const riskHash = ethers.keccak256(ethers.toUtf8Bytes(riskPayload));

    // ── Step 3: Submit hashes to blockchain ──
    const contract = await getContract(signerIndex || 0);

    const tx1 = await contract.submitValuationHash(propertyId, valuationHash);
    const receipt1 = await tx1.wait();

    const tx2 = await contract.submitRiskHash(propertyId, riskHash);
    const receipt2 = await tx2.wait();

    // ── Step 4: Return response ──
    res.json({
      predicted_price,
      risk_score,
      risk_label,
      confidence_interval,
      valuationHash,
      riskHash,
      blockchain_tx_valuation: receipt1.hash,
      blockchain_tx_risk: receipt2.hash,
    });
  } catch (err) {
    // Surface AI or blockchain errors clearly
    const detail = err.response?.data?.detail || err.message;
    res.status(500).json({ error: detail });
  }
}

module.exports = { evaluate };
