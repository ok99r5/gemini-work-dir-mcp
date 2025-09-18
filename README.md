This adds and manages project memories in `.gemini/GEMINI.md` within the work directory.

## Usage with Gemini Cli

said_  
said_list    List saved work directory memory.  
said_to      Save a work directory memory.  
said_not     Delete a work directory memory using an index.  


## Usage with MCP

"mcpServers": {
  "Gemini Work Dir MD": {
    "command": "npx",
    "args": [
      "-y",
      "gemini-work-dir-mcp"
    ]
  }
}
