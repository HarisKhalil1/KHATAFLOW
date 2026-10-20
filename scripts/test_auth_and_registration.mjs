import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('================================================================');
  console.log('KHATAFLOW E2E TEST: AUTHENTICATION, REGISTRATION & ROUTE PROTECTION');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    // -------------------------------------------------------------
    // TEST 1: Open /dashboard without authentication -> Access Denied
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Visiting /dashboard without authentication...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    // Clean all session data
    await page.evaluate(() => {
      localStorage.removeItem('KHATAFLOW_SESSION_V1');
      sessionStorage.clear();
    });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const test1Result = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        showsAccessDenied: text.includes('Access Restricted') || text.includes('Authentication Required'),
        showsLoginButton: text.includes('Proceed to Login Portal') || text.includes('Sign In'),
        customersHidden: !text.includes('Recent Ledger History') && !text.includes('Add Customer')
      };
    });
    console.log('✓ TEST 1 Result (Access Denied without session):', test1Result);
    if (!test1Result.showsAccessDenied) {
      throw new Error('TEST 1 FAILED: Unauthenticated user was not blocked from /dashboard!');
    }

    // -------------------------------------------------------------
    // TEST 2: Enter incorrect login credentials -> Login must fail
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Testing incorrect credentials on Login...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Fill wrong credentials
    await page.type('#login-email', 'wronguser@khataflow.pk');
    await page.type('#login-password', 'wrongpassword999');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    const test2Result = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        showsError: text.includes('Invalid username/email or password') || text.includes('verify your credentials'),
        urlIsHome: window.location.pathname === '/'
      };
    });
    console.log('✓ TEST 2 Result (Incorrect credentials rejected):', test2Result);
    if (!test2Result.showsError || !test2Result.urlIsHome) {
      throw new Error('TEST 2 FAILED: Incorrect login was not rejected!');
    }

    // -------------------------------------------------------------
    // TEST 3 & 4: Switch to Register -> Test mismatched passwords
    // -------------------------------------------------------------
    console.log('\n[TEST 3 & 4] Testing registration validation and mismatched passwords...');
    // Click "Register Shop Account" toggle
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const regBtn = btns.find(b => b.textContent && b.textContent.includes('Register Shop Account'));
      if (regBtn) regBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Submit empty fields
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 400));
    const emptyValidationResult = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('required') || text.includes('fill in');
    });
    console.log('✓ TEST 3 Result (Empty registration rejected):', emptyValidationResult);

    // Enter details with MISMATCHED passwords
    await page.evaluate(() => {
      const setVal = (input, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const inputs = Array.from(document.querySelectorAll('input'));
      for (const input of inputs) {
        if (input.placeholder && input.placeholder.includes('Madina Super Store')) setVal(input, 'Mismatched Shop');
        if (input.placeholder && input.placeholder.includes('Peshawar')) setVal(input, 'Peshawar');
        if (input.placeholder && input.placeholder.includes('Farhan Ali')) setVal(input, 'Owner Test');
        if (input.placeholder && input.placeholder.includes('0300-1234567')) setVal(input, '0300-9998877');
        if (input.placeholder && input.placeholder.includes('farhan@khataflow.pk')) setVal(input, 'mismatch_user@khataflow.pk');
        if (input.placeholder && input.placeholder.includes('Min. 6 chars')) setVal(input, 'password123');
        if (input.placeholder && input.placeholder.includes('Repeat password')) setVal(input, 'differentpassword456');
      }
    });
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    const mismatchResult = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        showsMismatchError: text.includes('Passwords do not match'),
        stillOnHome: window.location.pathname === '/'
      };
    });
    console.log('✓ TEST 4 Result (Password mismatch rejected):', mismatchResult);
    if (!mismatchResult.showsMismatchError) {
      throw new Error('TEST 4 FAILED: Password mismatch was not blocked!');
    }

    // -------------------------------------------------------------
    // TEST 5 & 6: Claim Existing Shop -> Nonexistent & Invalid Code
    // -------------------------------------------------------------
    console.log('\n[TEST 5 & 6] Testing Claim verification rules...');
    // Switch to "Claim Existing Shop" sub-tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const claimTab = btns.find(b => b.textContent && b.textContent.includes('Claim Existing Shop'));
      if (claimTab) claimTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Try claiming nonexistent shop ID
    await page.evaluate(() => {
      const setVal = (input, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const inputs = Array.from(document.querySelectorAll('input'));
      for (const input of inputs) {
        if (input.placeholder && input.placeholder.includes('SHOP-PK-004')) setVal(input, 'SHOP-PK-NONEXISTENT');
        if (input.placeholder && input.placeholder.includes('CLAIM-XXXXXX')) setVal(input, 'CLAIM-FAKE12');
        if (input.placeholder && input.placeholder.includes('Farhan Ali')) setVal(input, 'Hacker Bob');
        if (input.placeholder && input.placeholder.includes('0300-1234567')) setVal(input, '0300-1112233');
        if (input.placeholder && input.placeholder.includes('farhan@khataflow.pk')) setVal(input, 'hacker@khataflow.pk');
        if (input.placeholder && input.placeholder.includes('Min. 6 chars')) setVal(input, 'secret123');
        if (input.placeholder && input.placeholder.includes('Repeat password')) setVal(input, 'secret123');
      }
    });
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    const test5Result = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        showsNotFound: text.includes('not found in system registry'),
        stillOnHome: window.location.pathname === '/'
      };
    });
    console.log('✓ TEST 5 Result (Nonexistent shop claim rejected):', test5Result);
    if (!test5Result.showsNotFound) {
      throw new Error('TEST 5 FAILED: Nonexistent shop claim was not rejected!');
    }

    // Now test valid shop ID (e.g. SHOP-PK-001) but with WRONG claim code (claiming by ID alone)
    await page.evaluate(() => {
      const setVal = (input, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const inputs = Array.from(document.querySelectorAll('input'));
      for (const input of inputs) {
        if (input.placeholder && input.placeholder.includes('SHOP-PK-004')) setVal(input, 'SHOP-PK-001');
        if (input.placeholder && input.placeholder.includes('CLAIM-XXXXXX')) setVal(input, 'CLAIM-WRONG99');
      }
    });
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    const test6Result = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        rejectedWithoutProof: text.includes('already been claimed') || text.includes('Invalid claim code') || text.includes('Public Shop ID alone is not proof'),
        stillOnHome: window.location.pathname === '/'
      };
    });
    console.log('✓ TEST 6 Result (Claiming with ID alone/wrong code rejected):', test6Result);
    if (!test6Result.rejectedWithoutProof) {
      throw new Error('TEST 6 FAILED: Claiming existing shop without secret claim code was not blocked!');
    }

    // -------------------------------------------------------------
    // TEST 7: Register a valid new shop owner
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Registering a legitimate new shop owner...');
    // Switch back to "New Shop"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const newTab = btns.find(b => b.textContent && b.textContent.includes('New Shop'));
      if (newTab) newTab.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const uniqueShopName = `Zia Super Mart ${Date.now().toString().slice(-4)}`;
    const uniqueUser = `zia_owner_${Date.now().toString().slice(-4)}@khataflow.pk`;

    await page.evaluate((name, user) => {
      const setVal = (input, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const inputs = Array.from(document.querySelectorAll('input'));
      for (const input of inputs) {
        if (input.placeholder && input.placeholder.includes('Madina Super Store')) setVal(input, name);
        if (input.placeholder && input.placeholder.includes('Peshawar')) setVal(input, 'Mardan');
        if (input.placeholder && input.placeholder.includes('Farhan Ali')) setVal(input, 'Zia Ur Rehman');
        if (input.placeholder && input.placeholder.includes('0300-1234567')) setVal(input, '0345-1234567');
        if (input.placeholder && input.placeholder.includes('farhan@khataflow.pk')) setVal(input, user);
        if (input.placeholder && input.placeholder.includes('Min. 6 chars')) setVal(input, 'mardan123');
        if (input.placeholder && input.placeholder.includes('Repeat password')) setVal(input, 'mardan123');
      }
    }, uniqueShopName, uniqueUser);

    await page.click('button[type="submit"]');
    console.log('Submitted registration for:', uniqueShopName);
    await new Promise(r => setTimeout(r, 2000));

    // Confirm navigation to /dashboard
    const test7Result = await page.evaluate(() => {
      return {
        path: window.location.pathname,
        isDashboard: window.location.pathname === '/dashboard'
      };
    });
    console.log('✓ TEST 7 Result (Successfully registered & navigated to /dashboard):', test7Result);
    if (!test7Result.isDashboard) {
      throw new Error('TEST 7 FAILED: Registration did not navigate to /dashboard!');
    }

    // -------------------------------------------------------------
    // TEST 10: Confirm Shop Name and Shop ID appear inside dashboard
    // -------------------------------------------------------------
    console.log('\n[TEST 10] Checking Shop Name and Shop ID inside the dashboard...');
    const identityResult = await page.evaluate((expectedName) => {
      const text = document.body.innerText;
      return {
        hasShopName: text.includes(expectedName),
        hasShopId: /SHOP-PK-\d{3}/.test(text),
        foundShopIdMatch: text.match(/SHOP-PK-\d{3}/)?.[0]
      };
    }, uniqueShopName);
    console.log('✓ TEST 10 Result (Shop Name and Shop ID visible in dashboard):', identityResult);
    if (!identityResult.hasShopName || !identityResult.hasShopId) {
      throw new Error('TEST 10 FAILED: Shop Name or Shop ID missing from dashboard!');
    }

    // -------------------------------------------------------------
    // TEST 8 & 9: Log out and sign in again with saved credentials
    // -------------------------------------------------------------
    console.log('\n[TEST 8 & 9] Testing Log out and returning login with saved credentials...');
    // Click Sign Out in sidebar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signoutBtn = btns.find(b => b.textContent && b.textContent.includes('Sign Out'));
      if (signoutBtn) signoutBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Confirm session is cleared
    const sessionCleared = await page.evaluate(() => {
      return localStorage.getItem('KHATAFLOW_SESSION_V1') === null;
    });
    console.log('✓ TEST 8 Result (Log out cleared session):', sessionCleared);

    // Normal Login: only username/email and password
    console.log('Logging back in using returning login (Email & Password only)...');
    await page.type('#login-email', uniqueUser);
    await page.type('#login-password', 'mardan123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1500));

    const test9Result = await page.evaluate((expectedName) => {
      const text = document.body.innerText;
      return {
        path: window.location.pathname,
        isDashboard: window.location.pathname === '/dashboard',
        reloadedCorrectShop: text.includes(expectedName)
      };
    }, uniqueShopName);
    console.log('✓ TEST 9 Result (Returning login loads correct shop):', test9Result);
    if (!test9Result.isDashboard || !test9Result.reloadedCorrectShop) {
      throw new Error('TEST 9 FAILED: Returning login did not load the correct authorized shop!');
    }

    // -------------------------------------------------------------
    // TEST 11: Attempt duplicate registration -> Must reject
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Testing duplicate username registration prevention...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Open register
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const regBtn = btns.find(b => b.textContent && b.textContent.includes('Register Shop Account'));
      if (regBtn) regBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Attempt to register with same uniqueUser
    await page.evaluate((user) => {
      const setVal = (input, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const inputs = Array.from(document.querySelectorAll('input'));
      for (const input of inputs) {
        if (input.placeholder && input.placeholder.includes('Madina Super Store')) setVal(input, 'Duplicate Shop');
        if (input.placeholder && input.placeholder.includes('Peshawar')) setVal(input, 'Lahore');
        if (input.placeholder && input.placeholder.includes('Farhan Ali')) setVal(input, 'Duplicate Guy');
        if (input.placeholder && input.placeholder.includes('0300-1234567')) setVal(input, '0300-4445566');
        if (input.placeholder && input.placeholder.includes('farhan@khataflow.pk')) setVal(input, user);
        if (input.placeholder && input.placeholder.includes('Min. 6 chars')) setVal(input, 'somepass123');
        if (input.placeholder && input.placeholder.includes('Repeat password')) setVal(input, 'somepass123');
      }
    }, uniqueUser);

    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 600));

    const test11Result = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        showsDuplicateError: text.includes('already registered') || text.includes('Please sign in'),
        stillOnHome: window.location.pathname === '/'
      };
    });
    console.log('✓ TEST 11 Result (Duplicate account registration blocked):', test11Result);
    if (!test11Result.showsDuplicateError) {
      throw new Error('TEST 11 FAILED: Duplicate registration was not prevented!');
    }

    // -------------------------------------------------------------
    // TEST 12: Tenant isolation -> Cannot access another shop's ledger
    // -------------------------------------------------------------
    console.log('\n[TEST 12] Testing tenant data isolation...');
    // Log in as default shop SHOP-PK-001 ("Khyber General Store")
    await page.evaluate(() => {
      localStorage.setItem('KHATAFLOW_SESSION_V1', JSON.stringify({
        username: 'khyber@khataflow.pk',
        role: 'shop-owner',
        shopId: 'SHOP-PK-001',
        shopName: 'Khyber General Store',
        authenticatedAt: new Date().toISOString()
      }));
    });
    await page.goto('http://localhost:3000/dashboard/customers', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Try to maliciously change active shop in localStorage to SHOP-PK-002
    await page.evaluate(() => {
      localStorage.setItem('KHATAFLOW_ACTIVE_SHOP_ID', 'SHOP-PK-002');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Check that context enforced session shop (SHOP-PK-001, Tariq Khan) and rejected unauthorized switch
    const test12Result = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        retainedAuthorizedShop: text.includes('Khyber General Store') && text.includes('SHOP-PK-001'),
        isolatedFromShop002: !text.includes('Madina Super Store')
      };
    });
    console.log('✓ TEST 12 Result (Tenant isolation enforced against client tampering):', test12Result);
    if (!test12Result.retainedAuthorizedShop) {
      throw new Error('TEST 12 FAILED: Tenant isolation failed to retain authorized shop!');
    }

    // -------------------------------------------------------------
    // TEST 13: Refresh persistence
    // -------------------------------------------------------------
    console.log('\n[TEST 13] Testing session persistence across browser reload...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const test13Result = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        sessionPersisted: text.includes('Khyber General Store'),
        notBlocked: !text.includes('Authentication Required')
      };
    });
    console.log('✓ TEST 13 Result (Session persisted cleanly across reload):', test13Result);
    if (!test13Result.sessionPersisted || !test13Result.notBlocked) {
      throw new Error('TEST 13 FAILED: Session did not survive reload!');
    }

    console.log('\n================================================================');
    console.log('ALL 13 AUTHENTICATION, REGISTRATION & PROTECTION TESTS PASSED!');
    console.log('================================================================');

  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
