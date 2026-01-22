// tests/salesforceCPQ.e2e.spec.js

const { test } = require('@playwright/test');
const { POManager } = require('../main/utilities/POManager');
const { UtilityFunctions } = require('../main/utilities/UtilityFunctions');

test.describe('Salesforce CPQ – API Foundation Flow', () => {

    test('Login → Create Account → Create Opportunity → Create Quote (API)', async ({ page }) => {

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
        console.log(`✅ Account ID: ${accountId}`);

        // =========================
        // 💼 CREATE OPPORTUNITY (API)
        // =========================
        const opportunityId = await poManager.createOpportunityHybrid(accountId, true);
        console.log(`✅ Opportunity ID: ${opportunityId}`);

        // =========================
        // 📝 CREATE QUOTE (API preferred)
        // =========================
       const quoteId = await utils.createQuoteViaAPI(opportunityId, accountId);
        console.log('✅ Quote ID:', quoteId);


        // =========================
        // ✅ TEST END
        // =========================
        console.log('🎉 Base API flow completed successfully');
    });

});


