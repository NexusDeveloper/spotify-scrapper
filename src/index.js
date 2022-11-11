const puppeteer = require('puppeteer');
const cliArgs = require('./cli-args');
const {loadCookies, saveCookies} = require("./utils");

/**
 * @param {import('puppeteer').Browser} browser
 * @return {Promise<void>}
 */
const close = browser => {
    return browser.close().catch(() => {
        console.error("Couldn't close browser correctly");

        return undefined;
    });
}

/**
 * @param {string|null|undefined} message
 * @param {import('puppeteer').Browser} browser
 * @param {number} [code]
 * @return {(function(): Promise<void>)}
 */
const fatal = (message, browser, code = 1) => {
    return () => {
        message && console.error(message);

        return close(browser).finally(() => {
            process.exit(code);
        });
    }
}

module.exports = async () => {
    const DEBUG = process.env.DEBUG === 'true';

    const args = await cliArgs;
    const request = args._.join(' ');

    const browser = await puppeteer.launch({
        headless: !DEBUG,
        args: ['--lang=en-USA']
    });
    const page = await browser.pages().then(pages => {
        return pages.length ? pages[0] : browser.newPage();
    });

    if (DEBUG) {
        await page.setViewport({
            width: 1920, height: 1080,
        });
    }

    await loadCookies(page);
    await page.goto('https://spotify.com');

    // click accept cookies button
    await page.click('#onetrust-accept-btn-handler').then(() => {
        return saveCookies(page);
    }).catch(() => null);

    // authorize if needed
    await page.click('header button[data-testid="login-button"]').then(() => {
        return page.waitForNavigation({waitUntil: 'load'});
    }).then(() => {
        return page.type('input[id="login-username"]', args.login, {
            delay: 100,
        }).then(() => {
            return page.type('input[id="login-password"]', args.password, {
                delay: 100,
            });
        }).then(() => {
            return page.focus('input[id="login-password"]')
                .then(() => {
                    page.keyboard.press('Enter');
                });
        });
    }).then(() => {
        return page.waitForNavigation({waitUntil: 'load'});
    }).catch(() => null);
    await saveCookies(page);

    await page.waitForSelector('#main nav button[type="button"][data-testid="create-playlist-button"]', {
        timeout: 60000,
    })
        .then(elem => elem.click())
        .catch(fatal("Couldn't find the «Create new playlist» button", browser));

    const searchInput = await page.waitForSelector('#main main [role="search"] input[role="searchbox"]', {
        timeout: 60000// in ms
    }).catch(fatal("Couldn't await a page of the created playlist", browser));

    const spotifyResponse = await Promise.all([
        page.waitForResponse(response => {
            return (
                response.ok() &&
                response.request().method() === 'GET' &&
                response.url().includes('/pathfinder/v1/query?operationName=queryInlineCurationSearch')
            );
        }, {timeout: 60000}).catch(fatal("Couldn't await response from Spotify's server", browser)),
        searchInput.type(request, {delay: 100}),
    ]).then(([response]) => {
        return response.json();
    }).catch(reason => {
        return fatal(reason, browser)();
    });

    await browser.close();

    return args.onlySimplifiedTracks ?
        spotifyResponse?.data?.searchV2?.episodes?.items.map(({data}) => {
            return {
                id: data.id,
                name: data.name,
                coverArts: data.coverArt?.sources ?? [],
                podcast: data.podcastV2?.data?.name,
            };
        }) :
        spotifyResponse?.data ?? {};
};