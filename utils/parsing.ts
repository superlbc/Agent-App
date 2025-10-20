import { NextStep } from '../types.ts';

/**
 * Parses the combined string response from the agent, which contains
 * markdown content and a fenced JSON block for next steps.
 */
export const parseAgentResponseString = (responseText: string): { markdown: string; next_steps: NextStep[] } => {
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = responseText.match(jsonBlockRegex);

  if (match && match[1]) {
    const jsonString = match[1];
    const markdown = responseText.replace(jsonBlockRegex, '').trim();
    try {
      const parsedJson = JSON.parse(jsonString);
      return {
        markdown,
        next_steps: parsedJson.next_steps || [],
      };
    } catch (error) {
      console.error("Failed to parse JSON block from agent response:", error);
      // Fallback if JSON is malformed
      return {
        markdown: responseText,
        next_steps: parseNextStepsFromMarkdown(responseText),
      };
    }
  }

  // Fallback if no JSON block is found
  return {
    markdown: responseText,
    next_steps: parseNextStepsFromMarkdown(responseText),
  };
};


/**
 * A fallback parser to extract 'Next Steps' from a markdown table.
 * This is used if the agent response does not contain a valid JSON block.
 */
export const parseNextStepsFromMarkdown = (markdown: string): NextStep[] => {
  const steps: NextStep[] = [];
  const lines = markdown.split('\n');
  let inTable = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // The table starts after a line containing "Next Steps" and is identified by `|`
    if (trimmedLine.toLowerCase().includes('next steps')) {
      // Reset in case of multiple sections with this name
      inTable = false; 
    }

    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      const cells = trimmedLine.split('|').slice(1, -1).map(c => c.trim());
      
      // This is a separator, meaning the next row is data.
      if (cells.every(c => c.replace(/-/g, '').trim() === '')) {
        inTable = true;
        continue;
      }
      
      // If we are in the table and it's a data row (not header/separator)
      if (inTable && cells.length >= 6) {
        const statusText = cells[4] || 'NA';
        const statusMatch = statusText.match(/(RED|AMBER|GREEN|NA|—)/i);

        steps.push({
          department: cells[0] || '',
          owner: cells[1] || '',
          task: cells[2] || '',
          due_date: cells[3] || '',
          status: (statusMatch ? statusMatch[0].toUpperCase().replace('—', 'NA') : 'NA') as NextStep['status'],
          status_notes: cells[5] || '',
        });
      }
    } else {
      // If we were in a table and hit a non-table line, we're done.
      if (inTable) break;
    }
  }

  return steps;
};
