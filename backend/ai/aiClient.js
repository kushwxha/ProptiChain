/**
 * ai/aiClient.js
 * Axios client to call the ProptiChain FastAPI AI service.
 */
const axios = require("axios");

const AI_API_URL = process.env.AI_API_URL || "http://localhost:8000";

/**
 * Call the AI prediction endpoint.
 * @param {Object} propertyData — matches the FastAPI PropertyInput schema.
 * @returns {Object} { predicted_price, risk_score, risk_label, confidence_interval }
 */
async function getAIPrediction(propertyData) {
  const response = await axios.post(`${AI_API_URL}/predict`, propertyData);
  return response.data;
}

module.exports = { getAIPrediction };
