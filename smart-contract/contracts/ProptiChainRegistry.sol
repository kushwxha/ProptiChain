// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProptiChainRegistry
 * @notice Decentralized property registry with RBAC, AI valuation verification,
 *         and secure ownership transfer for the ProptiChain platform.
 */
contract ProptiChainRegistry {

    // ──────────────────────────────────────────────
    //  Roles
    // ──────────────────────────────────────────────
    enum Role { NONE, ADMIN, SELLER, BUYER, AI_ORACLE }

    mapping(address => Role) public userRoles;

    // ──────────────────────────────────────────────
    //  Property data
    // ──────────────────────────────────────────────
    struct Property {
        uint    propertyId;
        address owner;
        string  location;
        uint    area;          // square feet
        uint    price;         // in wei or smallest currency unit
        bytes32 valuationHash; // keccak256 of AI valuation JSON
        bytes32 riskHash;      // keccak256 of AI risk score JSON
        bool    forSale;
    }

    uint public propertyCount;                        // auto-incrementing ID
    mapping(uint => Property) public properties;      // propertyId => Property

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────
    event UserRegistered(address indexed user, Role role);
    event PropertyRegistered(uint indexed propertyId, address indexed owner, string location, uint area, uint price);
    event ValuationHashSubmitted(uint indexed propertyId, bytes32 valuationHash);
    event RiskHashSubmitted(uint indexed propertyId, bytes32 riskHash);
    event PropertyListed(uint indexed propertyId);
    event PropertyTransferred(uint indexed propertyId, address indexed from, address indexed to, uint price);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────
    modifier onlyRole(Role _role) {
        require(userRoles[msg.sender] == _role, "Access denied: insufficient role");
        _;
    }

    modifier propertyExists(uint _propertyId) {
        require(_propertyId > 0 && _propertyId <= propertyCount, "Property does not exist");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor — deployer becomes ADMIN
    // ──────────────────────────────────────────────
    constructor() {
        userRoles[msg.sender] = Role.ADMIN;
        emit UserRegistered(msg.sender, Role.ADMIN);
    }

    // ──────────────────────────────────────────────
    //  Role Management
    // ──────────────────────────────────────────────

    /**
     * @notice Register a user and assign a role. Only ADMIN can call.
     * @param _user    Address of the user to register.
     * @param _role    Role to assign (1=ADMIN, 2=SELLER, 3=BUYER, 4=AI_ORACLE).
     */
    function registerUser(address _user, Role _role) external onlyRole(Role.ADMIN) {
        require(_user != address(0), "Invalid address");
        require(_role != Role.NONE, "Cannot assign NONE role");
        userRoles[_user] = _role;
        emit UserRegistered(_user, _role);
    }

    // ──────────────────────────────────────────────
    //  Property Registration
    // ──────────────────────────────────────────────

    /**
     * @notice Register a new property. Only SELLER can call.
     * @param _location  Human-readable location string.
     * @param _area      Area in square feet.
     * @param _price     Listing price.
     */
    function registerProperty(
        string memory _location,
        uint _area,
        uint _price
    ) external onlyRole(Role.SELLER) {
        require(_area > 0, "Area must be greater than zero");
        require(_price > 0, "Price must be greater than zero");

        propertyCount++;
        properties[propertyCount] = Property({
            propertyId:    propertyCount,
            owner:         msg.sender,
            location:      _location,
            area:          _area,
            price:         _price,
            valuationHash: bytes32(0),
            riskHash:      bytes32(0),
            forSale:       false
        });

        emit PropertyRegistered(propertyCount, msg.sender, _location, _area, _price);
    }

    // ──────────────────────────────────────────────
    //  AI Oracle — Valuation & Risk Hash Submission
    // ──────────────────────────────────────────────

    /**
     * @notice Submit the AI valuation hash for a property. Only AI_ORACLE can call.
     * @param _propertyId   ID of the property.
     * @param _valuationHash keccak256 hash of the AI valuation result.
     */
    function submitValuationHash(
        uint _propertyId,
        bytes32 _valuationHash
    ) external onlyRole(Role.AI_ORACLE) propertyExists(_propertyId) {
        require(_valuationHash != bytes32(0), "Valuation hash cannot be empty");
        properties[_propertyId].valuationHash = _valuationHash;
        emit ValuationHashSubmitted(_propertyId, _valuationHash);
    }

    /**
     * @notice Submit the AI risk score hash for a property. Only AI_ORACLE can call.
     * @param _propertyId ID of the property.
     * @param _riskHash   keccak256 hash of the AI risk score result.
     */
    function submitRiskHash(
        uint _propertyId,
        bytes32 _riskHash
    ) external onlyRole(Role.AI_ORACLE) propertyExists(_propertyId) {
        require(_riskHash != bytes32(0), "Risk hash cannot be empty");
        properties[_propertyId].riskHash = _riskHash;
        emit RiskHashSubmitted(_propertyId, _riskHash);
    }

    // ──────────────────────────────────────────────
    //  Property Sale
    // ──────────────────────────────────────────────

    /**
     * @notice List an owned property for sale. Only the property owner can call.
     * @param _propertyId ID of the property to list.
     */
    function listPropertyForSale(uint _propertyId) external propertyExists(_propertyId) {
        Property storage p = properties[_propertyId];
        require(p.owner == msg.sender, "Only the property owner can list");
        require(!p.forSale, "Property is already listed for sale");
        p.forSale = true;
        emit PropertyListed(_propertyId);
    }

    /**
     * @notice Purchase a listed property. Only BUYER can call.
     *         Ownership transfers to the buyer; price is recorded.
     * @param _propertyId ID of the property to purchase.
     */
    function purchaseProperty(uint _propertyId)
        external
        onlyRole(Role.BUYER)
        propertyExists(_propertyId)
    {
        Property storage p = properties[_propertyId];
        require(p.forSale, "Property is not listed for sale");
        require(p.owner != msg.sender, "Owner cannot buy own property");

        address previousOwner = p.owner;
        p.owner   = msg.sender;
        p.forSale = false;

        emit PropertyTransferred(_propertyId, previousOwner, msg.sender, p.price);
    }

    // ──────────────────────────────────────────────
    //  View helpers
    // ──────────────────────────────────────────────

    /**
     * @notice Retrieve full property details.
     */
    function getProperty(uint _propertyId)
        external
        view
        propertyExists(_propertyId)
        returns (Property memory)
    {
        return properties[_propertyId];
    }

    /**
     * @notice Check the role of any address.
     */
    function getRole(address _user) external view returns (Role) {
        return userRoles[_user];
    }
}
