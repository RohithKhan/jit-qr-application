import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS } from '../../constants/config';

const WatchmanLoginScreen = () => {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Toast.show({ type: 'error', text1: 'Please fill all fields' });
            return;
        }
        setLoading(true);
        try {
            const response = await api.post('/watchman/login', { email, password });
            if (response.status === 200) {
                await AsyncStorage.multiSet([
                    ['token', response.data.token],
                    ['isLoggedIn', 'true'],
                    ['userType', 'watchman'],
                ]);
                Toast.show({ type: 'success', text1: 'Login successful!' });
                setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Watchman' }] }), 800);
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Login Failed', text2: error.response?.data?.message || 'Invalid credentials' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.card}>
                    <Text style={styles.emoji}>🔐</Text>
                    <Text style={styles.title}>Watchman Login</Text>
                    <Text style={styles.subtitle}>Enter your watchman credentials</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Watchman Email" placeholderTextColor={COLORS.textLight} keyboardType="email-address" autoCapitalize="none" />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.row}>
                            <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={COLORS.textLight} secureTextEntry={!showPassword} />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                                <Text>{showPassword ? '👁️' : '🔒'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
                        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Sign In as Watchman</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#4a3728' },
    scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
    backBtn: { marginBottom: 16 },
    backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
    card: { backgroundColor: COLORS.white, borderRadius: 24, padding: 28, elevation: 15 },
    emoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '800', color: '#4a3728', textAlign: 'center', marginBottom: 6 },
    subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.border },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyeBtn: { padding: 12 },
    btn: { backgroundColor: '#4a3728', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default WatchmanLoginScreen;
