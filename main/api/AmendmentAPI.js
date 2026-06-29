// main/api/AmendmentAPI.js
const testData = require('../utilities/testData');

class AmendmentAPI {
    constructor(apiRequest) {
        this.apiRequest = apiRequest;
    }

    async updateAmendmentQuoteLineQuantity(quoteId, quantity) {
        const result = await this.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+SBQQ__QuoteLine__c+WHERE+SBQQ__Quote__c='${quoteId}'+LIMIT+1`
        );

        if (!result.records?.length) {
            throw new Error('❌ Amendment Quote Line not found');
        }

        const quoteLineId = result.records[0].Id;

        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__QuoteLine__c/${quoteLineId}`,
            { SBQQ__Quantity__c: quantity }
        );

        console.log(`✅ Amendment Quote Line quantity updated → ${quantity}`);
    }

    async updateAmendmentQuoteLineQuantityAndStartDate(quoteId, quantity, startDate) {
        const result = await this.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+SBQQ__QuoteLine__c+WHERE+SBQQ__Quote__c='${quoteId}'+LIMIT+1`
        );

        if (!result.records?.length) {
            throw new Error('❌ Amendment Quote Line not found');
        }

        const quoteLineId = result.records[0].Id;

        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__QuoteLine__c/${quoteLineId}`,
            {
                SBQQ__Quantity__c: quantity,
                SBQQ__StartDate__c: startDate
            }
        );

        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__Quote__c/${quoteId}`,
            { SBQQ__StartDate__c: startDate }
        );

        console.log(`✅ Amendment Quote Line updated → Qty: ${quantity}, Start Date: ${startDate}`);
        console.log(`✅ Amendment Quote Start Date also updated → ${startDate}`);
    }

    async prepareAmendmentForOrdering(quoteId, startDate, pricebookName = testData.pricebook.name) {
        const pbResult = await this.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+Pricebook2+WHERE+Name='${encodeURIComponent(pricebookName)}'+LIMIT+1`
        );

        if (!pbResult.records?.length) {
            throw new Error(`❌ Pricebook not found: ${pricebookName}`);
        }

        const pricebookId = pbResult.records[0].Id;
        console.log(`🔍 Pricebook found: ${pricebookId}`);

        const lineResult = await this.apiRequest(
            'get',
            `query?q=SELECT+Id,SBQQ__Product__c+FROM+SBQQ__QuoteLine__c+WHERE+SBQQ__Quote__c='${quoteId}'+LIMIT+1`
        );

        if (!lineResult.records?.length) {
            throw new Error('❌ Amendment Quote Line not found');
        }

        const quoteLineId = lineResult.records[0].Id;
        const productId = lineResult.records[0].SBQQ__Product__c;
        console.log(`🔍 Quote Line: ${quoteLineId} | Product: ${productId}`);

        const pbeResult = await this.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+PricebookEntry+WHERE+Product2Id='${productId}'+AND+Pricebook2Id='${pricebookId}'+AND+IsActive=true+LIMIT+1`
        );

        if (!pbeResult.records?.length) {
            throw new Error(`❌ PricebookEntry not found for Product: ${productId}`);
        }

        const pricebookEntryId = pbeResult.records[0].Id;
        console.log(`🔍 PricebookEntry found: ${pricebookEntryId}`);

        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__QuoteLine__c/${quoteLineId}`,
            {
                SBQQ__PricebookEntryId__c: pricebookEntryId,
                SBQQ__StartDate__c: startDate
            }
        );
        console.log(`✅ PricebookEntryId + StartDate patched on Quote Line`);

        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__Quote__c/${quoteId}`,
            {
                SBQQ__PricebookId__c: pricebookId,
                SBQQ__StartDate__c: startDate
            }
        );
        console.log(`✅ Pricebook2Id + StartDate patched on Amendment Quote`);

        await this.apiRequest(
            'patch',
            `sobjects/SBQQ__Quote__c/${quoteId}`,
            { SBQQ__Ordered__c: true }
        );
        console.log(`✅ Amendment Quote marked as Ordered`);

        await new Promise(r => setTimeout(r, 8000));

        const orderResult = await this.apiRequest(
            'get',
            `query?q=SELECT+Id,OrderNumber+FROM+Order+WHERE+SBQQ__Quote__c='${quoteId}'+LIMIT+1`
        );

        if (!orderResult.records?.length) {
            throw new Error('❌ Amended Order not found after Ordered = true');
        }

        const orderId = orderResult.records[0].Id;
        console.log(`✅ Amended Order → ID: ${orderId} | Number: ${orderResult.records[0].OrderNumber}`);

        await this.apiRequest(
            'patch',
            `sobjects/Order/${orderId}`,
            {
                Pricebook2Id: pricebookId,
                EffectiveDate: startDate
            }
        );
        console.log(`✅ Pricebook2Id + EffectiveDate patched on Amended Order`);

        return orderId;
    }
}

module.exports = { AmendmentAPI };