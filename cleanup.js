const { UtilityFunctions } = require('./main/utilities/UtilityFunctions');

async function cleanup() {
    const utils = new UtilityFunctions('CLEANUP_JOB');

    console.log('🧹 Starting SAFE Salesforce cleanup...');

    try {

        // =========================
        // 1. QUOTES (CPQ)
        // =========================
        console.log('🔍 Fetching Quotes...');
        const quotes = await utils.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+SBQQ__Quote__c`
        );

        if (quotes.records?.length) {
            console.log(`🗑️ Deleting ${quotes.records.length} Quotes...`);

            for (const rec of quotes.records) {
                try {
                    await utils.apiRequest('delete', `sobjects/SBQQ__Quote__c/${rec.Id}`);
                    console.log(`✅ Deleted Quote: ${rec.Id}`);
                } catch (e) {
                    console.log(`❌ Failed Quote: ${rec.Id}`);
                }
            }
        }

        // =========================
        // 2. OPPORTUNITIES
        // =========================
        console.log('🔍 Fetching Opportunities...');
        const opps = await utils.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+Opportunity`
        );

        if (opps.records?.length) {
            console.log(`🗑️ Deleting ${opps.records.length} Opportunities...`);

            for (const rec of opps.records) {
                try {
                    await utils.apiRequest('delete', `sobjects/Opportunity/${rec.Id}`);
                    console.log(`✅ Deleted Opp: ${rec.Id}`);
                } catch (e) {
                    console.log(`❌ Failed Opp: ${rec.Id}`);
                }
            }
        }

        // =========================
        // 3. CONTACTS
        // =========================
        console.log('🔍 Fetching Contacts...');
        const contacts = await utils.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+Contact`
        );

        if (contacts.records?.length) {
            console.log(`🗑️ Deleting ${contacts.records.length} Contacts...`);

            for (const rec of contacts.records) {
                try {
                    await utils.apiRequest('delete', `sobjects/Contact/${rec.Id}`);
                    console.log(`✅ Deleted Contact: ${rec.Id}`);
                } catch (e) {
                    console.log(`❌ Failed Contact: ${rec.Id}`);
                }
            }
        }

        // =========================
        // 4. ACCOUNTS
        // =========================
        console.log('🔍 Fetching Accounts...');
        const accounts = await utils.apiRequest(
            'get',
            `query?q=SELECT+Id+FROM+Account`
        );

        if (accounts.records?.length) {
            console.log(`🗑️ Deleting ${accounts.records.length} Accounts...`);

            for (const rec of accounts.records) {
                try {
                    await utils.apiRequest('delete', `sobjects/Account/${rec.Id}`);
                    console.log(`✅ Deleted Account: ${rec.Id}`);
                } catch (e) {
                    console.log(`❌ Failed Account: ${rec.Id}`);
                }
            }
        }

        // =========================
        // 5. ORDER + CONTRACT (SAFE MODE)
        // =========================
        console.log('⚠️ Skipping Orders & Contracts (Salesforce locked records)');
        console.log('👉 Recommendation: Do NOT delete Activated Orders/Contracts');

        console.log('🎉 CLEANUP COMPLETED SUCCESSFULLY (SAFE MODE)');

    } catch (err) {
        console.error('❌ Cleanup failed:', err.message || err);
    }
}

cleanup();