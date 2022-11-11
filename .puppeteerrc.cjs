const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    cacheDirectory: join(__dirname, 'storage', 'cache', 'puppeteer'),
};