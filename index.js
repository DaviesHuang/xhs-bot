const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// const SEARCH_TERM = "Lenny's newsletter";
const SEARCH_TERM = "英国 summer internship";

// Initialize Supabase client
SUPABASE_URL='https://iewihlevlwwxrfflezdi.supabase.co'
SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2lobGV2bHd3eHJmZmxlemRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMzc5ODksImV4cCI6MjA1NDcxMzk4OX0.xA_vBTFH_EJ3L04XOdD9vdwNyKXB3XtpV1ougF9AWUo'
const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

async function saveInteractionToSupabase(searchTerm, noteTitle, interactionType) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          search_term: searchTerm,
          note_title: noteTitle,
          interaction_type: interactionType,
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
    
    console.log('Successfully saved to Supabase for note:', noteTitle);
    return data;
  } catch (error) {
    console.error('Failed to save to Supabase:', error);
    throw error;
  }
}

async function getInteractionsFromSupabase(searchTerm = null) {
  try {
    let query = supabase
      .from('comments')
      .select('*')
      .order('timestamp', { ascending: false });
    
    // If searchTerm is provided, filter by it
    if (searchTerm) {
      query = query.eq('search_term', searchTerm);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error reading from Supabase:', error);
      throw error;
    }
    
    console.log(`Found ${data.length} interactions${searchTerm ? ` for "${searchTerm}"` : ''}`);
    return data;
  } catch (error) {
    console.error('Failed to read from Supabase:', error);
    throw error;
  }
}

async function connectToBrowser() {
  try {
    // Connect to existing Chrome instance
    // Chrome needs to be started with --remote-debugging-port=9222
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    console.log('Connected to browser');

    // Create a new page and navigate to URL
    const context = browser.contexts()[0];
    const page = await context.newPage();
    await page.goto('https://www.xiaohongshu.com/explore');
    // await page.goto('https://www.xiaohongshu.com/search_result?keyword=Lenny%27s%2520newsletter&source=web_explore_feed');

    const title = await page.title();
    console.log('Page title:', title);

    // Wait for the search bar to be visible
    // Note: You may need to adjust the selector based on the actual page structure
    const searchBar = await page.waitForSelector('#search-input', { timeout: 5000 });

    // Type "Lenny" into the search bar with human-like typing speed
    await searchBar.type(SEARCH_TERM, { delay: 100 }); // Adds 100ms delay between keystrokes

    if (!searchBar) {
      throw new Error('Could not find search bar');
    }

    await page.keyboard.press('Enter');

    // Wait for and hover over the filter-box element
    await page.waitForSelector('.filter-box');
    await page.waitForTimeout(2000);
    await page.hover('.filter-box');
    await page.waitForTimeout(1000);
    await page.click('.dropdown-items span:has-text("最新")');
    await page.waitForTimeout(10000);

    // Get all interactions for the current search term
    const previousInteractions = await getInteractionsFromSupabase(SEARCH_TERM);
    console.log('Previous interactions:', previousInteractions);

    // Find all note items
    const noteItems = await page.locator('section.note-item').all();
    console.log(`Found ${noteItems.length} note items`);

    // Loop through each note item
    for (const noteItem of noteItems) {
        const noteTitle = await noteItem.locator('a.title').textContent();
        console.log('Processing note:', noteTitle);

        // Check if we've already interacted with this note
        const hasInteracted = previousInteractions.some(
            interaction => interaction.note_title === noteTitle
        );

        if (hasInteracted) {
            console.log('Already interacted with note:', noteTitle);
            continue;
        }

        // Click the note item
        await noteItem.click();
        await page.waitForTimeout(5000);

        // Wait for and click the comment button
        await page.waitForSelector('.engage-bar .content-edit');
        await page.click('.engage-bar .content-edit');
        await page.waitForTimeout(2000);
        await page.keyboard.type("我做了一个可以自动投递岗位的工具, 欢迎dd", { delay: 100 });
        await page.waitForTimeout(2000);

        // Save interaction using the extracted method
        await saveInteractionToSupabase(SEARCH_TERM, noteTitle, 'comment');

        // Go back to the search results
        await page.goBack();
        await page.waitForTimeout(5000);
    }

    console.log("End of the script")
  } catch (error) {
    console.error('Error during browser automation:', error);
    throw error;
  }
}

connectToBrowser();
