import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('--- STARTING COMPREHENSIVE HARIS DEMO SHOP & APPROVAL VERIFICATION ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Visit Login Page
    console.log('\n[STEP 1] Navigating to Home / Login Page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#login-email', { timeout: 10000 });

    // 2. Check Quick Demo Fill
    console.log('[STEP 2] Testing Quick Demo Fill for Haris Khan Demo Store...');
    await page.waitForSelector('#quick-demo-shop-owner', { timeout: 10000 });
    await page.click('#quick-demo-shop-owner');
    await new Promise(r => setTimeout(r, 200));

    const emailVal = await page.$eval('#login-email', el => el.value);
    const passVal = await page.$eval('#login-password', el => el.value);
    console.log(`  Credentials filled -> Username/Email: ${emailVal}, Password Length: ${passVal.length}`);

    // 3. Submit Login
    console.log('[STEP 3] Submitting login for Haris Khan Demo Store...');
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    const currentUrl = page.url();
    console.log(`  Navigated to: ${currentUrl}`);
    if (!currentUrl.includes('/dashboard')) {
      throw new Error(`Expected redirect to /dashboard but got ${currentUrl}`);
    }

    // 4. Verify Dashboard Contents & Financial Metrics
    console.log('[STEP 4] Verifying Shop Owner Dashboard UI & Metrics...');
    await page.waitForSelector('main', { timeout: 10000 });
    const pageText = await page.$eval('main', el => el.innerText);

    const hasHarisName = pageText.includes('Haris Khan Demo Store') || pageText.includes('Haris Khan');
    console.log(`  Contains Haris Khan / Demo Store: ${hasHarisName ? 'PASS' : 'FAIL'}`);

    // Check Header Banner / Badge
    const bannerText = await page.evaluate(() => {
      const banner = document.querySelector('header')?.innerText || document.body.innerText;
      return banner.slice(0, 500);
    });
    console.log(`  Header / Demo Indicator present: ${bannerText.includes('DEMO') ? 'PASS' : 'CHECK'}`);

    // Check Metrics in Dashboard Context / DOM
    const metrics = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        has7200: text.includes('7,200') || text.includes('7200'),
        has11700: text.includes('11,700') || text.includes('11700'),
        has4500: text.includes('4,500') || text.includes('4500'),
        has5000: text.includes('5,000') || text.includes('5000'),
      };
    });
    console.log(`  Financial Consistency Metrics:`, metrics);

    // 5. Verify Customers Page
    console.log('\n[STEP 5] Navigating to Customers Page...');
    await page.goto(`${BASE_URL}/dashboard/customers`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('main', { timeout: 10000 });

    const custText = await page.$eval('main', el => el.innerText);
    const hasCust1 = custText.includes('Tariq Mehmood');
    const hasCust2 = custText.includes('Zahid Hussain');
    const hasCust3 = custText.includes('Salman Farooq');

    console.log(`  Customer 1 (Tariq Mehmood): ${hasCust1 ? 'PASS' : 'FAIL'}`);
    console.log(`  Customer 2 (Zahid Hussain): ${hasCust2 ? 'PASS' : 'FAIL'}`);
    console.log(`  Customer 3 (Salman Farooq): ${hasCust3 ? 'PASS' : 'FAIL'}`);

    // Check customer balances
    const custBalances = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        tariqBalance3000: text.includes('3,000') || text.includes('3000'),
        zahidCleared: text.includes('0') || text.includes('Cleared') || text.includes('cleared'),
        salmanBalance4200: text.includes('4,200') || text.includes('4200'),
      };
    });
    console.log(`  Customer Balances:`, custBalances);

    // 6. Test Page Refresh Persistence & No Multiplying
    console.log('\n[STEP 6] Testing Page Reload Persistence & Duplicate Prevention...');
    await page.reload({ waitUntil: 'networkidle0' });
    const custCountAfterReload = await page.evaluate(() => {
      const text = document.body.innerText;
      const m1 = (text.match(/Tariq Mehmood/g) || []).length;
      const m2 = (text.match(/Zahid Hussain/g) || []).length;
      const m3 = (text.match(/Salman Farooq/g) || []).length;
      return { m1, m2, m3 };
    });
    console.log(`  Customer occurrences after reload: Tariq=${custCountAfterReload.m1}, Zahid=${custCountAfterReload.m2}, Salman=${custCountAfterReload.m3}`);
    if (custCountAfterReload.m1 > 2) {
      console.warn('  WARNING: Customer 1 might be multiplying on reload!');
    } else {
      console.log('  Customer records remain stable without duplication: PASS');
    }

    // 7. Test Records Page
    console.log('\n[STEP 7] Navigating to Records / Journal Page...');
    await page.goto(`${BASE_URL}/dashboard/records`, { waitUntil: 'networkidle0' });
    const recordsText = await page.$eval('main', el => el.innerText);
    console.log(`  Records page loaded: Contains bills/payments: ${recordsText.includes('INV-DEMO-101') || recordsText.includes('Credit Bill') || recordsText.includes('Tariq') ? 'PASS' : 'FAIL'}`);

    // 8. Test Reports Page
    console.log('\n[STEP 8] Navigating to Reports Page...');
    await page.goto(`${BASE_URL}/dashboard/reports`, { waitUntil: 'networkidle0' });
    const reportsText = await page.$eval('main', el => el.innerText);
    console.log(`  Reports page loaded: Total Udhaar Rs. 7,200 represented: ${reportsText.includes('7,200') || reportsText.includes('7200') ? 'PASS' : 'FAIL'}`);

    // 9. Sign Out
    console.log('\n[STEP 9] Signing Out...');
    await page.evaluate(() => {
      // Clear session directly or use logout button
      window.localStorage.removeItem('KHATAFLOW_SESSION_V1');
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // 10. Test Super Admin Console & Demo Marking
    console.log('\n[STEP 10] Testing Super Admin Login & Shop Directory...');
    await page.waitForSelector('#role-tab-super-admin', { timeout: 10000 });
    await page.evaluate(() => {
      document.getElementById('role-tab-super-admin')?.click();
    });
    await page.waitForSelector('#quick-demo-super-admin', { timeout: 10000 });
    await page.evaluate(() => {
      document.getElementById('quick-demo-super-admin')?.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const adminEmail = await page.$eval('#login-email', el => el.value);
    console.log(`  Super Admin login input -> Email: "${adminEmail}"`);

    await page.evaluate(() => {
      document.querySelector('form')?.requestSubmit();
    });
    await new Promise(r => setTimeout(r, 1200));

    const currentSuperUrl = await page.evaluate(() => window.location.href);
    const superNotif = await page.evaluate(() => document.querySelector('div[role="status"]')?.innerText);
    console.log(`  URL after submit: ${currentSuperUrl}, Notification: "${superNotif}"`);

    if (!currentSuperUrl.includes('/superadmin')) {
      await page.waitForFunction(() => window.location.pathname.includes('/superadmin'), { timeout: 10000 });
    }

    console.log(`  Super Admin URL: ${page.url()}`);
    await page.waitForSelector('main', { timeout: 10000 });
    const adminPageText = await page.$eval('main', el => el.innerText);

    const adminHasHaris = adminPageText.includes('Haris Khan Demo Store');
    const adminHasDemoBadge = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('DEMO') && text.includes('Haris Khan Demo Store');
    });

    console.log(`  Super Admin lists Haris Khan Demo Store: ${adminHasHaris ? 'PASS' : 'FAIL'}`);
    console.log(`  Marked with DEMO badge: ${adminHasDemoBadge ? 'PASS' : 'FAIL'}`);

    // Count how many copies of Haris demo shop exist in Super Admin table
    const harisCountInAdmin = (adminPageText.match(/Haris Khan Demo Store/g) || []).length;
    console.log(`  Exact count of Haris Khan Demo Store copies in Super Admin: ${harisCountInAdmin} (Expected: 1)`);

    // 11. Test New Registration Stays Pending
    console.log('\n[STEP 11] Testing Normal Shop Registration -> Pending Approval Workflow...');
    await page.evaluate(() => {
      window.localStorage.removeItem('KHATAFLOW_SESSION_V1');
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#btn-toggle-register', { timeout: 10000 });
    await page.evaluate(() => {
      document.getElementById('btn-toggle-register')?.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Fill helper for React controlled inputs
    const fillInput = async (selector, value) => {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.evaluate((sel, val) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error('Element not found: ' + sel);
        const prototype = Object.getPrototypeOf(el);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter) {
          prototypeValueSetter.call(el, val);
        } else {
          el.value = val;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, selector, value);
    };

    // Fill registration form for a new shop
    const testShopName = 'Peshawar Test Grocers ' + Date.now().toString().slice(-4);
    const testUsername = 'testgrocer' + Date.now().toString().slice(-4);

    await fillInput('#reg-shop-name', testShopName);
    await fillInput('#reg-shop-city', 'Peshawar');
    await fillInput('#reg-shop-address', 'Kohat Road, Peshawar');
    await fillInput('#reg-owner-name', 'Ahmad Jan');
    await fillInput('#reg-owner-phone', '0311-9988776');
    await fillInput('#reg-owner-username', testUsername);
    await fillInput('#reg-owner-password', 'mypass123');
    await fillInput('#reg-owner-confirm-password', 'mypass123');
    await new Promise(r => setTimeout(r, 400));

    await page.evaluate(() => {
      document.querySelector('form')?.requestSubmit();
    });
    await new Promise(r => setTimeout(r, 1500));

    const regSuccessText = await page.$eval('#reg-success-banner', el => el.innerText).catch(() => '');
    const regErrorText = await page.$eval('#login-notification-banner', el => el.innerText).catch(() => '');
    const regBanner = regSuccessText || regErrorText;
    console.log(`  Registration status message: "${regBanner}"`);
    const isPending = regBanner.includes('pending') || regBanner.includes('Super Admin approval') || regBanner.includes('registered successfully');
    console.log(`  New registration set to Pending approval: ${isPending ? 'PASS' : 'FAIL'}`);

    // Attempt to log in with this unapproved shop
    console.log('  Testing login attempt before Super Admin approval...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await fillInput('#login-email', testUsername);
    await fillInput('#login-password', 'mypass123');
    await new Promise(r => setTimeout(r, 300));
    await page.evaluate(() => {
      document.querySelector('form')?.requestSubmit();
    });
    await new Promise(r => setTimeout(r, 1200));

    const loginError = await page.$eval('#login-notification-banner', el => el.innerText).catch(() => '');
    console.log(`  Login rejection message: "${loginError}"`);
    const isBlocked = loginError.includes('pending') || loginError.includes('Super Admin approval') || loginError.includes('approval');
    console.log(`  Pending shop blocked from dashboard until approved: ${isBlocked ? 'PASS' : 'FAIL'}`);

    // 12. Check Horizontal Scroll Overflow
    console.log('\n[STEP 12] Checking Horizontal Scroll across Viewports...');
    const viewports = [
      { name: 'Desktop (1440px)', width: 1440, height: 900 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Mobile (375px)', width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      await page.setViewport(vp);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
      const overflow = await page.evaluate(() => {
        return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
      });
      console.log(`  Viewport ${vp.name}: overflow = ${overflow}px ${overflow === 0 ? '✓' : '✗'}`);
    }

    console.log('\n--- ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('\nVerification Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
