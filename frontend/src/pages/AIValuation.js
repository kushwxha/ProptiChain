import React, { useState } from "react";
import API from "../api";

/**
 * Page 2 — AI Valuation
 * Sends property features to the middleware, which calls the AI service,
 * hashes the result, submits it on-chain, and returns everything.
 */
function AIValuation() {
  const [form, setForm] = useState({
    signerIndex: 3,
    propertyId: 1,
    bedrooms: 3,
    bathrooms: 2,
    sqft_living: 1800,
    sqft_lot: 4000,
    floors: 2,
    waterfront: 0,
    view: 1,
    condition: 3,
    sqft_above: 1500,
    sqft_basement: 300,
    age: 10,
    renovated: 1,
    location: "Seattle",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Build propertyData matching the FastAPI PropertyInput schema
      const propertyData = {
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        sqft_living: Number(form.sqft_living),
        sqft_lot: Number(form.sqft_lot),
        floors: Number(form.floors),
        waterfront: Number(form.waterfront),
        view: Number(form.view),
        condition: Number(form.condition),
        sqft_above: Number(form.sqft_above),
        sqft_basement: Number(form.sqft_basement),
        age: Number(form.age),
        renovated: Number(form.renovated),
        location: form.location,
      };

      const res = await API.post("/ai/evaluate", {
        signerIndex: Number(form.signerIndex),
        propertyId: Number(form.propertyId),
        propertyData,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>AI Property Valuation</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Signer Index (AI_ORACLE)</label>
            <input name="signerIndex" type="number" value={form.signerIndex}
              onChange={handleChange} min="0" max="19" />
          </div>
          <div className="form-group">
            <label>Property ID (on-chain)</label>
            <input name="propertyId" type="number" value={form.propertyId}
              onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Bedrooms</label>
            <input name="bedrooms" type="number" value={form.bedrooms}
              onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Bathrooms</label>
            <input name="bathrooms" type="number" value={form.bathrooms}
              onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Sqft Living</label>
            <input name="sqft_living" type="number" value={form.sqft_living}
              onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Sqft Lot</label>
            <input name="sqft_lot" type="number" value={form.sqft_lot}
              onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Floors</label>
            <input name="floors" type="number" value={form.floors}
              onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Waterfront (0/1)</label>
            <input name="waterfront" type="number" value={form.waterfront}
              onChange={handleChange} min="0" max="1" />
          </div>
          <div className="form-group">
            <label>View (0-4)</label>
            <input name="view" type="number" value={form.view}
              onChange={handleChange} min="0" max="4" />
          </div>
          <div className="form-group">
            <label>Condition (1-5)</label>
            <input name="condition" type="number" value={form.condition}
              onChange={handleChange} min="1" max="5" />
          </div>
          <div className="form-group">
            <label>Sqft Above</label>
            <input name="sqft_above" type="number" value={form.sqft_above}
              onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Sqft Basement</label>
            <input name="sqft_basement" type="number" value={form.sqft_basement}
              onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Age (years)</label>
            <input name="age" type="number" value={form.age}
              onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Renovated (0/1)</label>
            <input name="renovated" type="number" value={form.renovated}
              onChange={handleChange} min="0" max="1" />
          </div>
          <div className="form-group full">
            <label>Location / City</label>
            <input name="location" value={form.location}
              onChange={handleChange} required />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Evaluating..." : "Run AI Evaluation"}
        </button>
      </form>

      {result && (
        <div className="result-box">
          <h3>AI Valuation Result</h3>
          <p><strong>Predicted Price:</strong> ${result.predicted_price?.toLocaleString()}</p>
          <p><strong>Risk Score:</strong> {result.risk_score}</p>
          <p><strong>Risk Label:</strong> {result.risk_label}</p>
          <p><strong>Confidence Interval:</strong> [${result.confidence_interval?.[0]?.toLocaleString()}, ${result.confidence_interval?.[1]?.toLocaleString()}]</p>
          <hr style={{ margin: "12px 0" }} />
          <p><strong>Valuation TX:</strong> <code>{result.blockchain_tx_valuation}</code></p>
          <p><strong>Risk TX:</strong> <code>{result.blockchain_tx_risk}</code></p>
        </div>
      )}
      {error && (
        <div className="result-box error">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default AIValuation;
