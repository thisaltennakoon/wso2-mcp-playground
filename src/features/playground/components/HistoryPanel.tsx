import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { HistoryEvent } from '../lib/constants';
import { useVerticalResize } from './hooks/useVerticalResize';
import ResizeHandle from './ResizeHandle';

interface HistoryPanelProps {
  history: HistoryEvent[];
}

const useStyles = makeStyles((theme) => ({
  historyContainer: {
    borderRadius: '8px 8px 0 0',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    borderBottom: 'none', // Remove bottom border since resize handle provides it
    display: 'flex',
    flexDirection: 'column',
  },
  historyHeader: {
    padding: theme.spacing(1, 2),
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '8px 8px 0 0',
    flexShrink: 0,
  },
  historyTitle: {
    fontWeight: 600,
    fontSize: '1rem',
    margin: 0,
    color: theme.palette.common.black,
  },
  historyContent: {
    backgroundColor: '#F2F8FE',
    padding: theme.spacing(1.5, 2),
    flex: 1,
    overflowY: 'auto',
    fontSize: '12px',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    minHeight: 0, // Important for flex container
  },
  emptyState: {
    opacity: 0.6,
    fontStyle: 'italic',
    color: theme.palette.grey[600] || '#6b7280',
    fontSize: '13px',
    textAlign: 'center',
    paddingTop: theme.spacing(3),
  },
  eventItem: {
    marginBottom: '8px',
    paddingLeft: '8px',
    paddingBottom: '4px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: '6px 8px',
    border: '1px solid rgba(255, 255, 255, 0.8)',
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  eventTimestamp: {
    color: theme.palette.grey[600] || '#6b7280',
    fontSize: '10px',
  },
  eventType: {
    fontWeight: 'bold',
    fontSize: '10px',
  },
  eventSource: {
    color: theme.palette.primary.main,
    fontSize: '11px',
  },
  eventMessage: {
    fontSize: '11px',
    marginBottom: '2px',
    color: theme.palette.common.black,
  },
  eventDetails: {
    marginTop: '4px',
  },
  detailsSummary: {
    cursor: 'pointer',
    fontSize: '10px',
    userSelect: 'none',
    color: theme.palette.grey[600] || '#6b7280',
  },
  detailsContent: {
    marginLeft: '8px',
    marginTop: '4px',
    fontSize: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '8px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '100px',
    border: `1px solid ${theme.palette.grey[200]}`,
    color: theme.palette.common.black,
  },
}));

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
  const classes = useStyles();
  
  // Initialize vertical resize functionality
  const { height, isResizing, resizeHandleProps } = useVerticalResize({
    defaultHeight: 300,
    minHeight: 120,
    maxHeight: 600,
    storageKey: 'mcp-inspector-history-panel-height',
  });

  const getEventColor = (type: string, theme: any) => {
    switch (type) {
      case 'error':
        return theme.palette.error.main || '#fe523c';
      case 'warning':
        return theme.palette.warning.main || '#ff9d52';
      case 'info':
        return theme.palette.primary.main || '#1A4C6D';
      case 'debug':
        return theme.palette.grey[600] || '#6b7280';
      default:
        return theme.palette.grey[500] || '#9ca3af';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Box>
      {/* Resize Handle */}
      <ResizeHandle 
        onMouseDown={resizeHandleProps.onMouseDown}
        isResizing={isResizing}
      />
      
      {/* History Panel Container */}
      <Box 
        className={classes.historyContainer}
        style={{ height: `${height}px` }}
      >
        <Box className={classes.historyHeader}>
          <Typography className={classes.historyTitle}>
            Activity History
          </Typography>
        </Box>

        <div className={classes.historyContent}>
          {history.length === 0 ? (
            <div className={classes.emptyState}>
              No activity yet.
            </div>
          ) : (
            <div>
              {history.map((event, index) => (
                <div
                  key={index}
                  className={classes.eventItem}
                  style={{
                    borderLeft: `3px solid ${getEventColor(event.type, { palette: { 
                      error: { main: '#fe523c' },
                      warning: { main: '#ff9d52' },
                      primary: { main: '#1A4C6D' },
                      grey: { 500: '#9ca3af', 600: '#6b7280' }
                    }})}`,
                  }}
                >
                  <div className={classes.eventHeader}>
                    <span className={classes.eventTimestamp}>
                      [{formatTime(event.timestamp)}]
                    </span>
                    <span
                      className={classes.eventType}
                      style={{
                        color: getEventColor(event.type, { palette: {
                          error: { main: '#fe523c' },
                          warning: { main: '#ff9d52' },
                          primary: { main: '#1A4C6D' },
                          grey: { 500: '#9ca3af', 600: '#6b7280' }
                        }})
                      }}
                    >
                      {event.type.toUpperCase()}
                    </span>
                    <span className={classes.eventSource}>
                      {event.source}
                    </span>
                  </div>
                  <div className={classes.eventMessage}>
                    {event.message}
                  </div>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <details className={classes.eventDetails}>
                      <summary className={classes.detailsSummary}>
                        Details
                      </summary>
                      <pre className={classes.detailsContent}>
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Box>
    </Box>
  );
};

export default HistoryPanel;
