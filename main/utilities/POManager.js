const { LoginPage } = require('../pageObjects/LoginPage');
const { OpportunityPage } = require('../pageObjects/OpportunityPage');
const { QuotePage } = require('../pageObjects/QuotePage');
const { ContractPage } = require('../pageObjects/ContractPage');
const { ContactPage } = require('../pageObjects/ContactPage');
const { AccountPage } = require('../pageObjects/AccountPage');
const { LoginPageObjects } = require('../pageObjectLocators/LoginPageObjects');

// CPQ Pages
const { QLEPage } = require('../pageObjects/QLEPage');
const { OrderPage } = require('../pageObjects/OrderPage');

class POManager {

    constructor(page, utilityFunctions) {
        this.page = page;
        this.utils = utilityFunctions;

        // 🔐 Core Pages
        this.loginPage = new LoginPage(this.page);

        // 🧾 Hybrid (UI + API) Pages
        this.accountPage = new AccountPage(this.page, this.utils);
        this.opportunityPage = new OpportunityPage(this.page, this.utils);

        // QuotePage properly initialized with page + utils
        this.quotePage = new QuotePage(this.page, this.utils);

        // Optional / existing pages
        this.contractPage = new ContractPage(this.page);
        this.contactPage = new ContactPage(this.page);
        this.loginPageObjects = new LoginPageObjects(this.page);

        // CPQ
        this.qlePage = new QLEPage(this.page);
        this.orderPage = new OrderPage(this.page);
    }

    // =========================
    // Getters
    // =========================
    getLoginPage() { return this.loginPage; }
    getAccountPage() { return this.accountPage; }
    getOpportunityPage() { return this.opportunityPage; }
    getQuotePage() { return this.quotePage; }
    getContractPage() { return this.contractPage; }
    getContactPage() { return this.contactPage; }
    getLoginPageObjects() { return this.loginPageObjects; }
    getQLEPage() { return this.qlePage; }
    getOrderPage() { return this.orderPage; }

    // =========================
    // 🌟 HYBRID FLOW HELPERS (API-first)
    // =========================

    /**
     * Create Account (API-first)
     */
    async createAccountHybrid(useAPI = true) {
        return await this.accountPage.createAccount(null, useAPI);
    }

    /**
     * Create Opportunity (API-first)
     */
    async createOpportunityHybrid(accountId, useAPI = true) {
        return await this.opportunityPage.createOpportunity(null, useAPI, accountId);
    }

    /**
     * Create Quote (API-first)
     */
    async createQuoteHybrid(opportunityId, accountId, useAPI = true) {
        if (useAPI) {
            // Using UtilityFunctions API helper directly
            return await this.utils.createQuoteViaAPI(opportunityId, accountId);
        } else {
            // Fallback to UI
            return await this.quotePage.createQuote(opportunityId);
        }
    }

    /**
     * Create Order (API-first)
     */
    async createOrderHybrid(accountId, quoteId, useAPI = true) {
        if (useAPI) {
            return await this.utils.createOrderViaAPI(accountId, quoteId);
        } else {
            return await this.orderPage.createOrder(null, false, quoteId);
        }
    }

    /**
     * Activate Order (API-first)
     */
    async activateOrderHybrid(orderId, useAPI = true) {
        if (useAPI) {
            return await this.orderPage.activateOrder(orderId, true);
        } else {
            return await this.orderPage.activateOrder(orderId, false);
        }
    }
}
  
module.exports = { POManager };
