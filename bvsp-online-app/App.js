import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [patientId, setPatientId] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const [bp, setBp] = useState('');
  const [temp, setTemp] = useState('');
  const [history, setHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('@vitals_history');
      if (savedHistory !== null) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
  };

  const saveToLocalStorage = async (updatedHistory) => {
    try {
      await AsyncStorage.setItem('@vitals_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  };

  const transmitVitals = async () => {
    if (!patientId || !heartRate || !spo2 || !bp || !temp) {
      Alert.alert('Incomplete Record', 'Please fill in all patient and vital sign fields.');
      return;
    }

    const hrNum = parseInt(heartRate);
    const spo2Num = parseInt(spo2);
    const tempNum = parseFloat(temp);
    const isCritical = hrNum > 120 || hrNum < 50 || spo2Num < 92 || tempNum > 100.4;

    const newRecord = {
      id: Date.now().toString(),
      patientId,
      heartRate,
      spo2,
      bp,
      temp,
      critical: isCritical,
      synced: isOnline,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    await saveToLocalStorage(updatedHistory);

    if (isOnline) {
      Alert.alert(isCritical ? '⚠️ CRITICAL ALERT' : 'Live Sync Complete', `Vitals transmitted online for Patient #${patientId}`);
    } else {
      Alert.alert('Offline Cached', `Device offline. Record stored locally for Patient #${patientId}`);
    }

    setHeartRate('');
    setSpo2('');
    setBp('');
    setTemp('');
  };

  const loadPreset = (type) => {
    setPatientId('PT-' + Math.floor(100 + Math.random() * 900));
    if (type === 'normal') {
      setHeartRate('76');
      setSpo2('98');
      setBp('120/80');
      setTemp('98.6');
    } else {
      setHeartRate('138');
      setSpo2('87');
      setBp('85/50');
      setTemp('102.4');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>BVSP TELEMETRY</Text>
          <Text style={styles.subtitle}>Advanced Triage Protocol</Text>
        </View>
        <TouchableOpacity style={styles.statusRow} onPress={() => setIsOnline(!isOnline)}>
          <View style={[styles.dot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online (Live)' : 'Offline (Cached)'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.presetRow}>
          <TouchableOpacity style={styles.presetBtn} onPress={() => loadPreset('normal')}>
            <Text style={styles.presetTextNormal}>🟢 Normal Case</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetBtn} onPress={() => loadPreset('critical')}>
            <Text style={styles.presetTextCritical}>🚨 Critical Case</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Patient ID / Case #</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. PT-409" 
          placeholderTextColor="#64748B"
          value={patientId} 
          onChangeText={setPatientId} 
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Heart Rate (BPM)</Text>
            <TextInput 
              style={styles.input} 
              keyboardDataType="numeric" 
              placeholder="72" 
              placeholderTextColor="#64748B"
              value={heartRate} 
              onChangeText={setHeartRate} 
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>SpO2 (%)</Text>
            <TextInput 
              style={styles.input} 
              keyboardDataType="numeric" 
              placeholder="98" 
              placeholderTextColor="#64748B"
              value={spo2} 
              onChangeText={setSpo2} 
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Blood Pressure</Text>
            <TextInput 
              style={styles.input} 
              placeholder="120/80" 
              placeholderTextColor="#64748B"
              value={bp} 
              onChangeText={setBp} 
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Temp (°F)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="98.6" 
              placeholderTextColor="#64748B"
              value={temp} 
              onChangeText={setTemp} 
            />
          </View>
        </View>

        <TouchableOpacity style={[styles.button, !isOnline && styles.offlineButton]} onPress={transmitVitals}>
          <Text style={styles.buttonText}>
            {isOnline ? 'TRANSMIT TELEMETRY STREAM' : 'STORE TO OFFLINE CACHE'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Central Telemetry & Offline Log ({history.length})</Text>
      {history.map((item) => (
        <View key={item.id} style={[styles.historyCard, item.critical && styles.criticalCard]}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyPatient}>Patient: {item.patientId}</Text>
            <Text style={styles.syncTag}>{item.synced ? '🟢 SYNCED' : '🟠 LOCAL CACHED'}</Text>
            <Text style={styles.historyTime}>{item.timestamp}</Text>
          </View>
          <Text style={styles.historyDetails}>
            HR: {item.heartRate} bpm | SpO2: {item.spo2}% | BP: {item.bp} | Temp: {item.temp}°F
          </Text>
          {item.critical && <Text style={styles.warningText}>⚠️ Priority Triage: Abnormal vital signs detected!</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#090D16', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  title: { color: '#F8FAFC', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  subtitle: { color: '#64748B', fontSize: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#111827', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#1F2937' },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  presetBtn: { backgroundColor: '#1F2937', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, width: '48%', alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  presetTextNormal: { color: '#34D399', fontSize: 12, fontWeight: '600' },
  presetTextCritical: { color: '#F87171', fontSize: 12, fontWeight: '600' },
  label: { color: '#9CA3AF', fontSize: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#1F2937', color: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 15, borderWidth: 1, borderColor: '#374151' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  offlineButton: { backgroundColor: '#D97706' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  sectionTitle: { color: '#9CA3AF', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  historyCard: { backgroundColor: '#111827', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1F2937' },
  criticalCard: { borderColor: '#EF4444', backgroundColor: '#1F1517' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyPatient: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
  syncTag: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
  historyTime: { color: '#64748B', fontSize: 12 },
  historyDetails: { color: '#D1D5DB', fontSize: 13 },
  warningText: { color: '#F87171', fontSize: 11, marginTop: 6, fontWeight: '600' }
});