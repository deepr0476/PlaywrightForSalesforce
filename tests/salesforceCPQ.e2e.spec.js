// tests/salesforceCPQ.e2e.spec.js

const { test } = require('@playwright/test');
const { POManager } = require('../main/utilities/POManager');
const { UtilityFunctions } = require('../main/utilities/UtilityFunctions');

test.describe('Salesforce CPQ – API Foundation Flow', () => {

    test('Login → Create Account → Create Contact → Create Opportunity → Create Quote (API)', async ({ page }) => {

        const utils = new UtilityFunctions('CPQ_API_Base_Flow');
        const poManager = new POManager(page, utils);

        const loginPage = poManager.getLoginPage();
        const accessToken = await utils.getAccessToken();
        await loginPage.loginWithToken(accessToken);
        console.log('✅ Login successful');

        const accountId = await poManager.createAccountHybrid(true);
        console.log(`✅ Account created → ID: ${accountId}`);

        const contactData = {
            Salutation: 'Mr.',
            LastName: `Contact_${Math.floor(Math.random() * 9000) + 1000}`
        };

        const contactId = await poManager.createContactHybrid(accountId, contactData, true);
        console.log(`✅ Contact created → ID: ${contactId}`);

        const contactInfo = await utils.apiRequest(
            'get',
            `sobjects/Contact/${contactId}?fields=Id,AccountId,LastName`
        );

        if (contactInfo.AccountId === accountId) {
            console.log('🔗 Contact correctly linked to Account');
        } else {
            console.warn('⚠️ Contact not linked to Account!');
        }

        const opportunityId = await poManager.createOpportunityHybrid(accountId, true);
        console.log(`✅ Opportunity created → ID: ${opportunityId}`);

        // 🔥 FIX: contactId added here
        const quoteId = await poManager.createQuoteHybrid(
            opportunityId,
            accountId,
            contactId,   // ✅ ADDED
            true
        );

        console.log(`✅ Quote created → ID: ${quoteId}`);

        await utils.setPricebookOnQuote(quoteId);

        console.log('🎉 Full API flow (Account → Contact → Opportunity → Quote) completed successfully');

        const qlePage = poManager.getQLEPage();

        await qlePage.openQuoteRecord(quoteId);
        await qlePage.clickEditLines();
        await qlePage.handlePricebookDialog();
        await qlePage.clickAddProducts();
        await qlePage.selectProduct();
        await qlePage.clickCalculate();
        await qlePage.saveQuoteLines();

        console.log('🎉 Phase 2 Complete — Product added, priced, and saved!');
    });

});