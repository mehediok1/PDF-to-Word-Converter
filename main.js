const { Actor } = require('apify');
const { PlaywrightCrawler, Dataset } = require('crawlee');

Actor.main(async () => {
    const input = await Actor.getInput();

    const {
        startUrls = [
            {
                url: 'https://zoneoftools.com/tools/pdf-to-word'
            }
        ],
        maxCrawlDepth = 0,
        maxCrawlPages = 1
    } = input;

    const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: maxCrawlPages,

        async requestHandler({ page, request, log }) {
            log.info(`Crawling: ${request.url}`);

            // Wait for the page to load
            await page.waitForLoadState('domcontentloaded');

            // Give JavaScript content some time to render
            await page.waitForTimeout(1000);

            // Extract page information
            const data = await page.evaluate(() => {
                const getMetaContent = (name) => {
                    const element =
                        document.querySelector(`meta[name="${name}"]`) ||
                        document.querySelector(`meta[property="${name}"]`);

                    return element?.getAttribute('content') || '';
                };

                // Remove unwanted elements from a cloned document
                const clone = document.body.cloneNode(true);

                clone.querySelectorAll(
                    'script, style, noscript, iframe, svg, nav, footer, header'
                ).forEach((element) => element.remove());

                const content = clone.innerText
                    .replace(/\s+/g, ' ')
                    .trim();

                return {
                    url: window.location.href,
                    title: document.title || '',
                    description: getMetaContent('description'),
                    content
                };
            });

            // Save the extracted data to the Apify Dataset
            await Dataset.pushData(data);

            log.info(`Successfully extracted content from: ${request.url}`);
        },

        async failedRequestHandler({ request, log }) {
            log.error(`Request failed: ${request.url}`);
        },
    });

    // Add start URLs
    await crawler.addRequests(
        startUrls.map((item) => ({
            url: item.url,
            userData: {
                depth: 0
            }
        }))
    );

    await crawler.run();

    log.info('Crawling finished successfully.');
});
