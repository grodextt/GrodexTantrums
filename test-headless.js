import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  console.log("Navigating to Admin Overview...");
  await page.goto('http://127.0.0.1:5000/admin?tab=overview', { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log(e.message));
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Navigating to Chapter Reader...");
  await page.goto('https://grodextt.pages.dev/manga/isekai-de-cheat-skill-o-te-ni-shita-ore-wa-genjitsu-sekai-o-mo-musou-suru-level-up-wa-jinsei-o-kaeta/chapter/30', { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log(e.message));

  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
  console.log("Done.");
})();
