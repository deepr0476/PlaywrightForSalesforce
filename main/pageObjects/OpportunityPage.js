class OpportunityPage {
    constructor(page, utilityFunctions) {
        this.page = page;
        this.utils = utilityFunctions;
    }

    // =========================
    // 🔹 CREATE OPPORTUNITY (API or UI)
    // =========================
    /**
     * @param {Object} data - optional opp data
     * @param {Boolean} useAPI
     * @param {String} accountId (required for API)
     */
    async createOpportunity(data = null, useAPI = true, accountId = null) {

        // =========================
        // API FLOW (PRIMARY)
        // =========================
        if (useAPI) {
            if (!accountId) {
                throw new Error('❌ accountId is mandatory for Opportunity API creation');
            }

            // 👉 DATA generation handled INSIDE UtilityFunctions
            const oppId = await this.utils.createOpportunityViaAPI(accountId, data);

            console.log(`✅ Opportunity created via API: ${oppId}`);
            return oppId;
        }

        // =========================
        // UI FLOW (FUTURE / FALLBACK)
        // =========================
        // NOTE: UI flow still needs data, so here we can generate safely
        const oppData = data || await this.utils.generateRandomOpportunityData();

        await this.page.goto(
            `${this.utils.instanceUrl}/lightning/o/Opportunity/list?filterName=Recent`
        );

        await this.page.click('button[title="New"]');

        await this.page.fill('input[name="Name"]', oppData.Name);
        await this.page.selectOption('select[name="StageName"]', oppData.StageName);
        await this.page.fill('input[name="CloseDate"]', oppData.CloseDate);
        await this.page.fill('input[name="Amount"]', oppData.Amount.toString());

        await this.page.click('button[title="Save"]');

        console.log(`✅ Opportunity created via UI: ${oppData.Name}`);
        return oppData.Name;
    }
}

module.exports = { OpportunityPage };
