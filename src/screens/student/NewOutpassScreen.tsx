import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView as RNTSafeAreaView, ScrollView, ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS } from '../../constants/config';

const NewOutpassScreen = () => {
    const navigation = useNavigation<any>();
    const [reason, setReason] = useState('');
    const [outpassType, setOutpassType] = useState('Outing');
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [fromTime, setFromTime] = useState<Date | null>(null);
    const [toTime, setToTime] = useState<Date | null>(null);

    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [showFromTimePicker, setShowFromTimePicker] = useState(false);
    const [showToTimePicker, setShowToTimePicker] = useState(false);
    const [skillrack, setSkillrack] = useState('');
    const [attendance, setAttendance] = useState('');
    const [loading, setLoading] = useState(false);
    const [residenceType, setResidenceType] = useState('');
    const [hasPending, setHasPending] = useState(false);
    const [document, setDocument] = useState<any>(null);

    useEffect(() => {
        const fetchPrerequisites = async () => {
            try {
                const [profileRes, outpassRes] = await Promise.all([
                    api.get('/api/profile'),
                    api.get('/api/outpass')
                ]);

                if (profileRes.status === 200) {
                    const user = profileRes.data.user;
                    const rt = user.residencetype?.toLowerCase() || '';
                    setResidenceType(rt);
                    if (rt === 'day scholar') setOutpassType('OD');

                    // Profile Blocking Logic
                    const isProfileComplete = () => {
                        if (!user.name || !user.registerNumber || !user.department || !user.year ||
                            !user.phone || !user.email || !user.parentnumber || !user.residencetype || !user.photo) {
                            return false;
                        }
                        if (user.residencetype === 'hostel' && (!user.hostelname || !user.hostelroomno)) return false;
                        if (user.residencetype === 'day scholar' && (!user.busno || !user.boardingpoint)) return false;
                        return true;
                    };

                    if (!isProfileComplete()) {
                        Toast.show({ type: 'error', text1: 'Profile Incomplete', text2: 'Please complete your profile first.' });
                        navigation.goBack();
                        return;
                    }
                }

                if (outpassRes.status === 200) {
                    const outpasses = outpassRes.data.outpasses || [];
                    const pending = outpasses.find((op: any) => op.status === 'pending');
                    if (pending) {
                        setHasPending(true);
                        Toast.show({ type: 'info', text1: 'Pending Application', text2: 'You already have a pending outpass.' });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch prerequisites for outpass', err);
            }
        };
        fetchPrerequisites();
    }, []);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });
            if (result.canceled === false) {
                const file = result.assets[0];
                if (file.size && file.size > 200 * 1024) {
                    Toast.show({ type: 'error', text1: 'File too large', text2: 'PDF must be under 200KB.' });
                    return;
                }
                setDocument(file);
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'File picking failed' });
        }
    };

    const handleSubmit = async () => {
        if (!reason || !fromDate || !toDate) {
            Toast.show({ type: 'error', text1: 'Please fill all required fields' });
            return;
        }
        if (outpassType === 'OD' && !document) {
            Toast.show({ type: 'error', text1: 'Document Required', text2: 'Please upload a PDF proof for OD.' });
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();

            // Format Dates precisely as 'YYYY-MM-DDTHH:mm' without timezone shifting
            const formatDateTime = (dateObj: Date | null, timeObj: Date | null) => {
                if (!dateObj) return '';

                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');

                let hours = '00';
                let minutes = '00';

                if (timeObj) {
                    hours = String(timeObj.getHours()).padStart(2, '0');
                    minutes = String(timeObj.getMinutes()).padStart(2, '0');
                }

                return `${year}-${month}-${day}T${hours}:${minutes}`;
            };

            formData.append('outpasstype', outpassType);
            formData.append('fromDate', formatDateTime(fromDate, fromTime));
            formData.append('toDate', formatDateTime(toDate, toTime));
            formData.append('reason', reason);
            formData.append('skillrack', skillrack || '');
            formData.append('attendance', attendance || '');

            if (outpassType === 'OD' && document) {
                if (Platform.OS === 'web') {
                    const res = await fetch(document.uri);
                    const blob = await res.blob();
                    formData.append('file', blob, document.name || 'document.pdf');
                } else {
                    formData.append('file', {
                        uri: document.uri,
                        type: document.mimeType || 'application/pdf',
                        name: document.name || 'document.pdf'
                    } as any);
                }
            }

            await api.post('/api/outpass/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Toast.show({ type: 'success', text1: 'Outpass submitted successfully!' });
            navigation.goBack();
        } catch (err: any) {
            console.error('Submit Outpass Error:', err);
            Toast.show({ type: 'error', text1: 'Failed to submit', text2: err.response?.data?.message || 'Please try again.' });
        } finally { setLoading(false); }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
                            <Picker style={styles.picker} selectedValue={outpassType} onValueChange={setOutpassType}>
                                {residenceType === 'day scholar' ? (
                                    <>
                                        <Picker.Item label="On Duty (OD)" value="OD" />
                                        <Picker.Item label="Emergency" value="Emergency" />
                                    </>
                                ) : (
                                    <>
                                        <Picker.Item label="Outing (Town Pass)" value="Outing" />
                                        <Picker.Item label="Home Pass" value="Home" />
                                        <Picker.Item label="On Duty (OD)" value="OD" />
                                        <Picker.Item label="Emergency" value="Emergency" />
                                    </>
                                )}
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
                            maxLength={250}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>SkillRack Solved</Text>
                            <TextInput style={styles.input} value={skillrack} onChangeText={setSkillrack} placeholder="0" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Attendance %</Text>
                            <TextInput style={styles.input} value={attendance} onChangeText={setAttendance} placeholder="85" keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
                        </View>
                    </View>

                    {outpassType === 'OD' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Upload Supporting Document (PDF) *</Text>
                            <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                                <Text style={styles.uploadBtnText}>{document ? document.name : 'Select PDF File'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>From Date & Time *</Text>
                        <View style={styles.row}>
                            {Platform.OS === 'web' ? (
                                <>
                                    <input
                                        type="date"
                                        style={styles.webInput as any}
                                        value={fromDate ? fromDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            if (e.target.value) setFromDate(new Date(e.target.value));
                                        }}
                                    />
                                    <input
                                        type="time"
                                        style={styles.webInput as any}
                                        value={fromTime ? fromTime.toTimeString().slice(0, 5) : ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const d = new Date();
                                                const [h, m] = e.target.value.split(':');
                                                d.setHours(parseInt(h), parseInt(m), 0);
                                                setFromTime(d);
                                            }
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity style={[styles.input, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowFromDatePicker(true)}>
                                        <Text style={{ color: fromDate ? COLORS.textPrimary : COLORS.textLight }}>
                                            {fromDate ? fromDate.toLocaleDateString() : 'Select Date'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.input, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowFromTimePicker(true)}>
                                        <Text style={{ color: fromTime ? COLORS.textPrimary : COLORS.textLight }}>
                                            {fromTime ? fromTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {Platform.OS !== 'web' && showFromDatePicker && (
                            <DateTimePicker
                                value={fromDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowFromDatePicker(Platform.OS === 'ios');
                                    if (selectedDate) setFromDate(selectedDate);
                                }}
                            />
                        )}
                        {Platform.OS !== 'web' && showFromTimePicker && (
                            <DateTimePicker
                                value={fromTime || new Date()}
                                mode="time"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowFromTimePicker(Platform.OS === 'ios');
                                    if (selectedDate) setFromTime(selectedDate);
                                }}
                            />
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>To Date & Time *</Text>
                        <View style={styles.row}>
                            {Platform.OS === 'web' ? (
                                <>
                                    <input
                                        type="date"
                                        style={styles.webInput as any}
                                        value={toDate ? toDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            if (e.target.value) setToDate(new Date(e.target.value));
                                        }}
                                    />
                                    <input
                                        type="time"
                                        style={styles.webInput as any}
                                        value={toTime ? toTime.toTimeString().slice(0, 5) : ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const d = new Date();
                                                const [h, m] = e.target.value.split(':');
                                                d.setHours(parseInt(h), parseInt(m), 0);
                                                setToTime(d);
                                            }
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity style={[styles.input, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowToDatePicker(true)}>
                                        <Text style={{ color: toDate ? COLORS.textPrimary : COLORS.textLight }}>
                                            {toDate ? toDate.toLocaleDateString() : 'Select Date'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.input, { flex: 1, justifyContent: 'center' }]} onPress={() => setShowToTimePicker(true)}>
                                        <Text style={{ color: toTime ? COLORS.textPrimary : COLORS.textLight }}>
                                            {toTime ? toTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {Platform.OS !== 'web' && showToDatePicker && (
                            <DateTimePicker
                                value={toDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowToDatePicker(Platform.OS === 'ios');
                                    if (selectedDate) setToDate(selectedDate);
                                }}
                            />
                        )}
                        {Platform.OS !== 'web' && showToTimePicker && (
                            <DateTimePicker
                                value={toTime || new Date()}
                                mode="time"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowToTimePicker(Platform.OS === 'ios');
                                    if (selectedDate) setToTime(selectedDate);
                                }}
                            />
                        )}
                    </View>

                    {hasPending && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>⚠️ You already have a pending outpass application. You must wait for it to be approved or rejected before applying for a new one.</Text>
                        </View>
                    )}

                    <TouchableOpacity style={[styles.btn, (loading || hasPending) && styles.btnDisabled]} onPress={handleSubmit} disabled={loading || hasPending}>
                        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>{hasPending ? 'Pending Application Exists' : 'Submit Application'}</Text>}
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
    picker: Platform.OS === 'web' ? { paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary, backgroundColor: 'transparent' } as any : { color: COLORS.textPrimary, height: 48, backgroundColor: 'transparent' },
    webInput: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.border } as any,
    row: { flexDirection: 'row', gap: 10 },
    btn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    btnDisabled: { opacity: 0.65 },
    btnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
    uploadBtn: { backgroundColor: COLORS.white, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center', borderStyle: 'dashed' },
    uploadBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
    warningBox: { backgroundColor: '#fff3cd', borderColor: '#ffeeba', borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 16 },
    warningText: { color: '#856404', fontSize: 13, lineHeight: 18, fontWeight: '500' },
});

export default NewOutpassScreen;
