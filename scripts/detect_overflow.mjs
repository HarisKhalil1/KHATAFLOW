import puppeteer from "puppeteer-core";

const viewports = [
  { name: "Desktop (1366x768)", width: 1366, height: 768 },
  { name: "Tablet (768x1024)", width: 768, height: 1024 },
  { name: "Mobile (390x844)", width: 390, height: 844 },
];

const urls = [
  "http://localhost:3000",
  "http://localhost:3000/superadmin",
  "http://localhost:3000/dashboard",
  "http://localhost:3000/dashboard/customers",
  "http://localhost:3000/dashboard/khata",
  "http://localhost:3000/dashboard/payments",
  "http://localhost:3000/dashboard/expenses",
  "http://localhost:3000/dashboard/reports",
  "http://localhost:3000/dashboard/settings",
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  console.log("=== CHECKING HORIZONTAL SCROLL / OVERFLOW ===");

  for (const vp of viewports) {
    console.log(`\n--- Testing ${vp.name} ---`);
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const url of urls) {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 15000 }).catch(() => {});

      const result = await page.evaluate(() => {
        const docScrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const innerWidth = window.innerWidth;
        const hasHorizontalScroll = docScrollWidth > innerWidth || bodyScrollWidth > innerWidth;

        // Find elements wider than viewport or sticking out
        const overflowingElements = [];
        const allElements = document.querySelectorAll("*");
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > innerWidth + 1) {
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              className: (el.className || "").toString().slice(0, 100),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              text: (el.innerText || "").slice(0, 40).replace(/\n/g, " "),
            });
          }
        }

        return {
          hasHorizontalScroll,
          docScrollWidth,
          bodyScrollWidth,
          innerWidth,
          overflowCount: overflowingElements.length,
          topOverflows: overflowingElements.slice(0, 5),
        };
      }, vp.width);

      if (result.hasHorizontalScroll) {
        console.log(`[FAIL] ${url} | scrollWidth: ${result.docScrollWidth}px > innerWidth: ${result.innerWidth}px`);
        console.log(`       Overflowing elements: ${result.overflowCount}`);
        for (const ov of result.topOverflows) {
          console.log(`       -> <${ov.tag}> id="${ov.id}" class="${ov.className}" right=${ov.right}px width=${ov.width}px text="${ov.text}"`);
        }
      } else {
        console.log(`[PASS] ${url} | scrollWidth: ${result.docScrollWidth}px <= ${result.innerWidth}px`);
      }
    }
  }

  await browser.close();
}

run().catch(console.error);
