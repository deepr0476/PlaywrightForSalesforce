class ContractAPI {
    constructor(apiRequest) {
        this.apiRequest = apiRequest;
    }

    async createContractFromOrder(orderId) {
        await this.apiRequest(
            'patch',
            `sobjects/Order/${orderId}`,
            { SBQQ__Contracted__c: true }
        );

        console.log(`✅ Contract generation triggered`);

        await new Promise(r => setTimeout(r, 5000));

        const result = await this.apiRequest(
            'get',
            `query?q=SELECT+Id,ContractNumber+FROM+Contract+WHERE+SBQQ__Order__c='${orderId}'+LIMIT+1`
        );

        if (!result.records?.length) {
            console.log(`ℹ️ Contract not generated yet`);
            return null;
        }

        const contractId = result.records[0].Id;

        console.log(
            `✅ Contract → ID: ${contractId} | Number: ${result.records[0].ContractNumber}`
        );

        return contractId;
    }
}

module.exports = { ContractAPI };