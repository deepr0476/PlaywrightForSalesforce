// main/pageObjects/QuotePage.js

class QuotePage {
    constructor(page, utilityFunctions) {
        this.page = page;
        this.utils = utilityFunctions;
    }

    async createQuote(opportunityId, accountId, contactId = null) {
        if (!opportunityId || !accountId) {
            throw new Error('❌ opportunityId & accountId required');
        }
        const quoteId = await this.utils.createQuoteViaAPI(
            opportunityId,
            accountId,
            contactId
        );
        console.log(`✅ Quote created via API: ${quoteId}`);
        return quoteId;
    }
}

module.exports = { QuotePage };