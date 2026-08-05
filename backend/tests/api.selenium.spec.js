const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testBackendHealth() {
  // Selenium is primarily for UI, but we can hit the endpoint and parse the JSON response shown in the browser.
  let options = new chrome.Options();
  options.addArguments('--headless');
  
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
    
  try {
    await driver.get('http://localhost:3000/health');
    let pageText = await driver.findElement({ css: 'body' }).getText();
    let json = JSON.parse(pageText);
    if (json.status) {
      console.log('Selenium Test Passed: Found status in response');
    } else {
      console.log('Selenium Test Failed: Invalid response format');
    }
  } catch (error) {
    console.error('Selenium Test Failed with error:', error.message);
  } finally {
    await driver.quit();
  }
}

testBackendHealth();
