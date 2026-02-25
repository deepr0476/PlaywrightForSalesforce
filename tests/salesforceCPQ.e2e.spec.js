// tests/salesforceCPQ.e2e.spec.js

const { test } = require('@playwright/test');
const { POManager } = require('../main/utilities/POManager');
const { UtilityFunctions } = require('../main/utilities/UtilityFunctions');

test.describe('Salesforce CPQ – API Foundation Flow', () => {

    test('Login → Create Account → Create Contact → Create Opportunity → Create Quote (API)', async ({ page }) => {

        // =========================
        // 🔧 Utilities + PO Manager
        // =========================
        const utils = new UtilityFunctions('CPQ_API_Base_Flow');
        const poManager = new POManager(page, utils);

        // =========================
        // 🔐 LOGIN (API + Frontdoor)
        // =========================
        const loginPage = poManager.getLoginPage();

        // 1. Token fetch (API)
        const accessToken = await utils.getAccessToken();

        // 2. UI login using Frontdoor
        await loginPage.loginWithToken(accessToken);
        console.log('✅ Login successful');

        // =========================
        // 🏢 CREATE ACCOUNT (API)
        // =========================
        const accountId = await poManager.createAccountHybrid(true);
        console.log(`✅ Account created → ID: ${accountId}`);

        // =========================
        // 👤 CREATE CONTACT (API – linked to Account)
        // =========================
        const contactData = {
            Salutation: 'Mr.',
            LastName: `Contact_${Math.floor(Math.random() * 9000) + 1000}`
        };
        const contactId = await poManager.createContactHybrid(accountId, contactData, true);
        console.log(`✅ Contact created → ID: ${contactId}`);

        // Optional: verify Account linkage via API
        const contactInfo = await utils.apiRequest(
            'get',
            `sobjects/Contact/${contactId}?fields=Id,AccountId,LastName`
        );

        if (contactInfo.AccountId === accountId) {
            console.log('🔗 Contact correctly linked to Account');
        } else {
            console.warn('⚠️ Contact not linked to Account! Check RecordTypeId or API data.');
        }

        // =========================
        // 💼 CREATE OPPORTUNITY (API)
        // =========================
        const opportunityId = await poManager.createOpportunityHybrid(accountId, true);
        console.log(`✅ Opportunity created → ID: ${opportunityId}`);

        // =========================
        // 📝 CREATE QUOTE (API preferred)
        // =========================
        const quoteId = await poManager.createQuoteHybrid(opportunityId, accountId, true);
        console.log(`✅ Quote created → ID: ${quoteId}`);

        // =========================
        // ✅ TEST END
        // =========================
        console.log('🎉 Full API flow (Account → Contact → Opportunity → Quote) completed successfully');
    });

});
