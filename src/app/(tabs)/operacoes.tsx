import React, { useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Button, TextInput, Text, useTheme } from "react-native-paper";

import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export default function OperacoesLivro() {
  const theme = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    async function initNfc() {
      try {
        await NfcManager.start();
      } catch (ex) {
        console.warn("Erro ao iniciar NFC", ex);
      }
    }
    initNfc();
  }, []);

  const [rfidTag, setRfidTag] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [buscando, setBuscando] = useState(false);
  
  const [livro, setLivro] = useState(null); 
  const [processando, setProcessando] = useState(false);
  
  // NOVO: Estado para guardar o CPF do Leitor que vai pegar o livro
  const [cpfLeitor, setCpfLeitor] = useState("");

  const lerTagNfc = async () => {
    setIsScanning(true);
    limparTela();
    
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      
      if (tag && tag.id) {
        setRfidTag(tag.id);
        buscarLivroPorRfid(tag.id);
      }
    } catch (error) {
      console.warn("Falha ou cancelamento na leitura NFC:", error);
    } finally {
      NfcManager.cancelTechnologyRequest();
      setIsScanning(false);
    }
  };

  const cancelarLeitura = () => {
    NfcManager.cancelTechnologyRequest();
    setIsScanning(false);
  };

  const limparTela = () => {
    setRfidTag("");
    setLivro(null);
    setCpfLeitor(""); // Limpa o CPF também
  };

  const buscarLivroPorRfid = async (tag) => {
    setBuscando(true);
    try {
      const resposta = await fetch(`http://192.168.1.4:3000/api/livros/${tag}`); 
      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Livro não encontrado.");
      }

      setLivro(dados);
    } catch (error) {
      Alert.alert("Não Encontrado", "Nenhum livro cadastrado com esta Tag RFID no acervo.");
      limparTela();
    } finally {
      setBuscando(false);
    }
  };

  // FUNÇÃO 1: CRIAR EMPRÉSTIMO VINCULANDO O LEITOR
  const realizarEmprestimo = async () => {
    if (!cpfLeitor) {
      Alert.alert("Atenção", "Digite o CPF do leitor para realizar o empréstimo.");
      return;
    }

    setProcessando(true);
    try {
      // Aqui chamamos a rota de Empréstimos, enviando qual é o livro e quem é o leitor
      const resposta = await fetch(`http://192.168.1.4:3000/api/emprestimos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ livro_id: livro.id, leitor_id: cpfLeitor }),
      });

      const textoResposta = await resposta.text();
      let dados;
      try { dados = JSON.parse(textoResposta); } 
      catch (e) { throw new Error("Erro no servidor ao criar empréstimo."); }

      if (!resposta.ok) throw new Error(dados.erro || "Erro ao processar empréstimo.");

      Alert.alert("Sucesso", "Empréstimo registrado com sucesso para este leitor!");
      limparTela();
    } catch (error) {
      Alert.alert("Erro", error.message);
    } finally {
      setProcessando(false);
    }
  };

const realizarDevolucao = async () => {
    setProcessando(true);
    try {
      // MUDANÇA AQUI: Apontando para a rota de devolução de empréstimos!
      const resposta = await fetch(`http://192.168.1.4:3000/api/emprestimos/devolucao`, {
        method: "POST", // Enviamos como POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ livro_id: livro.id }), // Mandamos o ID do livro
      });

      const textoResposta = await resposta.text();
      let dados;
      try { dados = JSON.parse(textoResposta); } 
      catch (e) { throw new Error("Erro no servidor ao devolver."); }

      if (!resposta.ok) throw new Error(dados.erro || "Erro ao processar devolução.");

      Alert.alert("Sucesso", "Devolução concluída! O livro está disponível novamente.");
      limparTela();
    } catch (error) {
      Alert.alert("Erro", error.message);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerContainer}>
            <Text variant="titleLarge" style={styles.headerTitle}>Empréstimos e Devoluções</Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Aproxime a tag para identificar o exemplar
            </Text>
          </View>

          <View style={[styles.nfcBox, isScanning && styles.nfcBoxAtivo]}>
            {isScanning || buscando ? (
              <ActivityIndicator animating={true} color="#1A1A1A" size="small" />
            ) : (
              <MaterialCommunityIcons name="nfc" size={32} color={rfidTag ? "#10B981" : "#1A1A1A"} />
            )}
            
            <View style={styles.nfcInfo}>
              <Text style={styles.nfcLabel}>
                {isScanning ? "Aguardando leitura..." : buscando ? "Buscando no acervo..." : "Tag RFID"}
              </Text>
              
              <View style={styles.inputTagContainer}>
                <TextInput
                  value={rfidTag}
                  onChangeText={setRfidTag}
                  placeholder={isScanning ? "Aproxime a tag..." : "Escaneie ou digite a tag"}
                  style={styles.inputRfid}
                  mode="flat"
                  underlineColor="#E5E5E5"
                  activeUnderlineColor="#1A1A1A"
                  autoCapitalize="characters"
                  editable={!isScanning}
                  onSubmitEditing={() => rfidTag ? buscarLivroPorRfid(rfidTag) : null}
                  right={
                    rfidTag && !isScanning ? (
                      <TextInput.Icon icon="close-circle" iconColor="#E02041" onPress={limparTela} />
                    ) : null
                  }
                />
              </View>
            </View>

            {(!rfidTag || isScanning) && (
              <Button 
                mode="contained" 
                onPress={isScanning ? cancelarLeitura : lerTagNfc} 
                style={[styles.btnEscanear, isScanning && styles.btnCancelar]} 
                labelStyle={styles.btnEscanearTexto}
              >
                {isScanning ? "Cancelar" : "Escanear"}
              </Button>
            )}
          </View>

          {livro && (
            <View style={styles.cardLivro}>
              <View style={styles.cardCabecalho}>
                <MaterialCommunityIcons name="book-open-variant" size={24} color="#1A1A1A" />
                <View style={[
                  styles.statusBadge, 
                  livro.status === 'DISPONIVEL' ? styles.statusBadgeDisponivel : styles.statusBadgeEmprestado
                ]}>
                  <Text style={[
                    styles.statusTexto, 
                    livro.status === 'DISPONIVEL' ? styles.statusTextoVerde : styles.statusTextoVermelho
                  ]}>
                    {livro.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.livroTitulo}>{livro.titulo}</Text>
              <Text style={styles.livroAutor}>{livro.autor || "Autor desconhecido"}</Text>
              
              <View style={styles.livroLocalizacao}>
                <MaterialCommunityIcons name="bookshelf" size={18} color="#717171" />
                <Text style={styles.localizacaoTexto}>
                  Estante: {livro.estante || "N/A"}   |   Prateleira: {livro.prateleira || "N/A"}
                </Text>
              </View>

              <View style={styles.areaAcoes}>
                {livro.status === 'DISPONIVEL' ? (
                  // SE ESTIVER DISPONÍVEL, MOSTRA O CAMPO DE CPF E BOTÃO DE EMPRESTAR
                  <View>
                    <TextInput 
                      label="CPF do Leitor *" 
                      value={cpfLeitor} 
                      onChangeText={setCpfLeitor} 
                      mode="outlined" 
                      style={styles.inputLeitor} 
                      outlineColor="#E5E5E5" 
                      activeOutlineColor="#1A1A1A" 
                      keyboardType="numeric" 
                      placeholder="Somente números"
                    />
                    <Button 
                      mode="contained" 
                      onPress={realizarEmprestimo} 
                      loading={processando}
                      disabled={processando || !cpfLeitor} // Trava se não digitar o CPF
                      style={[styles.btnEmprestar, !cpfLeitor && styles.btnDesativado]}
                      icon="account-arrow-right-outline"
                    >
                      Registrar Empréstimo
                    </Button>
                  </View>
                ) : (
                  // SE ESTIVER EMPRESTADO, MOSTRA APENAS O BOTÃO DE DEVOLVER
                  <Button 
                    mode="contained" 
                    onPress={realizarDevolucao} 
                    loading={processando}
                    disabled={processando}
                    style={styles.btnDevolver}
                    icon="book-arrow-left-outline"
                  >
                    Confirmar Devolução
                  </Button>
                )}
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F7F7" },
    scrollContainer: { padding: 20, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 40, paddingBottom: 150 },
    headerContainer: { marginBottom: 20 },
    headerTitle: { fontWeight: "800", color: "#1A1A1A", fontSize: 22 },
    headerSubtitle: { color: "#717171", fontSize: 14, marginTop: 4 },
    
    nfcBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5E5E5", marginBottom: 20, elevation: 1 },
    nfcBoxAtivo: { borderColor: "#1A1A1A", backgroundColor: "#F9F9F9" }, 
    nfcInfo: { flex: 1, marginHorizontal: 12 },
    nfcLabel: { fontSize: 11, color: "#717171", fontWeight: "600", textTransform: "uppercase" },
    inputTagContainer: { flexDirection: "row", alignItems: "center" },
    inputRfid: { flex: 1, backgroundColor: "transparent", fontSize: 14, fontFamily: "monospace", height: 35, paddingHorizontal: 0 },
    
    btnEscanear: { backgroundColor: "#1A1A1A", borderRadius: 8, marginLeft: 8 },
    btnCancelar: { backgroundColor: "#E02041" }, 
    btnEscanearTexto: { fontSize: 12, fontWeight: "700" },

    cardLivro: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#E5E5E5", elevation: 1 },
    cardCabecalho: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
    statusBadgeDisponivel: { backgroundColor: "#D1FAE5" }, 
    statusBadgeEmprestado: { backgroundColor: "#FEE2E2" }, 
    statusTexto: { fontSize: 12, fontWeight: "700" },
    statusTextoVerde: { color: "#065F46" }, 
    statusTextoVermelho: { color: "#991B1B" }, 
    
    livroTitulo: { fontSize: 20, fontWeight: "800", color: "#1A1A1A", marginBottom: 4 },
    livroAutor: { fontSize: 14, color: "#717171", marginBottom: 16 },
    
    livroLocalizacao: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", padding: 12, borderRadius: 8, marginBottom: 20 },
    localizacaoTexto: { fontSize: 13, color: "#4B5563", marginLeft: 8, fontWeight: "600" },
    
    areaAcoes: { borderTopWidth: 1, borderTopColor: "#E5E5E5", paddingTop: 16 },
    
    // ESTILOS NOVOS DO LEITOR
    inputLeitor: { backgroundColor: "#FFFFFF", marginBottom: 16, fontSize: 14 },
    btnDesativado: { backgroundColor: "#B0B0B0" },
    
    btnEmprestar: { backgroundColor: "#10B981", borderRadius: 8 }, 
    btnDevolver: { backgroundColor: "#3B82F6", borderRadius: 8 }, 
  });