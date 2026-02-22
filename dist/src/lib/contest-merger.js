import fs from 'fs';
import path from 'path';
import { getContests } from './contest-fetchers';
const CONTEST_DATA_DIR = path.join(process.cwd(), 'src', 'data');
const contestJsonPath = path.join(CONTEST_DATA_DIR, 'contests.json');
const allContestFields = [
    'id',
    'name',
    'startTime',
    'endTime',
    'url',
    'platform',
    'durationMinutes',
    'rated',
    'status',
    'description',
    'description_html',
    'author',
    'type',
];
export async function mergeContests() {
    try {
        const contests = await getContests();
        const standardizedContests = contests.map(contest => {
            const newContest = {};
            for (const field of allContestFields) {
                newContest[field] = contest[field] === undefined ? null : contest[field];
            }
            return newContest;
        });
        if (!fs.existsSync(CONTEST_DATA_DIR)) {
            fs.mkdirSync(CONTEST_DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(contestJsonPath, JSON.stringify(standardizedContests, null, 2), 'utf-8');
        console.log(`✅ Saved contest.json (${standardizedContests.length} contests)`);
    }
    catch (error) {
        console.error('Error merging contests:', error);
    }
}
