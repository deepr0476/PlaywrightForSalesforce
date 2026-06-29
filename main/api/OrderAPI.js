class OrderAPI {
    constructor(apiRequest) {
        this.apiRequest = apiRequest;
    }

    async createOrderFromQuote(quoteId) {
        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__Quote__c/${quoteId}`,
            { SBQQ__Ordered__c: true }
        );

        console.log(`✅ Quote marked as Ordered`);

        await new Promise(r => setTimeout(r, 3000));

        const result = await this.apiRequest(
            'get',
            `query?q=SELECT+Id,OrderNumber+FROM+Order+WHERE+SBQQ__Quote__c='${quoteId}'+LIMIT+1`
        );

        if (!result.records?.length) {
            throw new Error('❌ Order not found');
        }

        const orderId = result.records[0].Id;

        console.log(
            `✅ Order created → ID: ${orderId} | Number: ${result.records[0].OrderNumber}`
        );

        return orderId;
    }

    async activateOrder(orderId) {
        await this.apiRequest(
            'patch',
            `sobjects/Order/${orderId}`,
            { Status: 'Activated' }
        );

        console.log(`✅ Order activated!`);
    }
}

module.exports = { OrderAPI };