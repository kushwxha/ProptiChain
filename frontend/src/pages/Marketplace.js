import React, { useEffect, useState } from "react";
import API from "../api";

/**
 * Page 3 — Property Marketplace
 * Lists all on-chain properties and lets a BUYER purchase listed ones.
 */
function Marketplace() {
  const [properties, setProperties] = useState([]);
  const [buyerIndex, setBuyerIndex] = useState(2);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [error, setError] = useState(null);

  // Fetch all properties from blockchain
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await API.get("/property/all");
      setProperties(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  // List a property for sale
  const handleList = async (propertyId, signerIndex) => {
    setActionMsg(null);
    setError(null);
    try {
      const res = await API.post("/property/list", { signerIndex, propertyId });
      setActionMsg(res.data.message);
      fetchProperties(); // refresh
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Buy a property
  const handleBuy = async (propertyId) => {
    setActionMsg(null);
    setError(null);
    try {
      const res = await API.post("/property/buy", { signerIndex: Number(buyerIndex), propertyId });
      setActionMsg(res.data.message);
      fetchProperties(); // refresh
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="card">
      <h2>Property Marketplace</h2>

      <div className="form-group" style={{ maxWidth: 220, marginBottom: 16 }}>
        <label>Buyer Signer Index</label>
        <input type="number" value={buyerIndex}
          onChange={(e) => setBuyerIndex(e.target.value)} min="0" max="19" />
      </div>

      {actionMsg && <div className="result-box"><p>{actionMsg}</p></div>}
      {error && <div className="result-box error"><p>{error}</p></div>}

      {loading ? (
        <p>Loading properties from blockchain...</p>
      ) : properties.length === 0 ? (
        <p>No properties registered yet.</p>
      ) : (
        <table className="prop-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Location</th>
              <th>Area</th>
              <th>Price</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.propertyId}>
                <td>{p.propertyId}</td>
                <td>{p.location}</td>
                <td>{p.area} sqft</td>
                <td>${p.price.toLocaleString()}</td>
                <td title={p.owner}>{p.owner.slice(0, 6)}...{p.owner.slice(-4)}</td>
                <td className={p.forSale ? "status-sale" : "status-held"}>
                  {p.forSale ? "For Sale" : "Held"}
                </td>
                <td>
                  {p.forSale ? (
                    <button className="btn btn-success" onClick={() => handleBuy(p.propertyId)}>
                      Buy
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => handleList(p.propertyId, 1)}>
                      List for Sale
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="btn btn-primary" onClick={fetchProperties} style={{ marginTop: 16 }}>
        Refresh
      </button>
    </div>
  );
}

export default Marketplace;
