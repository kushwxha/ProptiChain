/**
 * propertyController.js
 * Handles property registration, listing, and purchase logic.
 */
const { getContract } = require("../blockchain");

/**
 * POST /property/register
 * Body: { signerIndex, location, area, price }
 */
async function registerProperty(req, res) {
  try {
    const { signerIndex, location, area, price } = req.body;
    if (!location || !area || !price) {
      return res.status(400).json({ error: "location, area, and price are required." });
    }
    const contract = await getContract(signerIndex || 0);
    const tx = await contract.registerProperty(location, area, price);
    const receipt = await tx.wait();

    // Extract propertyId from event
    const event = receipt.logs
      .map((log) => {
        try { return contract.interface.parseLog(log); } catch { return null; }
      })
      .find((e) => e && e.name === "PropertyRegistered");

    res.json({
      message: "Property registered successfully.",
      txHash: receipt.hash,
      propertyId: event ? Number(event.args.propertyId) : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /property/list
 * Body: { signerIndex, propertyId }
 */
async function listPropertyForSale(req, res) {
  try {
    const { signerIndex, propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ error: "propertyId is required." });
    }
    const contract = await getContract(signerIndex || 0);
    const tx = await contract.listPropertyForSale(propertyId);
    const receipt = await tx.wait();
    res.json({ message: "Property listed for sale.", txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /property/buy
 * Body: { signerIndex, propertyId }
 */
async function purchaseProperty(req, res) {
  try {
    const { signerIndex, propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ error: "propertyId is required." });
    }
    const contract = await getContract(signerIndex || 0);
    const tx = await contract.purchaseProperty(propertyId);
    const receipt = await tx.wait();
    res.json({ message: "Property purchased successfully.", txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /property/:id
 */
async function getProperty(req, res) {
  try {
    const propertyId = Number(req.params.id);
    const contract = await getContract(0);
    const prop = await contract.getProperty(propertyId);
    res.json({
      propertyId: Number(prop.propertyId),
      owner: prop.owner,
      location: prop.location,
      area: Number(prop.area),
      price: Number(prop.price),
      valuationHash: prop.valuationHash,
      riskHash: prop.riskHash,
      forSale: prop.forSale,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { registerProperty, listPropertyForSale, purchaseProperty, getProperty };
