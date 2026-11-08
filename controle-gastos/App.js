import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const STORAGE_KEY = '@gastos';
const CATEGORIAS = ['Alimentação', 'Transporte', 'Lazer', 'Outros'];
const LIMITE_DESTAQUE = 100;

const Stack = createNativeStackNavigator();


function formatarMoeda(valor) {
  const [inteiro, centavos] = Number(valor).toFixed(2).split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${comMilhar},${centavos}`;
}


function parseValor(texto) {
  const limpo = texto.trim().replace(/\./g, '').replace(',', '.');

  const n = Number(limpo);
  if (!Number.isNaN(n)) return n;
  return Number(texto.trim().replace(',', '.'));
}


function ListaScreen({ navigation, gastos, onExcluir, onLimparTudo }) {
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false);


  const total =
    gastos.reduce((soma, g) => soma + Math.round(g.valor * 100), 0) / 100;

  function renderItem({ item }) {
    const alto = item.valor > LIMITE_DESTAQUE;
    return (
      <View style={[styles.item, alto && styles.itemAlto]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemDescricao}>{item.descricao}</Text>
          <Text style={styles.itemCategoria}>{item.categoria}</Text>
        </View>
        <Text style={[styles.itemValor, alto && styles.itemValorAlto]}>
          {formatarMoeda(item.valor)}
        </Text>
        <TouchableOpacity
          style={styles.btnExcluir}
          onPress={() => onExcluir(item.id)}
          accessibilityLabel={`Excluir ${item.descricao}`}
        >
          <Text style={styles.btnExcluirTexto}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total gasto</Text>
        <Text style={styles.totalValor}>{formatarMoeda(total)}</Text>
      </View>

      <FlatList
        data={gastos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum gasto anotado ainda 💸</Text>
        }
      />

      {gastos.length > 0 &&
        (confirmandoLimpar ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTexto}>Apagar todos os gastos?</Text>
            <View style={styles.confirmBotoes}>
              <TouchableOpacity
                style={[styles.btnPequeno, styles.btnCancelar]}
                onPress={() => setConfirmandoLimpar(false)}
              >
                <Text style={styles.btnPequenoTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPequeno, styles.btnConfirmar]}
                onPress={() => {
                  onLimparTudo();
                  setConfirmandoLimpar(false);
                }}
              >
                <Text style={styles.btnPequenoTexto}>Sim, limpar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.btnLimpar}
            onPress={() => setConfirmandoLimpar(true)}
          >
            <Text style={styles.btnLimparTexto}>Limpar tudo</Text>
          </TouchableOpacity>
        ))}

      <TouchableOpacity
        style={styles.btnPrimario}
        onPress={() => navigation.navigate('Formulario')}
      >
        <Text style={styles.btnPrimarioTexto}>+ Adicionar gasto</Text>
      </TouchableOpacity>
    </View>
  );
}


function FormularioScreen({ navigation, onAdicionar }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [erro, setErro] = useState('');

  function salvar() {
    const desc = descricao.trim();
    const num = parseValor(valor);

    if (!desc) {
      setErro('Preencha a descrição do gasto.');
      return;
    }
    if (!valor.trim() || Number.isNaN(num) || num <= 0) {
      setErro('Informe um valor maior que zero.');
      return;
    }

    setErro('');
    onAdicionar({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      descricao: desc,
      valor: Math.round(num * 100) / 100,
      categoria,
    });
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Almoço"
          value={descricao}
          onChangeText={(t) => {
            setDescricao(t);
            if (erro) setErro('');
          }}
        />

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 25,90"
          keyboardType="decimal-pad"
          value={valor}
          onChangeText={(t) => {
            setValor(t);
            if (erro) setErro('');
          }}
        />

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.chips}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, categoria === cat && styles.chipAtivo]}
              onPress={() => setCategoria(cat)}
            >
              <Text
                style={[
                  styles.chipTexto,
                  categoria === cat && styles.chipTextoAtivo,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!erro && (
          <View style={styles.erroBox}>
            <Text style={styles.erroTexto}>⚠️ {erro}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.btnPrimario} onPress={salvar}>
          <Text style={styles.btnPrimarioTexto}>Salvar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


export default function App() {
  const [gastos, setGastos] = useState([]);
  const [carregado, setCarregado] = useState(false);


  useEffect(() => {
    (async () => {
      try {
        const salvo = await AsyncStorage.getItem(STORAGE_KEY);
        if (salvo) setGastos(JSON.parse(salvo));
      } catch (e) {
        console.warn('Erro ao carregar gastos', e);
      } finally {
        setCarregado(true);
      }
    })();
  }, []);


  useEffect(() => {
    if (!carregado) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gastos)).catch((e) =>
      console.warn('Erro ao salvar gastos', e)
    );
  }, [gastos, carregado]);

  const adicionar = (gasto) => setGastos((atual) => [gasto, ...atual]);
  const excluir = (id) =>
    setGastos((atual) => atual.filter((g) => g.id !== id));
  const limparTudo = () => setGastos([]);

  if (!carregado) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2e7d32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="Lista" options={{ title: 'Meus Gastos' }}>
          {(props) => (
            <ListaScreen
              {...props}
              gastos={gastos}
              onExcluir={excluir}
              onLimparTudo={limparTudo}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Formulario" options={{ title: 'Novo gasto' }}>
          {(props) => <FormularioScreen {...props} onAdicionar={adicionar} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f4', padding: 16 },

  totalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValor: { fontSize: 32, fontWeight: '800', color: '#2e7d32' },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  itemAlto: { borderLeftColor: '#d32f2f', backgroundColor: '#fff5f5' },
  itemDescricao: { fontSize: 16, fontWeight: '600', color: '#222' },
  itemCategoria: { fontSize: 12, color: '#888', marginTop: 2 },
  itemValor: { fontSize: 16, fontWeight: '700', color: '#2e7d32', marginHorizontal: 10 },
  itemValorAlto: { color: '#d32f2f' },
  btnExcluir: { padding: 6 },
  btnExcluirTexto: { fontSize: 20 },

  vazio: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },

  btnPrimario: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimarioTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },

  btnLimpar: { alignItems: 'center', paddingVertical: 8 },
  btnLimparTexto: { color: '#d32f2f', fontWeight: '600' },

  confirmBox: {
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    alignItems: 'center',
  },
  confirmTexto: { fontWeight: '600', marginBottom: 8 },
  confirmBotoes: { flexDirection: 'row', gap: 10 },
  btnPequeno: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  btnCancelar: { backgroundColor: '#9e9e9e' },
  btnConfirmar: { backgroundColor: '#d32f2f' },
  btnPequenoTexto: { color: '#fff', fontWeight: '600' },

  label: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  chipAtivo: { backgroundColor: '#2e7d32' },
  chipTexto: { color: '#333' },
  chipTextoAtivo: { color: '#fff', fontWeight: '700' },

  erroBox: {
    backgroundColor: '#ffebee',
    borderColor: '#d32f2f',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  erroTexto: { color: '#c62828', fontWeight: '600' },
});
