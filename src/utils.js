const puppeteerConfig = require("../.puppeteerrc");
const path = require("path");
const {promises: fs} = require("fs");

const getCookiesFilePath = (() => {
    const dir = puppeteerConfig.cacheDirectory ?? path.join(require('node:os').homedir(), '.cache', 'puppeteer');

    return () => path.join(dir, 'cookies.json');
})();

/**
 * @param {import('puppeteer').Page} page
 * @return {Promise<void>}
 */
const saveCookies = async (page) => {
    const cookies = await page.cookies();

    await fs.writeFile(getCookiesFilePath(), JSON.stringify(cookies));
}

/**
 * @param {import('puppeteer').Page} page
 * @return {Promise<void>}
 */
const loadCookies = async (page) => {
    const cookiesJson = await fs.readFile(getCookiesFilePath()).catch(() => null);
    if (!cookiesJson) {
        return;
    }

    const cookies = JSON.parse(cookiesJson.toString());
    if (Array.isArray(cookies)) {
        await page.setCookie(...cookies);
    }
}

module.exports = {
    loadCookies,
    saveCookies,
};