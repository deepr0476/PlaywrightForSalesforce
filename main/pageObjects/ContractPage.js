// main/pageObjects/ContractPage.js

class ContractPage {
    constructor(page, utilityFunctions) {
        this.page = page;
        this.utils = utilityFunctions;
    }

    async createContractFromOrder(orderId) {
        return await this.utils.createContractFromOrder(orderId);
    }
}

module.exports = { ContractPage };