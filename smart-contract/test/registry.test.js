/**
 * registry.test.js
 * Automated tests for ProptiChainRegistry smart contract.
 *
 * Covers:
 *  - Role enforcement
 *  - Property registration
 *  - AI hash submission
 *  - Property listing & transfer
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProptiChainRegistry", function () {
  let registry;
  let admin, seller, buyer, oracle, unauthorized;

  // Role enum values (must match Solidity enum order)
  const Role = { NONE: 0, ADMIN: 1, SELLER: 2, BUYER: 3, AI_ORACLE: 4 };

  beforeEach(async function () {
    [admin, seller, buyer, oracle, unauthorized] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ProptiChainRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();

    // Assign roles
    await registry.connect(admin).registerUser(seller.address, Role.SELLER);
    await registry.connect(admin).registerUser(buyer.address, Role.BUYER);
    await registry.connect(admin).registerUser(oracle.address, Role.AI_ORACLE);
  });

  // ─── Role Enforcement ───────────────────────────
  describe("Role Management", function () {
    it("deployer should be ADMIN", async function () {
      expect(await registry.getRole(admin.address)).to.equal(Role.ADMIN);
    });

    it("should assign SELLER role correctly", async function () {
      expect(await registry.getRole(seller.address)).to.equal(Role.SELLER);
    });

    it("should assign BUYER role correctly", async function () {
      expect(await registry.getRole(buyer.address)).to.equal(Role.BUYER);
    });

    it("should assign AI_ORACLE role correctly", async function () {
      expect(await registry.getRole(oracle.address)).to.equal(Role.AI_ORACLE);
    });

    it("non-ADMIN should NOT be able to register users", async function () {
      await expect(
        registry.connect(seller).registerUser(unauthorized.address, Role.BUYER)
      ).to.be.revertedWith("Access denied: insufficient role");
    });

    it("should NOT assign NONE role", async function () {
      await expect(
        registry.connect(admin).registerUser(unauthorized.address, Role.NONE)
      ).to.be.revertedWith("Cannot assign NONE role");
    });
  });

  // ─── Property Registration ───────────────────────
  describe("Property Registration", function () {
    it("SELLER should register a property", async function () {
      await expect(
        registry.connect(seller).registerProperty("New York", 1500, 500000)
      )
        .to.emit(registry, "PropertyRegistered")
        .withArgs(1, seller.address, "New York", 1500, 500000);

      const prop = await registry.getProperty(1);
      expect(prop.owner).to.equal(seller.address);
      expect(prop.location).to.equal("New York");
      expect(prop.area).to.equal(1500);
      expect(prop.price).to.equal(500000);
      expect(prop.forSale).to.equal(false);
    });

    it("non-SELLER should NOT register a property", async function () {
      await expect(
        registry.connect(buyer).registerProperty("LA", 1000, 300000)
      ).to.be.revertedWith("Access denied: insufficient role");
    });

    it("should reject zero area", async function () {
      await expect(
        registry.connect(seller).registerProperty("NY", 0, 100000)
      ).to.be.revertedWith("Area must be greater than zero");
    });

    it("should reject zero price", async function () {
      await expect(
        registry.connect(seller).registerProperty("NY", 1000, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });
  });

  // ─── AI Hash Submission ──────────────────────────
  describe("AI Valuation & Risk Hash Submission", function () {
    const sampleValuationHash = ethers.keccak256(
      ethers.toUtf8Bytes('{"predicted_price":350000}')
    );
    const sampleRiskHash = ethers.keccak256(
      ethers.toUtf8Bytes('{"risk_score":0.18}')
    );

    beforeEach(async function () {
      await registry.connect(seller).registerProperty("Seattle", 1800, 420000);
    });

    it("AI_ORACLE should submit valuation hash", async function () {
      await expect(
        registry.connect(oracle).submitValuationHash(1, sampleValuationHash)
      )
        .to.emit(registry, "ValuationHashSubmitted")
        .withArgs(1, sampleValuationHash);

      const prop = await registry.getProperty(1);
      expect(prop.valuationHash).to.equal(sampleValuationHash);
    });

    it("AI_ORACLE should submit risk hash", async function () {
      await expect(
        registry.connect(oracle).submitRiskHash(1, sampleRiskHash)
      )
        .to.emit(registry, "RiskHashSubmitted")
        .withArgs(1, sampleRiskHash);

      const prop = await registry.getProperty(1);
      expect(prop.riskHash).to.equal(sampleRiskHash);
    });

    it("non-ORACLE should NOT submit valuation hash", async function () {
      await expect(
        registry.connect(seller).submitValuationHash(1, sampleValuationHash)
      ).to.be.revertedWith("Access denied: insufficient role");
    });

    it("non-ORACLE should NOT submit risk hash", async function () {
      await expect(
        registry.connect(buyer).submitRiskHash(1, sampleRiskHash)
      ).to.be.revertedWith("Access denied: insufficient role");
    });

    it("should reject empty valuation hash", async function () {
      await expect(
        registry.connect(oracle).submitValuationHash(1, ethers.ZeroHash)
      ).to.be.revertedWith("Valuation hash cannot be empty");
    });

    it("should reject submission for non-existent property", async function () {
      await expect(
        registry.connect(oracle).submitValuationHash(999, sampleValuationHash)
      ).to.be.revertedWith("Property does not exist");
    });
  });

  // ─── Property Listing & Transfer ─────────────────
  describe("Property Listing & Transfer", function () {
    beforeEach(async function () {
      await registry.connect(seller).registerProperty("Boston", 2000, 600000);
    });

    it("owner should list property for sale", async function () {
      await expect(registry.connect(seller).listPropertyForSale(1))
        .to.emit(registry, "PropertyListed")
        .withArgs(1);

      const prop = await registry.getProperty(1);
      expect(prop.forSale).to.equal(true);
    });

    it("non-owner should NOT list property for sale", async function () {
      await expect(
        registry.connect(buyer).listPropertyForSale(1)
      ).to.be.revertedWith("Only the property owner can list");
    });

    it("should not list property that is already listed", async function () {
      await registry.connect(seller).listPropertyForSale(1);
      await expect(
        registry.connect(seller).listPropertyForSale(1)
      ).to.be.revertedWith("Property is already listed for sale");
    });

    it("BUYER should purchase a listed property", async function () {
      await registry.connect(seller).listPropertyForSale(1);

      await expect(registry.connect(buyer).purchaseProperty(1))
        .to.emit(registry, "PropertyTransferred")
        .withArgs(1, seller.address, buyer.address, 600000);

      const prop = await registry.getProperty(1);
      expect(prop.owner).to.equal(buyer.address);
      expect(prop.forSale).to.equal(false);
    });

    it("non-BUYER should NOT purchase property", async function () {
      await registry.connect(seller).listPropertyForSale(1);
      await expect(
        registry.connect(unauthorized).purchaseProperty(1)
      ).to.be.revertedWith("Access denied: insufficient role");
    });

    it("should NOT purchase property that is not for sale", async function () {
      await expect(
        registry.connect(buyer).purchaseProperty(1)
      ).to.be.revertedWith("Property is not listed for sale");
    });

    it("owner should NOT buy own property", async function () {
      // Make seller also a buyer for this test
      await registry.connect(admin).registerUser(seller.address, Role.BUYER);
      await expect(
        registry.connect(seller).purchaseProperty(1)
      ).to.be.revertedWith("Property is not listed for sale");
    });
  });
});
