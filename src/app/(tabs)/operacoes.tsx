import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import { Button, Divider, Text, TextInput, useTheme } from "react-native-paper";

export default function Operacoes() {
  const theme = useTheme();

  // Estados para o Empréstimo
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");

  // Estados Globais da Tela
  const [statusTexto, setStatusTexto] = useState("Aguardando operação...");
  const [carregando, setCarregando] = useState(false);

  // 1. Função de EMPRESTAR
  async function registrarEmprestimo() {
    if (!cpf || !telefone) {
      Alert.alert("Atenção", "Digite o CPF/RA e o Telefone do aluno.");
      return;
    }

    try {
      setCarregando(true);
      setStatusTexto("Aproxime o livro para EMPRÉSTIMO...");
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();
      const uid = tag.id;
      setStatusTexto(`Autenticando Tag: ${uid}...`);

      // 🚨 LEMBRE-SE DO SEU IP AQUI
      const resposta = await fetch("http://192.168.1.2:3000/api/emprestimos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfid_tag: uid, leitor_id: cpf, telefone }), // Enviando o telefone
      });

      if (resposta.status === 200 || resposta.status === 201) {
        // Se o seu backend estiver devolvendo a data calculada no JSON, você pode exibir aqui!
        Alert.alert(
          "Sucesso!",
          "Livro emprestado com sucesso. Status alterado.",
        );
        setStatusTexto("Empréstimo finalizado.");
        setCpf("");
        setTelefone("");
      } else {
        const erro = await resposta.json();
        Alert.alert(
          "Transação Negada",
          erro.erro || "Erro ao registrar empréstimo.",
        );
        setStatusTexto("Operação negada.");
      }
    } catch (ex) {
      console.warn(ex);
      setStatusTexto("Erro na leitura NFC.");
    } finally {
      NfcManager.cancelTechnologyRequest();
      setCarregando(false);
    }
  }

  // 2. Função de DEVOLVER
  async function registrarDevolucao() {
    try {
      setCarregando(true);
      setStatusTexto("Aproxime o livro para DEVOLUÇÃO...");
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();
      const uid = tag.id;
      setStatusTexto(`Devolvendo Tag: ${uid}...`);

      // 🚨 LEMBRE-SE DO SEU IP AQUI - Ajuste a rota se você chamou diferente no Node.js
      const resposta = await fetch(
        "http://192.168.1.2:3000/api/emprestimos/devolucao",
        {
          method: "POST", // ou POST, dependendo de como você fez no backend
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rfid_tag: uid }), // Só precisa da tag!
        },
      );

      if (resposta.status === 200) {
        Alert.alert(
          "Sucesso!",
          "Livro devolvido e agora está DISPONÍVEL no catálogo.",
        );
        setStatusTexto("Devolução concluída com sucesso!");
      } else {
        const erro = await resposta.json();
        Alert.alert("Erro", erro.erro || "Não foi possível devolver o livro.");
        setStatusTexto("Falha na devolução.");
      }
    } catch (ex) {
      console.warn(ex);
      setStatusTexto("Erro na leitura NFC.");
    } finally {
      NfcManager.cancelTechnologyRequest();
      setCarregando(false);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.cabecalhoApp}>
        <Text variant="headlineMedium" style={styles.tituloApp}>
          Operações
        </Text>
      </View>

      <View style={styles.conteudo}>
        {/* SEÇÃO 1: EMPRÉSTIMO */}
        <Text variant="titleLarge" style={styles.tituloSecao}>
          Saída de Livros
        </Text>
        <Text style={styles.instrucao}>
          Preencha os dados e leia a tag para emprestar.
        </Text>

        <TextInput
          mode="outlined"
          label="CPF ou RA do Aluno"
          value={cpf}
          onChangeText={setCpf}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="WhatsApp / Telefone"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <Button
          mode="contained"
          icon="book-arrow-up"
          loading={carregando}
          disabled={carregando}
          onPress={registrarEmprestimo}
          buttonColor="#28a745" // Verde
          style={styles.botao}
        >
          Ler NFC e Emprestar
        </Button>

        <Text style={styles.status}>{statusTexto}</Text>

        <Divider style={styles.divisor} />

        {/* SEÇÃO 2: DEVOLUÇÃO */}
        <Text variant="titleLarge" style={styles.tituloSecao}>
          Entrada de Livros
        </Text>
        <Text style={styles.instrucao}>
          Nenhum dado necessário. Apenas leia a tag do livro.
        </Text>

        <Button
          mode="contained"
          icon="book-arrow-down"
          loading={carregando}
          disabled={carregando}
          onPress={registrarDevolucao}
          buttonColor={theme.colors.primary} // Azul
          style={styles.botao}
        >
          Ler NFC e Devolver
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  cabecalhoApp: {
    padding: 20,
    backgroundColor: "#007BFF",
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  tituloApp: { color: "#fff", fontWeight: "bold", marginTop: 10 },
  conteudo: { padding: 20 },
  tituloSecao: { fontWeight: "bold", color: "#333", marginBottom: 5 },
  instrucao: { color: "#666", marginBottom: 15 },
  input: { marginBottom: 10, backgroundColor: "#fff" },
  status: {
    textAlign: "center",
    marginVertical: 15,
    color: "#007BFF",
    fontWeight: "bold",
  },
  botao: { borderRadius: 8, paddingVertical: 5 },
  divisor: { marginVertical: 30, height: 1.5 },
});
