// main/utilities/testData.js

module.exports = {
    product: {
        code: process.env.PRODUCT_CODE || '10KWHBATTERY'
    },
    discount: parseFloat(process.env.DISCOUNT_PERCENT) || 20,
    approvalThreshold: parseFloat(process.env.APPROVAL_THRESHOLD) || 20,
    subscriptionTerm: parseInt(process.env.SUBSCRIPTION_TERM) || 12,
    pricebook: {
        name: process.env.PRICEBOOK_NAME || 'Standard Price Book'
    },
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