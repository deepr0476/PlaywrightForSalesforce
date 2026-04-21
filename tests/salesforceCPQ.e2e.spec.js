// tests/salesforceCPQ.e2e.spec.js

const { test } = require('@playwright/test');
const { POManager } = require('../main/utilities/POManager');
const { UtilityFunctions } = require('../main/utilities/UtilityFunctions');

test.describe('Salesforce CPQ – API Foundation Flow', () => {

    test('Login → Create Account → Create Contact → Create Opportunity → Create Quote (API)', async ({ page }) => {

        const utils = new UtilityFunctions('CPQ_API_Base_Flow');
        const poManager = new POManager(page, utils);

        // =========================
        // 🔐 LOGIN
        // =========================
        const loginPage = poManager.getLoginPage();
        const accessToken = await utils.getAccessToken();
        await loginPage.loginWithToken(accessToken);
        console.log('✅ Login successful');

        // =========================
        // 🏢 ACCOUNT
        // =========================
        const accountId = await poManager.createAccountHybrid(true);
        console.log(`✅ Account created → ID: ${accountId}`);

        // =========================
        // 👤 CONTACT
        // =========================
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

        // =========================
        // 💼 OPPORTUNITY
        // =========================
        const opportunityId = await poManager.createOpportunityHybrid(accountId, true);
        console.log(`✅ Opportunity created → ID: ${opportunityId}`);

        // =========================
        // 📝 QUOTE
        // =========================
        const quoteId = await poManager.createQuoteHybrid(
            opportunityId,
            accountId,
            contactId,
            true
        );
        console.log(`✅ Quote created → ID: ${quoteId}`);

        await utils.setPricebookOnQuote(quoteId);

        console.log('🎉 Full API flow (Account → Contact → Opportunity → Quote) completed successfully');

        // =========================
        // 🖥️ PHASE 2 — QLE UI
        // =========================
        const qlePage = poManager.getQLEPage();

        await qlePage.openQuoteRecord(quoteId);
        await qlePage.clickEditLines();
        await qlePage.handlePricebookDialog();
        await qlePage.clickAddProducts();
        await qlePage.selectProduct();
        await qlePage.clickCalculate();
        await qlePage.saveQuoteLines();

        console.log('🎉 Phase 2 Complete — Product added, priced, and saved!');

        // =========================
        // 🆕 PHASE 3 — DISCOUNT + APPROVAL + ORDER
        // =========================

        // 3.1 Discount set karo (20% — approval trigger hogi)
        await utils.setDiscountOnQuote(quoteId, 20);

        // 3.2 Quote submit for approval
        await utils.submitQuoteForApproval(quoteId);

        // 3.3 Approval workitem ka wait karo
        const workitemId = await utils.getApprovalWorkitemId(quoteId);

        // 3.4 Quote approve karo
        await utils.approveQuote(workitemId);

        // 3.5 Order create karo
        const orderId = await utils.createOrderFromQuote(quoteId);
        console.log(`✅ Order created → ID: ${orderId}`);

        // 3.6 Order activate karo
        await utils.activateOrder(orderId);

        // 3.7 Contract check karo (optional)
        const contractId = await utils.getContractFromOrder(orderId);
        if (contractId) {
            console.log(`✅ Contract linked → ID: ${contractId}`);
        }

        console.log('🎉 Phase 3 Complete — Discount → Approval → Order → Activated!');
    });

});