const testData = require('../utilities/testData');

class QuoteAPI {
    constructor(apiRequest) {
        this.apiRequest = apiRequest;
    }

    async createQuoteViaAPI(opportunityId, accountId, contactId = null, data = null) {
        if (!opportunityId || !accountId) {
            throw new Error('opportunityId & accountId required');
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(startDate.getMonth() + testData.subscriptionTerm);

        const quoteData = {
            SBQQ__Opportunity2__c: opportunityId,
            SBQQ__Account__c: accountId,
            SBQQ__Primary__c: true,
            SBQQ__SubscriptionTerm__c: testData.subscriptionTerm,
            SBQQ__StartDate__c: startDate.toISOString().split('T')[0],
            SBQQ__EndDate__c: endDate.toISOString().split('T')[0],
            ...data
        };

        if (contactId) {
            quoteData.SBQQ__PrimaryContact__c = contactId;
        }

        const result = await this.apiRequest(
            'post',
            'sobjects/SBQQ__Quote__c/',
            quoteData
        );

        return result.id;
    }

    async setPricebookOnQuote(quoteId, pricebookName = testData.pricebook.name) {
        const encodedName = encodeURIComponent(pricebookName);
        const query = `SELECT+Id+FROM+Pricebook2+WHERE+Name='${encodedName}'+LIMIT+1`;

        const pbResult = await this.apiRequest('get', `query?q=${query}`);

        if (!pbResult.records?.length) {
            throw new Error(`❌ Pricebook not found: ${pricebookName}`);
        }

        const pricebookId = pbResult.records[0].Id;

        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__Quote__c/${quoteId}`,
            { SBQQ__PricebookId__c: pricebookId }
        );

        console.log(`✅ Pricebook set: ${pricebookName}`);
    }

    async setDiscountOnQuote(quoteId, discountPercent = testData.discount) {
        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__Quote__c/${quoteId}`,
            { SBQQ__CustomerDiscount__c: discountPercent }
        );

        console.log(`✅ Discount set: ${discountPercent}%`);
    }

    async setQuantityOnQuoteLine(quoteId, quantity = testData.product.quantity) {
        if (quantity <= 1) return;

        const result = await this.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+SBQQ__QuoteLine__c+WHERE+SBQQ__Quote__c='${quoteId}'+LIMIT+1`
        );

        if (!result.records?.length) {
            throw new Error('❌ Quote Line not found');
        }

        const quoteLineId = result.records[0].Id;

        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__QuoteLine__c/${quoteLineId}`,
            { SBQQ__Quantity__c: quantity }
        );

        console.log(`✅ Quantity set via API: ${quantity}`);
    }
}

module.exports = { QuoteAPI };