// =========================
// UtilityFunctions.js (FINAL – CPQ SAFE + CONTACT FLOW FIX + PHASE 3)
// =========================

require('dotenv').config();
const axios = require('axios');
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const jwt = require('jsonwebtoken');

class UtilityFunctions {

    constructor(TestCaseName) {
        this.TestCaseName = TestCaseName;
        this.accessToken = null;
        this.instanceUrl = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }

        const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8');

        const jwtToken = jwt.sign(
            {
                iss: process.env.SF_CLIENT_ID,
                sub: process.env.SF_USERNAME,
                aud: process.env.SF_LOGIN_URL
            },
            privateKey,
            { algorithm: 'RS256', expiresIn: '3m' }
        );

        const res = await axios.post(
            `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
            null,
            {
                params: {
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: jwtToken
                }
            }
        );

        this.accessToken = res.data.access_token;
        this.instanceUrl = res.data.instance_url;
        this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);

        return this.accessToken;
    }

    async apiRequest(method, endpoint, data = null) {
        const token = await this.getAccessToken();

        try {
            const res = await axios({
                method,
                url: `${this.instanceUrl}/services/data/v57.0/${endpoint}`,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data
            });

            return res.data;
        } catch (err) {
            console.error('❌ API Request Failed:', err.response?.data || err.message);
            throw err;
        }
    }

    async createAccountViaAPI() {
        const res = await this.apiRequest(
            'post',
            'sobjects/Account',
            { Name: `Account_${faker.number.int({ min: 1000, max: 9999 })}` }
        );
        return res.id;
    }

    async createContactViaAPI(accountId, data = {}) {
        if (!accountId) throw new Error('accountId required');

        const contactData = {
            Salutation: 'Mr.',
            LastName: faker.person.lastName(),
            ...data,
            AccountId: accountId
        };

        const res = await this.apiRequest('post', 'sobjects/Contact', contactData);
        return res.id;
    }

    async createOpportunityViaAPI(accountId) {
        const res = await this.apiRequest(
            'post',
            'sobjects/Opportunity',
            {
                Name: `Opp_${faker.number.int({ min: 1000, max: 9999 })}`,
                StageName: 'Prospecting',
                CloseDate: new Date().toISOString().split('T')[0],
                AccountId: accountId
            }
        );
        return res.id;
    }

    async createQuoteViaAPI(opportunityId, accountId, contactId = null, data = null) {
        if (!opportunityId || !accountId) {
            throw new Error('opportunityId & accountId required');
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + 12);

        const quoteData = {
            SBQQ__Opportunity2__c: opportunityId,
            SBQQ__Account__c: accountId,
            SBQQ__Primary__c: true,
            SBQQ__SubscriptionTerm__c: 12,
            SBQQ__StartDate__c: startDate.toISOString().split('T')[0],
            SBQQ__EndDate__c: endDate.toISOString().split('T')[0],
            ...data
        };

        console.log("🔥 CONTACT ID IN QUOTE:", contactId);

        if (contactId) {
            quoteData.SBQQ__PrimaryContact__c = contactId;
        }

        const result = await this.apiRequest('post', 'sobjects/SBQQ__Quote__c/', quoteData);
        console.log("📦 QUOTE CREATED:", result);

        return result.id;
    }

    async setPricebookOnQuote(quoteId) {
        const pbResult = await this.apiRequest(
            'get',
            'query?q=SELECT+Id+FROM+Pricebook2+WHERE+IsStandard=true+LIMIT+1'
        );

        const pricebookId = pbResult.records[0].Id;

        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__Quote__c/${quoteId}`,
            { SBQQ__PricebookId__c: pricebookId }
        );

