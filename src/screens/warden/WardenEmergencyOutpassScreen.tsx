import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../constants/config';
import DateTimePicker from '@react-native-community/datetimepicker';

const WardenEmergencyOutpassScreen = () => {
    const navigation = useNavigation<any>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        registerNumber: '',
        reason: '',
        fromDate: new Date(),
        toDate: new Date()
    });
    
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
    const [activeDateField, setActiveDateField] = useState<'from' | 'to'>('from');

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (activeDateField === 'from') {
            setShowFromPicker(Platform.OS === 'ios');
            if (selectedDate) {
                setFormData(prev => ({ ...prev, fromDate: selectedDate }));
            }
        } else {
            setShowToPicker(Platform.OS === 'ios');
            if (selectedDate) {
                setFormData(prev => ({ ...prev, toDate: selectedDate }));
            }
        }
    };

    const showPicker = (field: 'from' | 'to', mode: 'date' | 'time') => {
        setActiveDateField(field);
        setPickerMode(mode);
        if (field === 'from') setShowFromPicker(true);
        else setShowToPicker(true);
    };

    const handleSubmit = async () => {
        if (!formData.registerNumber.trim()) {
            Toast.show({ type: 'error', text1: 'Register Number is required' });
            return;
        }
        if (!formData.reason.trim()) {
            Toast.show({ type: 'error', text1: 'Reason is required' });
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/warden/outpass/emergency', {
                registerNumber: formData.registerNumber,
                reason: formData.reason,
                fromDate: formData.fromDate.toISOString(),
                toDate: formData.toDate.toISOString(),
                outpasstype: 'Emergency'
            });

            Toast.show({ type: 'success', text1: 'Emergency outpass generated successfully' });
            setTimeout(() => navigation.goBack(), 2000);
        } catch (error: any) {
            console.error('Error generating emergency outpass:', error);
            Toast.show({ 
                type: 'error', 
                text1: 'Failed to generate outpass',
                text2: error.response?.data?.message || 'Check if the student register number is valid'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleString();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Emergency Outpass</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formCard}>
                        <View style={styles.alertBox}>
                            <Text style={styles.alertIcon}>🚨</Text>
                            <Text style={styles.alertText}>
                                This form allows Wardens to instantly approve an emergency outpass for a student without the student needing to apply first.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Student Register Number *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 711326ITXXXX"
                                value={formData.registerNumber}
                                onChangeText={(text) => handleChange('registerNumber', text)}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>From Date & Time *</Text>
                            <View style={styles.dateTimeRow}>
                                <TouchableOpacity style={styles.dateTimeBtn} onPress={() => showPicker('from', 'date')}>
                                    <Text style={styles.dateTimeText}>{formData.fromDate.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dateTimeBtn} onPress={() => showPicker('from', 'time')}>
                                    <Text style={styles.dateTimeText}>{formData.fromDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </TouchableOpacity>
                            </View>
                            {showFromPicker && (
                                <DateTimePicker
                                    value={formData.fromDate}
                                    mode={pickerMode}
                                    is24Hour={false}
                                    display="default"
                                    onChange={handleDateChange}
                                />
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>To Date & Time *</Text>
                            <View style={styles.dateTimeRow}>
                                <TouchableOpacity style={styles.dateTimeBtn} onPress={() => showPicker('to', 'date')}>
                                    <Text style={styles.dateTimeText}>{formData.toDate.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dateTimeBtn} onPress={() => showPicker('to', 'time')}>
                                    <Text style={styles.dateTimeText}>{formData.toDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </TouchableOpacity>
                            </View>
                            {showToPicker && (
                                <DateTimePicker
                                    value={formData.toDate}
                                    mode={pickerMode}
                                    is24Hour={false}
                                    display="default"
                                    onChange={handleDateChange}
                                />
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Reason for Emergency *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the medical or urgent situation..."
                                value={formData.reason}
                                onChangeText={(text) => handleChange('reason', text)}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.submitBtnText}>Generate Emergency Outpass</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1e3a8a' },
    backBtn: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    backText: { color: '#1e3a8a', fontWeight: '600', fontSize: 13 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    
    formCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    
    alertBox: { flexDirection: 'row', backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#fca5a5', alignItems: 'center', gap: 12 },
    alertIcon: { fontSize: 24 },
    alertText: { flex: 1, color: '#991b1b', fontSize: 13, lineHeight: 20 },
    
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#1e293b' },
    textArea: { height: 120 },
    
    dateTimeRow: { flexDirection: 'row', gap: 12 },
    dateTimeBtn: { flex: 1, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, alignItems: 'center' },
    dateTimeText: { fontSize: 15, color: '#1e293b', fontWeight: '500' },
    
    submitBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, ...SHADOWS.medium },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' }
});

export default WardenEmergencyOutpassScreen;
