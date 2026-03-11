/**
 * controllers/propertyController.js
 * Handles property registration, listing, purchase, and fetching from blockchain.
 */
const { getContract } = require("../blockchain/contract");

/**
 * POST /property/register
 * Body: { signerIndex, location, area, price }
 */
async function registerProperty(req, res) {
  try {
    const { signerIndex, location, area, price } = req.body;

    // Input validation
    if (!location || !area || !price) {
      return res.status(400).json({ error: "location, area, and price are required." });
    }
    if (area <= 0 || price <= 0) {
      return res.status(400).json({ error: "area and price must be positive." });
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
      message: "Property registered on blockchain.",
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

    res.json({ message: "Property purchased.", txHash: receipt.hash });
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
    const p = await contract.getProperty(propertyId);

    res.json({
      propertyId: Number(p.propertyId),
      owner: p.owner,
      location: p.location,
      area: Number(p.area),
      price: Number(p.price),
      valuationHash: p.valuationHash,
      riskHash: p.riskHash,
      forSale: p.forSale,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /property/all
 * Fetches all registered properties from the blockchain.
 */
async function getAllProperties(req, res) {
  try {
    const contract = await getContract(0);
    const count = Number(await contract.propertyCount());
    const properties = [];

    for (let i = 1; i <= count; i++) {
      const p = await contract.getProperty(i);
      properties.push({
        propertyId: Number(p.propertyId),
        owner: p.owner,
        location: p.location,
        area: Number(p.area),
        price: Number(p.price),
        valuationHash: p.valuationHash,
        riskHash: p.riskHash,
        forSale: p.forSale,
      });
    }

    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { registerProperty, listPropertyForSale, purchaseProperty, getProperty, getAllProperties };
