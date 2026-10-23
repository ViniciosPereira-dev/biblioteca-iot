import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTheme } from "react-native-paper";

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#888",
      }}
    >
      {/* Catálogo */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Catalogo",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bookshelf" size={26} color={color} />
          ),
        }}
      />

      {/* Cadastro */}
      <Tabs.Screen
        name="cadastro"
        options={{
          title: "Cadastrar NFC",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="nfc-variant"
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* Empréstimos */}
      <Tabs.Screen
        name="operacoes"
        options={{
          title: "Empréstimos",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="book-account"
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="leitores" // TEM QUE SER O NOME EXATO DO ARQUIVO (ex: se for cadastroLeitor.js, ponha "cadastroLeitor")
        options={{
          title: 'Leitores',
          tabBarIcon: ({ color }) => (
            // Lembre-se de importar o MaterialCommunityIcons no topo, se já não tiver!
            <MaterialCommunityIcons name="account-plus" size={24} color={color} />
          ),
        }}
      />
    </Tabs>

    
  );
}
