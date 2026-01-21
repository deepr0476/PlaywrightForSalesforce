// main/pageObjects/AccountPage.js

const { faker } = require('@faker-js/faker');

class AccountPage {
    constructor(page, utilityFunctions) {
        this.page = page;
        this.utils = utilityFunctions;
    }

    // =========================
    // 🔹 CREATE ACCOUNT (UI or API)
    // =========================
    /**
     * Create Account
     * @param {Object} data - optional account data
     * @param {Boolean} useAPI - true for API, false for UI
     */
    async createAccount(data = null, useAPI = true) {
        if (useAPI) {
            // API path
            const accountId = await this.utils.createAccountViaAPI(data);
            console.log(`✅ Account created via API: ${accountId}`);
            return accountId;
        } else {
            // UI path
            const accountData = data || await this.utils.generateRandomAccountData();

            // Navigate to Account tab (example)
            await this.page.goto(`${this.utils.instanceUrl}/lightning/o/Account/list?filterName=Recent`);

            // Click New button
            await this.page.click('button[title="New"]');

            // Fill form fields
            await this.page.fill('input[name="Name"]', accountData.Name);
            await this.page.fill('input[name="Phone"]', accountData.Phone);
            await this.page.fill('input[name="BillingStreet"]', accountData.BillingStreet);
            await this.page.fill('input[name="BillingCity"]', accountData.BillingCity);
            await this.page.fill('input[name="BillingState"]', accountData.BillingState);
            await this.page.fill('input[name="BillingPostalCode"]', accountData.BillingPostalCode);
            await this.page.fill('input[name="BillingCountry"]', accountData.BillingCountry);

            // Save
            await this.page.click('button[title="Save"]');

            // Handle potential popups (dismiss)
            try {
                const dismissBtn = await this.page.$('button:has-text("Dismiss")');
                if (dismissBtn) await dismissBtn.click();
            } catch (e) {
                // Ignore if not found
            }

            console.log(`✅ Account created via UI: ${accountData.Name}`);
            return accountData.Name; // Return Name or you can fetch Id via UI if needed
        }
    }
}

module.exports = { AccountPage };
