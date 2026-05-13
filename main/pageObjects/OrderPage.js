// main/pageObjects/OrderPage.js

class OrderPage {
    constructor(page, utilityFunctions) {
        this.page = page;
        this.utils = utilityFunctions;
    }

    async createOrderFromQuote(quoteId) {
        return await this.utils.createOrderFromQuote(quoteId);
    }

    async activateOrder(orderId) {
        return await this.utils.activateOrder(orderId);
    }
}

module.exports = { OrderPage };