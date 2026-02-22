'use server';
import { getContests, refreshContests } from '@/lib/contest-fetchers';
export async function getLiveContestsAction() {
    try {
        console.log('Fetching live contests...');
        const contests = await getContests();
        console.log(`Successfully fetched ${contests.length} live contests.`);
        return contests;
    }
    catch (error) {
        console.error('Error fetching live contests:', error);
        throw new Error('Failed to fetch live contests.');
    }
}
export async function forceRefreshContestsAction() {
    try {
        console.log('Force refreshing contests...');
        await refreshContests();
        console.log('Contest refresh complete.');
        const contests = await getContests();
        console.log(`Successfully fetched ${contests.length} contests after refresh.`);
        return contests;
    }
    catch (error) {
        console.error('Error force refreshing contests:', error);
        throw new Error('Failed to force refresh contests.');
    }
}
