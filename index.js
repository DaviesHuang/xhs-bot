const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const SEARCH_TERM = "Lenny newsletter 产品经理";
// const SEARCH_TERM = "英国 summer internship";

const WAIT_TIME_MINUTES = 30;

const COMMENT_TEXT_LIST = [
    "感谢详细的分享！正好我也在考虑订阅Lenny的newsletter，有兴趣的朋友可以dd我一起share成本～",
    "内容很有价值！想问问评论区有没有人已经在用Lenny's newsletter？我想找小伙伴一起订阅，可以dd我。",
    "学到很多！Lenny的newsletter确实很强，不过订阅费有点贵，有同学想要一起订阅的吗？可以互相学习交流～",
    "说得真好！对了，我在找人一起订阅Lenny's newsletter，感兴趣的小伙伴可以dd我，一起学习成长！",
    "总结得很到位！顺便问一下，有打算订阅的朋友吗？我想找人share，有意者dd我。",
    "收藏了！正好也想订阅这个newsletter，不过想找人一起分摊费用，有想法的朋友欢迎dd我～",
    "讲得特别清楚，谢谢分享！话说有没有朋友想要一起订阅Lenny's newsletter的？可以组个小组一起学习。",
    "谢谢分享！不知道有没有打算订阅Lenny的newsletter的朋友，可以一起share订阅，欢迎dd我。",
    "干货满满！Lenny的newsletter我关注很久了，想找小伙伴一起订阅，有兴趣的可以dd我。",
    "谢谢分享，学到了！另外想问问，有想一起订阅Lenny的newsletter的朋友吗？可以dd我～"
]

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

async function smoothScroll(page) {
    // Get the total height of the page
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    let currentPosition = 0;
    
    while (currentPosition < viewportHeight) {
        await page.evaluate((scrollStep) => {
            window.scrollBy(0, scrollStep);
        }, 100); // Scroll 100 pixels at a time
        
        currentPosition += 100;
        await page.waitForTimeout(500); // Wait 500ms between scrolls for smoothness
        
        // Log progress
        const progress = Math.min((currentPosition / viewportHeight * 100), 100).toFixed(0);
        console.log(`Scrolling... ${progress}% complete`);
    }
    
    await page.waitForTimeout(1000);
}

async function waitWithProgress(page, minutes) {
    const totalWaitTime = 60000 * minutes; // Convert minutes to milliseconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < totalWaitTime) {
        const timeElapsed = Date.now() - startTime;
        const timeRemaining = totalWaitTime - timeElapsed;
        const minutesRemaining = Math.ceil(timeRemaining / 60000);
        
        console.log(`Waiting... ${minutesRemaining} minutes remaining`);
        await page.waitForTimeout(10000); // Wait 10 seconds before next log
    }
}

async function main() {
  try {
    // Connect to existing Chrome instance
    // Chrome needs to be started with --remote-debugging-port=9222
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    console.log('Connected to browser');

    // Create a new page and navigate to URL
    const context = browser.contexts()[0];
    const page = await context.newPage();
    await page.goto('https://www.xiaohongshu.com/explore');

    const title = await page.title();
    console.log('Page title:', title);

    // Wait for the search bar to be visible
    const searchBar = await page.waitForSelector('#search-input', { timeout: 5000 });

    // Type into the search bar with human-like typing speed
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
    let previousInteractions = await getInteractionsFromSupabase(SEARCH_TERM);
    console.log('Fetched previous interactions');

    // Find all note items
    let noteItems = await page.locator('section.note-item').all();
    console.log(`Found ${noteItems.length} note items`);

    let currentIndex = 0;
    while (currentIndex < noteItems.length) {
        const noteItem = noteItems[currentIndex];
        
        // Check if the note has a title element
        const titleElement = await noteItem.locator('a.title').count();
        if (titleElement === 0) {
            console.log(`Skipping note ${currentIndex + 1}/${noteItems.length}: No title element found`);
        } else {
            const noteTitle = await noteItem.locator('a.title').textContent();
            console.log(`Processing note ${currentIndex + 1}/${noteItems.length}:`, noteTitle);
    
            // Check if we've already interacted with this note
            const hasInteracted = previousInteractions.some(
                interaction => interaction.note_title === noteTitle
            );
    
            if (hasInteracted) {
                console.log('Already interacted with note:', noteTitle);
            } else {
                // Click the note item
                await noteItem.click();
                await page.waitForTimeout(10000);
        
                // Wait for and click the comment button
                await page.waitForSelector('.engage-bar .content-edit');
                await page.click('.engage-bar .content-edit');
                await page.waitForTimeout(2000);
                const randomComment = COMMENT_TEXT_LIST[Math.floor(Math.random() * COMMENT_TEXT_LIST.length)];
                await page.keyboard.type(randomComment, { delay: 100 });
                await page.waitForTimeout(2000);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(2000);
        
                await page.click('.engage-bar .like-lottie');
                await page.waitForTimeout(2000);
        
                // Save interaction using the extracted method
                await saveInteractionToSupabase(SEARCH_TERM, noteTitle, 'comment');
        
                // Go back to the search results
                await page.goBack();
                await waitWithProgress(page, WAIT_TIME_MINUTES); // Wait for 30 minutes
                
            }
        }

        currentIndex++;

        if (currentIndex >= noteItems.length) {
            console.log('Reached the end of current notes, fetching new notes...');
              // After loading the search results and before processing notes
            console.log('Starting smooth scroll...');
            await smoothScroll(page);
            console.log('Finished scrolling');
            await page.waitForTimeout(10000);

            previousInteractions = await getInteractionsFromSupabase(SEARCH_TERM);
            console.log('Fetched previous interactions');

            noteItems = await page.locator('section.note-item').all();
            console.log(`Found ${noteItems.length} note items`);  

            currentIndex = 0;
        }
    }

    console.log("End of the script")
  } catch (error) {
    console.error('Error during browser automation:', error);
    throw error;
  }
}

main();
