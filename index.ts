import { registerRootComponent } from 'expo';
import App from './App'; // Or wherever your main App component is located

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or a native build,
// the environment is set up appropriately.
registerRootComponent(App);