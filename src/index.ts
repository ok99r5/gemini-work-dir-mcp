#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Define the path for the .gemini directory and GEMINI.md file
const geminiDir = path.join(process.cwd(), '.gemini');
const geminiMdPath = path.join(geminiDir, 'GEMINI.md');

// Function to ensure the GEMINI.md file exists
function ensureGeminiMdExists() {
  if (!fs.existsSync(geminiDir)) {
    fs.mkdirSync(geminiDir, { recursive: true });
  }
  if (!fs.existsSync(geminiMdPath)) {
    fs.writeFileSync(geminiMdPath, '# Gemini Memories\n\n');
  }
}

ensureGeminiMdExists();

const server = new Server(
  {
    name: "gemini-work-dir-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define schemas for our tools
const ToToolInputSchema = z.object({
  text: z.string().describe('The text to save.'),
});
const NotToToolInputSchema = z.object({
  index: z.number().describe('The index number of the line to delete.'),
});

// Implement ListToolsRequestSchema handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
    {
      name: "said_",
      description: 'Displays the available commands for managing the work directory memory.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: "said_to",
      description: 'Saves a text to the .gemini/GEMINI.md file.',
      inputSchema: {
        type: 'object',
        properties: {
            text: { type: 'string', description: 'The text to save.' },
        },
        required: ['text'],
      },
    },
    {
      name: "said_list",
      description: 'Lists the content of the .gemini/GEMINI.md file with index numbers.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: "said_not",
      description: 'Deletes a line from the .gemini/GEMINI.md file by its index number.',
      inputSchema: {
        type: 'object',
        properties: {
            index: { type: 'number', description: 'The index number of the line to delete.' },
        },
        required: ['index'],
      },
    },
  ];
  return { tools };
});

// Implement CallToolRequestSchema handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const toolArgs = request.params.arguments;

  let result: string | undefined;

  switch (toolName) {
    case "said_":
      result = `
said_list    List saved work directory monory
said_to      Save a work directory monory
said_not     Delete a work directory monory
`;
      break;
    case "said_to":
      const toArgs = ToToolInputSchema.parse(toolArgs);
      const formattedText = `- ${toArgs.text}\n`;
      fs.appendFileSync(geminiMdPath, formattedText);
      result = `Successfully saved: "${toArgs.text}"`;
      break;
    case "said_list":
      const content = fs.readFileSync(geminiMdPath, 'utf-8');
      const lines = content.split('\n');
      let indexedContent = '';
      let index = 1;
      for (const line of lines) {
        if (line.startsWith('- ')) {
          indexedContent += `${index++}. ${line.substring(2)}\n`;
        }
      }
      result = indexedContent;
      break;
    case "said_not":
      const notToArgs = NotToToolInputSchema.parse(toolArgs);
      const deleteIndex = notToArgs.index;

      const currentContent = fs.readFileSync(geminiMdPath, 'utf-8');
      const currentLines = currentContent.split('\n');
      const newLines = [];
      let currentIndex = 1;
      let lineDeleted = false;
      for (const line of currentLines) {
        if (line.startsWith('- ')) {
          if (currentIndex === deleteIndex) {
            lineDeleted = true;
          } else {
            newLines.push(line);
          }
          currentIndex++;
        } else {
          newLines.push(line);
        }
      }

      if (lineDeleted) {
        fs.writeFileSync(geminiMdPath, newLines.join('\n'));
        result = `Successfully deleted line at index: ${deleteIndex}`;
      } else {
        result = `Could not find a line at index: ${deleteIndex}`;
      }
      break;
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }

  return {
    content: [{
      type: "text",
      text: result,
    }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
