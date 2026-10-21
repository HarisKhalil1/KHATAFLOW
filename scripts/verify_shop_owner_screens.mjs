import puppeteer from "puppeteer-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function verifyOwnerScreens() {
  console.log("==================================================================");
  console.log("VERIFYING SHOP OWNER SCREENS & EMPTY BUSINESS DATA");
  console.log("==================================================================");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  // Initialize a fresh genuine shop owner session with 0 demo data
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    const testShop = {
      id: "SHOP-PK-9999",
      name: "New Real Store",
      ownerName: "Akram Khan",
      ownerPhone: "0300-1122334",
      category: "General Store",
      city: "Peshawar",
      address: "Main Saddar Road",
      createdAt: new Date().toISOString(),
      status: "active",
      isClaimed: true,
      isDemoCreated: false,
      claimCode: "CLAIM-AKRAM9",
    };
    localStorage.setItem("KHATAFLOW_SHOP_REGISTRY_V1", JSON.stringify([testShop]));
    localStorage.setItem("KHATAFLOW_ACTIVE_SHOP_ID", "SHOP-PK-9999");
    localStorage.setItem("KHATAFLOW_SESSION_V1", JSON.stringify({
      userId: "user-owner-99",
      username: "akramkhan",
      email: "akram@khataflow.pk",
      role: "shop-owner",
      shopId: "SHOP-PK-9999",
      name: "Akram Khan",
    }));
  });

  // 1. Visit /dashboard
  console.log("\n[1] Checking /dashboard...");
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  const dashboardState = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasKhyber: body.includes("Khyber General Store"),
      hasHaji: body.includes("Haji Abdul Rehman"),
      hasTariq: body.includes("Tariq Mehmood"),
      hasGul: body.includes("Gul Khan"),
      hasHarris: /harris/i.test(body),
      hasHaris: /haris/i.test(body),
      hasRyan: /\b(ryan)\b/i.test(body),
      hasRayan: /\b(rayan)\b/i.test(body),
      bodySnippet: body.slice(0, 300).replace(/\n/g, " "),
    };
  });
  console.log("Dashboard state check:", dashboardState);

  if (
    dashboardState.hasKhyber ||
    dashboardState.hasHaji ||
    dashboardState.hasTariq ||
    dashboardState.hasGul ||
    dashboardState.hasHarris ||
    dashboardState.hasHaris ||
    dashboardState.hasRyan ||
    dashboardState.hasRayan
  ) {
    throw new Error("FAILED: Demo names detected on /dashboard!");
  }
  console.log("✓ /dashboard verified: No demo names or demo shops.");

  // 2. Visit /dashboard/customers
  console.log("\n[2] Checking /dashboard/customers...");
  await page.goto("http://localhost:3000/dashboard/customers", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  const customersState = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasEmptyMessage: body.includes("No customers registered yet") || body.includes("No customers found"),
      hasCards: document.querySelectorAll(".grid > div").length > 0,
      customerCardsCount: document.querySelectorAll("[data-testid='customer-card']").length,
    };
  });
  console.log("Customers page state:", customersState);
  if (!customersState.hasEmptyMessage) {
    throw new Error("FAILED: /dashboard/customers did not show clean empty message!");
  }
  console.log("✓ /dashboard/customers verified: Clean empty customer state.");

  // 3. Visit /dashboard/khata
  console.log("\n[3] Checking /dashboard/khata...");
  await page.goto("http://localhost:3000/dashboard/khata", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  const khataState = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasEmptyKhataNotice: body.includes("No Khata Accounts Yet") || body.includes("Select Khata Account"),
      hasAddCustomerBtn: body.includes("+ Add New Customer"),
    };
  });
  console.log("Khata page state:", khataState);
  if (!khataState.hasEmptyKhataNotice) {
    throw new Error("FAILED: /dashboard/khata did not show clean empty khata state!");
  }
  console.log("✓ /dashboard/khata verified: Clean empty khata state.");

  // 4. Visit /dashboard/payments
  console.log("\n[4] Checking /dashboard/payments...");
  await page.goto("http://localhost:3000/dashboard/payments", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  const paymentsState = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      totalCollectedZero: body.includes("Rs. 0"),
      hasEmptyTable: body.includes("No payment records found"),
    };
  });
  console.log("Payments page state:", paymentsState);
  if (!paymentsState.hasEmptyTable) {
    throw new Error("FAILED: /dashboard/payments did not show empty payment records!");
  }
  console.log("✓ /dashboard/payments verified: 0 payments, clean empty table.");

  // 5. Visit /dashboard/expenses
  console.log("\n[5] Checking /dashboard/expenses...");
  await page.goto("http://localhost:3000/dashboard/expenses", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  const expensesState = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      totalLoggedZero: body.includes("Rs. 0"),
      zeroEntries: body.includes("(0 entries)"),
    };
  });
  console.log("Expenses page state:", expensesState);
  if (!expensesState.totalLoggedZero || !expensesState.zeroEntries) {
    throw new Error("FAILED: /dashboard/expenses did not show 0 entries!");
  }
  console.log("✓ /dashboard/expenses verified: 0 expenses, clean empty list.");

  // 6. Visit /dashboard/reports
  console.log("\n[6] Checking /dashboard/reports...");
  await page.goto("http://localhost:3000/dashboard/reports", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  const reportsState = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasKhyber: body.includes("Khyber"),
      hasTariq: body.includes("Tariq"),
      bodySnippet: body.slice(0, 300).replace(/\n/g, " "),
    };
  });
  console.log("Reports page state:", reportsState);
  if (reportsState.hasKhyber || reportsState.hasTariq) {
    throw new Error("FAILED: Demo names detected on /dashboard/reports!");
  }
  console.log("✓ /dashboard/reports verified: No demo shop or customer references.");

  // 7. Visit /dashboard/settings
  console.log("\n[7] Checking /dashboard/settings...");
  await page.goto("http://localhost:3000/dashboard/settings", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  const settingsState = await page.evaluate(() => {
    const body = document.body.innerText;
    const inputs = Array.from(document.querySelectorAll("input")).map((i) => i.value);
    return {
      hasHardcodedKhyber: inputs.includes("Khyber General Store"),
      hasHardcodedHaji: inputs.includes("Haji Abdul Rehman"),
      hasHardcodedPhone: inputs.includes("0300-9876543"),
      inputs,
      hasResetDemoText: body.includes("re-initialize the original demo store dataset"),
    };
  });
  console.log("Settings page state:", {
    hasHardcodedKhyber: settingsState.hasHardcodedKhyber,
    hasHardcodedHaji: settingsState.hasHardcodedHaji,
    hasHardcodedPhone: settingsState.hasHardcodedPhone,
    hasResetDemoText: settingsState.hasResetDemoText,
  });

  if (settingsState.hasHardcodedKhyber || settingsState.hasHardcodedHaji || settingsState.hasHardcodedPhone) {
    throw new Error("FAILED: Hardcoded demo store details found in /dashboard/settings inputs!");
  }
  if (settingsState.hasResetDemoText) {
    throw new Error("FAILED: 're-initialize demo store dataset' text found in /dashboard/settings!");
  }
  console.log("✓ /dashboard/settings verified: No hardcoded demo store details or demo reset copy.");

  await browser.close();

  console.log("\n==================================================================");
  console.log("ALL SHOP OWNER SCREENS VERIFIED 100% CLEAN OF DEMO DATA!");
  console.log("==================================================================");
}

verifyOwnerScreens().catch((err) => {
  console.error("❌ OWNER SCREENS ERROR:", err);
  process.exit(1);
});
