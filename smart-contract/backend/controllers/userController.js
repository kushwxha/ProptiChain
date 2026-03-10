/**
 * userController.js
 * Handles user/role registration on the smart contract.
 */
const { getContract } = require("../blockchain");

// Role enum mapping (must match Solidity)
const RoleMap = { ADMIN: 1, SELLER: 2, BUYER: 3, AI_ORACLE: 4 };

/**
 * POST /user/register
 * Body: { signerIndex, userAddress, role }
 * role — one of "ADMIN", "SELLER", "BUYER", "AI_ORACLE"
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
    const userAddress = req.params.address;
    const contract = await getContract(0);
    const role = await contract.getRole(userAddress);
    const roleNames = ["NONE", "ADMIN", "SELLER", "BUYER", "AI_ORACLE"];
    res.json({ address: userAddress, role: roleNames[Number(role)] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { registerUser, getRole };
