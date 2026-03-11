import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import RegisterProperty from "./pages/RegisterProperty";
import AIValuation from "./pages/AIValuation";
import Marketplace from "./pages/Marketplace";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <h1 className="logo">ProptiChain</h1>
          <div className="nav-links">
            <Link to="/">Register</Link>
            <Link to="/valuation">AI Valuation</Link>
            <Link to="/marketplace">Marketplace</Link>
          </div>
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={<RegisterProperty />} />
            <Route path="/valuation" element={<AIValuation />} />
            <Route path="/marketplace" element={<Marketplace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
