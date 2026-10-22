import React from 'react';
import { PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { Stack } from 'expo-router';


const temaBiblioteca = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007BFF',
    secondary: '#28a745', 
    background: '#f5f5f5',
  },
};

export default function RootLayout() {
  return (

    <PaperProvider theme={temaBiblioteca}>
      
      <Stack screenOptions={{ headerShown: false }}>
        {/* Dizemos ao Expo que a rota principal será o nosso grupo de abas (tabs) */}
        <Stack.Screen name="(tabs)" />
      </Stack>
      
    </PaperProvider>
  );
}