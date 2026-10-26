import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ActivityIndicator,
  Badge,
  Button,
  Card,
  Chip,
  Modal,
  Portal,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";

export default function Catalogo() {
  const theme = useTheme();
  const styles = getStyles(theme);

  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroGenero, setFiltroGenero] = useState("TODOS");

  // Estados para controlar o Modal de Exemplares
  const [modalVisivel, setModalVisivel] = useState(false);
  const [livroSelecionado, setLivroSelecionado] = useState(null);

  const carregarLivros = async () => {
    setCarregando(true);
    try {
      const resposta = await fetch("http://192.168.1.4:3000/api/livros");
      if (!resposta.ok) {
        throw new Error(`Erro HTTP: ${resposta.status}`);
      }
      const dados = await resposta.json();
      setLivros(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.warn("Erro ao buscar livros:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarLivros();
  }, []);

  const formatarData = (dataIso) => {
    if (!dataIso) return "Não definida";
    const data = new Date(dataIso);
    // Garante o formato DD/MM/AAAA usando o padrão local brasileiro
    return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  // Lógica de agrupamento aprimorada (guarda o array de exemplares detalhados)
  const agruparLivros = (listaDeLivros) => {
    const grupos = listaDeLivros.reduce((acumulador, livro) => {
      const chave = livro.isbn || livro.titulo;

      if (!acumulador[chave]) {
        acumulador[chave] = {
          ...livro,
          quantidadeTotal: 0,
          quantidadeDisponivel: 0,
          exemplares: [], // Guarda os detalhes de cada exemplar físico
        };
      }

      acumulador[chave].quantidadeTotal += 1;

      const isDisponivel =
        String(livro.status ?? "").toUpperCase() === "DISPONIVEL";
      if (isDisponivel) {
        acumulador[chave].quantidadeDisponivel += 1;
      }

      acumulador[chave].exemplares.push({
        id: livro.id,
        rfid_tag: livro.rfid_tag,
        status: livro.status || "DISPONIVEL",
        estante: livro.estante,
        prateleira: livro.prateleira,
        leitor_nome: livro.leitor_nome,
        leitor_telefone: livro.leitor_telefone,
        data_devolucao: livro.data_devolucao,
      });

      return acumulador;
    }, {});

    return Object.values(grupos);
  };

  const listaAgrupada = agruparLivros(livros);

  const generosUnicos = [
    ...new Set(listaAgrupada.map((livro) => livro.genero || "Outros")),
  ].sort();
  const generosDisponiveis = ["TODOS", ...generosUnicos];

  const livrosFiltrados = listaAgrupada.filter((livro) => {
    const titulo = String(livro.titulo ?? "").toLowerCase();
    const autor = String(livro.autor ?? "").toLowerCase();
    const termoBusca = searchQuery.trim().toLowerCase();

    const bateuTexto =
      titulo.includes(termoBusca) || autor.includes(termoBusca);

    const generoLivro = livro.genero || "Outros";
    const bateuGenero =
      filtroGenero === "TODOS" || generoLivro === filtroGenero;

    return bateuTexto && bateuGenero;
  });

  const renderizarLivro = ({ item }) => {
    const urlCapa = item.isbn
      ? `https://covers.openlibrary.org/b/isbn/${item.isbn}-M.jpg`
      : "https://placehold.co/150x220?text=Sem+Capa";

    const qtdEmprestados = item.quantidadeTotal - item.quantidadeDisponivel;
    const temDisponivel = item.quantidadeDisponivel > 0;

    const corBadge = temDisponivel ? "#10B981" : "#E02041";
    const textoBadge = temDisponivel
      ? `${item.quantidadeDisponivel} de ${item.quantidadeTotal} Disp.`
      : "Indisponível";

    let textoLocalizacao = "Local não cadastrado";
    if (item.estante && item.prateleira) {
      textoLocalizacao = `Estante: ${item.estante}, Prat. ${item.prateleira}`;
    } else if (item.estante) {
      textoLocalizacao = `Estante: ${item.estante}`;
    } else if (item.prateleira) {
      textoLocalizacao = `Prateleira: ${item.prateleira}`;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          setLivroSelecionado(item);
          setModalVisivel(true);
        }}
      >
        <Card style={styles.cartao} mode="elevated">
          <View style={styles.linhaLivro}>
            <Card.Cover source={{ uri: urlCapa }} style={styles.capaLivro} />

            <Card.Content style={styles.cartaoConteudo}>
              <View>
                <View style={styles.cabecalhoCard}>
                  <Text
                    variant="titleMedium"
                    style={styles.titulo}
                    numberOfLines={2}
                  >
                    {item.titulo || "Título não informado"}
                  </Text>

                  <Badge
                    size={24}
                    style={[
                      styles.badge,
                      {
                        backgroundColor: corBadge,
                        color: "#fff",
                      },
                    ]}
                  >
                    {textoBadge}
                  </Badge>
                </View>

                <Text
                  variant="bodyMedium"
                  style={styles.autor}
                  numberOfLines={1}
                >
                  {item.autor || "Autor não informado"}
                </Text>

                <View style={styles.containerLocalizacao}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={14}
                    color="#E02041"
                  />
                  <Text style={styles.textoLocalizacao} numberOfLines={1}>
                    {textoLocalizacao}
                  </Text>
                </View>
              </View>

              <View style={styles.rodapeCartao}>
                <View style={styles.containerTag}>
                  <Text style={styles.textoTag}>
                    {item.quantidadeTotal === 1
                      ? `RFID: ${item.exemplares[0]?.rfid_tag || "N/A"}`
                      : `Toque para ver os ${item.quantidadeTotal} exemplares`}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.areaFiltros}>
        <Searchbar
          placeholder="Buscar livro ou autor..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.inputSearch}
          iconColor="#1A1A1A"
          placeholderTextColor="#717171"
        />

        <View style={styles.areaChips}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {generosDisponiveis.map((genero) => (
              <Chip
                key={genero}
                selected={filtroGenero === genero}
                onPress={() => setFiltroGenero(genero)}
                style={[
                  styles.chip,
                  filtroGenero === genero
                    ? styles.chipSelecionado
                    : styles.chipNaoSelecionado,
                ]}
                textStyle={
                  filtroGenero === genero
                    ? styles.textoSelecionado
                    : styles.textoNaoSelecionado
                }
                showSelectedCheck={false}
                compact
              >
                {genero}
              </Chip>
            ))}
          </ScrollView>
        </View>
      </View>

      {carregando && livros.length === 0 ? (
        <ActivityIndicator
          animating={true}
          size="large"
          color="#1A1A1A"
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={livrosFiltrados}
          keyExtractor={(item, index) =>
            String(item.isbn ?? item.titulo ?? index)
          }
          renderItem={renderizarLivro}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={carregando}
              onRefresh={carregarLivros}
              tintColor="#1A1A1A"
            />
          }
          ListEmptyComponent={
            <Text style={styles.textoVazio}>
              {searchQuery.trim() !== ""
                ? "Nenhum livro encontrado com esta busca."
                : filtroGenero !== "TODOS"
                  ? "Nenhum livro encontrado neste filtro."
                  : "Nenhum livro cadastrado na biblioteca ainda."}
            </Text>
          }
        />
      )}

      {/* MODAL DE DETALHES DOS EXEMPLARES */}
      {/* PORTAL DO MODAL DE EXEMPLARES COM A DATA DE DEVOLUÇÃO */}
      {/* PORTAL DO MODAL DE EXEMPLARES CORRIGIDO */}
      <Portal>
        <Modal
          visible={modalVisivel}
          onDismiss={() => setModalVisivel(false)}
          contentContainerStyle={[styles.modalConteudo, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitulo} numberOfLines={2}>
            {livroSelecionado?.titulo || "Exemplares"}
          </Text>

          <ScrollView style={{ maxHeight: 340, marginTop: 12 }} showsVerticalScrollIndicator={false}>
            {livroSelecionado?.exemplares.map((ex, index) => (
              <View key={ex.id || index} style={styles.itemExemplar}>
                <View style={styles.linhaExemplarCabecalho}>
                  <Text variant="bodyLarge" style={styles.textoRfid}>Tag: {ex.rfid_tag}</Text>
                  
                  {/* AJUSTE 1: Cores do Status em Array */}
                  <View style={[
                    styles.miniBadge, 
                    ex.status === "DISPONIVEL" ? styles.miniBadgeVerde : styles.miniBadgeVermelho
                  ]}>
                    <Text style={styles.miniBadgeTexto}>{ex.status}</Text>
                  </View>
                </View>

                {/* AJUSTE 2: Bloco estrutural com fechamento correto das Views de Detalhes */}
                {ex.status === "EMPRESTADO" && (
                  <View style={styles.containerDetalhesEmprestimo}>
                    <View style={styles.linhaInfoLeitor}>
                      <MaterialCommunityIcons name="account-outline" size={16} color="#4B5563" />
                      <Text style={styles.textoInfoLeitor}>Leitor: {ex.leitor_nome || "Não identificado"}</Text>
                    </View>
                    
                    {ex.leitor_telefone && (
                      <View style={styles.linhaInfoLeitor}>
                        <MaterialCommunityIcons name="phone-outline" size={16} color="#4B5563" />
                        <Text style={styles.textoInfoLeitor}>Contato: {ex.leitor_telefone}</Text>
                      </View>
                    )}

                    <View style={styles.linhaInfoLeitor}>
                      <MaterialCommunityIcons name="calendar-clock" size={16} color="#4B5563" />
                      <Text style={styles.textoInfoLeitor}>Devolução: {formatarData(ex.data_devolucao)}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <Button mode="contained" onPress={() => setModalVisivel(false)} style={styles.btnFecharModal}>
            Fechar Janela
          </Button>
        </Modal>
      </Portal>

    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    // Container Principal
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    lista: {
      padding: 16,
      paddingBottom: 32,
    },
    textoVazio: {
      textAlign: "center",
      color: "#717171",
      marginTop: 40,
      fontSize: 16,
    },

    // Área de Busca e Filtros (Chips)
    areaFiltros: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
    },
    searchbar: {
      backgroundColor: "#F9FAFB",
      borderRadius: 8,
      elevation: 0,
      height: 48,
    },
    inputSearch: {
      fontSize: 15,
      minHeight: 48,
    },
    areaChips: {
      marginTop: 12,
      flexDirection: "row",
    },
    chip: {
      marginRight: 8,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
    },
    chipSelecionado: {
      backgroundColor: "#1A1A1A",
    },
    chipNaoSelecionado: {
      backgroundColor: "#F3F4F6",
    },
    textoSelecionado: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },
    textoNaoSelecionado: {
      color: "#4B5563",
      fontSize: 13,
    },

    // Cartão do Livro (Lista Principal)
    cartao: {
      backgroundColor: "#FFFFFF",
      marginBottom: 14,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    linhaLivro: {
      flexDirection: "row",
      padding: 12,
    },
    capaLivro: {
      width: 90,
      height: 130,
      borderRadius: 6,
      backgroundColor: "#F3F4F6",
    },
    cartaoConteudo: {
      flex: 1,
      paddingLeft: 14,
      paddingVertical: 2,
      justifyContent: "space-between",
    },
    cabecalhoCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      width: "100%",
    },
    titulo: {
      fontWeight: "700",
      color: "#111827",
      flex: 1,
      paddingRight: 8,
      lineHeight: 20,
    },
    badge: {
      alignSelf: "flex-start",
      fontWeight: "bold",
      fontSize: 11,
      paddingHorizontal: 8,
    },
    autor: {
      color: "#6B7280",
      marginTop: 4,
    },
    containerLocalizacao: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    textoLocalizacao: {
      color: "#4B5563",
      fontSize: 13,
      marginLeft: 4,
    },
    rodapeCartao: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    containerTag: {
      backgroundColor: "#F3F4F6",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    textoTag: {
      color: "#374151",
      fontSize: 11,
      fontWeight: "500",
    },

    // Modal de Exemplares Detalhado
    modalConteudo: {
      padding: 24,
      margin: 20,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    modalTitulo: {
      fontWeight: "800",
      color: "#111827",
      letterSpacing: -0.5,
    },
    itemExemplar: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
    },
    linhaExemplarCabecalho: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    textoRfid: {
      fontWeight: "600",
      color: "#1F2937",
      fontSize: 15,
    },
    containerDetalhesEmprestimo: {
      marginTop: 10,
      backgroundColor: "#F9FAFB",
      padding: 10,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: "#E02041",
    },
    linhaInfoLeitor: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },
    textoInfoLeitor: {
      marginLeft: 8,
      color: "#4B5563",
      fontSize: 14,
      fontWeight: "500",
    },

    // Estilos do Mini Badge (Status dentro do Modal)
    miniBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    miniBadgeVerde: {
      backgroundColor: "#10B981", // Verde
    },
    miniBadgeVermelho: {
      backgroundColor: "#E02041", // Vermelho
    },
    miniBadgeTexto: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    btnFecharModal: {
      marginTop: 20,
      backgroundColor: "#1A1A1A",
      borderRadius: 8,
      paddingVertical: 4,
    },
  });
