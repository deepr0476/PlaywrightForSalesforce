const { faker } = require('@faker-js/faker');
const testData = require('../utilities/testData');

class OpportunityAPI {
    constructor(apiRequest) {
        this.apiRequest = apiRequest;
    }

    async createOpportunityViaAPI(accountId) {
        const res = await this.apiRequest(
            'post',
            'sobjects/Opportunity',
            {
                Name: `Opp_${faker.number.int({ min: 1000, max: 9999 })}`,
                StageName: testData.opportunity.stage,
                CloseDate: new Date().toISOString().split('T')[0],
                AccountId: accountId
            }
        );

        return res.id;
    }

    async closeOpportunityAsWon(opportunityId) {
        await this.apiRequest(
            'patch',
            `sobjects/Opportunity/${opportunityId}`,
            {
                StageName: 'Closed Won',
                CloseDate: new Date().toISOString().split('T')[0]
            }
        );

        console.log(`✅ Opportunity marked as Closed Won`);
    }
}

module.exports = { OpportunityAPI };