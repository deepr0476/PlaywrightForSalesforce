// main/utilities/testData.js

module.exports = {
    product: {
        code: process.env.PRODUCT_CODE || '10KWHBATTERY'
    },
    discount: parseInt(process.env.DISCOUNT_PERCENT) || 20,
    subscriptionTerm: 12,
    account: {
        namePrefix: 'Account'
    },
    contact: {
        salutation: 'Mr.'
    },
    opportunity: {
        stage: 'Prospecting'
    }
};