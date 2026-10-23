import React from 'react';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { Stack } from 'expo-router';

const temaBiblioteca = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1A1A1A', 
    background: '#F7F7F7',
    surface: '#FFFFFF',
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={temaBiblioteca}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaperProvider>
  );
}