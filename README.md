# ProptiChain

**AI-Powered Property Valuation & Fraud Risk Scoring on a Permissioned Blockchain**

ProptiChain is an MVP that integrates machine learning models for property valuation and transaction risk assessment with a permissioned blockchain system for transparent, tamper-proof property registration and ownership management.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [AI Service Setup](#ai-service-setup)
  - [Blockchain Layer Setup](#blockchain-layer-setup)
- [API Reference](#api-reference)
  - [AI Service](#ai-service-port-8000)
  - [Middleware API](#middleware-api-port-3001)
- [Testing](#testing)
- [How It Works](#how-it-works)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ProptiChain solves two core problems in real estate:

1. **Property Valuation** — Uses a Random Forest regression model trained on real housing data to predict property prices with confidence intervals.
2. **Transaction Risk Scoring** — Uses a Random Forest classifier to flag potentially risky transactions.
3. **Blockchain Registry** — Stores property records, ownership history, and AI result hashes on a permissioned blockchain for immutability and transparency.

AI predictions are hashed (keccak256) and stored on-chain, ensuring that valuation and risk results cannot be tampered with after submission.

---

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────┐     ┌─────────────────┐
│  React UI    │────>│  Middleware API   │────>│  AI Service   │     │  Smart Contract  │
│  Port 3000   │     │  (Express.js)    │     │  (FastAPI)    │     │  (Solidity)      │
└──────────────┘     │  Port 3001       │────>│  Port 8000    │     │  Hardhat :8545   │
                     │                  │     └───────────────┘     └─────────────────┘
                     │                  │────────────────────────────────────▲
                     └──────────────────┘
```

1. **React Frontend** — User-facing UI for property registration, AI valuation, and marketplace.
2. **Middleware API** — Orchestrates AI predictions and blockchain writes in a single pipeline.
3. **AI Service** — ML models for valuation (regression) and risk scoring (classification).
4. **Smart Contract** — On-chain property registry with RBAC and immutable AI result hashes.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI / ML | Python 3.12, Pandas, NumPy, Scikit-learn, FastAPI |
| Smart Contract | Solidity 0.8.20 |
| Blockchain Dev | Hardhat, Ethers.js v6 |
| Backend API | Node.js, Express.js, Axios |
| Frontend | React 18, React Router DOM 6 |
| Testing | Hardhat + Chai (blockchain), Scikit-learn metrics (AI) |

---

## Project Structure

```
ProptiChain/
│
├── ai_service/                    # AI/ML layer
│   ├── app.py                     # FastAPI prediction API (port 8000)
│   ├── train_models.py            # Model training script
│   ├── preprocess.py              # Data preprocessing utilities
│   ├── requirements.txt           # Python dependencies
│   └── .gitignore
│
├── smart-contract/                # Blockchain layer
│   ├── contracts/
│   │   └── ProptiChainRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── registry.test.js
│   ├── hardhat.config.js
│   └── package.json
│
├── backend/                       # Integration middleware (port 3001)
│   ├── server.js                  # Express API server
│   ├── blockchain/
│   │   └── contract.js            # Ethers.js contract helper
│   ├── ai/
│   │   └── aiClient.js            # Axios client for AI service
│   ├── controllers/
│   │   ├── propertyController.js
│   │   ├── aiController.js
│   │   └── userController.js
│   ├── routes/
│   │   ├── propertyRoutes.js
│   │   ├── aiRoutes.js
│   │   └── userRoutes.js
│   └── package.json
│
├── frontend/                      # React UI (port 3000)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── api.js
│   │   ├── index.js
│   │   └── pages/
│   │       ├── RegisterProperty.js
│   │       ├── AIValuation.js
│   │       └── Marketplace.js
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.10–3.12** (for AI service)
- **Node.js 18+** (for blockchain, middleware, and frontend)
- **npm** (comes with Node.js)

You need **four terminals** to run the full pipeline.

### Terminal 1 — AI Service (port 8000)

```bash
cd ai_service
.\venv\Scripts\Activate.ps1          # Windows PowerShell
pip install -r requirements.txt
python train_models.py               # Train models (first time only)
uvicorn app:app --reload
```

### Terminal 2 — Hardhat Blockchain Node (port 8545)

```bash
cd smart-contract
npm install
npx hardhat compile
npx hardhat node                     # Keep this running
```

### Terminal 3 — Deploy & Start Middleware (port 3001)

```bash
cd smart-contract
npx hardhat run scripts/deploy.js --network localhost

cd ../backend
npm install
node server.js
```

### Terminal 4 — React Frontend (port 3000)

```bash
cd frontend
npm install
npm start
```

Open **http://localhost:3000** in your browser.

### First-Time Setup (after deploy)

Before using the system, register roles via the middleware API (or use curl/Postman):

```bash
# SELLER (account 1)
curl -X POST http://localhost:3001/user/register -H "Content-Type: application/json" \
  -d '{"signerIndex":0,"userAddress":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","role":"SELLER"}'

# BUYER (account 2)
curl -X POST http://localhost:3001/user/register -H "Content-Type: application/json" \
  -d '{"signerIndex":0,"userAddress":"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC","role":"BUYER"}'

# AI_ORACLE (account 3)
curl -X POST http://localhost:3001/user/register -H "Content-Type: application/json" \
  -d '{"signerIndex":0,"userAddress":"0x90F79bf6EB2c4f870365E785982E1f101E93b906","role":"AI_ORACLE"}'
```

---

## API Reference

### AI Service (port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Get property valuation and risk score |

### Middleware API (port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/register` | Assign a role (ADMIN only) |
| GET | `/user/role/:address` | Check user role |
| POST | `/property/register` | Register property (SELLER) |
| POST | `/property/list` | List property for sale (owner) |
| POST | `/property/buy` | Purchase property (BUYER) |
| GET | `/property/all` | List all properties |
| GET | `/property/:id` | Get property details |
| POST | `/ai/evaluate` | Full pipeline: AI → Hash → Blockchain |

#### `POST /ai/evaluate` — Full AI + Blockchain Pipeline

**Request:**
```json
{
  "signerIndex": 3,
  "propertyId": 1,
  "propertyData": {
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft_living": 1800,
    "sqft_lot": 4000,
    "floors": 2,
    "waterfront": 0,
    "view": 1,
    "condition": 3,
    "sqft_above": 1500,
    "sqft_basement": 300,
    "age": 10,
    "renovated": 1,
    "location": "Seattle"
  }
}
```

**Response:**
```json
{
  "predicted_price": 332869.17,
  "risk_score": 0.57,
  "risk_label": "High Risk",
  "confidence_interval": [231990, 577950],
  "valuationHash": "0xabc...",
  "riskHash": "0xdef...",
  "blockchain_tx_valuation": "0x123...",
  "blockchain_tx_risk": "0x456..."
}
```

---

## Testing

### Blockchain Tests
```bash
cd smart-contract
npx hardhat test
```

Runs 16 automated tests covering:
- Role enforcement (ADMIN, SELLER, BUYER, AI_ORACLE)
- Property registration and validation
- AI valuation and risk hash submission
- Property listing and ownership transfer

### AI Model Evaluation

Run `python train_models.py` to see:
- **Valuation Model:** RMSE, MAE, R² score
- **Risk Model:** Accuracy, Precision, Recall, F1-score, ROC-AUC

---

## How It Works

1. **ADMIN** registers users and assigns roles (SELLER, BUYER, AI_ORACLE) via the middleware.
2. **SELLER** registers a property on the blockchain through the React UI.
3. **AI_ORACLE** triggers an AI evaluation — the middleware calls the AI service, receives predictions, hashes the results (keccak256), and submits both hashes to the smart contract in one request.
4. **SELLER** lists the property for sale on the marketplace.
5. **BUYER** purchases the property; ownership is transferred on-chain.
6. All actions emit blockchain events for transparency and off-chain monitoring.

---

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **ADMIN** | Register users, assign roles |
| **SELLER** | Register properties, list for sale |
| **BUYER** | Purchase listed properties |
| **AI_ORACLE** | Submit AI valuation and risk hashes |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is for research and educational purposes.

---

**Built by [kushwxha](https://github.com/kushwxha)**
