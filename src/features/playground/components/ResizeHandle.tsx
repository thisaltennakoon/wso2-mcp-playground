import React from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

interface ResizeHandleProps {
  onMouseDown: (event: React.MouseEvent) => void;
  isResizing?: boolean;
}

const useStyles = makeStyles((theme) => ({
  resizeHandle: {
    height: '8px',
    width: '100%',
    backgroundColor: 'transparent',
    cursor: 'row-resize',
    borderTop: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.08)', // Light blue hover
      borderTopColor: theme.palette.primary.main,
      borderBottomColor: theme.palette.primary.main,
    },
    '&:hover $dragIndicator': {
      opacity: 1,
      transform: 'scaleY(1.2)',
    },
  },
  resizing: {
    backgroundColor: 'rgba(25, 118, 210, 0.12)',
    borderTopColor: theme.palette.primary.main,
    borderBottomColor: theme.palette.primary.main,
    '& $dragIndicator': {
      opacity: 1,
      transform: 'scaleY(1.2)',
    },
  },
  dragIndicator: {
    width: '40px',
    height: '3px',
    backgroundColor: theme.palette.grey[400],
    borderRadius: '2px',
    opacity: 0.4,
    transition: 'all 0.2s ease',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-2px',
      left: '0',
      right: '0',
      height: '1px',
      backgroundColor: theme.palette.grey[300],
      borderRadius: '1px',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '-2px',
      left: '0',
      right: '0',
      height: '1px',
      backgroundColor: theme.palette.grey[300],
      borderRadius: '1px',
    },
  },
}));

const ResizeHandle: React.FC<ResizeHandleProps> = ({ 
  onMouseDown, 
  isResizing = false 
}) => {
  const classes = useStyles();

  return (
    <Box
      className={`${classes.resizeHandle} ${isResizing ? classes.resizing : ''}`}
      onMouseDown={onMouseDown}
      role="separator"
      aria-label="Resize history panel"
      aria-orientation="horizontal"
      tabIndex={0}
      onKeyDown={(event) => {
        // Add keyboard support for accessibility
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          // You could implement keyboard-based resizing here if needed
        }
      }}
    >
      <div className={classes.dragIndicator} />
    </Box>
  );
};

export default ResizeHandle;
