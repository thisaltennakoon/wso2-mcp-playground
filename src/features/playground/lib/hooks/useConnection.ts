import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  ClientRequest,
  Request,
  Result,
  ServerCapabilities,
} from '@modelcontextprotocol/sdk/types.js';
import { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { useState } from 'react';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';
import { ConnectionStatus, HistoryEvent, HistoryEventType } from '../constants';
import { Notification } from '../notificationTypes';

interface UseConnectionOptions {
  url: string | undefined;
  token: string | undefined;
  headerName: string;
}

export function useConnection({
  url,
  token,
  headerName,
}: UseConnectionOptions) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverCapabilities, setServerCapabilities] =
    useState<ServerCapabilities | null>(null);
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  const [clientTransport, setClientTransport] = useState<Transport | null>(
    null
  );
  const [history, setHistory] = useState<HistoryEvent[]>([]);

  /**
   * Adds an event to the history array (newest events at the top)
   */
  const addHistoryEvent = (
    type: HistoryEventType,
    source: string,
    message: string,
    details?: Record<string, unknown>
  ) => {
    const event: HistoryEvent = {
      type,
      timestamp: new Date().toISOString(),
      source,
      message,
      details,
    };
    setHistory(prev => [event, ...prev]);
  };

  /**
   * Clears the history array
   */
  const clearHistory = () => {
    setHistory([]);
  };

  /**
   * Shows an error snackbar with the given error message, truncated if necessary.
   * @param {string} errorString - The error message to display.
   * @param {function} showSnackbar - The snackbar function to show messages.
   */
  function showError(errorString: string) {
    const MAX_ERROR_LENGTH = 200;
    const truncatedErrorString =
      errorString.length > MAX_ERROR_LENGTH
        ? `${errorString.substring(0, MAX_ERROR_LENGTH)}...`
        : errorString;
    console.error(truncatedErrorString);
    
    addHistoryEvent('error', 'showError', 'Error displayed to user', {
      originalError: errorString,
      truncatedError: truncatedErrorString,
    });
  }

  const makeRequest = async <T extends z.ZodType>(
    request: ClientRequest,
    schema: T,
    options?: RequestOptions & { suppressToast?: boolean }
  ): Promise<z.output<T>> => {
    if (!mcpClient) {
      const error = 'MCP client not connected';
      addHistoryEvent('error', 'makeRequest', error);
      throw new Error(error);
    }
    
    const startTime = Date.now();
    addHistoryEvent('debug', 'makeRequest', `Starting MCP request: ${request.method}`, {
      method: request.method,
      params: request.params,
    });
    
    try {
      // prepare MCP Client request options
      const mcpRequestOptions: RequestOptions = {
        timeout: 60000,
        maxTotalTimeout: 60000,
      };
      
      const result = await mcpClient.request(request, schema, mcpRequestOptions);
      const responseTime = Date.now() - startTime;
      
      addHistoryEvent('info', 'makeRequest', `MCP request completed: ${request.method}`, {
        method: request.method,
        responseTime,
        success: true,
      });
      
      return result;
    } catch (e: unknown) {
      const responseTime = Date.now() - startTime;
      const errorString = (e as Error).message ?? String(e);
      
      addHistoryEvent('error', 'makeRequest', `MCP request failed: ${request.method}`, {
        method: request.method,
        error: errorString,
        responseTime,
        success: false,
      });
      
      if (!options?.suppressToast) {
        showError(errorString);
      }
      throw e;
    }
  };

  const is401Error = (error: unknown): boolean =>
    (error instanceof Error && error.message.includes('401')) ||
    (error instanceof Error && error.message.includes('Unauthorized'));

  const connect = async (_e?: unknown, retryCount: number = 0) => {
    setConnectionStatus('connecting');
    setConnectionError(null); // Clear previous errors
    clearHistory(); // Clear history on new connection
    
    addHistoryEvent('info', 'connect', 'Starting MCP server connection', {
      url,
      retryCount,
      hasToken: !!token,
      headerName,
    });
    
    const client = new Client<Request, Notification, Result>(
      {
        name: 'mcp-playground',
        version: '0.13.0',
      },
      {
        capabilities: {
          sampling: {},
          roots: {
            listChanged: true,
          },
        },
      }
    );

    try {
      // Inject auth manually instead of using SSEClientTransport, because we're
      // proxying through the playground server first.
      const headers: HeadersInit = {};

      if (token !== undefined) {
        headers[headerName] = token;
      }

      const mcpProxyServerUrl = new URL(url as string);

      let capabilities;
      try {
        addHistoryEvent('debug', 'connect', 'Creating transport and connecting to MCP server');
        
        const transport = new StreamableHTTPClientTransport(
          mcpProxyServerUrl as URL,
          {
            sessionId: undefined,
            requestInit: {
              headers,
            },
            // TODO these should be configurable...
            reconnectionOptions: {
              maxReconnectionDelay: 30000,
              initialReconnectionDelay: 1000,
              reconnectionDelayGrowFactor: 1.5,
              maxRetries: 2,
            },
          }
        );

        await client.connect(transport as Transport);

        setClientTransport(transport);
        addHistoryEvent('info', 'connect', 'Successfully connected to MCP transport');

        capabilities = client.getServerCapabilities();
        addHistoryEvent('info', 'connect', 'Retrieved server capabilities', {
          capabilities,
        });
      } catch (error) {
        console.error(
          `Failed to connect to MCP Server via the MCP Playground Proxy: ${mcpProxyServerUrl}:`,
          error
        );
        setConnectionStatus('error');

        if (is401Error(error)) {
          const authError = 'Internal key authentication failed. Make sure you have provided the correct security credentials';
          setConnectionError(authError);
          addHistoryEvent('error', 'connect', 'Authentication failed', {
            error: error instanceof Error ? error.message : String(error),
            isAuthError: true,
          });
          showError(authError);
          return;
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        setConnectionError(errorMessage);
        addHistoryEvent('error', 'connect', 'Connection failed', {
          error: errorMessage,
          url: mcpProxyServerUrl.toString(),
        });
        showError(errorMessage);
        throw error;
      }
      setServerCapabilities(capabilities ?? null);

      setMcpClient(client);
      setConnectionStatus('connected');
      setConnectionError(null); // Clear error on successful connection
      addHistoryEvent('info', 'connect', 'MCP connection established successfully', {
        hasCapabilities: !!capabilities,
      });
    } catch (e) {
      console.error(e);
      setConnectionStatus('error');
      const errorMessage = e instanceof Error ? e.message : String(e);
      setConnectionError(errorMessage);
      addHistoryEvent('error', 'connect', 'Unexpected error during connection', {
        error: errorMessage,
      });
    }
  };

  const disconnect = async () => {
    addHistoryEvent('info', 'disconnect', 'Starting MCP disconnection');
    
    try {
      await (clientTransport as StreamableHTTPClientTransport).terminateSession();
      await mcpClient?.close();
      setMcpClient(null);
      setClientTransport(null);
      setConnectionStatus('disconnected');
      setConnectionError(null); // Clear errors on disconnect
      setServerCapabilities(null);
      
      addHistoryEvent('info', 'disconnect', 'MCP disconnection completed successfully');
      clearHistory(); // Clear history on disconnect
    } catch (error) {
      addHistoryEvent('error', 'disconnect', 'Error during disconnection', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Still proceed with cleanup even if there was an error
      setMcpClient(null);
      setClientTransport(null);
      setConnectionStatus('disconnected');
      setConnectionError(null); // Clear errors even on disconnect error
      setServerCapabilities(null);
      clearHistory();
    }
  };

  return {
    connectionStatus,
    connectionError,
    serverCapabilities,
    mcpClient,
    makeRequest,
    connect,
    disconnect,
    history,
    addHistoryEvent,
    clearHistory,
  };
}
