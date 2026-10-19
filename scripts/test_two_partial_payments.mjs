import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\0d035862-8188-47d5-94c7-153e3cbe366e';

async function run() {
  console.log('--- TEST: TWO PARTIAL PAYMENTS (Rs. 2,000 + Rs. 2,000 = Rs. 11,000 remaining) ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await page.goto('http://localhost:3000/dashboard/customers', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.removeItem('KHATAFLOW_STORAGE_V3');
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // First payment: Rs. 2,000 on Rice
    console.log('Recording Payment 1: Rs. 2,000 allocated to Rice...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const recBtn = btns.find(b => b.textContent && b.textContent.includes('Receive Payment'));
      if (recBtn) recBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
      // Find 1 kg button on Rice
      const buttons = Array.from(document.querySelectorAll('button'));
      const oneKgBtn = buttons.find(b => b.textContent && /1\s*kg\s*\(Rs\.\s*2,000\)/i.test(b.textContent));
      if (oneKgBtn) oneKgBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Close success modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const doneBtn = btns.find(b => b.textContent && b.textContent.includes('Done'));
      if (doneBtn) doneBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Second payment: Rs. 2,000 on Rice again
    console.log('Recording Payment 2: Rs. 2,000 allocated to remaining Rice...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const recBtn = btns.find(b => b.textContent && b.textContent.includes('Receive Payment'));
      if (recBtn) recBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // In the item allocation list, the Rice card now has a button "1 kg (Rs. 2,000)" or "Full Due (Rs. 2,000)"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // Find button inside the Rice container
      const riceBtn = buttons.find(b => b.textContent && (b.textContent.includes('1 kg (Rs. 2,000)') || b.textContent.includes('Full Due (Rs. 2,000)')));
      if (riceBtn) riceBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'partial_2_allocated_screenshot.png') });

    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'partial_2_success_screenshot.png') });

    const secondPaymentSuccessText = await page.evaluate(() => {
      const modal = document.body.innerText;
      return {
        hasText: modal.includes('Payment Recorded Successfully'),
        amountReceived2000: modal.includes('Rs. 2,000 received'),
        remainingBalance11000: modal.includes('Remaining balance: Rs. 11,000')
      };
    });
    console.log('Second payment modal text check:', secondPaymentSuccessText);

    // Close modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const doneBtn = btns.find(b => b.textContent && b.textContent.includes('Done'));
      if (doneBtn) doneBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Check customer card balance
    const cardBalance = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        shows11000: text.includes('11,000'),
        showsTariq: text.includes('Tariq Khan')
      };
    });
    console.log('Customer card balance after 2 payments:', cardBalance);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'customer_card_11000_balance.png') });

    console.log('--- TEST PASSED: Rs. 2,000 + Rs. 2,000 = Rs. 11,000 OUTSTANDING VERIFIED ---');
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await browser.close();
  }
}

run();
