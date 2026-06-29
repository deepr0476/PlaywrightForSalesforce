const axios = require('axios');

class ApiClient {
    constructor(jwtAuth) {
        this.jwtAuth = jwtAuth;
    }

    async apiRequest(method, endpoint, data = null) {
        const { accessToken, instanceUrl } = await this.jwtAuth.getAccessToken();

        try {
            const res = await axios({
                method,
                url: `${instanceUrl}/services/data/v57.0/${endpoint}`,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                data
            });

            return res.data;
        } catch (err) {
            console.error('❌ API Request Failed:', err.response?.data || err.message);
            throw err;
        }
    }
}

module.exports = { ApiClient };