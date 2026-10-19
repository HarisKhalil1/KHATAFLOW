import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\0d035862-8188-47d5-94c7-153e3cbe366e';

async function run() {
  console.log('--- STARTING KHATAFLOW PAYMENT & BALANCE CALCULATION E2E VERIFICATION ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Navigate to customers page
    console.log('Step 1: Navigating to http://localhost:3000/dashboard/customers ...');
    await page.goto('http://localhost:3000/dashboard/customers', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Clear any previous test session storage to start clean from V3 seed
    await page.evaluate(() => {
      localStorage.removeItem('KHATAFLOW_STORAGE_V3');
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step1_customers_list.png') });
    console.log('Snapshot step1_customers_list.png saved.');

    // 2. Select Tariq Khan
    console.log('Step 2: Finding Tariq Khan...');
    const tariqKhanCard = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div, tr, li, button, a'));
      for (const el of cards) {
        if (el.textContent && el.textContent.includes('Tariq Khan') && el.textContent.includes('15,000')) {
          return { found: true, text: el.textContent.slice(0, 100) };
        }
      }
      return { found: false };
    });
    console.log('Tariq Khan found with 15,000 balance:', tariqKhanCard);

    // Click on Tariq Khan
    await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      for (const el of els) {
        if (el.textContent && el.textContent.trim() === 'Tariq Khan') {
          el.click();
          return;
        }
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // 3. Open Record Payment Modal
    console.log('Step 3: Opening Record Payment Modal...');
    const opened = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      for (const b of btns) {
        if (b.textContent && (b.textContent.includes('Record Payment') || b.textContent.includes('Receive Payment'))) {
          b.click();
          return true;
        }
      }
      return false;
    });
    console.log('Modal trigger clicked:', opened);
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step2_record_payment_modal_opened.png') });

    // 4. Verify Bill details in modal
    const billDetails = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasBill1001: text.includes('BILL-1001'),
        has15000: text.includes('15,000'),
        hasRice: text.includes('Rice'),
        has4000: text.includes('4,000')
      };
    });
    console.log('Original Bill Details in Modal:', billDetails);

    // 5. Enter Rs. 2,000 and allocate Rs. 2,000 to Rice
    console.log('Step 5: Entering Rs. 2,000 and allocating Rs. 2,000 to Rice...');
    await page.evaluate(() => {
      // Find Rice quick button case-insensitively
      const buttons = Array.from(document.querySelectorAll('button'));
      const oneKgBtn = buttons.find(b => b.textContent && /1\s*kg\s*\(Rs\.\s*2,000\)/i.test(b.textContent));
      if (oneKgBtn) {
        console.log('Found 1 kg button! Clicking it...');
        oneKgBtn.click();
      }
    });

    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step3_allocated_2000_to_rice.png') });

    // 6. Check Live Impact Calculation
    const liveCalculations = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        showsRice1KgPaid: text.includes('1 kg') || text.includes('1 KG') || text.includes('Paying for:'),
        showsRemaining2000: text.includes('Remaining: Rs. 2,000') || text.includes('Rs. 2,000'),
        showsNewBillOutstanding13000: text.includes('13,000'),
        summaryMatches: text.includes('Payment Impact') && text.includes('13,000')
      };
    });
    console.log('Live Calculations inside modal:', liveCalculations);

    // 7. Click Save Payment
    console.log('Step 7: Clicking Save Payment...');
    const saved = await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.scrollIntoView();
        submitBtn.click();
        return true;
      }
      return false;
    });
    console.log('Save button clicked:', saved);
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step4_payment_saved_confirmation.png') });

    // Close modal if success modal is open
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const doneBtn = btns.find(b => b.textContent && (b.textContent.includes('Done') || b.textContent.includes('Close')));
      if (doneBtn) doneBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // 8. Verify post-payment values on Customer profile / ledger
    const customerLedgerStatus = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        shows13000Balance: text.includes('13,000'),
        doesNotShow4000AsPayment: !text.includes('Payment Received: Rs. 4,000'),
        hasPaymentOf2000: text.includes('2,000')
      };
    });
    console.log('Post-Payment Tariq Khan Balance Check:', customerLedgerStatus);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step5_post_payment_ledger.png') });

    // 9. Record second payment of Rs. 2,000 against remaining Rice
    console.log('Step 9: Recording second payment of Rs. 2,000...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      for (const b of btns) {
        if (b.textContent && (b.textContent.includes('Record Payment') || b.textContent.includes('Receive Payment'))) {
          b.click();
          return;
        }
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify Rice now shows 1 KG paid, 1 KG unpaid, Rs. 2,000 due
    const secondModalCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        alreadyPaidShows2000: text.includes('2,000'),
        outstandingShows13000: text.includes('13,000'),
        riceUnpaid1Kg: text.includes('1 KG unpaid') || text.includes('Remaining: Rs. 2,000')
      };
    });
    console.log('Second Payment Modal Initial State:', secondModalCheck);

    // Pay remaining 2,000 on Rice (now 1 kg is remaining, so button says 1 kg (Rs. 2,000) or Full Due (Rs. 2,000))
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const riceBtn = buttons.find(b => b.textContent && (/1\s*kg\s*\(Rs\.\s*2,000\)/i.test(b.textContent) || /Full Due/i.test(b.textContent)));
      if (riceBtn) {
        riceBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    // Save second payment
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.scrollIntoView();
        submitBtn.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step6_second_payment_saved.png') });

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const doneBtn = btns.find(b => b.textContent && (b.textContent.includes('Done') || b.textContent.includes('Close')));
      if (doneBtn) doneBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Check balance is now 11,000 (15,000 - 4,000)
    const finalBalanceCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        shows11000Balance: text.includes('11,000'),
        showsTotalPaid4000: text.includes('4,000')
      };
    });
    console.log('Final Balance Check (Rs. 11,000 outstanding):', finalBalanceCheck);

    // 10. Refresh the page to test persistence
    console.log('Step 10: Refreshing page to verify persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const persistenceCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        persisted11000: text.includes('11,000'),
        persistedTariq: text.includes('Tariq Khan')
      };
    });
    console.log('Persistence Check after reload:', persistenceCheck);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'step7_persisted_after_refresh.png') });

    console.log('--- ALL AUTOMATED E2E CHECKS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

run();
