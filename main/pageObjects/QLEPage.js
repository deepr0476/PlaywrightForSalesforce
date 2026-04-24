// main/pageObjects/QLEPage.js

const { expect } = require('@playwright/test');
const { product } = require('../utilities/testData');

class QLEPage {
    constructor(page) {
        this.page = page;
    }

    async openQuoteRecord(quoteId) {
        const url = `${process.env.SF_INSTANCE_URL}/lightning/r/SBQQ__Quote__c/${quoteId}/view`;
        console.log(`🌐 Opening Quote: ${url}`);
        await this.page.goto(url);
        await this.page.waitForURL('**/lightning/r/SBQQ__Quote__c/**', { timeout: 30000 });
        console.log('✅ Quote record page loaded');
    }

    async clickEditLines() {
    const editLinesBtn = this.page.locator(
        'button.slds-button:has-text("Edit Lines")'
    );
    await editLinesBtn.waitFor({ timeout: 20000 });
    await editLinesBtn.click();
    console.log('🖱️ Edit Lines clicked');

    // ✅ height="100%" wala specific iframe wait karo
    await this.page.waitForSelector(
        'iframe[name^="vfFrameId_"][height="100%"]',
        { timeout: 30000 }
    );
    console.log('✅ QLE iframe detected');
}

    async handlePricebookDialog() {
        const frame = this.page.frameLocator('iframe[name^="vfFrameId_"][height="100%"]');

        await this.page.waitForTimeout(5000);

        const sbFrame = this.page.frames().find(f => f.url().includes('/apex/sb?'));

        if (sbFrame) {
            const clicked = await sbFrame.evaluate(() => {
                function deepFindAll(root, selector, results = []) {
                    results.push(...root.querySelectorAll(selector));
                    for (const node of root.querySelectorAll('*')) {
                        if (node.shadowRoot) deepFindAll(node.shadowRoot, selector, results);
                    }
                    return results;
                }

                const saveBtn = deepFindAll(document, 'paper-button[slot="paper-button"].primary')[0];
                if (!saveBtn) return 'no-primary-btn';

                saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
                return 'clicked-primary-save';
            });

            console.log(`🔍 Pricebook result: ${clicked}`);
            await this.page.waitForTimeout(3000);
        }

        await frame.getByRole('button', { name: 'Add Products' })
            .waitFor({ timeout: 30000 });
        console.log('✅ QLE fully loaded');
    }

    // 🆕 Dynamic — productCode testData se aata hai
    async clickAddProducts(productCode = product.code) {
        const frame = this.page.frameLocator('iframe[name^="vfFrameId_"][height="100%"]');

        await frame.getByRole('button', { name: 'Add Products' }).click();
        console.log('🖱️ Add Products clicked');

        await frame.locator(`span#me:has-text("${productCode}")`)
            .waitFor({ timeout: 30000 });
        console.log(`✅ Product catalog loaded — looking for: ${productCode}`);
    }

    // 🆕 Dynamic — productCode testData se aata hai
    async selectProduct(productCode = product.code) {
        const frame = this.page.frameLocator('iframe[name^="vfFrameId_"][height="100%"]');

        const productCheckbox = frame
            .locator('sb-swipe-container')
            .filter({ has: frame.locator(`span#me:has-text("${productCode}")`) })
            .getByRole('checkbox');

        await productCheckbox.waitFor({ timeout: 20000 });
        await productCheckbox.click();
        console.log(`✅ Product ${productCode} selected`);

        await frame.locator('paper-button#plSelect').click();
        console.log('🖱️ Select clicked — product added to QLE');

        await frame.locator(`span#me:has-text("${productCode}")`)
            .waitFor({ timeout: 30000 });
        console.log('✅ Product line appeared in QLE');
    }

    async clickCalculate() {
        const frame = this.page.frameLocator('iframe[name^="vfFrameId_"][height="100%"]');

        await frame.getByRole('button', { name: 'Calculate' }).click();
        console.log('🧮 Calculate clicked');

        await frame.locator('.slds-spinner')
            .waitFor({ state: 'hidden', timeout: 30000 })
            .catch(() => console.log('ℹ️ Spinner not found — calculation instant '));

        console.log('✅ Pricing calculated');
    }

    async saveQuoteLines() {
        const frame = this.page.frameLocator('iframe[name^="vfFrameId_"][height="100%"]');

        await frame.getByRole('button', { name: 'Save', exact: true }).click();
        console.log('💾 Save clicked');

        await this.page.waitForURL('**/lightning/r/SBQQ__Quote__c/**', { timeout: 45000 });
        console.log('✅ Quote Lines saved successfully');
    }
}

module.exports = { QLEPage };
