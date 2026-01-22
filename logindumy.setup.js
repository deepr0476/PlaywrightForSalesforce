const { chromium } = require('@playwright/test');
require('dotenv').config();

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const sid = encodeURIComponent(process.env.SF_ACCESS_TOKEN);
  const retURL = encodeURIComponent('/lightning/page/home');

  const frontdoorUrl =
    `${process.env.SALESFORCE_INSTANCE}/secur/frontdoor.jsp` +
    `?sid=${sid}&retURL=${retURL}`;

  console.log('Frontdoor URL:', frontdoorUrl);

  await page.goto(frontdoorUrl, { waitUntil: 'domcontentloaded' });

  // URL wait mat karo, Lightning thoda drama karta hai
  await page.waitForTimeout(5000);

  console.log('Current URL:', page.url());
})();
 