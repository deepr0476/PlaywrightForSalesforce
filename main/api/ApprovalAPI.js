class ApprovalAPI {
    constructor(apiRequest) {
        this.apiRequest = apiRequest;
    }

    async submitQuoteForApproval(quoteId) {
        const result = await this.apiRequest(
            'post',
            'process/approvals',
            {
                requests: [{
                    actionType: 'Submit',
                    contextId: quoteId,
                    comments: 'Submitting for approval via automation'
                }]
            }
        );

        console.log(`✅ Quote submitted for approval`);
        return result;
    }

    async getApprovalWorkitemId(quoteId, retries = 10, waitMs = 3000) {
        for (let i = 0; i < retries; i++) {
            const result = await this.apiRequest(
                'get',
                `query?q=SELECT+Id+FROM+ProcessInstanceWorkitem+WHERE+ProcessInstance.TargetObjectId='${quoteId}'+LIMIT+1`
            );

            if (result.records?.length > 0) {
                const workitemId = result.records[0].Id;
                console.log(`✅ Approval workitem found: ${workitemId}`);
                return workitemId;
            }

            console.log(`⏳ Waiting for workitem... attempt ${i + 1}/${retries}`);
            await new Promise(r => setTimeout(r, waitMs));
        }

        throw new Error('❌ Approval workitem not found after retries');
    }

    async approveQuote(workitemId) {
        await this.apiRequest(
            'post',
            'process/approvals',
            {
                requests: [{
                    actionType: 'Approve',
                    contextId: workitemId,
                    comments: 'Approved via automation'
                }]
            }
        );

        console.log(`✅ Quote approved!`);
    }
}

module.exports = { ApprovalAPI };