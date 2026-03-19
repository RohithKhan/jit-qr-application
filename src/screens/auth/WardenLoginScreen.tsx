import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../constants/config';

const WardenLoginScreen = () => {
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
            const response = await api.post('/warden/login', { email, password });
            if (response.status === 200) {
                await AsyncStorage.multiSet([
                    ['token', response.data.token],
                    ['isLoggedIn', 'true'],
                    ['userType', 'warden'],
                ]);
                Toast.show({ type: 'success', text1: 'Login successful!' });
                setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Warden' }] }), 800);
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Login Failed', text2: error.response?.data?.message || 'Invalid credentials' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.backgroundLayer} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back to Welcome</Text>
                </TouchableOpacity>

                <View style={styles.card}>
                    <View style={styles.loginHeader}>
                        <View style={styles.logoCircle}><Text style={{ fontSize: 32 }}>🛡️</Text></View>
                        <Text style={styles.title}>Warden Login</Text>
                        <Text style={styles.subtitle}>Enter your warden credentials to access the portal</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Warden Email / ID</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    placeholderTextColor={COLORS.textLight}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <Text style={styles.inputIcon}>👤</Text>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={[styles.input, { paddingRight: 50 }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    placeholderTextColor={COLORS.textLight}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                                    <Text style={{ fontSize: 18 }}>{showPassword ? '👁️' : '🔒'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
                            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Sign In</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primaryDark },
    backgroundLayer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: COLORS.primaryDark,
        opacity: 0.95
    },
    scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    backBtn: { marginBottom: 24, flexDirection: 'row', alignItems: 'center' },
    backText: { color: COLORS.white, fontSize: 15, fontWeight: '600', opacity: 0.9 },

    card: { backgroundColor: COLORS.white, borderRadius: 30, paddingVertical: 40, paddingHorizontal: 24, ...SHADOWS.large },

    loginHeader: { alignItems: 'center', marginBottom: 32 },
    logoCircle: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: '#475569',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16, ...SHADOWS.small
    },
    title: { fontSize: 26, fontWeight: '800', color: COLORS.primaryDark, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 10, lineHeight: 20 },

    form: { gap: 20 },
    inputGroup: { marginBottom: 4 },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4 },
    inputWrapper: { position: 'relative' },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        paddingLeft: 16,
        paddingRight: 45,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.textPrimary,
        borderWidth: 1.5,
        borderColor: COLORS.border
    },
    inputIcon: { position: 'absolute', right: 16, top: 18, fontSize: 18, opacity: 0.5 },
    eyeBtn: { position: 'absolute', right: 12, top: 14, padding: 5 },

    btn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        ...SHADOWS.medium
    },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: COLORS.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
});


export default WardenLoginScreen;
