# MCP Playground

A lightweight, fully client-side React component for inspecting and testing MCP (Model Context Protocol) servers using streamable HTTP — no server-side dependencies required.

## What is MCP Playground?

MCP Playground is a developer-friendly React component that provides a comprehensive interface for testing and debugging MCP (Model Context Protocol) servers directly from the browser. Unlike traditional server inspection tools that require backend infrastructure, this playground runs entirely on the client-side, making it perfect for integration into web applications, developer portals, and debugging workflows.

**Key capabilities:**
- **Real-time MCP Server Testing**: Connect to any MCP-compatible server and test its tools and capabilities
- **Interactive Tool Execution**: Execute MCP tools with custom parameters and view results in real-time
- **Connection Management**: Easy connect/disconnect functionality with connection status monitoring
- **History Tracking**: Built-in activity history for debugging and observability

## How to Use It

### Installation

Install the package directly from the GitHub repository:

```bash
npm install wso2/mcp-playground
```

or with yarn:

```bash
yarn add wso2/mcp-playground
```

### Basic Usage

Import and use the `MCPPlayground` component in your React application:

```jsx
import MCPPlayground from 'mcp-playground';

function App() {
  return (
    <div>
      <h1>My Application</h1>
      <MCPPlayground />
    </div>
  );
}
```

### Advanced Usage with Props

```jsx
import React, { useState } from 'react';
import MCPPlayground from 'mcp-playground';

function DeveloperDashboard() {
  const [token, setToken] = useState('');
  const [isTokenFetching, setIsTokenFetching] = useState(false);

  const handleTokenRegenerate = async () => {
    setIsTokenFetching(true);
    try {
      // Your token regeneration logic
      const newToken = await fetchNewToken();
      setToken(newToken);
    } finally {
      setIsTokenFetching(false);
    }
  };

  return (
    <MCPPlayground
      url="https://your-mcp-server.com/mcp"
      token={token}
      headerName="Authorization"
      isTokenFetching={isTokenFetching}
      handleTokenRegenerate={handleTokenRegenerate}
      tokenPlaceholder="Bearer <your-token>"
    />
  );
}
```

### Custom Authentication Headers

```jsx
import MCPPlayground from 'mcp-playground';

function CustomAuthExample() {
  return (
    <MCPPlayground
      url="https://devportal.bijira.dev/mcpapi/v1/mcp"
      token="bearer-token-here"
      headerName="X-API-Key"
      shouldSetHeaderNameExternally={true}
    />
  );
}
```

### Configuration Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | `undefined` | The MCP server endpoint URL to connect to |
| `token` | `string` | `undefined` | The authentication token for requests |
| `headerName` | `string` | `'Authorization'` | HTTP header name for authentication |
| `shouldSetHeaderNameExternally` | `boolean` | `false` | Whether parent component manages header name |
| `isTokenFetching` | `boolean` | `false` | Shows loading state for token |
| `isUrlFetching` | `boolean` | `false` | Shows loading state for URL |
| `handleTokenRegenerate` | `() => void` | `undefined` | Callback for token regeneration |
| `tokenPlaceholder` | `string` | `'Add Your Token'` | Placeholder text for token input |

### Testing MCP Tools

Once connected to an MCP server, you can:

1. **View Available Tools**
2. **Execute Tools**: Click on any tool to open its parameter form and execute it
3. **View Results**: Tool execution results are displayed in a formatted JSON viewer
4. **Monitor History**: All requests and responses are logged in the history panel
5. **Ping Server**: Use the ping tab to test basic connectivity

## Who Uses MCP Playground

### Production Deployments

**[Bijira Console](https://console.bijira.dev/)**
- Allows API developers to explore and test available MCP tools
- Integrates MCP Playground for testing and debugging MCP-compatible AI services

**[DevPortal](https://devportal.bijira.dev/)**
- Allows API consumers to explore and test available MCP tools

## Development

### Prerequisites

- Node.js 16+
- React 17+
- Material-UI v4

### Local Development

```bash
# Clone the repository
git clone https://github.com/wso2/mcp-playground.git
cd mcp-playground

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## How We Built It

This project was built leveraging the foundation provided by the [Model Context Protocol Inspector](https://github.com/modelcontextprotocol/inspector), adapting and extending it to create a reusable React component suitable for integration into various web applications.

**Architecture Decisions:**
- **Client-side only**: No backend dependencies, communicates directly with MCP servers over HTTP
- **Modular design**: Structured as a reusable React component with configurable props
- **Theme isolation**: Uses scoped CSS class generation to prevent style conflicts
- **Flexible authentication**: Supports various authentication headers and token management patterns

## Related Projects

- [Model Context Protocol](https://github.com/modelcontextprotocol/modelcontextprotocol) - The official MCP specification
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - SDK for building MCP-compatible applications
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - Original inspector that inspired this project
