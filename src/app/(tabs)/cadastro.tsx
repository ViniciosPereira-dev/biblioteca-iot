import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function Cadastro() {
  const theme = useTheme();
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [statusTexto, setStatusTexto] = useState(
    "Preencha os dados e leia a tag.",
  );
  const [carregando, setCarregando] = useState(false);

  async function lerEtiquetaESalvar() {
    if (!titulo || !autor || !isbn) {
      Alert.alert(
        "Atenção",
        "Preencha o título, autor e o ISBN antes de ler a tag.",
      );
      return;
    }

    try {
      setCarregando(true);
      setStatusTexto("Aproxime a etiqueta NFC (ou cartão)...");
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();
      const uid = tag.id;
      setStatusTexto(`Lendo Tag: ${uid}...`);

      // 🚨 ATENÇÃO: COLOQUE SEU IP AQUI
      const resposta = await fetch("http://192.168.1.2:3000/api/livros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfid_tag: uid, titulo, autor, isbn }), // <- ISBN adicionado!
      });

      if (resposta.status === 201) {
        Alert.alert("Sucesso!", "Livro cadastrado no acervo com sucesso.");
        setStatusTexto("Pronto para o próximo livro.");
        // Limpa os campos após o sucesso
        setTitulo("");
        setAutor("");
        setIsbn("");
      } else {
        const erro = await resposta.json();
        Alert.alert("Aviso", erro.erro || "Erro ao cadastrar.");
        setStatusTexto("Falha na gravação.");
      }
    } catch (ex) {
      console.warn(ex);
      setStatusTexto("Erro ou leitura cancelada.");
    } finally {
      NfcManager.cancelTechnologyRequest();
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.tituloApp}>
        Cadastrar Livro
      </Text>

      <View style={styles.formulario}>
        <TextInput
          mode="outlined"
          label="Título do Livro"
          value={titulo}
          onChangeText={setTitulo}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Autor"
          value={autor}
          onChangeText={setAutor}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="ISBN (Apenas números)"
          value={isbn}
          onChangeText={setIsbn}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.status}>{statusTexto}</Text>

        <Button
          mode="contained"
          icon="nfc"
          loading={carregando}
          disabled={carregando}
          onPress={lerEtiquetaESalvar}
          style={styles.botao}
          contentStyle={{ paddingVertical: 8 }}
        >
          Ler NFC e Salvar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  tituloApp: {
    padding: 20,
    backgroundColor: "#007BFF",
    color: "#fff",
    fontWeight: "bold",
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  formulario: { padding: 20, marginTop: -15 },
  input: { marginBottom: 15, backgroundColor: "#fff" },
  status: {
    textAlign: "center",
    marginVertical: 15,
    color: "#666",
    fontWeight: "bold",
  },
  botao: { borderRadius: 8, marginTop: 10 },
});
