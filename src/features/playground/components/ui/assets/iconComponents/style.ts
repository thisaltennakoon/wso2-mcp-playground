/*
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.com). All Rights Reserved.
 *
 * This software is the property of WSO2 Inc. and its suppliers, if any.
 * Dissemination of any information or reproduction of any material contained
 * herein is strictly forbidden, unless permitted by WSO2 in accordance with
 * the WSO2 Commercial License available at http://wso2.com/licenses.
 * For specific language governing the permissions and limitations under
 * this license, please see the license as well as any agreement you’ve
 * entered into with WSO2 governing the purchase of this software and any
 * associated services.
 */
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    defaultIcon: {
      fill: theme.palette.secondary.main,
      '&:hover': {
        fill: theme.palette.primary.main,
      },
    },
    interactiveIcon: {
      fill: theme.palette.secondary.main,
      '&:hover': {
        fill: theme.palette.primary.main,
      },
    },
    defaultHeaderIconWrapper: {
      '&:hover': {
        fill: 'transparent',
      },
    },
    checkIcon: {
      marginTop: '3px',
    },
    defaultPrimaryIcon: {
      width: '1em',
      height: '1em',
      fill: 'none',
    },
    defaultFontIcon: {
      width: '1em',
      height: '1em',
      fill: 'currentColor',
    },
    defaultMainIcon: {
      width: theme.spacing(2),
      height: theme.spacing(2),
      fill: 'currentColor',
    },
    defaultInProgressIcon: {
      width: theme.spacing(2),
      height: theme.spacing(2),
      fill: 'currentColor',
      animation: 'spin 2s linear infinite',
    },
    defaultQueuedIcon: {
      width: theme.spacing(2),
      height: theme.spacing(2),
      fill: 'currentColor',
      animation: 'spin 2s linear infinite',
    },
  })
);
