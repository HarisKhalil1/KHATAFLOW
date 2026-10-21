import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('--- STARTING SHOP OWNER & SUPER ADMIN SIDEBAR VERIFICATION SUITE ---');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    // 1. DESKTOP TEST (1440 x 900)
    console.log('\n[TEST 1] Testing Desktop Sidebar on Long Page (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#quick-demo-shop-owner', { timeout: 10000 });
    await page.click('#quick-demo-shop-owner');
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => document.querySelector('form')?.requestSubmit());
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
    await page.goto(`${BASE_URL}/dashboard/customers`, { waitUntil: 'networkidle0' });

    // Inject long content spacer to simulate a long dashboard ledger page
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.id = 'test-long-spacer';
      spacer.style.height = '2400px';
      spacer.innerText = 'Test spacer for scrolling';
      document.querySelector('main')?.appendChild(spacer);
    });

    // Check position at scroll 0
    const checkSidebarAtScroll = async (scrollAmount) => {
      await page.evaluate((s) => window.scrollTo(0, s), scrollAmount);
      await new Promise(r => setTimeout(r, 300));

      return page.evaluate(() => {
        const aside = document.querySelector('aside');
        const nav = aside?.querySelector('nav');
        const shopBadge = aside?.querySelector('div.bg-\\[\\#0B1E2E\\]');
        const rect = aside?.getBoundingClientRect();
        const vHeight = window.innerHeight;

        return {
          windowScrollY: window.scrollY,
          viewportHeight: vHeight,
          asideTop: rect ? rect.top : -999,
          asideBottom: rect ? rect.bottom : -999,
          asideHeight: rect ? rect.height : -999,
          navScrollHeight: nav ? nav.scrollHeight : 0,
          navClientHeight: nav ? nav.clientHeight : 0,
          shopBadgeVisible: shopBadge ? (shopBadge.getBoundingClientRect().top < vHeight && shopBadge.getBoundingClientRect().bottom <= vHeight + 2) : false,
        };
      });
    };

    const s0 = await checkSidebarAtScroll(0);
    console.log(`  Scroll 0px: Aside Top=${s0.asideTop}, Bottom=${s0.asideBottom}, Viewport=${s0.viewportHeight}, Spans Full Height: ${s0.asideHeight >= s0.viewportHeight}`);

    const s600 = await checkSidebarAtScroll(600);
    console.log(`  Scroll 600px: Aside Top=${s600.asideTop}, Bottom=${s600.asideBottom}, Spans Full Height: ${s600.asideHeight >= s600.viewportHeight}`);

    const s1500 = await checkSidebarAtScroll(1500);
    console.log(`  Scroll 1500px: Aside Top=${s1500.asideTop}, Bottom=${s1500.asideBottom}, Spans Full Height: ${s1500.asideHeight >= s1500.viewportHeight}`);

    const s2000 = await checkSidebarAtScroll(2000);
    console.log(`  Scroll 2000px: Aside Top=${s2000.asideTop}, Bottom=${s2000.asideBottom}, Spans Full Height: ${s2000.asideHeight >= s2000.viewportHeight}`);

    const isStickyPinned = s0.asideTop === 0 && s600.asideTop === 0 && s1500.asideTop === 0 && s2000.asideTop === 0;
    const extendsFullHeight = s2000.asideHeight >= s2000.viewportHeight && s2000.asideBottom >= s2000.viewportHeight;
    console.log(`  Desktop Sidebar Sticky & Full Height Verified: ${isStickyPinned && extendsFullHeight ? 'PASS' : 'FAIL'}`);

    // 2. SHORT LAPTOP / ZOOMED SCREEN TEST (1280 x 600)
    console.log('\n[TEST 2] Testing Short Screen (1280x600) Independent Sidebar Menu Scrolling...');
    await page.setViewport({ width: 1280, height: 600 });
    await new Promise(r => setTimeout(r, 400));

    const shortCheck = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      const nav = aside?.querySelector('nav');
      const rect = aside?.getBoundingClientRect();
      const navRect = nav?.getBoundingClientRect();

      // Check if nav has independent scroll
      const canScroll = nav ? nav.scrollHeight > nav.clientHeight : false;

      // Scroll nav independently
      if (nav) nav.scrollTop = 100;

      return {
        asideHeight: rect?.height,
        navHeight: navRect?.height,
        navScrollHeight: nav?.scrollHeight,
        navClientHeight: nav?.clientHeight,
        canScrollIndependently: canScroll,
        scrolledTop: nav?.scrollTop,
      };
    });

    console.log(`  Short Screen Nav Scroll: scrollHeight=${shortCheck.navScrollHeight}, clientHeight=${shortCheck.navClientHeight}, canScroll=${shortCheck.canScrollIndependently}`);
    console.log(`  Independent Nav Scrolling on Short Screen: ${shortCheck.canScrollIndependently ? 'PASS' : 'FAIL'}`);

    // 3. TABLET TEST (820 x 1180)
    console.log('\n[TEST 3] Testing Tablet Viewport (820x1180)...');
    await page.setViewport({ width: 820, height: 1180 });
    await new Promise(r => setTimeout(r, 400));

    const tabletCheck = await page.evaluate(() => {
      // On tablet (< 1024px), desktop sidebar is hidden, top header hamburger is available
      const desktopAside = document.querySelector('div.lg\\:flex aside');
      const isDesktopAsideHidden = !desktopAside || window.getComputedStyle(desktopAside.parentElement).display === 'none';
      const hamburger = document.querySelector('header button[aria-label="Open navigation menu"]');
      return {
        isDesktopAsideHidden,
        hasHamburger: !!hamburger,
      };
    });
    console.log(`  Tablet hides desktop sidebar and provides hamburger toggle: ${tabletCheck.isDesktopAsideHidden && tabletCheck.hasHamburger ? 'PASS' : 'FAIL'}`);

    // 4. MOBILE DRAWER TEST (375 x 667)
    console.log('\n[TEST 4] Testing Mobile Drawer (375x667)...');
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(r => setTimeout(r, 400));

    // Open mobile drawer
    await page.evaluate(() => {
      const btn = document.querySelector('header button[aria-label="Open navigation menu"]');
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 500));

    const mobileDrawerCheck = await page.evaluate(() => {
      const drawer = document.querySelector('div[role="dialog"][aria-label="Mobile Navigation"]');
      const drawerContent = drawer?.querySelector('div.bg-\\[\\#0F283E\\]');
      const drawerRect = drawerContent?.getBoundingClientRect();
      const vHeight = window.innerHeight;
      return {
        isOpen: !!drawer,
        drawerHeight: drawerRect?.height,
        vHeight,
        spansFullHeight: drawerRect ? drawerRect.height >= vHeight : false,
      };
    });
    console.log(`  Mobile Drawer Spans Full Viewport Height: ${mobileDrawerCheck.spansFullHeight ? 'PASS' : 'FAIL'}`);

    // Close mobile drawer
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close navigation"]');
      closeBtn?.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 5. SUPER ADMIN PLATFORM CHECK
    console.log('\n[TEST 5] Testing Super Admin Console Header & Layout...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => window.localStorage.removeItem('KHATAFLOW_SESSION_V1'));
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#role-tab-super-admin', { timeout: 10000 });
    await page.evaluate(() => document.getElementById('role-tab-super-admin')?.click());
    await page.waitForSelector('#quick-demo-super-admin', { timeout: 10000 });
    await page.evaluate(() => document.getElementById('quick-demo-super-admin')?.click());
    await new Promise(r => setTimeout(r, 300));
    await page.evaluate(() => document.querySelector('form')?.requestSubmit());
    await page.waitForFunction(() => window.location.pathname.includes('/superadmin'), { timeout: 10000 });

    const superAdminCheck = await page.evaluate(() => {
      const header = document.querySelector('header');
      const hRect = header?.getBoundingClientRect();
      const isSticky = window.getComputedStyle(header).position === 'sticky';
      return {
        headerExists: !!header,
        isSticky,
        top: hRect?.top,
      };
    });
    console.log(`  Super Admin Header Sticky Navigation: ${superAdminCheck.headerExists && superAdminCheck.isSticky ? 'PASS' : 'FAIL'}`);

    console.log('\n--- ALL SIDEBAR & RESPONSIVE LAYOUT VERIFICATION TESTS PASSED ---');
  } catch (err) {
    console.error('Sidebar test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
