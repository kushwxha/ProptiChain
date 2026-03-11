/**
 * controllers/userController.js
 * Register users and check roles on the smart contract.
 */
const { getContract } = require("../blockchain/contract");

const RoleMap = { ADMIN: 1, SELLER: 2, BUYER: 3, AI_ORACLE: 4 };
const RoleNames = ["NONE", "ADMIN", "SELLER", "BUYER", "AI_ORACLE"];

/**
 * POST /user/register
 * Body: { signerIndex, userAddress, role }
 */
async function registerUser(req, res) {
  try {
    const { signerIndex, userAddress, role } = req.body;
    if (!userAddress || !role) {
      return res.status(400).json({ error: "userAddress and role are required." });
    }
    const roleValue = RoleMap[role.toUpperCase()];
    if (!roleValue) {
      return res.status(400).json({ error: `Invalid role. Use: ${Object.keys(RoleMap).join(", ")}` });
    }

    const contract = await getContract(signerIndex || 0);
    const tx = await contract.registerUser(userAddress, roleValue);
    const receipt = await tx.wait();

    res.json({ message: `User registered as ${role}.`, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /user/role/:address
 */
async function getRole(req, res) {
  try {
    const contract = await getContract(0);
    const role = await contract.getRole(req.params.address);
    res.json({ address: req.params.address, role: RoleNames[Number(role)] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { registerUser, getRole };
