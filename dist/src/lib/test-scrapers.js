import { refreshContests } from './contest-fetchers';
async function testScrapers() {
    console.log('Starting scraper test...');
    await refreshContests();
    console.log('Scraper test finished.');
}
testScrapers();
