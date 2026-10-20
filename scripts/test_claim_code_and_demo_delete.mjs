import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTests() {
  console.log('================================================================');
  console.log('KHATAFLOW VERIFICATION: CLAIM CODE DISPLAY + MANUAL DEMO SHOP DELETION');
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
    // SETUP: Set super admin session
    // -------------------------------------------------------------
    console.log('\n[SETUP] Setting Super Admin session...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem(
        'KHATAFLOW_SESSION_V1',
        JSON.stringify({
          role: 'superadmin',
          username: 'superadmin',
          name: 'Super Administrator',
          loginTime: new Date().toISOString()
        })
      );
    });

    // -------------------------------------------------------------
    // TEST 1: Navigate to /superadmin and inspect details
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Visiting /superadmin as Super Admin...');
    await page.goto('http://localhost:3000/superadmin', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    const pageTitle = await page.evaluate(() => document.body.innerText);
    if (!pageTitle.includes('Super Admin Control Center') && !pageTitle.includes('Registered Shops Directory')) {
      throw new Error('TEST 1 FAILED: Super Admin control center not loaded!');
    }
    console.log('✓ TEST 1 PASSED: Super Admin control center successfully rendered.');

    // -------------------------------------------------------------
    // TEST 2: Check Claim Code display in Details modal for SHOP-PK-001
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Opening Details modal for SHOP-PK-001...');
    // Click Details on the first row
    const detailsButtons = await page.$$('button');
    let clickedDetails = false;
    for (const btn of detailsButtons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.trim() === 'Details') {
        await btn.click();
        clickedDetails = true;
        break;
      }
    }
    if (!clickedDetails) {
      throw new Error('TEST 2 FAILED: Could not find Details button!');
    }
    await new Promise((r) => setTimeout(r, 600));

    const detailsModalData = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      if (!modal) return { notFound: true };
      const text = modal.innerText;
      const hasShopId = text.includes('SHOP-PK-001');
      const hasClaimCodeLabel = text.toLowerCase().includes('claim code');
      const hasCopyButton = text.includes('Copy');
      const hasPassword = text.toLowerCase().includes('password123') || text.toLowerCase().includes('owner password:');
      const hasResetButton = text.includes('Reset Claim Code');

      // Find claim code pattern CLAIM-[A-Z0-9]+
      const match = text.match(/CLAIM-[A-Z0-9]+/);
      const claimCode = match ? match[0] : null;

      return {
        hasShopId,
        hasClaimCodeLabel,
        hasCopyButton,
        hasPassword,
        hasResetButton,
        claimCode,
      };
    });

    console.log('Details Modal Evaluation:', detailsModalData);
    if (!detailsModalData || !detailsModalData.hasShopId) {
      throw new Error('TEST 2 FAILED: Details modal did not show Shop ID SHOP-PK-001!');
    }
    if (!detailsModalData.claimCode) {
      throw new Error('TEST 2 FAILED: Claim Code was not displayed in Details modal!');
    }
    if (!detailsModalData.hasCopyButton) {
      throw new Error('TEST 2 FAILED: Copy button was not found in Details modal!');
    }
    if (detailsModalData.hasPassword) {
      throw new Error('TEST 2 FAILED: Owner password was exposed in Details modal!');
    }
    if (detailsModalData.hasResetButton) {
      throw new Error('TEST 2 FAILED: Prohibited "Reset Claim Code" button was found!');
    }

    const firstObservedClaimCode = detailsModalData.claimCode;
    console.log(`✓ TEST 2 PASSED: Claim Code "${firstObservedClaimCode}" displayed with Copy button, no password, no reset button.`);

    // -------------------------------------------------------------
    // TEST 3: Persistence of Claim Code after page refresh
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Testing Claim Code persistence across page refresh...');
    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.fixed.inset-0 button');
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Reload page
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Reopen Details on SHOP-PK-001
    const reloadedButtons = await page.$$('button');
    for (const btn of reloadedButtons) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.trim() === 'Details') {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    const reloadedClaimCode = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      if (!modal) return null;
      const match = modal.innerText.match(/CLAIM-[A-Z0-9]+/);
      return match ? match[0] : null;
    });

    console.log(`Reloaded Claim Code: "${reloadedClaimCode}", Original: "${firstObservedClaimCode}"`);
    if (reloadedClaimCode !== firstObservedClaimCode) {
      throw new Error(`TEST 3 FAILED: Claim Code changed after refresh! Before: ${firstObservedClaimCode}, After: ${reloadedClaimCode}`);
    }
    console.log('✓ TEST 3 PASSED: Claim Code remained strictly identical after page refresh (never regenerated).');

    // Close details modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.fixed.inset-0 button');
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // -------------------------------------------------------------
    // TEST 4: Protection of Original Shops against Demo Deletion
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Testing protection of baseline shops (SHOP-PK-001, 002, 003)...');
    const baselineProtection = await page.evaluate(() => {
      // Direct context check via shop registry in localStorage
      const raw = localStorage.getItem('KHATAFLOW_SHOP_REGISTRY_V1');
      const shops = JSON.parse(raw);
      const originalShops = shops.filter((s) => ['SHOP-PK-001', 'SHOP-PK-002', 'SHOP-PK-003'].includes(s.id));
      const allMarkedProtected = originalShops.every((s) => s.isDemoCreated === false);
      return {
        originalCount: originalShops.length,
        allMarkedProtected,
      };
    });

    if (baselineProtection.originalCount !== 3 || !baselineProtection.allMarkedProtected) {
      throw new Error('TEST 4 FAILED: Baseline shops are not protected!');
    }
    console.log('✓ TEST 4 PASSED: Original baseline shops are explicitly non-demo and protected.');

    // -------------------------------------------------------------
    // TEST 5: Create a new Demo Shop via Super Admin flow
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Creating a new demo shop via Super Admin flow...');
    // Click "+ Register New Shop (Admin)"
    const allBtns = await page.$$('button');
    for (const btn of allBtns) {
      const text = await (await btn.getProperty('innerText')).jsonValue();
      if (text.includes('Register New Shop (Admin)')) {
        await btn.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    // Fill form
    const demoShopName = `Automated Demo Shop ${Date.now().toString().slice(-4)}`;
    await page.type('input[placeholder*="Saddar Grocery"]', demoShopName);
    await page.type('input[placeholder*="Shop #4"]', 'Demo Plaza, University Road');
    await page.type('input[placeholder*="Abdul Samad"]', 'Demo Tester');
    await page.type('input[placeholder*="0300-1234567"]', '0333-8889999');

    // Submit form
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await new Promise((r) => setTimeout(r, 1000));

    // Verify creation success modal with claim code
    const creationResult = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      if (!modal) return null;
      const text = modal.innerText;
      const successMsg = text.includes('Shop Account Successfully Generated');
      const match = text.match(/SHOP-PK-[A-Z0-9]+/);
      const newShopId = match ? match[0] : null;
      const claimMatch = text.match(/CLAIM-[A-Z0-9]+/);
      const claimCode = claimMatch ? claimMatch[0] : null;
      return { successMsg, newShopId, claimCode };
    });

    console.log('Creation Result:', creationResult);
    if (!creationResult || !creationResult.newShopId || !creationResult.claimCode) {
      throw new Error('TEST 5 FAILED: Demo shop creation did not produce Shop ID and Claim Code!');
    }
    const createdDemoShopId = creationResult.newShopId;
    console.log(`✓ TEST 5 PASSED: Created Demo Shop ID ${createdDemoShopId} with Claim Code ${creationResult.claimCode}.`);

    // Click "Done" to close creation modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const doneBtn = buttons.find((b) => b.innerText.trim() === 'Done');
      if (doneBtn) doneBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------
    // TEST 6: Verify Demo Shop persists across refresh (NEVER deleted on refresh)
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Testing persistence across page refresh (refresh must NEVER delete shop)...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    const shopPresentAfterRefresh = await page.evaluate((shopId) => {
      const text = document.body.innerText;
      const raw = localStorage.getItem('KHATAFLOW_SHOP_REGISTRY_V1');
      const shops = JSON.parse(raw);
      const found = shops.find((s) => s.id === shopId);
      return {
        foundInTable: text.includes(shopId),
        foundInRegistry: !!found,
        isDemoCreated: found?.isDemoCreated,
      };
    }, createdDemoShopId);

    console.log('Shop presence after refresh:', shopPresentAfterRefresh);
    if (!shopPresentAfterRefresh.foundInTable || !shopPresentAfterRefresh.foundInRegistry) {
      throw new Error('TEST 6 FAILED: Demo shop was deleted or missing after page refresh!');
    }
    if (shopPresentAfterRefresh.isDemoCreated !== true) {
      throw new Error('TEST 6 FAILED: Demo shop did not have isDemoCreated: true classification!');
    }
    console.log('✓ TEST 6 PASSED: Demo shop persisted across refresh with persistent isDemoCreated: true flag.');

    // -------------------------------------------------------------
    // TEST 7: Test Delete Confirmation Dialog (Cancel leaves data unchanged)
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Testing Delete Confirmation Dialog and Cancel action...');
    // Find the row for createdDemoShopId and click "Delete Demo"
    const clickedDelete = await page.evaluate((shopId) => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const targetRow = rows.find((r) => r.innerText.includes(shopId));
      if (!targetRow) return false;
      const deleteBtn = Array.from(targetRow.querySelectorAll('button')).find(
        (b) => b.innerText.includes('Delete Demo')
      );
      if (deleteBtn) {
        deleteBtn.click();
        return true;
      }
      return false;
    }, createdDemoShopId);

    if (!clickedDelete) {
      throw new Error('TEST 7 FAILED: Could not find or click Delete Demo button for demo shop!');
    }
    await new Promise((r) => setTimeout(r, 600));

    // Verify Confirmation Dialog contents
    const dialogData = await page.evaluate((shopId, shopName) => {
      const modal = document.querySelector('.fixed.inset-0');
      if (!modal) return null;
      const text = modal.innerText;
      return {
        hasTitle: text.includes('Confirm Demo Shop Deletion'),
        hasShopName: text.includes(shopName),
        hasShopId: text.includes(shopId),
        hasCancelBtn: text.includes('Cancel (Keep Shop)'),
        hasConfirmBtn: text.includes('Confirm & Delete Demo Shop'),
      };
    }, createdDemoShopId, demoShopName);

    console.log('Delete Confirmation Dialog:', dialogData);
    if (!dialogData || !dialogData.hasTitle || !dialogData.hasShopName || !dialogData.hasShopId) {
      throw new Error('TEST 7 FAILED: Delete confirmation dialog missing required shop name or ID!');
    }

    // Click "Cancel (Keep Shop)"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find((b) => b.innerText.includes('Cancel (Keep Shop)'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify shop is STILL present after Cancel
    const stillPresentAfterCancel = await page.evaluate((shopId) => {
      const text = document.body.innerText;
      const raw = localStorage.getItem('KHATAFLOW_SHOP_REGISTRY_V1');
      const shops = JSON.parse(raw);
      return text.includes(shopId) && shops.some((s) => s.id === shopId);
    }, createdDemoShopId);

    if (!stillPresentAfterCancel) {
      throw new Error('TEST 7 FAILED: Shop was deleted despite clicking Cancel!');
    }
    console.log('✓ TEST 7 PASSED: Cancel left all shop data completely unchanged.');

    // -------------------------------------------------------------
    // TEST 8: Test Confirmed Deletion of Demo Shop
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Testing confirmed manual deletion of demo shop...');
    // Click Delete Demo button again
    await page.evaluate((shopId) => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const targetRow = rows.find((r) => r.innerText.includes(shopId));
      if (!targetRow) return;
      const deleteBtn = Array.from(targetRow.querySelectorAll('button')).find(
        (b) => b.innerText.includes('Delete Demo')
      );
      if (deleteBtn) deleteBtn.click();
    }, createdDemoShopId);
    await new Promise((r) => setTimeout(r, 600));

    // Click "Confirm & Delete Demo Shop"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const confirmBtn = buttons.find((b) => b.innerText.includes('Confirm & Delete Demo Shop'));
      if (confirmBtn) confirmBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Verify immediately removed from UI table and registry
    const checkImmediatelyDeleted = await page.evaluate((shopId) => {
      const table = document.querySelector('table');
      const tableText = table ? table.innerText : '';
      const raw = localStorage.getItem('KHATAFLOW_SHOP_REGISTRY_V1');
      const shops = JSON.parse(raw);
      const isStillInRegistry = shops.some((s) => s.id === shopId);
      return {
        removedFromTable: !tableText.includes(shopId),
        removedFromRegistry: !isStillInRegistry,
      };
    }, createdDemoShopId);

    console.log('Immediate Deletion State:', checkImmediatelyDeleted);
    if (!checkImmediatelyDeleted.removedFromTable || !checkImmediatelyDeleted.removedFromRegistry) {
      throw new Error('TEST 8 FAILED: Demo shop was not removed after confirmed deletion!');
    }

    // Refresh page to verify it REMAINS deleted
    console.log('Refreshing page to ensure deleted demo shop remains deleted...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    const checkPersistentlyDeleted = await page.evaluate((shopId) => {
      const table = document.querySelector('table');
      const tableText = table ? table.innerText : '';
      const raw = localStorage.getItem('KHATAFLOW_SHOP_REGISTRY_V1');
      const shops = JSON.parse(raw);
      const isStillInRegistry = shops.some((s) => s.id === shopId);
      const baselineShopsExist = ['SHOP-PK-001', 'SHOP-PK-002', 'SHOP-PK-003'].every((id) =>
        shops.some((s) => s.id === id)
      );
      return {
        stillGoneFromTable: !tableText.includes(shopId),
        stillGoneFromRegistry: !isStillInRegistry,
        baselineShopsExist,
      };
    }, createdDemoShopId);

    console.log('Persistent Deletion State after Refresh:', checkPersistentlyDeleted);
    if (!checkPersistentlyDeleted.stillGoneFromTable || !checkPersistentlyDeleted.stillGoneFromRegistry) {
      throw new Error('TEST 8 FAILED: Deleted demo shop reappeared after refresh!');
    }
    if (!checkPersistentlyDeleted.baselineShopsExist) {
      throw new Error('TEST 8 FAILED: Baseline shops were corrupted or deleted during demo deletion!');
    }
    console.log('✓ TEST 8 PASSED: Demo shop remains deleted after refresh; all baseline shops are 100% intact.');

    console.log('\n================================================================');
    console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (8/8 TESTS PASSED)');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ TEST RUNNER ERROR:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
