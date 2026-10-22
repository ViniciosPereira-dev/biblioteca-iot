import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

export default function TabsLayout() {
  // Puxa as cores que definimos no root layout
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,                          // Mostra a barra de título no topo
        tabBarActiveTintColor: theme.colors.primary, // Cor do ícone quando a aba está selecionada
        tabBarInactiveTintColor: '#888',             // Cor do ícone inativo
        headerStyle: { 
          backgroundColor: theme.colors.primary      // Cor da barra de título no topo
        },
        headerTintColor: '#fff',                     // Cor do texto do título no topo
      }}
    >
      {/* Aba 1: Catálogo (index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bookshelf" size={26} color={color} />
          ),
        }}
      />

      {/* Aba 2: Cadastrar Livro (cadastro.tsx) */}
      <Tabs.Screen
        name="cadastro"
        options={{
          title: 'Cadastrar NFC',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="nfc-variant" size={26} color={color} />
          ),
        }}
      />

      {/* Aba 3: Empréstimos (operacoes.tsx) */}
      <Tabs.Screen
        name="operacoes"
        options={{
          title: 'Empréstimos',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="book-account" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}