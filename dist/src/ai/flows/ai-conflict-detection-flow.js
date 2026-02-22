'use server';
/**
 * @fileOverview An AI agent that detects scheduling conflicts for contests.
 *
 * - detectSchedulingConflicts - A function that handles the conflict detection process.
 * - ConflictDetectionInput - The input type for the detectSchedulingConflicts function.
 * - ConflictDetectionOutput - The return type for the detectSchedulingConflicts function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
const ContestEntrySchema = z.object({
    id: z.string().describe('Unique identifier for the contest.'),
    name: z.string().describe('Name of the contest.'),
    startTime: z.string().datetime().describe('Start time of the contest in ISO 8601 format.'),
    endTime: z.string().datetime().describe('End time of the contest in ISO 8601 format.'),
});
const ConflictDetectionInputSchema = z.object({
    contests: z.array(ContestEntrySchema).describe('An array of contest entries.'),
});
const ConflictSchema = z.object({
    type: z.enum(['overlap', 'high_density', 'other']).describe('Type of scheduling conflict.'),
    description: z.string().describe('Detailed description of the conflict.'),
    contestsInvolved: z
        .array(z.string())
        .describe('IDs of contests involved in this conflict.'),
});
const ConflictDetectionOutputSchema = z.object({
    conflicts: z.array(ConflictSchema).describe('An array of detected scheduling conflicts.'),
    summary: z.string().describe('A summary of all detected conflicts, if any.'),
    hasConflicts: z.boolean().describe('True if any conflicts were detected, false otherwise.'),
});
export async function detectSchedulingConflicts(input) {
    return conflictDetectionFlow(input);
}
const conflictDetectionPrompt = ai.definePrompt({
    name: 'conflictDetectionPrompt',
    input: { schema: ConflictDetectionInputSchema },
    output: { schema: ConflictDetectionOutputSchema },
    prompt: `You are an AI assistant specialized in detecting scheduling conflicts for events.
Your task is to analyze a list of contest entries and identify any potential scheduling conflicts.

Consider the following types of conflicts:
1.  **Overlap**: When two or more contests have overlapping time periods.
2.  **High Density**: When too many contests occur within a very short time frame (e.g., one contest ends and another begins within 60 minutes).

Analyze the provided contest data and identify all conflicts. For each conflict, specify its type, a detailed description, and the IDs of the contests involved. Provide an overall summary and indicate if any conflicts were found.

Contest entries:
{{#each contests}}
  - ID: {{this.id}}, Name: "{{this.name}}", Start: {{this.startTime}}, End: {{this.endTime}}
{{/each}}`,
});
const conflictDetectionFlow = ai.defineFlow({
    name: 'conflictDetectionFlow',
    inputSchema: ConflictDetectionInputSchema,
    outputSchema: ConflictDetectionOutputSchema,
}, async (input) => {
    const { output } = await conflictDetectionPrompt(input);
    return output;
});
