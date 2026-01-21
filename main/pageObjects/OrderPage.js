const { expect } = require('@playwright/test');

class OrderPage {
  constructor(page) {
    this.page = page;
  }

  async createOrder() {

    // Show more actions
    await this.page.getByRole('button', { name: 'Show more actions' }).click();
    await this.page.getByRole('button', { name: 'Create Order' }).click();

    // Save Order
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();

    // Wait for order page
    await this.page.waitForSelector('button[name="Activate"]', { timeout: 30000 });
  }

  async activateOrder() {
    await this.page.getByRole('tab', { name: 'Details' }).click();
    await this.page.getByRole('button', { name: 'Activate' }).click();
    await this.page.getByRole('dialog')
      .getByRole('button', { name: 'Activate' })
      .click();
  }
}

module.exports = { OrderPage };
