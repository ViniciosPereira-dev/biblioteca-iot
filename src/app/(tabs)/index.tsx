import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 

import {
  useTheme,
  Text,
  Card,
  Badge,
  ActivityIndicator,
  Searchbar,
  Chip,
  Portal,
  Modal,
  Button,
} from 'react-native-paper';

export default function Catalogo() {
  const theme = useTheme();
  const styles = getStyles(theme);

  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('TODOS');

  // Estados para controlar o Modal de Exemplares
  const [modalVisivel, setModalVisivel] = useState(false);
  const [livroSelecionado, setLivroSelecionado] = useState(null);

  const carregarLivros = async () => {
    setCarregando(true);
    try {
      const resposta = await fetch('http://192.168.1.2:3000/api/livros');
      if (!resposta.ok) {
        throw new Error(`Erro HTTP: ${resposta.status}`);
      }
      const dados = await resposta.json();
      setLivros(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.warn('Erro ao buscar livros:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarLivros();
  }, []);

  // Lógica de agrupamento aprimorada (guarda o array de exemplares detalhados)
  const agruparLivros = (listaDeLivros) => {
    const grupos = listaDeLivros.reduce((acumulador, livro) => {
      const chave = livro.isbn || livro.titulo; 
      
      if (!acumulador[chave]) {
        acumulador[chave] = {
          ...livro,
          quantidadeTotal: 0,
          quantidadeDisponivel: 0,
          exemplares: [] // Guarda os detalhes de cada exemplar físico
        };
      }
      
      acumulador[chave].quantidadeTotal += 1;
      
      const isDisponivel = String(livro.status ?? '').toUpperCase() === 'DISPONIVEL';
      if (isDisponivel) {
        acumulador[chave].quantidadeDisponivel += 1;
      }
      
      acumulador[chave].exemplares.push({
        id: livro.id,
        rfid_tag: livro.rfid_tag,
        status: livro.status || 'DISPONIVEL',
        estante: livro.estante,
        prateleira: livro.prateleira,
        leitor_nome: livro.leitor_nome,
        data_devolucao: livro.data_devolucao,
      });
      
      return acumulador;
    }, {});
    
    return Object.values(grupos);
  };

  const listaAgrupada = agruparLivros(livros);


  const generosUnicos = [...new Set(listaAgrupada.map(livro => livro.genero || 'Outros'))].sort();
  const generosDisponiveis = ['TODOS', ...generosUnicos];

  const livrosFiltrados = listaAgrupada.filter((livro) => {
    const titulo = String(livro.titulo ?? '').toLowerCase();
    const autor = String(livro.autor ?? '').toLowerCase();
    const termoBusca = searchQuery.trim().toLowerCase();

    const bateuTexto = titulo.includes(termoBusca) || autor.includes(termoBusca);

    const generoLivro = livro.genero || 'Outros';
    const bateuGenero = filtroGenero === 'TODOS' || generoLivro === filtroGenero;

    return bateuTexto && bateuGenero;
  });

  const renderizarLivro = ({ item }) => {
    const urlCapa = item.isbn
      ? `https://covers.openlibrary.org/b/isbn/${item.isbn}-M.jpg`
      : 'https://placehold.co/150x220?text=Sem+Capa';

    const qtdEmprestados = item.quantidadeTotal - item.quantidadeDisponivel;
    const temDisponivel = item.quantidadeDisponivel > 0;

    const corBadge = temDisponivel ? '#10B981' : '#E02041';
    const textoBadge = temDisponivel 
      ? `${item.quantidadeDisponivel} de ${item.quantidadeTotal} Disp.` 
      : 'Indisponível';

    let textoLocalizacao = 'Local não cadastrado';
    if (item.estante && item.prateleira) {
      textoLocalizacao = `Estante ${item.estante}, Prat. ${item.prateleira}`;
    } else if (item.estante) {
      textoLocalizacao = `Estante ${item.estante}`;
    } else if (item.prateleira) {
      textoLocalizacao = `Prateleira ${item.prateleira}`;
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
                  <Text variant="titleMedium" style={styles.titulo} numberOfLines={2}>
                    {item.titulo || 'Título não informado'}
                  </Text>
                  
                  <Badge
                    size={24}
                    style={[
                      styles.badge,
                      {
                        backgroundColor: corBadge, 
                        color: '#fff'
                      },
                    ]}
                  >
                    {textoBadge}
                  </Badge>
                </View>

                <Text variant="bodyMedium" style={styles.autor} numberOfLines={1}>
                  {item.autor || 'Autor não informado'}
                </Text>
                
                <View style={styles.containerLocalizacao}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color="#E02041" />
                  <Text style={styles.textoLocalizacao} numberOfLines={1}>
                    {textoLocalizacao}
                  </Text>
                </View>
              </View>

              <View style={styles.rodapeCartao}>
                <View style={styles.containerTag}>
                  <Text style={styles.textoTag}>
                    {item.quantidadeTotal === 1 
                      ? `RFID: ${item.exemplares[0]?.rfid_tag || 'N/A'}` 
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
                  filtroGenero === genero ? styles.chipSelecionado : styles.chipNaoSelecionado,
                ]}
                textStyle={filtroGenero === genero ? styles.textoSelecionado : styles.textoNaoSelecionado}
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
        <ActivityIndicator animating={true} size="large" color="#1A1A1A" style={styles.loading} />
      ) : (
        <FlatList
          data={livrosFiltrados}
          keyExtractor={(item, index) => String(item.isbn ?? item.titulo ?? index)}
          renderItem={renderizarLivro}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregarLivros} tintColor="#1A1A1A" />}
          ListEmptyComponent={
            <Text style={styles.textoVazio}>
              {searchQuery.trim() !== ''
                ? 'Nenhum livro encontrado com esta busca.'
                : filtroGenero !== 'TODOS'
                ? 'Nenhum livro encontrado neste filtro.'
                : 'Nenhum livro cadastrado na biblioteca ainda.'}
            </Text>
          }
        />
      )}

      {/* MODAL DE DETALHES DOS EXEMPLARES */}
      <Portal>
        <Modal
          visible={modalVisivel}
          onDismiss={() => setModalVisivel(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {livroSelecionado && (
            <View>
              <Text variant="titleLarge" style={styles.modalTitulo}>
                {livroSelecionado.titulo}
              </Text>
              <Text variant="bodyMedium" style={styles.modalAutor}>
                Autor: {livroSelecionado.autor}
              </Text>

              <Text style={styles.modalSubtitulo}>
                Exemplares Físicos ({livroSelecionado.quantidadeTotal}):
              </Text>

              <ScrollView style={styles.modalListaExemplares}>
{livroSelecionado.exemplares.map((ex, idx) => {
                  const emprestado = String(ex.status ?? '').toUpperCase() === 'EMPRESTADO';
                  return (
                    <View key={ex.id || idx} style={styles.itemExemplar}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.itemRfid}>RFID: {ex.rfid_tag}</Text>
                        <Text style={styles.itemLocal}>
                          Local: Estante {ex.estante}, Prat. {ex.prateleira}
                        </Text>
                        
                        {/* A MÁGICA ACONTECE AQUI: Só aparece se estiver emprestado */}
                        {emprestado && (
                          <View style={{ marginTop: 8, padding: 8, backgroundColor: '#FEE2E2', borderRadius: 6 }}>
                            <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: 'bold' }}>
                              👤 Leitor: {ex.leitor_nome || 'CPF não cadastrado'}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#991B1B' }}>
                              📅 Devolução: {ex.data_devolucao ? new Date(ex.data_devolucao).toLocaleDateString('pt-BR') : 'Data não definida'}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Badge
                        size={22}
                        style={{
                          backgroundColor: emprestado ? '#E02041' : '#10B981',
                          color: '#fff',
                          fontWeight: 'bold',
                        }}
                      >
                        {ex.status}
                      </Badge>
                    </View>
                  );
                })}
              </ScrollView>

              <Button
                mode="contained"
                onPress={() => setModalVisivel(false)}
                style={styles.botaoFechar}
                buttonColor="#1A1A1A"
              >
                Fechar
              </Button>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F7F7', 
    },
    areaFiltros: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#EBEBEB',
      elevation: 0,
    },
    searchbar: {
      backgroundColor: '#F5F5F5',
      borderRadius: 12,
      marginBottom: 16,
      height: 50,
      elevation: 0,
    },
    inputSearch: {
      minHeight: 0,
      color: '#1A1A1A',
    },
    areaChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginHorizontal: -4,
    },
    chip: {
      marginHorizontal: 4,
      marginBottom: 8,
      flexShrink: 0,
      borderRadius: 20,
    },
    chipSelecionado: {
      backgroundColor: '#1A1A1A',
      borderWidth: 1,
      borderColor: '#1A1A1A',
    },
    chipNaoSelecionado: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E5E5',
    },
    textoSelecionado: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    textoNaoSelecionado: {
      color: '#717171',
      fontWeight: '500',
    },
    lista: {
      padding: 15,
      paddingBottom: 100,
    },
    cartao: {
      marginBottom: 15,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#EFEFEF',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    linhaLivro: {
      flexDirection: 'row',
    },
    capaLivro: {
      width: 90, 
      height: 135,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      backgroundColor: '#F5F5F5',
    },
    cartaoConteudo: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 12,
      justifyContent: 'space-between',
    },
    cabecalhoCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titulo: {
      fontWeight: '800',
      color: '#1A1A1A',
      fontSize: 16,
      flex: 1, 
      marginRight: 8, 
    },
    badge: {
      paddingHorizontal: 8,
      fontWeight: 'bold',
      fontSize: 12,
      marginTop: 2, 
    },
    autor: {
      color: '#717171',
      marginTop: 4,
      fontSize: 14,
    },
    containerLocalizacao: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    textoLocalizacao: {
      color: '#717171',
      fontSize: 12,
      marginLeft: 4,
      fontWeight: '500',
    },
    rodapeCartao: {
      marginTop: 10,
      alignItems: 'flex-start', 
    },
    containerTag: {
      backgroundColor: '#F5F5F5', 
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    textoTag: {
      color: '#717171', 
      fontSize: 11,
      fontFamily: 'monospace', 
      fontWeight: '600',
    },
    loading: {
      marginTop: 50,
    },
    textoVazio: {
      textAlign: 'center',
      marginTop: 50,
      color: '#717171',
      fontSize: 16,
      paddingHorizontal: 20,
    },

    // ESTILOS DO MODAL
    modalContainer: {
      backgroundColor: 'white',
      padding: 20,
      margin: 20,
      borderRadius: 16,
      maxHeight: '80%',
    },
    modalTitulo: {
      fontWeight: 'bold',
      color: '#1A1A1A',
    },
    modalAutor: {
      color: '#717171',
      marginBottom: 15,
    },
    modalSubtitulo: {
      fontWeight: 'bold',
      fontSize: 14,
      color: '#1A1A1A',
      marginBottom: 10,
      borderTopWidth: 1,
      borderTopColor: '#EBEBEB',
      paddingTop: 12,
    },
    modalListaExemplares: {
      maxHeight: 250,
      marginBottom: 15,
    },
    itemExemplar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    itemRfid: {
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: 12,
      color: '#374151',
    },
    itemLocal: {
      fontSize: 11,
      color: '#6B7280',
      marginTop: 2,
    },
    botaoFechar: {
      borderRadius: 8,
    },
  });