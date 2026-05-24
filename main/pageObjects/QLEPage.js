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
        const editLinesBtn = this.page.locator('button.slds-button:has-text("Edit Lines")');

        await editLinesBtn.waitFor({ timeout: 20000 });
        await editLinesBtn.click();

        console.log('🖱️ Edit Lines clicked');

        await this.page.waitForSelector(
            'iframe[name^="vfFrameId_"][height="100%"]',
            { timeout: 30000 }
        );

        console.log('✅ QLE iframe detected');
    }

    async handlePricebookDialog() {
        await this.forceClosePricebookPopup();

        const frame = this.page.frameLocator(
            'iframe[name^="vfFrameId_"][height="100%"]'
        );

        await frame
            .getByRole('button', { name: 'Add Products' })
            .waitFor({ timeout: 60000 });

        console.log('✅ QLE fully loaded');
    }

    async forceClosePricebookPopup() {
        await this.page.waitForTimeout(3000);

        const sbFrame = this.page.frames().find(f => f.url().includes('/apex/sb?'));

        if (!sbFrame) {
            console.log('ℹ️ QLE frame not found while checking pricebook popup');
            return;
        }

        for (let i = 1; i <= 5; i++) {
            const result = await sbFrame.evaluate(() => {
                function deepFindAll(root, selector, results = []) {
                    if (!root) return results;

                    results.push(...root.querySelectorAll(selector));

                    for (const node of root.querySelectorAll('*')) {
                        if (node.shadowRoot) {
                            deepFindAll(node.shadowRoot, selector, results);
                        }
                    }

                    return results;
                }

                const dialogs = deepFindAll(document, 'sb-pricebook-dialog');

                const visibleDialog = dialogs.find(dialog => {
                    const rect = dialog.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                });

                if (!visibleDialog) {
                    return 'no-visible-pricebook-dialog';
                }

                const buttons = deepFindAll(document, 'paper-button, button');

                const saveBtn = buttons.find(btn => {
                    const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
                    return text === 'save';
                });

                if (!saveBtn) {
                    return 'save-button-not-found';
                }

                saveBtn.click();
                saveBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true }));
                saveBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true, cancelable: true }));
                saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));

                return 'pricebook-save-clicked';
            });

            console.log(`🔍 Force pricebook result attempt ${i}: ${result}`);

            await this.page.waitForTimeout(4000);

            if (result === 'no-visible-pricebook-dialog') {
                break;
            }
        }
    }

    async clickAddProducts(productCode = product.code) {
        const frame = this.page.frameLocator(
            'iframe[name^="vfFrameId_"][height="100%"]'
        );

        await this.forceClosePricebookPopup();

        await frame.getByRole('button', { name: 'Add Products' }).click();

        console.log('🖱️ Add Products clicked');

        await frame
            .locator(`span#me:has-text("${productCode}")`)
            .waitFor({ timeout: 30000 });

        console.log(`✅ Product catalog loaded — looking for: ${productCode}`);
    }

    async selectProduct(productCode = product.code) {
        const frame = this.page.frameLocator(
            'iframe[name^="vfFrameId_"][height="100%"]'
        );

        const productCheckbox = frame
            .locator('sb-swipe-container')
            .filter({
                has: frame.locator(`span#me:has-text("${productCode}")`)
            })
            .getByRole('checkbox');

        await productCheckbox.waitFor({ timeout: 20000 });
        await productCheckbox.click();

        console.log(`✅ Product ${productCode} selected`);

        await frame.locator('paper-button#plSelect').click();

        console.log('🖱️ Select clicked — product added to QLE');

        await frame
            .locator(`span#me:has-text("${productCode}")`)
            .waitFor({ timeout: 30000 });

        console.log('✅ Product line appeared in QLE');
    }

    async clickCalculate() {
        const frame = this.page.frameLocator(
            'iframe[name^="vfFrameId_"][height="100%"]'
        );

        const calcBtn = frame.getByRole('button', { name: 'Calculate' });

        await calcBtn.waitFor({ timeout: 30000 });
        await calcBtn.click({ force: true });

        console.log('🧮 Calculate clicked');

        await this.page.waitForTimeout(5000);

        console.log('✅ Pricing calculated');
    }

    async saveQuoteLines() {
        const frame = this.page.frameLocator(
            'iframe[name^="vfFrameId_"][height="100%"]'
        );

        const saveBtn = frame.getByRole('button', {
            name: 'Save',
            exact: true
        });

        await saveBtn.waitFor({ timeout: 30000 });
        await saveBtn.click({ force: true });

        console.log('💾 Save clicked');

        await this.page.waitForURL(
            '**/lightning/r/SBQQ__Quote__c/**',
            { timeout: 60000 }
        );

        console.log('✅ Redirected to Quote record page');

        await this.page.waitForTimeout(5000);

        console.log('✅ Quote Lines saved successfully');
    }
}

module.exports = { QLEPage };