const { chromium } = require('playwright');

async function connectToBrowser() {
  try {
    // Connect to existing Chrome instance
    // Chrome needs to be started with --remote-debugging-port=9222
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    console.log('Connected to browser');

    // Create a new page and navigate to URL
    const context = browser.contexts()[0];
    const page = await context.newPage();
    // await page.goto('https://www.xiaohongshu.com/explore');
    await page.goto('https://www.xiaohongshu.com/search_result?keyword=Lenny%27s%2520newsletter&source=web_explore_feed');

    const title = await page.title();
    console.log('Page title:', title);

    // // Wait for the search bar to be visible
    // // Note: You may need to adjust the selector based on the actual page structure
    // const searchBar = await page.waitForSelector('#search-input', { timeout: 5000 });

    // // Type "Lenny" into the search bar with human-like typing speed
    // await searchBar.type("Lenny's newsletter", { delay: 100 }); // Adds 100ms delay between keystrokes

    // if (!searchBar) {
    //   throw new Error('Could not find search bar');
    // }

    // await page.keyboard.press('Enter');

    // Wait for and hover over the filter-box element
    await page.waitForSelector('.filter-box');
    await page.waitForTimeout(2000);
    await page.hover('.filter-box');
    await page.waitForTimeout(1000);
    await page.click('.dropdown-items span:has-text("最新")');
    await page.waitForLoadState('networkidle');

    // Find all note items
    const noteItems = await page.locator('section.note-item').all();
    console.log(`Found ${noteItems.length} note items`);

    // Click the first note item
    const noteTitle = await noteItems[0].locator('a.title').textContent();
    console.log('First note title:', noteTitle);
    await noteItems[0].click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // // Like the note
    // await page.waitForSelector('.like-lottie');
    // await page.click('.like-lottie');

    // Wait for and click the comment button
    await page.waitForSelector('.engage-bar .content-edit');
    await page.click('.engage-bar .content-edit');
    await page.waitForTimeout(2000);

    console.log("End of the script")
  } catch (error) {
    console.error('Error during browser automation:', error);
    throw error;
  }
}

connectToBrowser();
