'use server';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as puppeteer from 'puppeteer';
import ical from 'node-ical';
import { mergeContests } from './contest-merger';
const CONTEST_DATA_DIR = path.join(process.cwd(), 'src', 'data', 'contest');
const filePaths = {
    atcoder: path.join(CONTEST_DATA_DIR, 'atcoder_events.json'),
    codechef: path.join(CONTEST_DATA_DIR, 'codechef_events.json'),
    codeforces: path.join(CONTEST_DATA_DIR, 'codeforces_events.json'),
    gfg: path.join(CONTEST_DATA_DIR, 'gfg_contests.json'),
    leetcode: path.join(CONTEST_DATA_DIR, 'leetcode_events.json'),
    codolio: path.join(CONTEST_DATA_DIR, 'codolio_events.json'),
    google: path.join(CONTEST_DATA_DIR, 'google_calendar_contests.json'),
    programming: path.join(CONTEST_DATA_DIR, 'programming_contests.json'),
};
const saveJSON = (filePath, data) => {
    if (!fs.existsSync(CONTEST_DATA_DIR)) {
        fs.mkdirSync(CONTEST_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✅ Saved ${path.basename(filePath)} (${data.length} contests)`);
};
async function fetchAtCoder() {
    try {
        const { data } = await axios.get("https://kenkoooo.com/atcoder/resources/contests.json");
        saveJSON(filePaths.atcoder, data);
    }
    catch (err) {
        console.error("❌ AtCoder Error:", err.message);
    }
}
async function fetchCodeChef() {
    var _a, _b, _c;
    try {
        const proxyUrl = "https://go.x2u.in/proxy?email=22311a6904@iot.sreenidhi.edu.in&apiKey=962d6cf0&url=";
        const targetUrl = "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all";
        const { data } = await axios.get(proxyUrl + targetUrl);
        if (data.status !== "success")
            throw new Error("API returned failure");
        saveJSON(filePaths.codechef, [...((_a = data.future_contests) !== null && _a !== void 0 ? _a : []), ...((_b = data.present_contests) !== null && _b !== void 0 ? _b : []), ...((_c = data.past_contests) !== null && _c !== void 0 ? _c : [])]);
    }
    catch (err) {
        console.error("❌ CodeChef Error:", err.message);
    }
}
async function fetchCodeforces() {
    try {
        const { data } = await axios.get("https://codeforces.com/api/contest.list?gym=false");
        if (data.status !== "OK")
            throw new Error("API failed");
        saveJSON(filePaths.codeforces, data.result);
    }
    catch (err) {
        console.error("❌ Codeforces Error:", err.message);
    }
}
async function fetchGFG() {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto("https://practice.geeksforgeeks.org/events", { waitUntil: "networkidle2" });
        await new Promise((resolve) => setTimeout(resolve, 6000));
        const contests = await page.evaluate(() => Array.from(document.querySelectorAll("a"))
            .map(card => { var _a; return ({ name: (_a = card.innerText) === null || _a === void 0 ? void 0 : _a.trim(), url: card.href }); })
            .filter(c => c.url && c.url.includes("/contest") && c.name && c.name.length > 5));
        saveJSON(filePaths.gfg, contests);
    }
    catch (err) {
        console.error("❌ GFG Error:", err.message);
    }
    finally {
        if (browser)
            await browser.close();
    }
}
async function fetchLeetCode() {
    try {
        const { data } = await axios.post("https://leetcode.com/graphql", { query: `query { allContests { title titleSlug startTime duration isVirtual } }` }, { headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" } });
        saveJSON(filePaths.leetcode, data.data.allContests);
    }
    catch (err) {
        console.error("❌ LeetCode Error:", err.message);
    }
}
async function fetchCodolio() {
    try {
        const url = `https://node.codolio.com/api/contest-calendar/v1/all/get-contests?startDate=${encodeURIComponent("2020-01-01T00:00:00.000Z")}&endDate=${encodeURIComponent("2030-12-31T23:59:59.000Z")}`;
        const { data } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json", "Origin": "https://codolio.com", "Referer": "https://codolio.com/" },
        });
        saveJSON(filePaths.codolio, data);
    }
    catch (err) {
        console.error("❌ Codolio Error:", err.message);
    }
}
async function fetchGoogleCalendar(url, file) {
    try {
        const { data } = await axios.get(url);
        const events = Object.values(ical.parseICS(data))
            .filter((event) => event !== undefined && event.type === "VEVENT");
        saveJSON(file, events);
    }
    catch (err) {
        console.error(`❌ Error fetching ${path.basename(file)}:`, err.message);
    }
}
let isRefreshingInProgress = false;
export async function refreshContests() {
    if (isRefreshingInProgress)
        return;
    isRefreshingInProgress = true;
    console.log('Refreshing contests from all platforms...');
    try {
        await Promise.all([
            fetchAtCoder(),
            fetchCodeChef(),
            fetchCodeforces(),
            fetchGFG(),
            fetchLeetCode(),
            fetchCodolio(),
            fetchGoogleCalendar("https://calendar.google.com/calendar/ical/efcajlnqvdqjeoud2spsiphnqk%40group.calendar.google.com/public/basic.ics", filePaths.google),
            fetchGoogleCalendar("https://calendar.google.com/calendar/ical/k23j233gtcvau7a8ulk2p360m4%40group.calendar.google.com/public/basic.ics", filePaths.programming)
        ]);
    }
    catch (e) {
        console.error('Refresh failed', e);
    }
    finally {
        isRefreshingInProgress = false;
    }
}
function parseDescription(description) {
    if (!description)
        return { clean_description: '' };
    const linkRegex = /<a href="(.*?)">.*?<\/a>/;
    const byRegex = /by <a href=".*?">(.*?)<\/a>/;
    const linkMatch = description.match(linkRegex);
    const byMatch = description.match(byRegex);
    const parsed_url = linkMatch ? linkMatch[1] : undefined;
    const author = byMatch ? byMatch[1] : undefined;
    let parsed_rated;
    if (description.toLowerCase().includes('rated'))
        parsed_rated = "Rated";
    else if (description.toLowerCase().includes('unrated'))
        parsed_rated = "Unrated";
    const clean_description = description.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim();
    return { parsed_url, author, parsed_rated, clean_description };
}
export async function getContests() {
    const allFiles = Object.values(filePaths);
    const filesArePopulated = allFiles.every(file => fs.existsSync(file) && fs.readFileSync(file, 'utf-8').length > 2);
    if (!filesArePopulated) {
        await refreshContests();
    }
    let allContests = [];
    try {
        allContests.push(...JSON.parse(fs.readFileSync(filePaths.atcoder, 'utf-8')).map(atcoderAdapter));
    }
    catch (_a) {
        console.error('Error processing AtCoder');
    }
    try {
        allContests.push(...JSON.parse(fs.readFileSync(filePaths.codechef, 'utf-8')).map(codechefAdapter));
    }
    catch (_b) {
        console.error('Error processing CodeChef');
    }
    try {
        allContests.push(...JSON.parse(fs.readFileSync(filePaths.codeforces, 'utf-8')).map(codeforcesAdapter));
    }
    catch (_c) {
        console.error('Error processing Codeforces');
    }
    try {
        allContests.push(...JSON.parse(fs.readFileSync(filePaths.gfg, 'utf-8')).map(gfgAdapter));
    }
    catch (_d) {
        console.error('Error processing GFG');
    }
    try {
        allContests.push(...JSON.parse(fs.readFileSync(filePaths.leetcode, 'utf-8')).map(leetcodeAdapter));
    }
    catch (_e) {
        console.error('Error processing LeetCode');
    }
    try {
        allContests.push(...JSON.parse(fs.readFileSync(filePaths.codolio, 'utf-8')).map(codolioAdapter));
    }
    catch (_f) {
        console.error('Error processing Codolio');
    }
    try {
        allContests.push(...JSON.parse(fs.readFileSync(filePaths.google, 'utf-8')).map(googleCalendarAdapter));
    }
    catch (_g) {
        console.error('Error processing Google Calendar');
    }
    try {
        allContests.push(...JSON.parse(fs.readFileSync(filePaths.programming, 'utf-8')).map(googleCalendarAdapter));
    }
    catch (_h) {
        console.error('Error processing Programming Contests');
    }
    const uniqueContests = Array.from(new Map(allContests.filter(c => c.startTime && c.endTime).map(c => [c.id, c])).values());
    uniqueContests.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return uniqueContests;
}
// Adapters
const atcoderAdapter = (c) => ({ id: c.id, name: c.title, startTime: new Date(c.start_epoch_second * 1000).toISOString(), endTime: new Date((c.start_epoch_second + c.duration_second) * 1000).toISOString(), durationMinutes: c.duration_second / 60, url: `https://atcoder.jp/contests/${c.id}`, rated: c.rate_change !== '0', platform: 'AtCoder' });
const codechefAdapter = (c) => ({ platform: "CodeChef", name: c.contest_name, id: c.contest_code, url: `https://www.codechef.com/contests/${c.contest_code}`, startTime: new Date(c.contest_start_date_iso || c.contest_start_date).toISOString(), endTime: new Date(c.contest_end_date_iso || c.contest_end_date).toISOString(), durationMinutes: parseInt(c.contest_duration, 10), status: c.status });
const codeforcesAdapter = (c) => ({ id: c.id, name: c.name, type: c.type, status: c.phase, rated: !(c.type !== "CF" || c.name.toLowerCase().includes("unrated")), startTime: new Date(c.startTimeSeconds * 1000).toISOString(), endTime: new Date((c.startTimeSeconds + c.durationSeconds) * 1000).toISOString(), durationMinutes: c.durationSeconds / 60, url: `https://codeforces.com/contest/${c.id}`, platform: 'Codeforces' });
const gfgAdapter = (c) => (Object.assign(Object.assign({}, c), { id: `gfg-${c.url.split('/').pop() || Math.random()}`, platform: "GeeksforGeeks", startTime: new Date().toISOString(), endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() }));
const leetcodeAdapter = (c) => ({ platform: "LeetCode", name: c.title, id: c.titleSlug, startTime: new Date(c.startTime * 1000).toISOString(), endTime: new Date((c.startTime * 1000) + (c.duration * 1000)).toISOString(), durationMinutes: c.duration / 60, url: `https://leetcode.com/contest/${c.titleSlug}`, status: c.startTime * 1000 > Date.now() ? 'UPCOMING' : 'PAST', rated: 'N/A' });
const codolioAdapter = (c) => ({ id: c._id, name: c.contestName, platform: c.platform, startTime: c.startTime, endTime: c.endTime, durationMinutes: c.durationInSeconds / 60, url: c.url, rated: c.isRated, status: c.status });
const googleCalendarAdapter = (c) => { var _a, _b, _c; const { parsed_url, author, parsed_rated, clean_description } = parseDescription(c.description); return { id: c.uid, name: c.summary || "No Title", startTime: ((_a = c.start) === null || _a === void 0 ? void 0 : _a.toISOString()) || new Date().toISOString(), endTime: ((_b = c.end) === null || _b === void 0 ? void 0 : _b.toISOString()) || new Date().toISOString(), description: clean_description, description_html: c.description, url: ((_c = c.url) === null || _c === void 0 ? void 0 : _c.val) || c.url || parsed_url, platform: 'Community', author, rated: parsed_rated }; };
if (typeof window === 'undefined') {
    if (!global.contestRefreshInterval) {
        console.log("Setting up 10-minute contest refresh and merge interval...");
        const refreshAndMerge = async () => {
            console.log('Starting contest refresh...');
            await refreshContests();
            console.log('Refresh complete. Starting merge...');
            await mergeContests();
            console.log('Merge complete.');
        };
        // Run once on startup
        refreshAndMerge().catch(err => console.error("Initial contest refresh/merge failed:", err));
        // Schedule subsequent runs
        global.contestRefreshInterval = setInterval(() => {
            refreshAndMerge().catch(err => console.error("Scheduled contest refresh/merge failed:", err));
        }, 10 * 60 * 1000);
    }
}
