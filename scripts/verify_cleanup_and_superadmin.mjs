import puppeteer from "puppeteer-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function run() {
  console.log("==================================================================");
  console.log("KHATAFLOW END-TO-END VERIFICATION: CLEANUP, SUPERADMIN, SHOP LIFECYCLE & OVERFLOW");
  console.log("==================================================================");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1366,768"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));

  // -------------------------------------------------------------
  // TEST B: Super Admin Authentication
  // -------------------------------------------------------------
  console.log("\n[TEST B] Testing Super Admin Login via UI...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

  // Select Super Admin role tab in login card (not navbar language switcher)
  await page.evaluate(() => {
    const roleContainer = document.querySelector('div[aria-label="Login role selection"]');
    if (roleContainer) {
      const btns = roleContainer.querySelectorAll("button");
      if (btns[1]) btns[1].click();
    }
  });
  await new Promise((r) => setTimeout(r, 400));

  // Type credentials using real keyboard events for React state
  await page.click("#login-email");
  await page.type("#login-email", "admin@khataflow.pk", { delay: 30 });

  await page.click("#login-password");
  await page.type("#login-password", "admin123", { delay: 30 });

  // Submit login form
  const submitButton = await page.$('button[type="submit"]');
  if (submitButton) {
    await submitButton.click();
  }

  // Wait for client-side routing to /superadmin
  await page.waitForFunction(() => window.location.pathname === "/superadmin", { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 600));

  const currentUrl = page.url();
  console.log(`Current URL after login: ${currentUrl}`);
  if (!currentUrl.includes("/superadmin")) {
    throw new Error(`TEST B FAILED: Did not redirect to /superadmin, url is ${currentUrl}`);
  }
  console.log("✓ TEST B PASSED: Super Admin logged in successfully and console opened.");

  // -------------------------------------------------------------
  // TEST C: Demo Cleanup
  // -------------------------------------------------------------
  console.log("\n[TEST C] Verifying Demo Data Cleanup...");
  const registryState = await page.evaluate(() => {
    const raw = localStorage.getItem("KHATAFLOW_SHOP_REGISTRY_V1");
    const shops = raw ? JSON.parse(raw) : [];
    const legacyKeys = [
      localStorage.getItem("KHATAFLOW_STORAGE_V3"),
      localStorage.getItem("KHATAFLOW_STORAGE_SHOP-PK-001"),
      localStorage.getItem("KHATAFLOW_STORAGE_SHOP-PK-002"),
      localStorage.getItem("KHATAFLOW_STORAGE_SHOP-PK-003"),
    ].filter(Boolean);

    const bodyText = document.body.innerText;
    const hasOldKhyber = /khyber/i.test(bodyText);
    const hasOldMadina = /madina/i.test(bodyText);
    const hasOldRehman = /rehman/i.test(bodyText);
    const hasHarris = /\b(harris)\b/i.test(bodyText);
    const hasHaris = /\b(haris)\b/i.test(bodyText);
    const hasRyan = /\b(ryan)\b/i.test(bodyText);
    const hasRayan = /\b(rayan)\b/i.test(bodyText);

    return {
      shopsCount: shops.length,
      legacyKeysCount: legacyKeys.length,
      hasOldKhyber,
      hasOldMadina,
      hasOldRehman,
      hasHarris,
      hasHaris,
      hasRyan,
      hasRayan,
      shops,
    };
  });

  console.log(`Shops in registry: ${registryState.shopsCount}`);
  console.log(`Legacy keys remaining: ${registryState.legacyKeysCount}`);
  console.log(`Old demo names present in UI: Khyber=${registryState.hasOldKhyber}, Madina=${registryState.hasOldMadina}, Rehman=${registryState.hasOldRehman}, Harris=${registryState.hasHarris}, Haris=${registryState.hasHaris}, Ryan=${registryState.hasRyan}, Rayan=${registryState.hasRayan}`);

  if (
    registryState.hasOldKhyber ||
    registryState.hasOldMadina ||
    registryState.hasOldRehman ||
    registryState.hasHarris ||
    registryState.hasHaris ||
    registryState.hasRyan ||
    registryState.hasRayan
  ) {
    throw new Error("TEST C FAILED: Old demo shops or names still present in UI!");
  }
  if (registryState.legacyKeysCount > 0) {
    throw new Error("TEST C FAILED: Legacy storage keys were not cleaned!");
  }

  // Refresh page and verify clean state holds
  console.log("Refreshing page to ensure clean state persists...");
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));

  const afterRefreshShopsCount = await page.evaluate(() => {
    const raw = localStorage.getItem("KHATAFLOW_SHOP_REGISTRY_V1");
    return raw ? JSON.parse(raw).length : 0;
  });

  if (afterRefreshShopsCount !== 0) {
    throw new Error(`TEST C FAILED: Demo shops were reseeded on refresh! Count: ${afterRefreshShopsCount}`);
  }
  console.log("✓ TEST C PASSED: Demo cleanup verified. Registry starts clean with 0 old demo shops.");

  // -------------------------------------------------------------
  // TEST D: Fresh Shop Creation with Unique ID and Claim Code
  // -------------------------------------------------------------
  console.log("\n[TEST D] Creating a fresh shop as Super Admin...");

  // Click "+ Register New Shop (Admin)" button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const registerBtn = buttons.find((b) => b.innerText.includes("Register New Shop"));
    if (registerBtn) registerBtn.click();
  });

  await new Promise((r) => setTimeout(r, 600));

  // Fill in shop creation form
  await page.evaluate(() => {
    const setVal = (input, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, val);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const nameInput = document.querySelector('input[placeholder*="Saddar Grocery"]');
    const cityInput = document.querySelector('input[placeholder*="Peshawar"]');
    const ownerNameInput = document.querySelector('input[placeholder*="Abdul Samad"]');
    const ownerPhoneInput = document.querySelector('input[placeholder*="0300-1234567"]');

    if (nameInput) setVal(nameInput, "Peshawar Modern Mart");
    if (cityInput) setVal(cityInput, "Peshawar");
    if (ownerNameInput) setVal(ownerNameInput, "Irfan Ullah");
    if (ownerPhoneInput) setVal(ownerPhoneInput, "0333-5566778");

    const generateBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.innerText.includes("Generate Shop")
    );
    if (generateBtn) generateBtn.click();
  });

  await new Promise((r) => setTimeout(r, 800));

  // Verify modal shows generated shop ID and Claim Code
  const creationResult = await page.evaluate(() => {
    const body = document.body.innerText;
    const hasSuccess = body.includes("Shop Account Successfully Generated!");
    const matchId = body.match(/SHOP-PK-\d+/);
    const matchClaim = body.match(/CLAIM-[A-Z0-9]+/);

    return {
      hasSuccess,
      shopId: matchId ? matchId[0] : null,
      claimCode: matchClaim ? matchClaim[0] : null,
    };
  });

  console.log(`Generated Shop ID: ${creationResult.shopId}`);
  console.log(`Generated Claim Code: ${creationResult.claimCode}`);

  if (!creationResult.shopId || !creationResult.claimCode) {
    throw new Error("TEST D FAILED: Shop ID or Claim Code was not generated!");
  }

  // Click Done button to close modal and wait for modal to disappear
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const doneBtn = buttons.find((b) => b.innerText.trim() === "Done");
    if (doneBtn) doneBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Check shop appears in Shop Directory table
  const tableCheck = await page.evaluate((shopId) => {
    const rows = Array.from(document.querySelectorAll("table tr"));
    const foundRow = rows.find((r) => r.innerText.includes(shopId));
    return {
      rowFound: Boolean(foundRow),
      rowText: foundRow ? foundRow.innerText.replace(/\n/g, " ") : null,
    };
  }, creationResult.shopId);

  if (!tableCheck.rowFound) {
    throw new Error("TEST D FAILED: Newly created shop does not appear in table!");
  }
  console.log(`Table row: ${tableCheck.rowText}`);

  console.log("Opening Shop Details modal...");
  // Find the Details button in the matching table row and click it using evaluate
  const clickSuccess = await page.evaluate((shopId) => {
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    const targetRow = rows.find((r) => r.innerText.includes(shopId));
    if (!targetRow) return "Target row not found";
    const detailsBtn = Array.from(targetRow.querySelectorAll("button")).find(
      (b) => b.innerText.trim() === "Details"
    );
    if (!detailsBtn) return "Details button not found in row";
    detailsBtn.click();
    return "Clicked";
  }, creationResult.shopId);
  console.log("Details button click status:", clickSuccess);

  await new Promise((r) => setTimeout(r, 1000));

  // Check what modals or text are present (case-insensitive because Tailwind uppercase transforms innerText)
  const modalDetails = await page.evaluate(() => {
    const text = (document.body.innerText + " " + document.body.textContent).toLowerCase();
    const modalHeaders = Array.from(document.querySelectorAll("h3")).map(h => h.innerText);
    return {
      hasRecord: text.includes("shop administrative record"),
      hasClaimCodeSection: text.includes("shop claim code"),
      hasDeleteDemoAction: text.includes("delete demo shop"),
      headers: modalHeaders,
      bodyHasShopDetails: text.includes("owner invitation"),
    };
  });
  console.log("Modal Details check:", modalDetails);

  if (!modalDetails.hasRecord || !modalDetails.hasClaimCodeSection) {
    throw new Error("TEST D FAILED: Shop Details modal did not show administrative record or claim code!");
  }
  console.log("✓ TEST D PASSED: Shop created with unique Shop ID and Claim Code. Displayed in table & details modal.");

  // -------------------------------------------------------------
  // TEST E: Delete Demo Shop Workflow (Cancel and Confirm)
  // -------------------------------------------------------------
  console.log("\n[TEST E] Testing Delete Demo Shop workflow...");

  // Click Delete Demo Shop from details modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const delBtn = buttons.find((b) => b.innerText.includes("Delete Demo Shop"));
    if (delBtn) delBtn.click();
  });

  await new Promise((r) => setTimeout(r, 600));

  // Check confirmation dialog opened
  const confirmDialogOpen = await page.evaluate(() => {
    return document.body.innerText.includes("Confirm Demo Shop Deletion");
  });

  if (!confirmDialogOpen) {
    throw new Error("TEST E FAILED: Delete confirmation dialog did not open!");
  }
  console.log("Delete confirmation dialog displayed.");

  // Step 1: Click Cancel and verify shop is NOT deleted
  console.log("Testing Cancel action...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const cancelBtn = buttons.find((b) => b.innerText.includes("Cancel (Keep Shop)"));
    if (cancelBtn) cancelBtn.click();
  });

  await new Promise((r) => setTimeout(r, 500));

  const stillExistsAfterCancel = await page.evaluate((shopId) => {
    return document.body.innerText.includes(shopId);
  }, creationResult.shopId);

  if (!stillExistsAfterCancel) {
    throw new Error("TEST E FAILED: Shop was deleted even after clicking Cancel!");
  }
  console.log("✓ Cancel verified: Shop remains unchanged.");

  // Step 2: Open delete confirmation and confirm deletion
  console.log("Re-opening delete confirmation and confirming deletion...");
  const openDelStatus = await page.evaluate((shopId) => {
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    const targetRow = rows.find((r) => r.innerText.includes(shopId));
    if (!targetRow) return "Target row not found";
    const delBtn = Array.from(targetRow.querySelectorAll("button")).find(
      (b) => b.innerText.trim().includes("Delete Demo")
    );
    if (!delBtn) return "Delete Demo button not found in row";
    delBtn.click();
    return "Clicked Delete Demo in row";
  }, creationResult.shopId);
  console.log("Open delete dialog status:", openDelStatus);

  await new Promise((r) => setTimeout(r, 600));

  // Click Confirm & Delete Demo Shop
  const confirmStatus = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const confirmBtn = buttons.find((b) => 
      b.innerText.toLowerCase().includes("confirm & delete") || 
      b.innerText.toLowerCase().includes("delete demo shop")
    );
    if (!confirmBtn) {
      return `Confirm button not found among: [${buttons.map(b => b.innerText.replace(/\n/g, ' ')).join(', ')}]`;
    }
    confirmBtn.click();
    return "Confirm button clicked";
  });
  console.log("Confirm action status:", confirmStatus);

  await new Promise((r) => setTimeout(r, 800));

  // Verify shop is gone from table and storage (note: toast notification contains shop ID to confirm deletion)
  const existsAfterDelete = await page.evaluate((shopId) => {
    const raw = localStorage.getItem("KHATAFLOW_SHOP_REGISTRY_V1");
    const shops = raw ? JSON.parse(raw) : [];
    const inStorage = shops.some((s) => s.id === shopId);
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    const inTable = rows.some((r) => r.innerText.includes(shopId));
    return { inStorage, inTable };
  }, creationResult.shopId);
  console.log("After delete check:", existsAfterDelete);

  if (existsAfterDelete.inStorage || existsAfterDelete.inTable) {
    throw new Error(`TEST E FAILED: Shop is still present in directory table after deletion! storage=${existsAfterDelete.inStorage}, table=${existsAfterDelete.inTable}`);
  }

  // Refresh page and confirm deletion is permanent
  await page.reload({ waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));

  const existsAfterReload = await page.evaluate((shopId) => {
    const raw = localStorage.getItem("KHATAFLOW_SHOP_REGISTRY_V1");
    const shops = raw ? JSON.parse(raw) : [];
    const inStorage = shops.some((s) => s.id === shopId);
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    const inTable = rows.some((r) => r.innerText.includes(shopId));
    return inStorage || inTable;
  }, creationResult.shopId);

  if (existsAfterReload) {
    throw new Error("TEST E FAILED: Deleted shop returned after reload!");
  }
  console.log("✓ TEST E PASSED: Delete Demo Shop workflow verified (cancel preserves, confirm permanently deletes).");

  // -------------------------------------------------------------
  // TEST F: Horizontal Scrolling Check across Viewports
  // -------------------------------------------------------------
  console.log("\n[TEST F] Verifying Horizontal Scrolling across viewports...");
  const viewports = [
    { name: "Desktop", width: 1366, height: 768 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Mobile", width: 390, height: 844 },
  ];

  const testUrls = [
    "http://localhost:3000",
    "http://localhost:3000/superadmin",
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    for (const u of testUrls) {
      await page.goto(u, { waitUntil: "networkidle0" });
      const scrollCheck = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth;
        const iw = window.innerWidth;
        return {
          scrollWidth: sw,
          innerWidth: iw,
          overflow: sw > iw,
        };
      });

      console.log(`  [${vp.name} ${vp.width}x${vp.height}] ${u} -> scrollWidth: ${scrollCheck.scrollWidth}px, innerWidth: ${scrollCheck.innerWidth}px (overflow: ${scrollCheck.overflow})`);
      if (scrollCheck.overflow) {
        throw new Error(`TEST F FAILED: Horizontal overflow detected on ${u} at ${vp.name} (${scrollCheck.scrollWidth}px > ${scrollCheck.innerWidth}px)`);
      }
    }
  }
  console.log("✓ TEST F PASSED: Zero horizontal overflow across Desktop, Tablet, and Mobile viewports.");

  console.log("\n==================================================================");
  console.log("ALL VERIFICATION SUITES COMPLETED WITH 100% SUCCESS!");
  console.log("==================================================================");

  await browser.close();
}

run().catch((err) => {
  console.error("\n❌ SUITE ERROR:", err);
  process.exit(1);
});
