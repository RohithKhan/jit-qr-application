import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';

const departments = ['Computer Science and Engineering', 'Mechanical Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Artificial Intelligence and Data Science', 'Master of Business Administration'];

const INITIAL_FORM = { name: '', registerNumber: '', email: '', password: '', department: '', year: '', semester: '', batch: '', phone: '', parentnumber: '', gender: '', residencetype: '' };

const StudentRegistrationScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [activeTab, setActiveTab] = useState<'bulk' | 'single' | 'added'>(route.params?.initialTab || 'bulk');
    const [form, setForm] = useState({ ...INITIAL_FORM });
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const nameInputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
    }, [route.params?.initialTab]);

    useEffect(() => {
        if (activeTab === 'added') fetchStudents();
    }, [activeTab]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff/students/list');
            setStudents(res.data?.students || []);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setFile(result.assets[0]);
            }
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Error picking file' });
        }
    };

    const handleBulkRegister = async () => {
        if (!file) {
            Toast.show({ type: 'error', text1: 'Please select an Excel file' });
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
                name: file.name,
                type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            } as any);

            await api.post('/staff/student/signup/bulk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Toast.show({ type: 'success', text1: 'Bulk registration successful!' });
            setFile(null);
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Registration failed', text2: err.response?.data?.message || 'Try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSingleRegister = async () => {
        const required = ['name', 'email', 'password', 'department'];
        if (required.some((k) => !form[k as keyof typeof form])) {
            Toast.show({ type: 'error', text1: 'Please fill name, email, password, and dept' });
            return;
        }
        setLoading(true);
        try {
            // Updated to match web usage /staff/student/signup
            await api.post('/staff/student/signup', form);
            Toast.show({ type: 'success', text1: 'Student registered successfully!' });
            setForm({ ...INITIAL_FORM });
            setTimeout(() => nameInputRef.current?.focus(), 100);
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Registration failed', text2: err.response?.data?.message || 'Try again.' });
        } finally { setLoading(false); }
    };

    const filteredStudents = students.filter(s =>
        s?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <TouchableOpacity style={[styles.tab, activeTab === 'bulk' && styles.activeTab]} onPress={() => setActiveTab('bulk')}>
                <MaterialCommunityIcons name="folder-upload" size={20} color={activeTab === 'bulk' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.tabText, activeTab === 'bulk' && styles.activeTabText]}>Bulk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'single' && styles.activeTab]} onPress={() => setActiveTab('single')}>
                <Ionicons name="person-add" size={18} color={activeTab === 'single' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.tabText, activeTab === 'single' && styles.activeTabText]}>Single</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'added' && styles.activeTab]} onPress={() => setActiveTab('added')}>
                <Ionicons name="people" size={20} color={activeTab === 'added' ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.tabText, activeTab === 'added' && styles.activeTabText]}>Added</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Student Management</Text>
                        <Text style={styles.headerSubtitle}>Add or view students</Text>
                    </View>
                </View>

                {renderTabs()}

                <ScrollView
                    style={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    {activeTab === 'bulk' && (
                        <View style={[styles.card, styles.animateFade]}>
                            <View style={styles.uploadZone}>
                                <TouchableOpacity style={[styles.uploadLabel, file && styles.hasFile]} onPress={handlePickDocument}>
                                    <View style={styles.uploadIcon}>
                                        <Text style={{ fontSize: 40 }}>{file ? '📄' : '☁️'}</Text>
                                    </View>
                                    <Text style={styles.uploadTitle}>{file ? file.name : 'Click to Upload Excel File'}</Text>
                                    <Text style={styles.uploadSubtitle}>{file ? 'Ready to upload' : 'Supports .xls and .xlsx'}</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={[styles.btn, (!file || loading) && styles.btnDisabled]} onPress={handleBulkRegister} disabled={!file || loading}>
                                {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Upload & Register</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTab === 'single' && (
                        <View style={[styles.card, styles.animateFade]}>
                            {[
                                { key: 'name', label: 'Full Name *', placeholder: 'Enter full name', keyboard: 'default', ref: nameInputRef },
                                { key: 'email', label: 'Email Address *', placeholder: 'Enter email address', keyboard: 'email-address' },
                                { key: 'password', label: 'Password *', placeholder: 'Create password', keyboard: 'default', secure: true },
                            ].map(({ key, label, placeholder, keyboard, ref, secure }) => (
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
                                        secureTextEntry={secure}
                                        autoCapitalize="none"
                                    />
                                </View>
                            ))}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Department *</Text>
                                <View style={styles.pickerWrap}>
                                    <Picker
                                        selectedValue={form.department}
                                        onValueChange={(v) => handleChange('department', v)}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Select Department" value="" color={COLORS.textLight} />
                                        {departments.map(i => <Picker.Item key={i} label={i} value={i} />)}
                                    </Picker>
                                </View>
                            </View>
                            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSingleRegister} disabled={loading}>
                                {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Register Student</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTab === 'added' && (
                        <View style={[styles.card, styles.animateFade, { padding: 16 }]}>
                            <View style={styles.studentsHeader}>
                                <Text style={styles.studentsTitle}>
                                    Total Students: <Text style={styles.countBadge}>{filteredStudents.length}</Text>
                                </Text>
                                <View style={styles.searchBar}>
                                    <Ionicons name="search" size={18} color={COLORS.textLight} style={styles.searchIcon} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search by name format..."
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                </View>
                            </View>

                            {loading && students.length === 0 ? (
                                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                            ) : students.length === 0 ? (
                                <Text style={styles.emptyText}>No students added yet.</Text>
                            ) : filteredStudents.length === 0 ? (
                                <Text style={styles.emptyText}>No students found matching "{searchQuery}"</Text>
                            ) : (
                                filteredStudents.map((child, idx) => (
                                    <View key={child._id || idx} style={styles.studentItem}>
                                        <View style={styles.studentAvatar}>
                                            {child.photo ? (
                                                <Image
                                                    source={{ uri: child.photo.startsWith('http') ? child.photo : `${CDN_URL}${child.photo}` }}
                                                    style={{ width: '100%', height: '100%', borderRadius: 22 }}
                                                />
                                            ) : (
                                                <Text style={styles.avatarText}>{child?.name?.charAt(0).toUpperCase()}</Text>
                                            )}
                                        </View>
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{child.name}</Text>
                                            <Text style={styles.studentMeta}>{child.email}</Text>
                                            <View style={styles.badgeRow}>
                                                {child.department ? <View style={styles.deptBadge}><Text style={styles.deptBadgeText}>{child.department.substring(0, 15)}...</Text></View> : null}
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.viewBtn}
                                            onPress={() => navigation.navigate('StudentDetails', { id: child._id })}
                                        >
                                            <Text style={styles.viewBtnText}>View</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingVertical: 18, paddingTop: 10, gap: 12 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingHorizontal: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: { borderBottomColor: COLORS.primary },
    tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
    activeTabText: { color: COLORS.primary },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 120 },
    card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', ...SHADOWS.small },
    animateFade: { opacity: 1 }, // Simple implementation for mobile

    // Bulk
    uploadZone: { marginBottom: 24 },
    uploadLabel: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
        borderRadius: 16,
        backgroundColor: '#f8fafc',
    },
    hasFile: { borderColor: COLORS.success, backgroundColor: '#f0fdf4' },
    uploadIcon: { marginBottom: 12 },
    uploadTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6, textAlign: 'center' },
    uploadSubtitle: { fontSize: 13, color: COLORS.textLight },

    // Form
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary },
    pickerWrap: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
    picker: Platform.OS === 'web' ? {
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
        backgroundColor: 'transparent',
        borderWidth: 0,
        outlineWidth: 0,
        width: '100%'
    } as any : {
        color: COLORS.textPrimary,
        height: 52,
        backgroundColor: 'transparent',
        width: '100%'
    },
    btn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8, ...SHADOWS.small },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },

    // Added Students List
    studentsHeader: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 16 },
    studentsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
    countBadge: { color: COLORS.primary, backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 30, fontSize: 15 },
    studentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    studentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
    studentMeta: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6 },
    badgeRow: { flexDirection: 'row' },
    deptBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    deptBadgeText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
    viewBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.primaryLight, borderRadius: 8 },
    viewBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});

export default StudentRegistrationScreen;
