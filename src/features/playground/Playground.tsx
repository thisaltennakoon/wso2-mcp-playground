import {
  ClientRequest,
  CompatibilityCallToolResult,
  CompatibilityCallToolResultSchema,
  EmptyResultSchema,
  ListToolsResultSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import React, { useEffect, useRef, useState } from 'react';
import NotificationsIcon from '@material-ui/icons/Notifications';
import { z } from 'zod';
import { Box, Grid, Typography } from '@material-ui/core';
import { MenuSubAPIManagement } from './components/ui/Icons/generated';
import MCPPlaygroundConnect from './components/ui/Images/Templates/MCPPlaygroundConnect.svg';
import { cacheToolOutputSchemas } from './utils/schemaUtils';
import { useConnection } from './lib/hooks/useConnection';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import PingTab from './components/PingTab';
import Sidebar from './components/Sidebar';
import ToolsTab from './components/ToolsTab';
import HistoryPanel from './components/HistoryPanel';
import { useStyles } from './style';

interface PlaygroundProps {
  url?: string;
  token?: string;
  headerName?: string;
  shouldSetHeaderNameExternally?: boolean;
  isTokenFetching?: boolean;
  isUrlFetching?: boolean;
  handleTokenRegenerate?: () => void;
  isMcpProxyWithOperationMapping?: boolean;
  tokenPlaceholder?: string;
}

const Playground = ({
  url: initialUrl,
  token: initialToken,
  headerName: initialHeaderName,
  shouldSetHeaderNameExternally,
  isTokenFetching,
  isUrlFetching,
  handleTokenRegenerate,
  isMcpProxyWithOperationMapping,
  tokenPlaceholder,
}: PlaygroundProps) => {
  const classes = useStyles();
  const [token, setToken] = useState<string>();
  const [url, setUrl] = useState<string>();
  const [headerName, setHeaderName] = useState<string>(initialHeaderName|| 'Authorization');
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolResult, setToolResult] =
    useState<CompatibilityCallToolResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({
    resources: null,
    prompts: null,
    tools: null,
  });

  useEffect(() => {
    setUrl(initialUrl || '');
  }, [initialUrl]);

  useEffect(() => {
    setToken(initialToken || '');
  }, [initialToken]);

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [nextToolCursor, setNextToolCursor] = useState<string | undefined>();
  const progressTokenRef = useRef(0);

  const {
    connectionStatus,
    connectionError,
    serverCapabilities,
    mcpClient,
    makeRequest,
    connect: connectMcpServer,
    disconnect: disconnectMcpServer,
    history,
    addHistoryEvent,
    clearHistory,
  } = useConnection({
    url,
    token,
    headerName,
  });

  const clearError = (tabKey: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [tabKey]: null }));
  };

  const sendMCPRequest = async <T extends z.ZodType>(
    request: ClientRequest,
    schema: T,
    tabKey?: keyof typeof errors
  ) => {
    try {
      const response = await makeRequest(request, schema);
      if (tabKey !== undefined) {
        clearError(tabKey);
      }
      return response;
    } catch (e) {
      const errorString = (e as Error).message ?? String(e);
      if (tabKey !== undefined) {
        setErrors((prev) => ({
          ...prev,
          [tabKey]: errorString,
        }));
      }
      throw e;
    }
  };

  const listTools = async () => {
    addHistoryEvent('info', 'listTools', 'Fetching tools from MCP server', {
      nextCursor: nextToolCursor,
    });

    const response = await sendMCPRequest(
      {
        method: 'tools/list' as const,
        params: nextToolCursor ? { cursor: nextToolCursor } : {},
      },
      ListToolsResultSchema,
      'tools'
    );
    setTools(response.tools);
    setNextToolCursor(response.nextCursor);
    // Cache output schemas for validation
    cacheToolOutputSchemas(response.tools);

    addHistoryEvent('info', 'listTools', 'Tools fetched successfully', {
      toolCount: response.tools.length,
      hasNextCursor: !!response.nextCursor,
      toolNames: response.tools.map(tool => tool.name),
    });
  };

  const callTool = async (name: string, params: Record<string, unknown>) => {
    addHistoryEvent('info', 'callTool', `Calling MCP tool: ${name}`, {
      toolName: name,
      parameters: params,
      progressToken: progressTokenRef.current + 1,
    });

    try {
      const response = await sendMCPRequest(
        {
          method: 'tools/call' as const,
          params: {
            name,
            arguments: params,
            _meta: {
              progressToken: (progressTokenRef.current += 1),
            },
          },
        },
        CompatibilityCallToolResultSchema,
        'tools'
      );
      setToolResult(response);

      addHistoryEvent('info', 'callTool', `Tool call completed successfully: ${name}`, {
        toolName: name,
        hasContent: !!response.content,
        contentLength: Array.isArray(response.content) ? response.content.length : 0,
        isError: response.isError || false,
      });
    } catch (e) {
      const errorMessage = (e as Error).message ?? String(e);
      addHistoryEvent('error', 'callTool', `Tool call failed: ${name}`, {
        toolName: name,
        error: errorMessage,
        parameters: params,
      });

      setToolResult({
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
        isError: true,
      });
    }
  };

  return (
    <Box className={classes.componentLevelPageContainer}>
      <Typography variant="h3">
        MCP Playground
      </Typography>
      <Grid container md={12}>
        <Grid item xs={12} md={3} className={classes.playgroundSlider}>
          <Sidebar
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            url={url}
            setUrl={setUrl}
            token={token}
            setToken={setToken}
            headerName={headerName}
            setHeaderName={setHeaderName}
            shouldSetHeaderNameExternally={shouldSetHeaderNameExternally || false}
            isTokenFetching={isTokenFetching}
            isUrlFetching={isUrlFetching}
            handleTokenRegenerate={handleTokenRegenerate}
            onConnect={connectMcpServer}
            onDisconnect={disconnectMcpServer}
            tokenPlaceholder={tokenPlaceholder}
          />
        </Grid>
        <Grid item xs={12} md={8} className={classes.playgroundRightSlider}>
          <Box
            className={classes.playgroundResult}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              overflow: 'hidden'
            }}
          >
            {mcpClient ? (
              <>
                {/* Main Content Area - Scrollable */}
                <Box
                  style={{
                    flex: '1 1 auto',
                    overflow: 'auto',
                    minHeight: 0
                  }}
                >
                  <Tabs
                    defaultValue="tools"
                    className="w-full p-4"
                    onValueChange={(value) => {
                      window.location.hash = value;
                    }}
                  >
                    <TabsList className={classes.tabsList}>
                      <TabsTrigger value="tools" className={classes.tabTrigger}>
                        <MenuSubAPIManagement className={classes.tabIcon} />
                        Tools
                      </TabsTrigger>
                      <TabsTrigger value="ping" className={classes.tabTrigger}>
                        <NotificationsIcon className={classes.tabIcon} />
                        Ping
                      </TabsTrigger>
                    </TabsList>

                    <div className="w-full">
                      {!serverCapabilities?.tools ? (
                        <>
                          <div className="flex items-center justify-center p-4">
                            <p className="text-lg text-gray-500 dark:text-gray-400">
                              The connected server does not support any MCP
                              capabilities
                            </p>
                          </div>
                          <PingTab
                            onPingClick={() => {
                              addHistoryEvent('info', 'ping', 'Sending ping to MCP server (no tools mode)');
                              sendMCPRequest(
                                {
                                  method: 'ping' as const,
                                },
                                EmptyResultSchema
                              ).then(() => {
                                addHistoryEvent('info', 'ping', 'Ping successful (no tools mode)');
                              }).catch((e) => {
                                addHistoryEvent('error', 'ping', 'Ping failed (no tools mode)', {
                                  error: e instanceof Error ? e.message : String(e),
                                });
                                console.error('Ping failed:', e);
                              });
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <ToolsTab
                            tools={tools}
                            listTools={() => {
                              clearError('tools');
                              listTools();
                            }}
                            clearTools={() => {
                              addHistoryEvent('info', 'clearTools', 'Clearing tools cache');
                              setTools([]);
                              setNextToolCursor(undefined);
                              // Clear cached output schemas
                              cacheToolOutputSchemas([]);
                            }}
                            callTool={async (name, params) => {
                              clearError('tools');
                              setToolResult(null);
                              await callTool(name, params);
                            }}
                            selectedTool={selectedTool}
                            setSelectedTool={(tool) => {
                              clearError('tools');
                              setSelectedTool(tool);
                              setToolResult(null);
                            }}
                            toolResult={toolResult}
                            nextCursor={nextToolCursor}
                            isMcpProxyWithOperationMapping={
                              isMcpProxyWithOperationMapping
                            }
                          />
                          <PingTab
                            onPingClick={() => {
                              addHistoryEvent('info', 'ping', 'Sending ping to MCP server');
                              sendMCPRequest(
                                {
                                  method: 'ping' as const,
                                },
                                EmptyResultSchema
                              ).then(() => {
                                addHistoryEvent('info', 'ping', 'Ping successful');
                              }).catch((e) => {
                                addHistoryEvent('error', 'ping', 'Ping failed', {
                                  error: e instanceof Error ? e.message : String(e),
                                });
                                console.error('Ping failed:', e);
                              });
                            }}
                          />
                        </>
                      )}
                    </div>
                  </Tabs>
                </Box>

                {/* Fixed History Panel at Bottom */}
                <Box
                  style={{
                    flex: '0 0 auto',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <HistoryPanel history={history} />
                </Box>
              </>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                style={{ flex: '1 1 auto' }}
              >
                <Box>
                  <img src={MCPPlaygroundConnect} alt="MCP Playground Connect" />
                </Box>
                <Typography variant="h4">
                  Connect to an MCP server to start inspecting
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Playground;
