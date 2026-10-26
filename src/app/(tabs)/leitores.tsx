import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { Button, TextInput, Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Leitores() {
  const theme = useTheme();
  const styles = getStyles(theme);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carregando, setCarregando] = useState(false);

  // MÁSCARAS PARA MELHORAR A EXPERIÊNCIA DO USUÁRIO
  const aplicarMascaraCPF = (texto) => {
    let valor = texto.replace(/\D/g, ""); // Tira tudo que não é número
    if (valor.length > 11) valor = valor.slice(0, 11);
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(valor);
  };

  const aplicarMascaraTelefone = (texto) => {
    let valor = texto.replace(/\D/g, "");
    if (valor.length > 11) valor = valor.slice(0, 11);
    valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
    valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
    setTelefone(valor);
  };

  const limparFormulario = () => {
    setNome("");
    setCpf("");
    setTelefone("");
  };

  const cadastrarLeitor = async () => {
    // Limpa a formatação para enviar apenas números ao backend
    const cpfLimpo = cpf.replace(/\D/g, "");
    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (!nome.trim() || cpfLimpo.length !== 11 || telefoneLimpo.length < 10) {
      Alert.alert("Atenção", "Preencha o Nome, um CPF válido (11 dígitos) e o Telefone com DDD.");
      return;
    }

    setCarregando(true);
    try {
      // ATENÇÃO: Verifique se este IP é o mesmo que você está usando nas outras telas
      const resposta = await fetch("http://192.168.1.4:3000/api/leitores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome,
          cpf: cpfLimpo, 
          telefone: telefoneLimpo,
        }),
      });

      const textoResposta = await resposta.text();
      let dados;
      try {
        dados = JSON.parse(textoResposta);
      } catch (e) {
        throw new Error("Erro de comunicação com o servidor.");
      }

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao cadastrar leitor.");
      }

      Alert.alert("Sucesso", "Leitor cadastrado com sucesso! Já pode realizar empréstimos.");
      limparFormulario();
    } catch (error) {
      Alert.alert("Erro", error.message);
    } finally {
      setCarregando(false);
    }
  };

  // Trava visual do botão
  const camposCompletos = nome.length > 2 && cpf.replace(/\D/g, "").length === 11 && telefone.length > 13;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerContainer}>
            <Text variant="titleLarge" style={styles.headerTitle}>Novo Leitor</Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Cadastre usuários para permitir empréstimos de livros
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.iconeContainer}>
              <MaterialCommunityIcons name="account-school-outline" size={48} color="#1A1A1A" />
            </View>

            <TextInput
              label="Nome Completo *"
              value={nome}
              onChangeText={setNome}
              mode="outlined"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#1A1A1A"
              autoCapitalize="words"
              left={<TextInput.Icon icon="account-outline" color="#717171" />}
            />

            <TextInput
              label="CPF *"
              value={cpf}
              onChangeText={aplicarMascaraCPF}
              mode="outlined"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#1A1A1A"
              keyboardType="numeric"
              maxLength={14} 
              left={<TextInput.Icon icon="card-account-details-outline" color="#717171" />}
            />

            <TextInput
              label="Telefone (WhatsApp) *"
              value={telefone}
              onChangeText={aplicarMascaraTelefone}
              mode="outlined"
              style={styles.input}
              outlineColor="#E5E5E5"
              activeOutlineColor="#1A1A1A"
              keyboardType="numeric"
              maxLength={15} 
              left={<TextInput.Icon icon="phone-outline" color="#717171" />}
            />

            <Button
              mode="contained"
              onPress={cadastrarLeitor}
              loading={carregando}
              disabled={carregando}
              style={[styles.btnCadastrar, !camposCompletos && styles.btnCadastrarIncompleto]}
              labelStyle={styles.btnCadastrarTexto}
              icon="content-save-outline"
            >
              Salvar Cadastro
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
      paddingBottom: 40 
    },
    headerContainer: { marginBottom: 20 },
    headerTitle: { fontWeight: "800", color: "#1A1A1A", fontSize: 22 },
    headerSubtitle: { color: "#717171", fontSize: 14, marginTop: 4 },
    
    formContainer: { 
      backgroundColor: "#FFFFFF", 
      borderRadius: 12, 
      padding: 20, 
      borderWidth: 1, 
      borderColor: "#E5E5E5", 
      elevation: 1 
    },
    iconeContainer: {
      alignItems: "center",
      marginBottom: 20,
      backgroundColor: "#F3F4F6",
      padding: 16,
      borderRadius: 50,
      alignSelf: "center",
    },
    input: { backgroundColor: "#FFFFFF", marginBottom: 16, fontSize: 14 },
    
    btnCadastrar: { backgroundColor: "#1A1A1A", borderRadius: 12, marginTop: 10, paddingVertical: 6 },
    btnCadastrarIncompleto: { backgroundColor: "#B0B0B0" },
    btnCadastrarTexto: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  });