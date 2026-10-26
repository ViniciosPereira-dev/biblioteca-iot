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
import {
  ActivityIndicator,
  Button,
  TextInput,
  Text,
  useTheme,
} from "react-native-paper";

import NfcManager, { NfcTech } from "react-native-nfc-manager";

export default function CadastroLivro() {
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
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [genero, setGenero] = useState("");
  const [isbn, setIsbn] = useState("");
  const [estante, setEstante] = useState("");
  const [prateleira, setPrateleira] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [buscandoIsbn, setBuscandoIsbn] = useState(false);

  const camposCompletos = rfidTag !== "" && titulo !== "" && isbn !== "";

const buscarDadosPorIsbn = async () => {
    const isbnLimpo = isbn.replace(/\D/g, "");

    if (!isbnLimpo || (isbnLimpo.length !== 10 && isbnLimpo.length !== 13)) {
      Alert.alert("Atenção", "Digite um ISBN válido (10 ou 13 números).");
      return;
    }

    setBuscandoIsbn(true);
    try {
      // API da Open Library: 100% gratuita, sem bloqueios e sem necessidade de API Key
      const response = await fetch(`https://openlibrary.org/search.json?isbn=${isbnLimpo}`);
      
      if (!response.ok) {
        throw new Error("Erro na comunicação com a API da Open Library");
      }

      const data = await response.json();
      
      // A Open Library retorna "numFound: 0" se não achar nada
      if (data.numFound === 0 || !data.docs || data.docs.length === 0) {
        throw new Error("ISBN não encontrado");
      }

      // Os dados ficam no primeiro item do array 'docs'
      const livro = data.docs[0];
      console.log("Retorno da Open Library:", livro); 

      // Preenchendo o formulário
      if (livro.title && !titulo) {
        setTitulo(livro.title);
      }
      
      if (livro.author_name && livro.author_name.length > 0 && !autor) {
        setAutor(livro.author_name.join(", "));
      }
      
      if (livro.subject && livro.subject.length > 0 && !genero) {
        // A Open Library pode trazer muitos assuntos, pegamos o primeiro
        setGenero(livro.subject[0]); 
      }

    } catch (error) {
      console.warn("Erro ao buscar na Open Library:", error);
      Alert.alert(
        "Aviso",
        "ISBN não encontrado automaticamente. Você pode preencher os dados manualmente."
      );
    } finally {
      setBuscandoIsbn(false);
    }
  };

  const lerTagNfc = async () => {
    setIsScanning(true);
    setRfidTag("");

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      if (tag && tag.id) {
        setRfidTag(tag.id);
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

  const confirmarExclusaoTag = () => {
    Alert.alert(
      "Excluir Leitura",
      "Tem certeza que deseja descartar a tag lida?",
      [
        { text: "Não, manter", style: "cancel" },
        {
          text: "Sim, excluir",
          onPress: () => setRfidTag(""),
          style: "destructive",
        },
      ],
    );
  };

  const limparFormulario = () => {
    setRfidTag("");
    setTitulo("");
    setAutor("");
    setGenero("");
    setIsbn("");
    setEstante("");
    setPrateleira("");
  };

  const cadastrarLivro = async () => {
    setCarregando(true);
    try {
      const resposta = await fetch("http://192.168.1.4:3000/api/livros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfid_tag: rfidTag,
          titulo,
          autor,
          genero,
          isbn,
          estante,
          prateleira,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao cadastrar o exemplar.");
      }

      Alert.alert("Sucesso", "Exemplar físico cadastrado com sucesso!");
      limparFormulario();
    } catch (error) {
      Alert.alert("Erro no Cadastro", error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Novo Exemplar
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Aproxime a tag física RFID/NFC no leitor do celular
            </Text>
          </View>

          <View style={[styles.nfcBox, isScanning && styles.nfcBoxAtivo]}>
            {isScanning ? (
              <ActivityIndicator
                animating={true}
                color="#1A1A1A"
                size="small"
              />
            ) : (
              <MaterialCommunityIcons
                name="nfc"
                size={32}
                color={rfidTag ? "#10B981" : "#1A1A1A"}
              />
            )}

            <View style={styles.nfcInfo}>
              <Text style={styles.nfcLabel}>
                {isScanning ? "Aguardando leitura..." : "Tag RFID Detectada"}
              </Text>

              <View style={styles.inputTagContainer}>
                <TextInput
                  value={rfidTag}
                  onChangeText={setRfidTag}
                  placeholder={
                    isScanning
                      ? "Aproxime a tag..."
                      : "Escaneie ou digite a tag"
                  }
                  style={styles.inputRfid}
                  mode="flat"
                  underlineColor="#E5E5E5"
                  activeUnderlineColor="#1A1A1A"
                  autoCapitalize="characters"
                  editable={!isScanning}
                />

                {rfidTag !== "" && !isScanning && (
                  <TouchableOpacity
                    onPress={confirmarExclusaoTag}
                    style={styles.btnLimparIcone}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={24}
                      color="#E02041"
                    />
                  </TouchableOpacity>
                )}
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

          <View style={styles.formContainer}>
            {/* ISBN AGORA VEM PRIMEIRO */}
            <TextInput
              label="ISBN *"
              value={isbn}
              onChangeText={setIsbn}
              onBlur={buscarDadosPorIsbn} // Dispara a busca quando o usuário sai do campo
              mode="outlined"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#1A1A1A"
              keyboardType="numeric"
              right={
                buscandoIsbn ? (
                  <TextInput.Icon
                    icon={() => (
                      <ActivityIndicator size="small" color="#1A1A1A" />
                    )}
                  />
                ) : null
              }
            />

            <TextInput
              label="Título do Livro *"
              value={titulo}
              onChangeText={setTitulo}
              mode="outlined"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#1A1A1A"
              autoCapitalize="words"
            />

            <TextInput
              label="Autor"
              value={autor}
              onChangeText={setAutor}
              mode="outlined"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#1A1A1A"
              autoCapitalize="words"
            />

            <TextInput
              label="Gênero"
              value={genero}
              onChangeText={setGenero}
              mode="outlined"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#1A1A1A"
              autoCapitalize="words"
            />

            <View style={styles.linhaDupla}>
              <TextInput
                label="Estante"
                value={estante}
                onChangeText={setEstante}
                mode="outlined"
                style={[styles.input, styles.metade]}
                outlineColor="#E5E5E5"
                activeOutlineColor="#1A1A1A"
              />
              <TextInput
                label="Prateleira"
                value={prateleira}
                onChangeText={setPrateleira}
                mode="outlined"
                style={[styles.input, styles.metade]}
                outlineColor="#E5E5E5"
                activeOutlineColor="#1A1A1A"
              />
            </View>

            <Button
              mode="contained"
              onPress={cadastrarLivro}
              loading={carregando}
              disabled={carregando || isScanning}
              // Se os campos não estiverem completos, aplica um estilo cinza
              style={[
                styles.btnCadastrar,
                !camposCompletos && styles.btnCadastrarIncompleto,
              ]}
              labelStyle={styles.btnCadastrarTexto}
            >
              Cadastrar Exemplar
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F7F7" },
    scrollContainer: {
      padding: 20,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 40,
      paddingBottom: 150,
    },
    headerContainer: { marginBottom: 20 },
    headerTitle: { fontWeight: "800", color: "#1A1A1A", fontSize: 22 },
    headerSubtitle: { color: "#717171", fontSize: 14, marginTop: 4 },

    nfcBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: "#E5E5E5",
      marginBottom: 20,
      elevation: 1,
    },
    nfcBoxAtivo: { borderColor: "#1A1A1A", backgroundColor: "#F9F9F9" },
    nfcInfo: { flex: 1, marginHorizontal: 12 },
    nfcLabel: {
      fontSize: 11,
      color: "#717171",
      fontWeight: "600",
      textTransform: "uppercase",
    },

    inputTagContainer: { flexDirection: "row", alignItems: "center" },
    inputRfid: {
      flex: 1,
      backgroundColor: "transparent",
      fontSize: 14,
      fontFamily: "monospace",
      height: 35,
      paddingHorizontal: 0,
    },
    btnLimparIcone: { padding: 5, paddingRight: 0 },

    btnEscanear: { backgroundColor: "#1A1A1A", borderRadius: 8, marginLeft: 8 },
    btnCancelar: { backgroundColor: "#E02041" },
    btnEscanearTexto: { fontSize: 12, fontWeight: "700" },

    formContainer: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: "#E5E5E5",
      elevation: 1,
    },
    input: { backgroundColor: "#FFFFFF", marginBottom: 14, fontSize: 14 },
    linhaDupla: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
    },
    metade: { flex: 1 },
    btnCadastrar: {
      backgroundColor: "#1A1A1A",
      borderRadius: 12,
      marginTop: 10,
      paddingVertical: 6,
    },
    // NOVO ESTILO: Deixa o botão cinza claro quando faltam dados
    btnCadastrarIncompleto: { backgroundColor: "#B0B0B0" },
    btnCadastrarTexto: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  });
