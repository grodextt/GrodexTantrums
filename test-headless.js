import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Error') || msg.text().includes('error')) {
      console.log('BROWSER LOG:', msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    const url = request.url();
    // Only show non-supabase failures (supabase 401s are expected when unauthenticated)
    if (!url.includes('supabase.co')) {
      console.log('REQUEST FAILED:', url, request.failure()?.errorText);
    }
  });

  const BASE = 'https://grodextt.pages.dev';

  console.log('\n--- Test 1: Homepage ---');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log(e.message));
  await new Promise(r => setTimeout(r, 1000));
  const title1 = await page.title();
  console.log('Title:', title1);

  console.log('\n--- Test 2: Admin Panel ---');
  await page.goto(`${BASE}/admin?tab=overview`, { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log(e.message));
  await new Promise(r => setTimeout(r, 2000));
  const url2 = page.url();
  const title2 = await page.title();
  console.log('Final URL:', url2, '| Title:', title2);

  console.log('\n--- Test 3: Chapter Reader ---');
  await page.goto(`${BASE}/manga/isekai-de-cheat-skill-o-te-ni-shita-ore-wa-genjitsu-sekai-o-mo-musou-suru-level-up-wa-jinsei-o-kaeta/chapter/30`, { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log(e.message));
  await new Promise(r => setTimeout(r, 2000));
  const url3 = page.url();
  const title3 = await page.title();
  console.log('Final URL:', url3, '| Title:', title3);

  await browser.close();
  console.log('\nDone.');
})();
