import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS } from '../../constants/config';

const departments = ['Computer Science and Engineering', 'Mechanical Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Electrical Engineering', 'Civil Engineering'];

const INITIAL_FORM = { name: '', registerNumber: '', email: '', password: '', department: '', year: '', semester: '', batch: '', phone: '', parentnumber: '', gender: '', residencetype: '' };

const StudentRegistrationScreen = () => {
    const navigation = useNavigation<any>();
    const [form, setForm] = useState({ ...INITIAL_FORM });
    const [loading, setLoading] = useState(false);
    const nameInputRef = useRef<TextInput>(null);

    const handleChange = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const handleRegister = async () => {
        const required = ['name', 'registerNumber', 'email', 'password', 'department', 'year', 'semester', 'batch'];
        if (required.some((k) => !form[k as keyof typeof form])) {
            Toast.show({ type: 'error', text1: 'Please fill all required fields' });
            return;
        }
        setLoading(true);
        try {
            await api.post('/staff/register-student', form);
            Toast.show({ type: 'success', text1: 'Student registered successfully!' });
            setForm({ ...INITIAL_FORM });
            setTimeout(() => nameInputRef.current?.focus(), 100);
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Registration failed', text2: err.response?.data?.message || 'Try again.' });
        } finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Register Student</Text>
            </View>
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    {[
                        { key: 'name', label: 'Full Name *', placeholder: 'Student name', keyboard: 'default', ref: nameInputRef },
                        { key: 'registerNumber', label: 'Register Number *', placeholder: 'e.g. 312123104001', keyboard: 'default' },
                        { key: 'email', label: 'Email *', placeholder: 'student@example.com', keyboard: 'email-address' },
                        { key: 'password', label: 'Password *', placeholder: 'Initial password', keyboard: 'default' },
                        { key: 'phone', label: 'Phone', placeholder: 'Phone number', keyboard: 'phone-pad' },
                        { key: 'parentnumber', label: 'Parent Phone', placeholder: 'Parent contact', keyboard: 'phone-pad' },
                        { key: 'batch', label: 'Batch *', placeholder: 'e.g. 2022-2026', keyboard: 'default' },
                    ].map(({ key, label, placeholder, keyboard, ref }) => (
                        <View key={key} style={styles.inputGroup}>
                            <Text style={styles.label}>{label}</Text>
                            <TextInput
                                ref={key === 'name' ? nameInputRef : undefined}
                                style={styles.input}
                                value={form[key as keyof typeof form]}
                                onChangeText={(v) => handleChange(key, v)}
                                placeholder={placeholder}
                                placeholderTextColor={COLORS.textLight}
                                keyboardType={keyboard as any}
                                autoCapitalize="none"
                            />
                        </View>
                    ))}
                    {[
                        { key: 'department', label: 'Department *', items: departments },
                        { key: 'year', label: 'Year *', items: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
                        { key: 'semester', label: 'Semester *', items: ['1', '2', '3', '4', '5', '6', '7', '8'] },
                        { key: 'gender', label: 'Gender', items: ['male', 'female'] },
                        { key: 'residencetype', label: 'Residence', items: ['day scholar', 'hostel'] },
                    ].map(({ key, label, items }) => (
                        <View key={key} style={styles.inputGroup}>
                            <Text style={styles.label}>{label}</Text>
                            <View style={styles.pickerWrap}>
                                <Picker selectedValue={form[key as keyof typeof form]} onValueChange={(v) => handleChange(key, v)}>
                                    <Picker.Item label={`Select ${label}`} value="" />
                                    {items.map(i => <Picker.Item key={i} label={i} value={i} />)}
                                </Picker>
                            </View>
                        </View>
                    ))}
                    <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Register Student</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    scroll: { flex: 1 },
    card: { margin: 16, backgroundColor: COLORS.white, borderRadius: 16, padding: 20, elevation: 2, marginBottom: 32 },
    inputGroup: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
    input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1.5, borderColor: COLORS.border, color: COLORS.textPrimary },
    pickerWrap: { backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden' },
    btn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    btnDisabled: { opacity: 0.65 },
    btnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});

export default StudentRegistrationScreen;
