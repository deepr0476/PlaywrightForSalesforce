const testData = require('./testData');
const { JwtAuth } = require('./auth/jwtAuth');
const { ApiClient } = require('./http/apiClient');
const { AccountAPI } = require('../api/AccountAPI');
const { ContactAPI } = require('../api/ContactAPI');
const { OpportunityAPI } = require('../api/OpportunityAPI');
const { QuoteAPI } = require('../api/QuoteAPI');
const { ApprovalAPI } = require('../api/ApprovalAPI');
const { OrderAPI } = require('../api/OrderAPI');
const { ContractAPI } = require('../api/ContractAPI');
const { AmendmentAPI } = require('../api/AmendmentAPI');

class UtilityFunctions {
    constructor(TestCaseName) {
        this.TestCaseName = TestCaseName;
        this.jwtAuth = new JwtAuth();
        this.apiClient = new ApiClient(this.jwtAuth);
    
        this.accountAPI = new AccountAPI(this.apiRequest.bind(this));
        this.contactAPI = new ContactAPI(this.apiRequest.bind(this));
        this.opportunityAPI = new OpportunityAPI(this.apiRequest.bind(this));
        this.quoteAPI = new QuoteAPI(this.apiRequest.bind(this));
        this.approvalAPI = new ApprovalAPI(this.apiRequest.bind(this));
        this.orderAPI = new OrderAPI(this.apiRequest.bind(this));
        this.contractAPI = new ContractAPI(this.apiRequest.bind(this));
        this.amendmentAPI = new AmendmentAPI(this.apiRequest.bind(this));
    }

    // =========================
    // AUTH + HTTP // 
    // =========================
    async getAccessToken() {
        const { accessToken } = await this.jwtAuth.getAccessToken();
        return accessToken;
    }

    async apiRequest(method, endpoint, data = null) {
        return this.apiClient.apiRequest(method, endpoint, data);
    }
    
    // =========================
    // ACCOUNT //
    // =========================
    async createAccountViaAPI() {
        return this.accountAPI.createAccountViaAPI();
    }

    // =========================
    // CONTACT //
    // =========================
    async createContactViaAPI(accountId, data = {}) {
        return this.contactAPI.createContactViaAPI(accountId, data);
    }

    // =========================
    // OPPORTUNITY // 
    // =========================
    async createOpportunityViaAPI(accountId) {
        return this.opportunityAPI.createOpportunityViaAPI(accountId);
    }

    async closeOpportunityAsWon(opportunityId) {
        return this.opportunityAPI.closeOpportunityAsWon(opportunityId);
    }

    // =========================
    // QUOTE // 
    // =========================
    async createQuoteViaAPI(opportunityId, accountId, contactId = null, data = null) {
        return this.quoteAPI.createQuoteViaAPI(opportunityId, accountId, contactId, data);
    }

    async setPricebookOnQuote(quoteId, pricebookName = testData.pricebook.name) {
        return this.quoteAPI.setPricebookOnQuote(quoteId, pricebookName);
    }

    async setDiscountOnQuote(quoteId, discountPercent = testData.discount) {
        return this.quoteAPI.setDiscountOnQuote(quoteId, discountPercent);
    }

    async setQuantityOnQuoteLine(quoteId, quantity = testData.product.quantity) {
        return this.quoteAPI.setQuantityOnQuoteLine(quoteId, quantity);
    }

   
    // AMENDMENT // 
    async updateAmendmentQuoteLineQuantity(quoteId, quantity) {
        return this.amendmentAPI.updateAmendmentQuoteLineQuantity(quoteId, quantity);
    }

    async updateAmendmentQuoteLineQuantityAndStartDate(quoteId, quantity, startDate) {
        return this.amendmentAPI.updateAmendmentQuoteLineQuantityAndStartDate(quoteId, quantity, startDate);
    }

    async prepareAmendmentForOrdering(quoteId, startDate, pricebookName = testData.pricebook.name) {
        return this.amendmentAPI.prepareAmendmentForOrdering(quoteId, startDate, pricebookName);
    }
    // =========================
    // APPROVAL // 
    // =========================
    async submitQuoteForApproval(quoteId) {
        return this.approvalAPI.submitQuoteForApproval(quoteId);
    }

    async getApprovalWorkitemId(quoteId, retries = 10, waitMs = 3000) {
        return this.approvalAPI.getApprovalWorkitemId(quoteId, retries, waitMs);
    }

    async approveQuote(workitemId) {
        return this.approvalAPI.approveQuote(workitemId);
    }

    // =========================
    // ORDER // 
    // =========================
    async createOrderFromQuote(quoteId) {
        return this.orderAPI.createOrderFromQuote(quoteId);
    }

    async activateOrder(orderId) {
        return this.orderAPI.activateOrder(orderId);
    }

    // =========================
    // CONTRACT // 
    // =========================
    async createContractFromOrder(orderId) {
        return this.contractAPI.createContractFromOrder(orderId);
    }
}

module.exports = { UtilityFunctions };