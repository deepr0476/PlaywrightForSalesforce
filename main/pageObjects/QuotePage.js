// main/pageObjects/QuotePage.js

class QuotePage {
    constructor(page, utilityFunctions) {
        this.page = page;
        this.utils = utilityFunctions;
    }

    /**
     * Create Quote via API
     * @param {String} opportunityId
     */
    async createQuote(opportunityId) {
        if (!opportunityId) {
            throw new Error('❌ opportunityId is mandatory for Quote creation');
        }

        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(today.getMonth() + 12);

        const quoteData = {
            Name: `Auto Quote ${Date.now()}`,
            SBQQ__Opportunity2__c: opportunityId,
            SBQQ__StartDate__c: today.toISOString().split('T')[0],
            SBQQ__EndDate__c: endDate.toISOString().split('T')[0],
            SBQQ__Primary__c: true,
            SBQQ__SubscriptionTerm__c: 12
        };
 
        const quoteId = await this.utils.apiRequest(
            'POST',
            'sobjects/SBQQ__Quote__c',
            quoteData
        );

        console.log(`✅ Quote created via API: ${quoteId}`);
        return quoteId;
    }
}

module.exports = { QuotePage };
