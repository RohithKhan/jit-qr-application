import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS } from '../../constants/config';

const NewOutpassScreen = () => {
    const navigation = useNavigation<any>();
    const [reason, setReason] = useState('');
    const [outpassType, setOutpassType] = useState('regular');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [fromTime, setFromTime] = useState('');
    const [toTime, setToTime] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason || !fromDate || !toDate) {
            Toast.show({ type: 'error', text1: 'Please fill all required fields' });
            return;
        }
        setLoading(true);
        try {
            await api.post('/api/outpass', { reason, outpassType, fromDate, toDate, fromTime, toTime });
            Toast.show({ type: 'success', text1: 'Outpass submitted successfully!' });
            navigation.goBack();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Failed to submit', text2: err.response?.data?.message || 'Please try again.' });
        } finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Outpass Request</Text>
            </View>
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Outpass Type *</Text>
                        <View style={styles.pickerWrap}>
                            <Picker selectedValue={outpassType} onValueChange={setOutpassType}>
                                <Picker.Item label="Regular" value="regular" />
                                <Picker.Item label="Emergency" value="emergency" />
                                <Picker.Item label="Medical" value="medical" />
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Reason *</Text>
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Describe the reason for outpass..."
                            placeholderTextColor={COLORS.textLight}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>From Date * (YYYY-MM-DD)</Text>
                            <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} placeholder="2025-01-15" placeholderTextColor={COLORS.textLight} />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>To Date * (YYYY-MM-DD)</Text>
                            <TextInput style={styles.input} value={toDate} onChangeText={setToDate} placeholder="2025-01-16" placeholderTextColor={COLORS.textLight} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>From Time</Text>
                            <TextInput style={styles.input} value={fromTime} onChangeText={setFromTime} placeholder="09:00" placeholderTextColor={COLORS.textLight} />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>To Time</Text>
                            <TextInput style={styles.input} value={toTime} onChangeText={setToTime} placeholder="17:00" placeholderTextColor={COLORS.textLight} />
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Submit Outpass Request</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
    backBtn: { padding: 4 },
    backText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
    scroll: { flex: 1 },
    card: { margin: 16, backgroundColor: COLORS.white, borderRadius: 16, padding: 20, elevation: 2 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
    input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.border },
    textarea: { height: 100, textAlignVertical: 'top' },
    pickerWrap: { backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden' },
    row: { flexDirection: 'row', gap: 10 },
    btn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    btnDisabled: { opacity: 0.65 },
    btnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});

export default NewOutpassScreen;
