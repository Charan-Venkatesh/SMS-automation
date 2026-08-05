/**
 * App Entry Point
 * Purpose: Root component wrapping the app with PaperProvider for Material UI,
 * NavigationContainer for routing, and theme configuration with dark mode support.
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { AppNavigator } from './src/navigation/AppNavigator';

const App: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
