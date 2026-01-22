const { expect } = require('@playwright/test');

class QLEPage {
  constructor(page) {
    this.page = page;
  }

  async openQLEFromQuote() {
    await this.page.getByRole('button', { name: 'Edit Lines' }).click();
  }

  async addProductAndCalculate() {
  
    // ⚠️ CPQ iframe 
    const qleFrame = this.page.frameLocator('iframe[name^="vfFrameId_"]');

    // Pricebook dialog (first time only)
    const priceBookSaveBtn = qleFrame.locator('#pricebookDialog')
      .getByRole('button', { name: 'Save' });

    if (await priceBookSaveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await priceBookSaveBtn.click();
    }

    // Add Products
    await qleFrame.getByRole('button', { name: 'Add Products' }).click();

    // Select Product (from your codegen)
    await qleFrame
      .locator('sb-swipe-container')
      .filter({ hasText: '10KWHBATTERY 10kWh Battery' })
      .getByRole('checkbox')
      .click();

    await qleFrame.getByRole('button', { name: 'Select', exact: true }).click();

    // Calculate
    await qleFrame.getByRole('button', { name: 'Calculate' }).click();

    // Save Quote Lines
    await qleFrame.getByRole('button', { name: 'Save', exact: true }).click();
  }
}

module.exports = { QLEPage };

