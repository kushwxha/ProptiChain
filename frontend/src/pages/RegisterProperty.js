import React, { useState } from "react";
import API from "../api";

/**
 * Page 1 — Property Registration
 * Registers a new property on the blockchain via the middleware.
 */
function RegisterProperty() {
  const [form, setForm] = useState({ signerIndex: 1, location: "", area: "", price: "" });
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
      const res = await API.post("/property/register", {
        signerIndex: Number(form.signerIndex),
        location: form.location,
        area: Number(form.area),
        price: Number(form.price),
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
      <h2>Register Property</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Signer Index (SELLER)</label>
            <input name="signerIndex" type="number" value={form.signerIndex}
              onChange={handleChange} min="0" max="19" />
          </div>
          <div className="form-group">
            <label>Location / City</label>
            <input name="location" value={form.location}
              onChange={handleChange} placeholder="e.g. Seattle" required />
          </div>
          <div className="form-group">
            <label>Area (sqft)</label>
            <input name="area" type="number" value={form.area}
              onChange={handleChange} placeholder="1800" required />
          </div>
          <div className="form-group">
            <label>Price</label>
            <input name="price" type="number" value={form.price}
              onChange={handleChange} placeholder="420000" required />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register Property"}
        </button>
      </form>

      {result && (
        <div className="result-box">
          <h3>Success</h3>
          <p><strong>Property ID:</strong> {result.propertyId}</p>
          <p><strong>TX Hash:</strong> {result.txHash}</p>
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

export default RegisterProperty;
