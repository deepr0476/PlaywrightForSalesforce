require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');

class JwtAuth {
    constructor() {
        this.accessToken = null;
        this.instanceUrl = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return {
                accessToken: this.accessToken,
                instanceUrl: this.instanceUrl
            };
        }

        const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8');

        const jwtToken = jwt.sign(
            {
                iss: process.env.SF_CLIENT_ID,
                sub: process.env.SF_USERNAME,
                aud: process.env.SF_LOGIN_URL
            },
            privateKey,
            { algorithm: 'RS256', expiresIn: '3m' }
        );

        const res = await axios.post(
            `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
            null,
            {
                params: {
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: jwtToken
                }
            }
        );

        this.accessToken = res.data.access_token;
        this.instanceUrl = res.data.instance_url;
        this.tokenExpiry = new Date(Date.now() + 2 * 60 * 1000);

        return {
            accessToken: this.accessToken,
            instanceUrl: this.instanceUrl
        };
    }
}

module.exports = { JwtAuth };