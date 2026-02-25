// main/pageObjects/ContactPage.js

class ContactPage {
    constructor(page, utilityFunctions) {
        this.page = page;
        this.utils = utilityFunctions;
    }

    // =========================
    // 👤 CREATE CONTACT (API or UI)
    // =========================
    async createContact(accountId, data = null, useAPI = true) {
        if (useAPI) {
            const contactId = await this.utils.createContactViaAPI(accountId, data);
            console.log(`✅ Contact created via API: ${contactId}`);
            return contactId;
        }

        // 🔻 UI fallback (future-safe, not used now)
        throw new Error('❌ UI Contact creation not implemented yet');
    }
}

module.exports = { ContactPage };
