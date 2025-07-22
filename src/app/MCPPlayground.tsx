import {ThemeProvider} from '@material-ui/core/styles';
import { StylesProvider, createGenerateClassName } from '@material-ui/core/styles';
import useChoreoTheme from './theme/Theme.ts';
import Playground, { PlaygroundProps } from '../features/playground/Playground';

// Create a scoped class name generator to avoid conflicts
const generateClassName = createGenerateClassName({
    productionPrefix: 'mcp-playground',
    seed: 'mcp'
});

function MCPPlayground(props: PlaygroundProps) {
    const theme = useChoreoTheme(false);
    return (
        <div className="mcp-playground-root">
            <StylesProvider generateClassName={generateClassName}>
                <ThemeProvider theme={theme}>
                    <Playground {...props}/>
                </ThemeProvider>
            </StylesProvider>
        </div>
    )
}

export default MCPPlayground