        console.log(`✅ Pricebook set: ${pricebookId}`);
    }

    // =========================
    // 🆕 PHASE 3 — DISCOUNT
    // =========================
    async setDiscountOnQuote(quoteId, discountPercent = 20) {
        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__Quote__c/${quoteId}`,
            { SBQQ__CustomerDiscount__c: discountPercent }
        );
        console.log(`✅ Discount set: ${discountPercent}%`);
    }

    // =========================
    // 🆕 PHASE 3 — SUBMIT FOR APPROVAL
    // =========================
    async submitQuoteForApproval(quoteId) {
        const result = await this.apiRequest(
            'post',
            'process/approvals',
            {
                requests: [{
                    actionType: 'Submit',
                    contextId: quoteId,
                    comments: 'Submitting for approval via automation'
                }]
            }
        );

        console.log(`✅ Quote submitted for approval`);
        console.log(`📋 Approval result:`, JSON.stringify(result));
        return result;
    }

    // =========================
    // 🆕 PHASE 3 — WAIT FOR APPROVAL WORKITEM
    // =========================
    async getApprovalWorkitemId(quoteId, retries = 10, waitMs = 3000) {
    for (let i = 0; i < retries; i++) {
        const result = await this.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+ProcessInstanceWorkitem+WHERE+ProcessInstance.TargetObjectId='${quoteId}'+LIMIT+1`
        );

        if (result.records && result.records.length > 0) {
            const workitemId = result.records[0].Id;
            console.log(`✅ Approval workitem found: ${workitemId}`);
            return workitemId;
        }

        console.log(`⏳ Waiting for approval workitem... attempt ${i + 1}/${retries}`);
        await new Promise(r => setTimeout(r, waitMs));
    }

    throw new Error('❌ Approval workitem not found after retries');
}
    // =========================
    // 🆕 PHASE 3 — APPROVE QUOTE
    // =========================
    async approveQuote(workitemId) {
        const result = await this.apiRequest(
            'post',
            'process/approvals',
            {
                requests: [{
                    actionType: 'Approve',
                    contextId: workitemId,
                    comments: 'Approved via automation'
                }]
            }
        );

        console.log(`✅ Quote approved!`);
        return result;
    }

    // =========================
    // 🆕 PHASE 3 — CREATE ORDER FROM QUOTE
    // =========================
    async createOrderFromQuote(quoteId) {
        // Step 1: SBQQ__Ordered__c = true set karo
        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__Quote__c/${quoteId}`,
            { SBQQ__Ordered__c: true }
        );

        console.log(`✅ Quote marked as Ordered`);

        // Step 2: Order fetch karo jo is quote se linked hai
        await new Promise(r => setTimeout(r, 3000)); // Order create hone ka wait

        const orderResult = await this.apiRequest(
            'get',
            `query?q=SELECT+Id,OrderNumber,Status+FROM+Order+WHERE+SBQQ__Quote__c='${quoteId}'+LIMIT+1`
        );

        if (!orderResult.records || orderResult.records.length === 0) {
            throw new Error('❌ Order not found after marking quote as ordered');
        }

        const orderId = orderResult.records[0].Id;
        const orderNumber = orderResult.records[0].OrderNumber;
        console.log(`✅ Order created → ID: ${orderId} | Number: ${orderNumber}`);

        return orderId;
    }

    // =========================
    // 🆕 PHASE 3 — ACTIVATE ORDER
    // =========================
    async activateOrder(orderId) {
        await this.apiRequest(
            'patch',
            `sobjects/Order/${orderId}`,
            { Status: 'Activated' }
        );

        console.log(`✅ Order activated!`);
    }

    // =========================
    // 🆕 PHASE 3 — CREATE CONTRACT FROM ORDER
    // =========================
    async getContractFromOrder(orderId) {
        await new Promise(r => setTimeout(r, 3000));

        const result = await this.apiRequest(
            'get',
            `query?q=SELECT+Id,ContractNumber,Status+FROM+Contract+WHERE+SBQQ__Order__c='${orderId}'+LIMIT+1`
        );

        if (!result.records || result.records.length === 0) {
            console.log(`ℹ️ No contract linked to order yet`);
            return null;
        }

        const contractId = result.records[0].Id;
        console.log(`✅ Contract found → ID: ${contractId}`);
        return contractId;
    }
}

module.exports = { UtilityFunctions };