import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';

export default function CadastroLeitor() {
  const theme = useTheme();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [carregando, setCarregando] = useState(false);

  const salvarLeitor = async () => {
    if (!nome || !cpf) {
      Alert.alert('Atenção', 'Nome e CPF são obrigatórios.');
      return;
    }

    setCarregando(true);
    try {
      const resposta = await fetch('http://192.168.1.2:3000/api/leitores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cpf, telefone }),
      });

      if (resposta.ok) {
        Alert.alert('Sucesso!', 'Aluno cadastrado com sucesso!');
        setNome('');
        setCpf('');
        setTelefone('');
      } else {
        Alert.alert('Erro', 'Não foi possível cadastrar o aluno.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.titulo}>Novo Aluno</Text>
      
      <TextInput
        mode="outlined"
        label="Nome Completo"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label="CPF ou RA"
        value={cpf}
        onChangeText={setCpf}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label="Telefone / WhatsApp"
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Button
        mode="contained"
        loading={carregando}
        disabled={carregando}
        onPress={salvarLeitor}
        style={styles.botao}
        buttonColor="#1A1A1A"
      >
        Cadastrar Aluno
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F7F7', justifyContent: 'center' },
  titulo: { fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { marginBottom: 15, backgroundColor: '#fff' },
  botao: { paddingVertical: 8, marginTop: 10, borderRadius: 8 }
});