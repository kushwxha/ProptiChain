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
  - [AI Service API](#ai-service-api)
  - [Blockchain API](#blockchain-api)
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
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────────┐
│   AI Service    │       │   Blockchain API     │       │   Smart Contract    │
│   (FastAPI)     │──────>│   (Express.js)       │──────>│   (Solidity)        │
│   Port 8000     │       │   Port 3000          │       │   Hardhat Network   │
└─────────────────┘       └──────────────────────┘       └─────────────────────┘
  - Valuation Model         - Property CRUD                - ProptiChainRegistry
  - Risk Model              - AI hash submission           - RBAC enforcement
  - /predict endpoint       - User/role management         - Event logging
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI / ML | Python 3.12, Pandas, NumPy, Scikit-learn, FastAPI |
| Smart Contract | Solidity 0.8.20 |
| Blockchain Dev | Hardhat, Ethers.js v6 |
| Backend API | Node.js, Express.js |
| Testing | Hardhat + Chai (blockchain), Scikit-learn metrics (AI) |

---

## Project Structure

```
ProptiChain/
│
├── ai_service/                    # AI/ML layer
│   ├── app.py                     # FastAPI prediction API
│   ├── train_models.py            # Model training script
│   ├── preprocess.py              # Data preprocessing utilities
│   ├── requirements.txt           # Python dependencies
│   ├── data.csv                   # Training dataset (not committed)
│   ├── valuation_model.pkl        # Trained valuation model (not committed)
│   ├── risk_model.pkl             # Trained risk model (not committed)
│   └── .gitignore
│
├── smart-contract/                # Blockchain layer
│   ├── contracts/
│   │   └── ProptiChainRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── registry.test.js
│   ├── backend/
│   │   ├── server.js              # Express API server
│   │   ├── blockchain.js          # Ethers.js contract helper
│   │   ├── controllers/
│   │   │   ├── propertyController.js
│   │   │   ├── aiController.js
│   │   │   └── userController.js
│   │   └── routes/
│   │       ├── propertyRoutes.js
│   │       ├── aiRoutes.js
│   │       └── userRoutes.js
│   ├── hardhat.config.js
│   ├── package.json
│   └── .gitignore
│
└── README.md                      # This file
```

---

## Getting Started

### Prerequisites

- **Python 3.10–3.12** (for AI service)
- **Node.js 18+** (for blockchain layer)
- **npm** (comes with Node.js)

### AI Service Setup

```bash
cd ai_service

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Train models
python train_models.py

# Start the AI API
uvicorn app:app --reload
```

The AI API runs at **http://localhost:8000**. Visit http://localhost:8000/docs for Swagger UI.

### Blockchain Layer Setup

```bash
cd smart-contract

# Install dependencies
npm install

# Compile the smart contract
npx hardhat compile

# Start a local blockchain (keep this terminal open)
npx hardhat node

# In a new terminal — deploy the contract
npx hardhat run scripts/deploy.js --network localhost

# Start the Express API
node backend/server.js
```

The Blockchain API runs at **http://localhost:3000**.

---

## API Reference

### AI Service API

**Base URL:** `http://localhost:8000`

#### `POST /predict` — Get property valuation and risk score

**Request:**
```json
{
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
```

**Response:**
```json
{
  "predicted_price": 332869.17,
  "risk_score": 0.57,
  "risk_label": "High Risk",
  "confidence_interval": [231990.0, 577950.0]
}
```

---

### Blockchain API

**Base URL:** `http://localhost:3000`

> `signerIndex` maps to Hardhat test accounts (0 = ADMIN, 1 = SELLER, 2 = BUYER, 3 = AI_ORACLE after role setup).

#### `POST /user/register` — Assign a role (ADMIN only)
```json
{
  "signerIndex": 0,
  "userAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "role": "SELLER"
}
```

#### `POST /property/register` — Register a property (SELLER)
```json
{
  "signerIndex": 1,
  "location": "Seattle",
  "area": 1800,
  "price": 420000
}
```

#### `POST /ai/valuation` — Submit AI valuation hash (AI_ORACLE)
```json
{
  "signerIndex": 3,
  "propertyId": 1,
  "valuationData": { "predicted_price": 350000 }
}
```

#### `POST /ai/risk` — Submit AI risk hash (AI_ORACLE)
```json
{
  "signerIndex": 3,
  "propertyId": 1,
  "riskData": { "risk_score": 0.18, "risk_label": "Low Risk" }
}
```

#### `POST /property/list` — List property for sale (owner)
```json
{
  "signerIndex": 1,
  "propertyId": 1
}
```

#### `POST /property/buy` — Purchase property (BUYER)
```json
{
  "signerIndex": 2,
  "propertyId": 1
}
```

#### `GET /property/:id` — Get property details
#### `GET /user/role/:address` — Get user role

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

1. **ADMIN** registers users and assigns roles (SELLER, BUYER, AI_ORACLE).
2. **SELLER** registers a property on the blockchain.
3. **AI_ORACLE** calls the AI service (`/predict`) to get valuation and risk results.
4. **AI_ORACLE** submits the keccak256 hash of AI results to the smart contract for immutable verification.
5. **SELLER** lists the property for sale.
6. **BUYER** purchases the property; ownership is transferred on-chain.
7. All actions emit blockchain events for transparency and off-chain monitoring.

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
