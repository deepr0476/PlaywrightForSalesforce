const { faker } = require('@faker-js/faker');
const testData = require('../utilities/testData');

class ContactAPI {
    constructor(apiRequest) {
        this.apiRequest = apiRequest;
    }

    async createContactViaAPI(accountId, data = {}) {
        if (!accountId) throw new Error('accountId required');

        const account = await this.apiRequest(
            'get',
            `sobjects/Account/${accountId}?fields=BillingStreet,BillingCity,BillingState,BillingPostalCode,BillingCountry,Phone`
        );

        const contactData = {
            Salutation: testData.contact.salutation,
            LastName: faker.person.lastName(),
            Email: faker.internet.email(),
            Phone: account.Phone,
            MailingStreet: account.BillingStreet,
            MailingCity: account.BillingCity,
            MailingState: account.BillingState,
            MailingPostalCode: account.BillingPostalCode,
            MailingCountry: account.BillingCountry,
            ...data,
            AccountId: accountId
        };

        const res = await this.apiRequest('post', 'sobjects/Contact', contactData);
        return res.id;
    }
}

module.exports = { ContactAPI };