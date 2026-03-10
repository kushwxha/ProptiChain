# ProptiChain Blockchain Layer

Permissioned blockchain prototype for property registry, ownership tracking, AI valuation verification, and role-based access control.

## Tech Stack
- **Solidity** — Smart contract
- **Hardhat** — Compile, test, deploy
- **Node.js + Express** — Backend API
- **Ethers.js** — Blockchain interaction

---

## Quick Start

### 1. Install dependencies
```bash
cd smart-contract
npm install
```

### 2. Compile the contract
```bash
npx hardhat compile
```

### 3. Start a local blockchain node
Open a **separate terminal** and run:
```bash
npx hardhat node
```
This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 test accounts.

### 4. Run tests
```bash
npx hardhat test
```

### 5. Deploy the contract
```bash
npx hardhat run scripts/deploy.js --network localhost
```
The contract address is saved to `backend/deploy.json`.

### 6. Start the API server
```bash
node backend/server.js
```
API runs at `http://localhost:3000`.

---

## API Endpoints

> **signerIndex** — Hardhat test account index (0 = ADMIN, 1 = SELLER, 2 = BUYER, 3 = AI_ORACLE after setup).

### Register a user/role
```bash
POST /user/register
{
  "signerIndex": 0,
  "userAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "role": "SELLER"
}
```

### Register a property (SELLER)
```bash
POST /property/register
{
  "signerIndex": 1,
  "location": "Seattle",
  "area": 1800,
  "price": 420000
}
```

### Submit AI valuation hash (AI_ORACLE)
```bash
POST /ai/valuation
{
  "signerIndex": 3,
  "propertyId": 1,
  "valuationData": { "predicted_price": 350000 }
}
```

### Submit AI risk hash (AI_ORACLE)
```bash
POST /ai/risk
{
  "signerIndex": 3,
  "propertyId": 1,
  "riskData": { "risk_score": 0.18, "risk_label": "Low Risk" }
}
```

### List property for sale (owner/SELLER)
```bash
POST /property/list
{
  "signerIndex": 1,
  "propertyId": 1
}
```

### Buy property (BUYER)
```bash
POST /property/buy
{
  "signerIndex": 2,
  "propertyId": 1
}
```

### Get property details
```bash
GET /property/1
```

### Get user role
```bash
GET /user/role/0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

---

## Project Structure
```
smart-contract/
├── contracts/
│   └── ProptiChainRegistry.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── registry.test.js
├── backend/
│   ├── server.js
│   ├── blockchain.js
│   ├── deploy.json          (generated after deploy)
│   ├── controllers/
│   │   ├── propertyController.js
│   │   ├── aiController.js
│   │   └── userController.js
│   └── routes/
│       ├── propertyRoutes.js
│       ├── aiRoutes.js
│       └── userRoutes.js
├── hardhat.config.js
├── package.json
└── .gitignore
```
