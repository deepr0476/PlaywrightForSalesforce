// main/pageObjects/QLEPage.js

const { expect } = require('@playwright/test');

class QLEPage {
    constructor(page) {
        this.page = page;
    }

    // ─────────────────────────────────────────────
    // Step 1: Quote record page open karo
    // ─────────────────────────────────────────────
    async openQuoteRecord(quoteId) {
    const url = `${process.env.SF_INSTANCE_URL}/lightning/r/SBQQ__Quote__c/${quoteId}/view`;
    console.log(`🌐 Opening Quote: ${url}`);
    await this.page.goto(url);
    // networkidle hatao — URL based wait karo
    await this.page.waitForURL('**/lightning/r/SBQQ__Quote__c/**', { timeout: 30000 });
    console.log('✅ Quote record page loaded');
}

    // ─────────────────────────────────────────────
    // Step 2: Edit Lines click karo
    // Lightning page pe hai — iframe ke BAHAR
    // ─────────────────────────────────────────────
    async clickEditLines() {
        const editLinesBtn = this.page.locator(
            'button.slds-button:has-text("Edit Lines")'
        );

        await editLinesBtn.waitFor({ timeout: 20000 });
        await editLinesBtn.click();
        console.log('🖱️ Edit Lines clicked');

        // VF iframe load hone ka wait
        await this.page.waitForSelector(
            'iframe[name^="vfFrameId_"]',
            { timeout: 30000 }
        );
        console.log('✅ QLE iframe detected');
    }

    // ─────────────────────────────────────────────
    // Step 3: Pricebook dialog — aaye toh handle
    //         na aaye toh skip — dono handle hain
    // ─────────────────────────────────────────────
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
    // ─────────────────────────────────────────────
    // Step 4: Add Products click karo
    // class="notLast" = pehla button = Add Products
  
    // ─────────────────────────────────────────────
    async clickAddProducts() {
       const frame = this.page.frameLocator('iframe[name^="vfFrameId_"][height="100%"]');

        await frame.getByRole('button', { name: 'Add Products' }).click();
        console.log('🖱️ Add Products clicked');

        // Product catalog load hone ka wait
        await frame.locator('span#me:has-text("10KWHBATTERY")')
            .waitFor({ timeout: 30000 });
        console.log('✅ Product catalog loaded');
    }

    // ─────────────────────────────────────────────
    // Step 5: Product select karo
    // span#me ke andar 10KWHBATTERY text hai
    // ─────────────────────────────────────────────
    async selectProduct() {
       const frame = this.page.frameLocator('iframe[name^="vfFrameId_"][height="100%"]');

        // Product row ka checkbox
        const productCheckbox = frame
            .locator('sb-swipe-container')
            .filter({ has: frame.locator('span#me:has-text("10KWHBATTERY")') })
            .getByRole('checkbox');

        await productCheckbox.waitFor({ timeout: 20000 });
        await productCheckbox.click();
        console.log('✅ Product 10KWHBATTERY selected');

        // id="plSelect" — confirmed from inspect
        await frame.locator('paper-button#plSelect').click();
        console.log('🖱️ Select clicked — product added to QLE');

        // Line item appear hone ka wait
        await frame.locator('span#me:has-text("10KWHBATTERY")')
            .waitFor({ timeout: 30000 });
        console.log('✅ Product line appeared in QLE');
    }

    // ─────────────────────────────────────────────
    // Step 6: Calculate
    // notFirst wala pehla button = Calculate
    // notFirst + primary = Save
    // ─────────────────────────────────────────────
    async clickCalculate() {
        const frame = this.page.frameLocator('iframe[name^="vfFrameId_"][height="100%"]');

        await frame.getByRole('button', { name: 'Calculate' }).click();
        console.log('🧮 Calculate clicked');

        await frame.locator('.slds-spinner')
            .waitFor({ state: 'hidden', timeout: 30000 })
            .catch(() => console.log('ℹ️ Spinner nahi mila — calculation instant tha'));

        console.log('✅ Pricing calculated');
    }

    // ─────────────────────────────────────────────
    // Step 7: Save
    // primary class = blue Save button
    // ─────────────────────────────────────────────
   async saveQuoteLines() {
    const frame = this.page.frameLocator('iframe[name^="vfFrameId_"][height="100%"]');
    
    await frame.getByRole('button', { name: 'Save', exact: true }).click();
    console.log('💾 Save clicked');

    // networkidle hatao — Quote record page load hone ka wait karo
    await this.page.waitForURL('**/lightning/r/SBQQ__Quote__c/**', { timeout: 45000 });
    console.log('✅ Quote Lines saved successfully');
}
}

module.exports = { QLEPage };