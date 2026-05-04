// tests/cpq/quote-without-approval.spec.js

const { test } = require('@playwright/test');
const { POManager } = require('../../main/utilities/POManager');
const { UtilityFunctions } = require('../../main/utilities/UtilityFunctions');
const testData = require('../../main/utilities/testData');

test.describe('Salesforce CPQ – E2E Flow Without Approval', () => {

    test('Account → Contact → Opportunity → Quote → Product → Order → Contract (No Approval)', async ({ page }) => {

        const utils = new UtilityFunctions('CPQ_No_Approval_Flow');
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
            Salutation: testData.contact.salutation,
            LastName: `Contact_${Math.floor(Math.random() * 9000) + 1000}`
        };
        const contactId = await poManager.createContactHybrid(accountId, contactData, true);
        console.log(`✅ Contact created → ID: ${contactId}`);

        // =========================
        // 💼 OPPORTUNITY
        // =========================
        const opportunityId = await poManager.createOpportunityHybrid(accountId, true);
        console.log(`✅ Opportunity created → ID: ${opportunityId}`);

        // =========================
        // 📝 QUOTE
        // =========================
        const quoteId = await poManager.createQuoteHybrid(
            opportunityId, accountId, contactId, true
        );
        console.log(`✅ Quote created → ID: ${quoteId}`);

        await utils.setPricebookOnQuote(quoteId);
        console.log('🎉 Phase 1 Complete — API flow done!');

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
        // 🆕 PHASE 3 — LOW DISCOUNT (No Approval needed)
        // =========================
        const lowDiscount = testData.approvalThreshold - 5; // threshold se 5% kam
        await utils.setDiscountOnQuote(quoteId, testData.discount.withoutApproval);

        // Approval nahi lagegi — seedha Order
        const orderPage = poManager.getOrderPage();
        const orderId = await orderPage.createOrderFromQuote(quoteId);
        console.log(`✅ Order created → ID: ${orderId}`);

        await orderPage.activateOrder(orderId);

        const contractPage = poManager.getContractPage();
        const contractId = await contractPage.createContractFromOrder(orderId);
        if (contractId) {
            console.log(`✅ Contract created → ID: ${contractId}`);
        }

        console.log('🎉 Phase 3 Complete — Order → Activated (No Approval needed)!');
    });
});
