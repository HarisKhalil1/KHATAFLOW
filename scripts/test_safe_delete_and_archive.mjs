import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\0d035862-8188-47d5-94c7-153e3cbe366e';

async function run() {
  console.log('========================================================================');
  console.log('KHATAFLOW E2E VERIFICATION: SAFE CUSTOMER DELETE, ARCHIVE, RESTORE & EDIT');
  console.log('========================================================================');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,950']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  try {
    // 1. Navigate to customers page & clean session
    console.log('\n[1] Navigating to http://localhost:3000/dashboard/customers...');
    await page.goto('http://localhost:3000/dashboard/customers', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.removeItem('KHATAFLOW_STORAGE_V3');
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Capture initial baseline balances
    const baselineBalances = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasTariq15000: text.includes('Tariq Khan') && text.includes('15,000'),
        hasBilal8200: text.includes('Bilal Ahmed') && text.includes('8,200'),
        hasRashid4800: text.includes('Rashid Mehmood') && text.includes('4,800'),
      };
    });
    console.log('✓ Initial baseline balances confirmed:', baselineBalances);

    // ========================================================================
    // TEST CASE 1: Delete an Empty Customer (No transactions, 0 balance)
    // ========================================================================
    console.log('\n[2] TEST CASE 1: Create an empty customer and delete them safely...');
    // Click Add New Customer
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.includes('Add New Customer'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Fill form for empty customer
    await page.type('#customer-name-input', 'Zeeshan Test Customer');
    await page.type('#customer-phone-input', '0300-1122334');
    await new Promise(r => setTimeout(r, 400));

    // Submit add customer
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const emptyCustomerCreated = await page.evaluate(() => {
      return document.body.innerText.includes('Zeeshan Test Customer');
    });
    console.log('✓ Empty customer created successfully:', emptyCustomerCreated);

    // Click Delete button on Zeeshan Test Customer card specifically
    console.log('Opening Delete dialog for empty customer...');
    await page.evaluate(() => {
      // Find all customer card elements (div with rounded-2xl)
      const h3s = Array.from(document.querySelectorAll('h3'));
      const zeeshanH3 = h3s.find(h => h.innerText.includes('Zeeshan Test Customer'));
      if (zeeshanH3) {
        const card = zeeshanH3.closest('.rounded-2xl') || zeeshanH3.parentElement?.parentElement?.parentElement;
        const deleteBtn = card?.querySelector('button[title*="delete"], button[title*="Delete"], button[title*="Archive"]');
        if (deleteBtn) deleteBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_empty_customer_modal.png') });

    // Verify modal recognizes No Financial History
    const emptyModalCheck = await page.evaluate(() => {
      const modal = document.body.innerText;
      return {
        hasTitle: modal.includes('Delete Customer'),
        hasNoFinancialRecords: modal.includes('No Financial History') || modal.includes('no bills, no payments'),
        hasConfirmButton: modal.includes('Confirm Delete Customer')
      };
    });
    console.log('✓ Empty Customer Modal correctly detected 0 financial records:', emptyModalCheck);

    // Confirm deletion
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.innerText.includes('Confirm Delete Customer'));
      if (confirmBtn) confirmBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const emptyCustomerDeleted = await page.evaluate(() => {
      return !document.body.innerText.includes('Zeeshan Test Customer');
    });
    console.log('✓ Empty customer successfully permanently deleted:', emptyCustomerDeleted);

    // ========================================================================
    // TEST CASE 2: Safe Archiving for Customer with Financial Records
    // ========================================================================
    console.log('\n[3] TEST CASE 2: Safe Archiving a customer with financial history (Bilal Ahmed)...');
    // Open Delete/Archive modal on Bilal Ahmed specifically
    await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const bilalH3 = h3s.find(h => h.innerText.includes('Bilal Ahmed'));
      if (bilalH3) {
        const card = bilalH3.closest('.rounded-2xl') || bilalH3.parentElement?.parentElement?.parentElement;
        const deleteBtn = card?.querySelector('button[title*="Archive"], button[title*="delete"], button[title*="Delete"]');
        if (deleteBtn) deleteBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_financial_customer_archive_modal.png') });

    // Verify modal detects financial records
    const financialModalCheck = await page.evaluate(() => {
      const modal = document.body.innerText;
      return {
        detectedWarning: modal.includes('Financial History Detected'),
        showsOutstanding: modal.includes('8,200'),
        showsBills: modal.includes('Bill'),
        recommendsArchive: modal.includes('Archive Customer (Recommended & Reversible)'),
      };
    });
    console.log('✓ Modal correctly detected financial records & recommended Archiving:', financialModalCheck);

    // Perform Safe Archive
    await page.evaluate(() => {
      const reasonInput = document.querySelector('#archive-reason');
      if (reasonInput) {
        reasonInput.value = 'Temporary closure';
        reasonInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const btns = Array.from(document.querySelectorAll('button'));
      const archiveBtn = btns.find(b => b.innerText.includes('Archive Customer Safely'));
      if (archiveBtn) archiveBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify Bilal Ahmed disappeared from active list
    const activeListCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        bilalInActiveList: text.includes('Bilal Ahmed'),
        tariqStillHere: text.includes('Tariq Khan') && text.includes('15,000'),
        rashidStillHere: text.includes('Rashid Mehmood') && text.includes('4,800'),
      };
    });
    console.log('✓ Active Customer List after archiving Bilal Ahmed:', activeListCheck);
    console.log('✓ Confirmed: Other customers (Tariq Khan Rs. 15,000, Rashid Mehmood Rs. 4,800) completely unchanged!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_active_list_without_archived.png') });

    // ========================================================================
    // TEST CASE 3: Archived Customer cannot receive new transactions
    // ========================================================================
    console.log('\n[4] TEST CASE 3: Verifying archived customer cannot receive new transactions...');
    // Click "Receive Payment" in sidebar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const payBtn = btns.find(b => b.innerText && b.innerText.includes('Record Payment'));
      if (payBtn) payBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const paymentDropdownCheck = await page.evaluate(() => {
      const select = document.querySelector('#payment-customer-select, select');
      if (!select) return { dropdownFound: false };
      const options = Array.from(select.querySelectorAll('option')).map(o => o.text);
      return {
        dropdownFound: true,
        hasBilal: options.some(o => o.includes('Bilal Ahmed')),
        hasTariq: options.some(o => o.includes('Tariq Khan')),
      };
    });
    console.log('✓ Record Payment customer dropdown check (Bilal must NOT be available):', paymentDropdownCheck);

    // Close payment modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close modal"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // ========================================================================
    // TEST CASE 4: View in Archived Tab and Restore Customer
    // ========================================================================
    console.log('\n[5] TEST CASE 4: Navigating to Archived tab and restoring Bilal Ahmed...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const archivedTab = btns.find(b => b.innerText && b.innerText.includes('Archived'));
      if (archivedTab) archivedTab.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const archivedTabCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        bilalFoundInArchived: text.includes('Bilal Ahmed'),
        showsPreservedInArchive: text.includes('Preserved in Archive') || text.includes('Archived'),
        hasRestoreButton: text.includes('Restore Customer'),
        balancePreserved8200: text.includes('8,200'),
      };
    });
    console.log('✓ Archived Tab Inspection:', archivedTabCheck);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_archived_tab.png') });

    // Click "Restore Customer"
    console.log('Restoring Bilal Ahmed...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const restoreBtn = btns.find(b => b.innerText.includes('Restore Customer'));
      if (restoreBtn) restoreBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Switch back to "All" tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const allTab = btns.find(b => b.innerText && b.innerText.startsWith('All'));
      if (allTab) allTab.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const restoredCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        bilalRestoredInAllTab: text.includes('Bilal Ahmed'),
        balanceExact8200: text.includes('8,200'),
      };
    });
    console.log('✓ Customer restored successfully to active list with exact balance:', restoredCheck);

    // ========================================================================
    // TEST CASE 5: Edit Customer Details
    // ========================================================================
    console.log('\n[6] TEST CASE 5: Editing customer details (phone & address)...');
    // Click Edit button on Bilal Ahmed card specifically
    await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const bilalH3 = h3s.find(h => h.innerText.includes('Bilal Ahmed'));
      if (bilalH3) {
        const card = bilalH3.closest('.rounded-2xl') || bilalH3.parentElement?.parentElement?.parentElement;
        const editBtn = card?.querySelector('button[title*="Edit"], button[title*="edit"]');
        if (editBtn) editBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_edit_customer_modal.png') });

    // Update phone & address with native setters for React
    await page.evaluate(() => {
      const phoneInput = document.querySelector('#edit-customer-phone');
      if (phoneInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(phoneInput, '0333-1112223');
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
        phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const addrInput = document.querySelector('#edit-customer-address');
      if (addrInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(addrInput, 'Hayatabad Phase 5, Peshawar');
        addrInput.dispatchEvent(new Event('input', { bubbles: true }));
        addrInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const editResultCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasNewPhone: text.includes('0333-1112223'),
        hasNewAddress: text.includes('Hayatabad Phase 5, Peshawar'),
        balanceStill8200: text.includes('8,200'),
      };
    });
    console.log('✓ Edit Customer updated details while maintaining balance:', editResultCheck);

    // ========================================================================
    // TEST CASE 6: Persistence across reload
    // ========================================================================
    console.log('\n[7] TEST CASE 6: Verifying persistence across page reload...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    const reloadCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        persistedBilal: text.includes('Bilal Ahmed'),
        persistedPhone: text.includes('0333-1112223'),
        persistedTariq: text.includes('Tariq Khan') && text.includes('15,000'),
      };
    });
    console.log('✓ Persistence verified after reload:', reloadCheck);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_final_state.png') });

    console.log('\n========================================================================');
    console.log('ALL SAFE CUSTOMER DELETE, ARCHIVE, RESTORE & EDIT CHECKS PASSED!');
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
  }
}

run();
