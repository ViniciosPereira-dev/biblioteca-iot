import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, View, FlatList, ActivityIndicator } from "react-native";
import { Badge, Card, Text } from "react-native-paper";

export default function Catalogo() {
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Função para buscar os dados no Node.js
  const buscarLivros = async () => {
    setCarregando(true);
    try {
      // 🚨 LEMBRE-SE: Coloque o IP do seu notebook aqui!
      const resposta = await fetch("http://192.168.1.2:3000/api/livros");

      if (resposta.ok) {
        const dados = await resposta.json();
        console.log("Dados recebidos do servidor:", dados);
        setLivros(dados); // Salva os livros no estado da tela
      } else {
        Alert.alert("Erro", "Não foi possível carregar o catálogo.");
      }
    } catch (error) {
      console.warn("Erro de rede:", error);
    } finally {
      setCarregando(false);
    }
  };

  // O useFocusEffect roda toda vez que você entra nesta aba
  useFocusEffect(
    useCallback(() => {
      buscarLivros();
    }, []),
  );

  // Como cada livro será desenhado na tela
  const renderizarLivro = ({ item }) => {
    const urlCapa = item.isbn
      ? `https://covers.openlibrary.org/b/isbn/${item.isbn}-M.jpg`
      : "https://via.placeholder.com/150?text=Sem+Capa";

    return (
      <Card style={styles.cartao} mode="elevated">
        <View style={{ flexDirection: "row" }}>
          {/* Lado Esquerdo: A Capa do Livro */}
          <Card.Cover source={{ uri: urlCapa }} style={styles.capaLivro} />

          {/* Lado Direito: Os Dados */}
          <Card.Content style={styles.cartaoConteudo}>
            <View>
              <Text variant="titleMedium" style={styles.titulo} numberOfLines={2}>
                {item.titulo}
              </Text>
              <Text variant="bodyMedium" style={styles.autor}>
                {item.autor}
              </Text>
              <Text variant="labelSmall" style={styles.tagId}>
                Tag: {item.rfid_tag}
              </Text>
            </View>

            <Badge
              size={24}
              style={[
                styles.badge,
                {
                  backgroundColor:
                    item.status === "EMPRESTADO" ? "#dc3545" : "#28a745",
                },
              ]}
            >
              {item.status || "DISPONÍVEL"}
            </Badge>
          </Card.Content>
        </View>
      </Card>
    );
  };

  // 1️⃣ RETORNO PRINCIPAL: O que realmente vai aparecer na tela do app
  return (
    <View style={styles.container}>
      {/* Cabeçalho opcional da tela */}
      <View style={styles.cabecalhoApp}>
        <Text variant="headlineMedium" style={styles.tituloApp}>
          Catálogo de Livros
        </Text>
      </View>

      {/* Se estiver carregando, mostra o ícone de loading */}
      {carregando ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loading} />
      ) : (
        /* Componente correto para renderizar listas dinâmicas */
        <FlatList
          data={livros}
          keyExtractor={(item) => item.id?.toString() || item.rfid_tag}
          renderItem={renderizarLivro}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.textoVazio}>Nenhum livro encontrado.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  cabecalhoApp: {
    padding: 20,
    backgroundColor: "#007BFF",
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  tituloApp: { color: "#fff", fontWeight: "bold" },
  lista: { padding: 15 },
  cartao: { marginBottom: 15, backgroundColor: "#fff", overflow: "hidden" },
  capaLivro: {
    width: 100,
    height: 150,
    borderRadius: 0, // Ajustado para não quebrar o layout interno do Card.Cover
  },
  cartaoConteudo: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: "space-between",
  },
  titulo: { fontWeight: "bold", color: "#333" },
  autor: { color: "#666", marginTop: 2 },
  tagId: { color: "#aaa", marginTop: 5 },
  badge: { paddingHorizontal: 10, alignSelf: "flex-start", marginTop: 5, color: '#fff' },
  loading: { marginTop: 50 },
  textoVazio: {
    textAlign: "center",
    marginTop: 50,
    color: "#888",
    fontSize: 16,
  },
});