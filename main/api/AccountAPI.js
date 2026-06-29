const { faker } = require('@faker-js/faker');
const testData = require('../utilities/testData');

class AccountAPI {
    constructor(apiRequest) {
        this.apiRequest = apiRequest;
    }

    async createAccountViaAPI() {
        const street = faker.location.streetAddress();
        const city = faker.location.city();
        const state = faker.location.state();
        const zip = faker.location.zipCode();
        const country = 'India';
        const phone = `+91${faker.string.numeric(10)}`;

        const res = await this.apiRequest(
            'post',
            'sobjects/Account',
            {
                Name: `${testData.account.namePrefix}_${faker.number.int({ min: 1000, max: 9999 })}`,
                Phone: phone,
                BillingStreet: street,
                BillingCity: city,
                BillingState: state,
                BillingPostalCode: zip,
                BillingCountry: country,
                ShippingStreet: street,
                ShippingCity: city,
                ShippingState: state,
                ShippingPostalCode: zip,
                ShippingCountry: country
            }
        );

        return res.id;
    }
}

module.exports = { AccountAPI }; 