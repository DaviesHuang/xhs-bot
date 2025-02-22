# Xiaohongshu Automation Script

This project contains a Playwright automation script for interacting with Xiaohongshu (小红书), a Chinese social media platform. The script demonstrates automated browsing, searching, and interaction capabilities.

## Prerequisites

- Node.js (v14 or higher)
- Google Chrome browser
- Playwright

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Chrome with remote debugging enabled:
   ```bash
   # For Windows
   "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

   # For MacOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

   # For Linux
   google-chrome --remote-debugging-port=9222
   ```

3. Run the script:
   ```bash
   node index.js
   ```

