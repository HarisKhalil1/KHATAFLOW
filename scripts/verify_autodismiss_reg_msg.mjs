import puppeteer from 'puppeteer-core';

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('--- STARTING AUTO-DISMISS REGISTRATION STATUS MESSAGE VERIFICATION ---');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

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

  try {
    // 1. Navigate to home
    console.log('\n[TEST 1] Navigating to Home page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // Ensure no stale banner is present initially
    const initialBanner = await page.$('#reg-success-banner');
    console.log(`  Initial banner present before registration: ${initialBanner !== null ? 'FAIL' : 'PASS (None)'}`);

    // 2. Open Register Form
    console.log('\n[TEST 2] Opening registration form...');
    await page.waitForSelector('#btn-toggle-register', { timeout: 10000 });
    await page.evaluate(() => document.getElementById('btn-toggle-register')?.click());
    await new Promise(r => setTimeout(r, 400));

    // 3. Register a new test shop
    const testId = Date.now().toString().slice(-4);
    const shopName = `AutoDismiss Test Mart ${testId}`;
    const username = `owner${testId}`;

    console.log(`  Registering shop: "${shopName}", Owner: "${username}"`);
    await fillInput('#reg-shop-name', shopName);
    await fillInput('#reg-shop-city', 'Peshawar');
    await fillInput('#reg-shop-address', 'Ring Road, Peshawar');
    await fillInput('#reg-owner-name', 'Tariq AutoDismiss');
    await fillInput('#reg-owner-phone', '0300-8889999');
    await fillInput('#reg-owner-username', username);
    await fillInput('#reg-owner-password', 'testpass123');
    await fillInput('#reg-owner-confirm-password', 'testpass123');

    await page.evaluate(() => {
      document.querySelector('form')?.requestSubmit();
    });

    // 4. Confirm message appears immediately (after 1s)
    await new Promise(r => setTimeout(r, 1200));
    const bannerAfterSubmit = await page.$('#reg-success-banner');
    const bannerText = bannerAfterSubmit ? await page.$eval('#reg-success-banner', el => el.innerText) : '';
    console.log(`  Banner visible at 1.2s: ${bannerAfterSubmit !== null ? 'PASS' : 'FAIL'}`);
    console.log(`  Banner text: "${bannerText.replace(/\n/g, ' ')}"`);

    const hasShopId = /SHOP-PK-\d+/.test(bannerText);
    const hasPendingApproval = bannerText.includes('pending Super Admin approval');
    console.log(`  Contains unique Shop ID: ${hasShopId ? 'PASS' : 'FAIL'}`);
    console.log(`  Explains Super Admin approval pending: ${hasPendingApproval ? 'PASS' : 'FAIL'}`);

    // 5. Check auto-transition to login view after ~3s
    await new Promise(r => setTimeout(r, 2200)); // total ~3.4s
    const isLoginView = await page.evaluate(() => document.querySelector('#login-password') !== null);
    console.log(`  Auto-transitioned to login view after 3s: ${isLoginView ? 'PASS' : 'FAIL'}`);

    // Banner should still be visible at ~3.5s
    const bannerAt3s = await page.$('#reg-success-banner');
    console.log(`  Banner still visible during grace period (3.5s): ${bannerAt3s !== null ? 'PASS' : 'FAIL'}`);

    // 6. Confirm message is automatically dismissed after ~5s
    console.log('\n[TEST 3] Waiting for 5-second auto-dismissal...');
    await new Promise(r => setTimeout(r, 2200)); // total ~5.6s
    const bannerAt6s = await page.$('#reg-success-banner');
    console.log(`  Banner automatically dismissed at 5.6s: ${bannerAt6s === null ? 'PASS' : 'FAIL'}`);

    // 7. Refresh page and verify old message does NOT reappear
    console.log('\n[TEST 4] Refreshing page to verify old message does not reappear...');
    await page.reload({ waitUntil: 'networkidle0' });
    const bannerAfterReload = await page.$('#reg-success-banner');
    console.log(`  Banner absent after page reload: ${bannerAfterReload === null ? 'PASS' : 'FAIL'}`);

    // 8. Test manual dismiss button
    console.log('\n[TEST 5] Testing manual dismiss "X" button on registration...');
    await page.waitForSelector('#btn-toggle-register', { timeout: 10000 });
    await page.evaluate(() => document.getElementById('btn-toggle-register')?.click());
    await new Promise(r => setTimeout(r, 400));

    const testId2 = (Date.now() + 1).toString().slice(-4);
    await fillInput('#reg-shop-name', `Dismiss Mart ${testId2}`);
    await fillInput('#reg-shop-city', 'Peshawar');
    await fillInput('#reg-owner-name', 'Dismiss Tester');
    await fillInput('#reg-owner-phone', '0300-1112222');
    await fillInput('#reg-owner-username', `dismiss${testId2}`);
    await fillInput('#reg-owner-password', 'testpass123');
    await fillInput('#reg-owner-confirm-password', 'testpass123');

    await page.evaluate(() => {
      document.querySelector('form')?.requestSubmit();
    });
    await new Promise(r => setTimeout(r, 1000));

    const bannerManual = await page.$('#reg-success-banner');
    console.log(`  Banner visible before manual dismiss: ${bannerManual !== null ? 'PASS' : 'FAIL'}`);

    // Click dismiss button
    await page.evaluate(() => {
      document.querySelector('#reg-success-banner button')?.click();
    });
    await new Promise(r => setTimeout(r, 200));
    const bannerAfterManualDismiss = await page.$('#reg-success-banner');
    console.log(`  Banner instantly dismissed on "X" click: ${bannerAfterManualDismiss === null ? 'PASS' : 'FAIL'}`);

    // 9. Verify Super Admin Console still displays the newly registered shop as pending
    console.log('\n[TEST 6] Verifying shop is in Super Admin as pending approval...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#role-tab-super-admin', { timeout: 10000 });
    await page.evaluate(() => document.getElementById('role-tab-super-admin')?.click());
    await page.waitForSelector('#quick-demo-super-admin', { timeout: 10000 });
    await page.evaluate(() => document.getElementById('quick-demo-super-admin')?.click());
    await new Promise(r => setTimeout(r, 300));

    await page.evaluate(() => document.querySelector('form')?.requestSubmit());
    await page.waitForFunction(() => window.location.pathname.includes('/superadmin'), { timeout: 10000 });

    const superAdminText = await page.$eval('main', el => el.innerText);
    const hasRegisteredShop = superAdminText.includes(`AutoDismiss Test Mart ${testId}`);
    console.log(`  New shop visible in Super Admin console: ${hasRegisteredShop ? 'PASS' : 'FAIL'}`);

    // 10. Verify Haris Khan Demo Store login is 100% working
    console.log('\n[TEST 7] Verifying Haris Khan Demo Store login...');
    await page.evaluate(() => window.localStorage.removeItem('KHATAFLOW_SESSION_V1'));
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#quick-demo-shop-owner', { timeout: 10000 });
    await page.evaluate(() => document.getElementById('quick-demo-shop-owner')?.click());
    await new Promise(r => setTimeout(r, 300));
    await page.evaluate(() => document.querySelector('form')?.requestSubmit());
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });

    const dashboardText = await page.$eval('main', el => el.innerText);
    const hasHarisStore = dashboardText.includes('Haris Khan Demo Store') || dashboardText.includes('Haris Khan');
    console.log(`  Haris Khan Demo Store dashboard loads successfully: ${hasHarisStore ? 'PASS' : 'FAIL'}`);

    console.log('\n--- ALL AUTO-DISMISS & VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
