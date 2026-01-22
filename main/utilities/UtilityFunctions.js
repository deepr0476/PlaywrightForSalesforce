// =========================
// UtilityFunctions.js (FINAL – CPQ SAFE)
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
    // 🔐 JWT TOKEN
    // =========================
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
   
    // =========================
    // 🔨 GENERIC API CALL
    // =========================
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

    // =========================
    // 🧾 PRICEBOOK (MANDATORY)
    // =========================
    async getStandardPricebookId() {
        const res = await this.apiRequest(
            'get',
            `query/?q=SELECT+Id+FROM+Pricebook2+WHERE+IsStandard=true+LIMIT+1`
        );
        return res.records[0].Id;
    }

    // =========================
    // 🏢 ACCOUNT
    // =========================
    async createAccountViaAPI() {
        const res = await this.apiRequest(
            'post',
            'sobjects/Account',
            {
                Name: `Account_${faker.number.int({ min: 1000, max: 9999 })}`
            }
        );
        return res.id;
    }

    // =========================
    // 💼 OPPORTUNITY
    // =========================
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

    // =========================
   // =========================
// 🧾 CREATE CPQ QUOTE (API)
// =========================
async createQuoteViaAPI(opportunityId, accountId, data = null) {
    if (!opportunityId || !accountId) {
        throw new Error('❌ opportunityId & accountId are required for Quote');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 12);

    const quoteData = data || {
        SBQQ__Opportunity2__c: opportunityId,
        SBQQ__Account__c: accountId,
        SBQQ__Primary__c: true,
        SBQQ__SubscriptionTerm__c: 12,
        SBQQ__StartDate__c: startDate.toISOString().split('T')[0],
        SBQQ__EndDate__c: endDate.toISOString().split('T')[0]
    };

    const result = await this.apiRequest(
        'post',
        'sobjects/SBQQ__Quote__c/',
        quoteData
    );

    return result.id;
}

}

module.exports = { UtilityFunctions };
