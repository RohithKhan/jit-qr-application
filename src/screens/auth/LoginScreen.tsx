import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS } from '../../constants/config';

interface Props {
    route?: { params?: { initialType?: 'student' | 'staff' } };
}

const LoginScreen: React.FC<Props> = ({ route }) => {
    const navigation = useNavigation<any>();
    const initialType = route?.params?.initialType || 'student';
    const [loginType, setLoginType] = useState<'student' | 'staff'>(initialType);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter email and password' });
            return;
        }
        setLoading(true);
        try {
            const endpoint = loginType === 'student' ? '/api/login' : '/staff/login';
            const response = await api.post(endpoint, { email, password });
            if (response.status === 200) {
                const token = response.data.token;
                await AsyncStorage.multiSet([
                    ['token', token],
                    ['isLoggedIn', 'true'],
                    ['userType', loginType],
                ]);
                Toast.show({ type: 'success', text1: 'Login successful!' });
                setTimeout(() => {
                    const stack = loginType === 'staff' ? 'Staff' : 'Student';
                    navigation.reset({ index: 0, routes: [{ name: stack }] });
                }, 800);
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                Toast.show({ type: 'error', text1: 'Invalid credentials', text2: 'Please try again.' });
            } else if (error.response?.status === 404) {
                Toast.show({ type: 'error', text1: 'User not found', text2: 'Check your email.' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Something went wrong. Try again later.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                <View style={styles.card}>
                    <Text style={styles.logoEmoji}>{loginType === 'student' ? '🎓' : '👨‍🏫'}</Text>
                    <Text style={styles.title}>{loginType === 'student' ? 'Student Login' : 'Staff Login'}</Text>
                    <Text style={styles.subtitle}>Enter your credentials to access the portal</Text>

                    {/* Tab Toggle */}
                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tab, loginType === 'student' && styles.tabActive]}
                            onPress={() => setLoginType('student')}
                        >
                            <Text style={[styles.tabText, loginType === 'student' && styles.tabTextActive]}>Student</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, loginType === 'staff' && styles.tabActive]}
                            onPress={() => setLoginType('staff')}
                        >
                            <Text style={[styles.tabText, loginType === 'staff' && styles.tabTextActive]}>Staff</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{loginType === 'student' ? 'Email / Student ID' : 'Staff Email / ID'}</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter email or ID"
                            placeholderTextColor={COLORS.textLight}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter password"
                                placeholderTextColor={COLORS.textLight}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                                <Text style={styles.eyeText}>{showPassword ? '👁️' : '🔒'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color={COLORS.white} />
                            : <Text style={styles.btnText}>{loginType === 'student' ? 'Sign In' : 'Sign In as Staff'}</Text>
                        }
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.primaryDark },
    scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
    backBtn: { marginBottom: 16 },
    backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
        elevation: 15,
    },
    logoEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.primaryDark, textAlign: 'center', marginBottom: 6 },
    subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: COLORS.white, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    tabText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 14 },
    tabTextActive: { color: COLORS.primary },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.textPrimary,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyeBtn: { padding: 12 },
    eyeText: { fontSize: 20, opacity: 0.6 },
    btn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default LoginScreen;
