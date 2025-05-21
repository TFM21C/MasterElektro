'use server';

/**
 * @fileOverview A circuit configuration suggestion AI agent.
 *
 * - suggestCircuitConfiguration - A function that handles the circuit configuration suggestion process.
 * - SuggestCircuitConfigurationInput - The input type for the suggestCircuitConfiguration function.
 * - SuggestCircuitConfigurationOutput - The return type for the suggestCircuitConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCircuitConfigurationInputSchema = z.object({
  circuitDescription: z
    .string()
    .describe('A description of the desired circuit behavior in natural language.'),
});
export type SuggestCircuitConfigurationInput = z.infer<typeof SuggestCircuitConfigurationInputSchema>;

const SuggestCircuitConfigurationOutputSchema = z.object({
  circuitSuggestion: z
    .string()
    .describe('A suggestion for a suitable circuit configuration based on the description.'),
});
export type SuggestCircuitConfigurationOutput = z.infer<typeof SuggestCircuitConfigurationOutputSchema>;

export async function suggestCircuitConfiguration(input: SuggestCircuitConfigurationInput): Promise<SuggestCircuitConfigurationOutput> {
  return suggestCircuitConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCircuitConfigurationPrompt',
  input: {schema: SuggestCircuitConfigurationInputSchema},
  output: {schema: SuggestCircuitConfigurationOutputSchema},
  prompt: `You are an expert electrical engineer specializing in designing electrical circuits.

You will use the following information to suggest a suitable circuit configuration.

Description: {{{circuitDescription}}}

Suggest a circuit configuration that meets the requirements described above.`,
});

const suggestCircuitConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestCircuitConfigurationFlow',
    inputSchema: SuggestCircuitConfigurationInputSchema,
    outputSchema: SuggestCircuitConfigurationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
