// =========================
// UtilityFunctions.js (FINAL – API + JWT READY)
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

    // =========================
    // 🔐 ENV + CREDENTIALS
    // =========================
    async fetchEnvironmentCreds() {
        if (
            !process.env.SF_USERNAME ||
            !process.env.SF_CLIENT_ID ||
            !process.env.PRIVATE_KEY_PATH ||
            !process.env.SF_LOGIN_URL
        ) {
            throw new Error("❌ Missing Salesforce API credentials in .env file");
        }

        return {
            username: process.env.SF_USERNAME,
            clientId: process.env.SF_CLIENT_ID,
            loginUrl: process.env.SF_LOGIN_URL,
            privateKeyPath: process.env.PRIVATE_KEY_PATH
        };
    }

    // =========================
    // 🔑 JWT → ACCESS TOKEN
    // =========================
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }

        const secrets = await this.fetchEnvironmentCreds();
        const privateKey = fs.readFileSync(secrets.privateKeyPath, 'utf8');

        const jwtToken = jwt.sign(
            {
                iss: secrets.clientId,
                sub: secrets.username,
                aud: secrets.loginUrl
            },
            privateKey,
            { algorithm: 'RS256', expiresIn: '3m' }
        );

        const response = await axios.post(
            `${secrets.loginUrl}/services/oauth2/token`,
            null,
            {
                params: {
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: jwtToken
                }
            }
        );

        this.accessToken = response.data.access_token;
        this.instanceUrl = response.data.instance_url;
        this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000); // 55 min

        return this.accessToken;
    }

    // =========================
    // 🔨 GENERIC API REQUEST
    // =========================
    async apiRequest(method, endpoint, data = null) {
        const token = await this.getAccessToken();

        const response = await axios({
            method,
            url: `${this.instanceUrl}/services/data/v57.0/${endpoint}`,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data
        });

        return response.data;
    }

    // =========================
    // 🎲 TEST DATA (FAKER ONLY)
    // =========================
    async generateRandomAccountData() {
        return {
            Name: `TestAccount_${faker.number.int({ min: 1000, max: 9999 })}`,
            Phone: faker.phone.number('9#########'),
            BillingStreet: faker.location.streetAddress(),
            BillingCity: faker.location.city(),
            BillingState: faker.location.state({ abbreviated: true }),
            BillingPostalCode: faker.location.zipCode(),
            BillingCountry: faker.location.country()
        };
    }

    async generateRandomOpportunityData() {
        return {
            Name: `TestOpp_${faker.number.int({ min: 1000, max: 9999 })}`,
            StageName: faker.helpers.arrayElement([
                'Prospecting',
                'Qualification',
                'Needs Analysis'
            ]),
            CloseDate: new Date().toISOString().split('T')[0],
            Amount: faker.finance.amount(1000, 50000, 2)
        };
    }

    async generateRandomQuoteData() {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 30);

        return {
            StartDate: start.toISOString().split('T')[0],
            EndDate: end.toISOString().split('T')[0],
            SubscriptionTerm: faker.number.int({ min: 1, max: 12 })
        };
    }

    async generateRandomOrderData() {
        return {
            EffectiveDate: new Date().toISOString().split('T')[0],
            Description: `Order_${faker.number.int({ min: 1000, max: 9999 })}`
        };
    }

    // =========================
    // ⚡ API CREATE HELPERS
    // =========================
    async createAccountViaAPI(data = null) {
        const accountData =
            data && typeof data === 'object'
                ? data
                : await this.generateRandomAccountData();

        const result = await this.apiRequest(
            'post',
            'sobjects/Account/',
            accountData
        );

        return result.id;
    }

    async createOpportunityViaAPI(accountId, data = null) {
        if (!accountId) {
            throw new Error("❌ accountId is required to create Opportunity");
        }

        const oppData =
            data && typeof data === 'object'
                ? data
                : await this.generateRandomOpportunityData();

        oppData.AccountId = accountId;

        const result = await this.apiRequest(
            'post',
            'sobjects/Opportunity/',
            oppData
        );

        return result.id;
    }

    async createQuoteViaAPI(opportunityId, accountId, data = null) {
        if (!opportunityId || !accountId) {
            throw new Error("❌ opportunityId & accountId are required");
        }

        const quoteData =
            data && typeof data === 'object'
                ? data
                : await this.generateRandomQuoteData();

        quoteData.OpportunityId = opportunityId;
        quoteData.AccountId = accountId;

        const result = await this.apiRequest(
            'post',
            'sobjects/Quote/',
            quoteData
        );

        return result.id;
    }

    async createOrderViaAPI(accountId, quoteId, data = null) {
        if (!accountId || !quoteId) {
            throw new Error("❌ accountId & quoteId are required");
        }

        const orderData =
            data && typeof data === 'object'
                ? data
                : await this.generateRandomOrderData();

        orderData.AccountId = accountId;
        orderData.QuoteId = quoteId;

        const result = await this.apiRequest(
            'post',
            'sobjects/Order/',
            orderData
        );

        return result.id;
    }
}

module.exports = { UtilityFunctions };
