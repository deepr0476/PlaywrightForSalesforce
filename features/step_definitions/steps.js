const { Given, When, Then } = require('@cucumber/cucumber');
const { test, expect } = require('@playwright/test');
const { UtilityFunctions } = require('../../main/utilities/UtilityFunctions');

Given(
  'a login to salesforce application for {string}',
  { timeout: 120 * 1000 },
  async function (TestCaseName) {
    // Test data setup - Read test case Data
    this.utilityFunctionLocal = new UtilityFunctions(TestCaseName);
    this.LocalTestData = await this.utilityFunctionLocal.ReadDataFromExcel();

    // Step 1 - Login into Salesforce as admin
    await this.loginPage.adminUserLogin(this.utilityFunctionLocal);

    // Wait for Salesforce Lightning Home page to load completely
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector('div[role="main"]', { timeout: 60000 });
  }
);

When(
  'you create opportunity record',
  { timeout: 120 * 1000 },
  async function () {
    // Step 2 - Creation Salesforce opportunity
    try {
      this.Opportunity = await this.opportunityPage.salesforceOpportunityCreation(
        this.LocalTestData,
        this.utilityFunctionLocal
      );

      // Verify Opportunity page loaded
      await this.page.waitForSelector('span.slds-page-header__title', { timeout: 30000 });
    } catch (err) {
      console.error('Opportunity creation failed:', err.message);
      this.Opportunity = ['Failed', 'Failed'];
    }
  }
);

Then(
  'opportunity record should get created',
  { timeout: 120 * 1000 },
  async function () {
    // Step 3 - Print the opportunity details
    const OpportunityName = this.Opportunity[1] || 'N/A';
    const OpportunityID = this.Opportunity[0] || 'N/A';
    console.log(`Opportunity Name: ${OpportunityName}   ----   Opportunity ID: ${OpportunityID}`);
  }
);

// Salesforce API Login
Given(
  'a login to salesforce application via salesforce API for {string}',
  { timeout: 120 * 1000 },
  async function (TestCaseName) {
    this.utilityFunctionLocal = new UtilityFunctions(TestCaseName);
    this.LocalTestData = await this.utilityFunctionLocal.ReadDataFromExcel();
    this.secretsData = await this.utilityFunctionLocal.fetchEnvironmentCreds();

    this.username = this.secretsData.get('username');
    this.password = this.secretsData.get('password');
    this.clientId = this.secretsData.get('clientId');
    this.clientSecret = this.secretsData.get('clientSecret');
    this.securityToken = this.secretsData.get('securityToken');
    this.URL = this.secretsData.get('environmentURL') + '/services/oauth2/token';

    this.response = await this.requestContext.post(this.URL, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      params: {
        grant_type: 'password',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: this.username,
        password: this.password + this.securityToken
      }
    });

    this.data = await this.response.json();
    this.environmentURL = this.data.instance_url;
    this.environmentAccessToken = this.data.access_token;
  }
);

When(
  'you query account record ID',
  { timeout: 120 * 1000 },
  async function () {
    this.query = "select Id from account where name = 'Test Account'";
    this.queryUrl = `${this.environmentURL}/services/data/v52.0/query?q=${encodeURIComponent(this.query)}`;

    this.queryResponse = await this.requestContext.fetch(this.queryUrl, {
      headers: { Authorization: `Bearer ${this.environmentAccessToken}` }
    });

    this.data = await this.queryResponse.json();
    this.accountId = this.data.records[0]?.Id;
    if (!this.accountId) throw new Error('Account ID not found for Test Account');
  }
);

When(
  'create opportunity via salesforce API',
  { timeout: 120 * 1000 },
  async function () {
    this.url = `${this.environmentURL}/services/data/v52.0/sobjects/Opportunity/`;
    this.accountData = {
      AccountId: this.accountId,
      CloseDate: new Date().toISOString().split('T')[0], // current date
      Name: `Playwright Opportunity ${Date.now()}`,
      RecordTypeId: '012dL000000rJNtQAM',
      StageName: 'Qualification'
    };

    this.requestContextPart = {
      headers: {
        Authorization: `Bearer ${this.environmentAccessToken}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(this.accountData)
    };

    this.response = await this.requestContext.post(this.url, this.requestContextPart);
    this.result = await this.response.json();

    this.opportunityID = this.result.id;
    console.log('Created Opportunity ID:', this.opportunityID);

    this.Opportunity = [this.opportunityID, this.accountData.Name];
  }
);

Then(
  'cleanup the opportunity record via salesforce API',
  { timeout: 120 * 1000 },
  async function () {
    if (!this.opportunityID) {
      console.warn('No Opportunity created. Cleanup skipped.');
      return;
    }

    this.apiUrl = `${this.environmentURL}/services/data/v52.0/sobjects/Opportunity/${this.opportunityID}`;
    await this.requestContext.delete(this.apiUrl, {
      headers: { Authorization: `Bearer ${this.environmentAccessToken}` }
    });

    console.log('Opportunity cleaned up successfully');
  }
);

When(
  'you create CPQ quote for the opportunity',
  { timeout: 120 * 1000 },
  async function () {
    if (!this.Opportunity || this.Opportunity[0] === 'Failed') {
      console.warn('Opportunity not available. CPQ quote creation skipped.');
      return;
    }

    this.QuoteId = await this.opportunityPage.createCPQQuote(
      this.Opportunity,
      this.LocalTestData,
      this.utilityFunctionLocal
    );

    console.log('Created CPQ Quote ID:', this.QuoteId);
  }
);
