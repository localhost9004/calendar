import { refreshContests } from './src/lib/contest-fetchers';
async function main() {
    try {
        await refreshContests();
        console.log('Contest data refreshed and merged successfully.');
    }
    catch (error) {
        console.error('An error occurred during the refresh and merge process:', error);
        process.exit(1);
    }
}
main();
