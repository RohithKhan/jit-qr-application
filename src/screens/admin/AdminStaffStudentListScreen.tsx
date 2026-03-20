import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Image, Modal, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';

const AdminStaffStudentListScreen = ({ route }: any) => {
    const { staffid, staffName } = route.params || {};
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [students, setStudents] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newStudent, setNewStudent] = useState({
        name: '', email: '', password: '', staffid: staffid || '',
        residencetype: '', hostelname: '', hostelroomno: '', busno: '', boardingpoint: ''
    });

    useFocusEffect(
        useCallback(() => {
            fetchStudents();
        }, [staffid])
    );

    useEffect(() => {
        const lower = query.toLowerCase();
        setFiltered(students.filter(s =>
            (s.name?.toLowerCase() || '').includes(lower) ||
            (s.registerNumber?.toLowerCase() || '').includes(lower) ||
            (s.department?.toLowerCase() || '').includes(lower)
        ));
    }, [query, students]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/student/list');
            const all = res.data.students || res.data || [];
            const staffStudents = all.filter((s: any) => {
                const id = typeof s.staffid === 'string' ? s.staffid : s.staffid?._id;
                return id === staffid;
            });
            setStudents(staffStudents);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to fetch assigned students' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (studentId: string, name: string) => {
        Alert.alert('Remove Student', `Are you sure you want to remove ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/admin/student/delete/${studentId}`);
                        Toast.show({ type: 'success', text1: 'Student removed successfully' });
                        fetchStudents();
                    } catch {
                        Toast.show({ type: 'error', text1: 'Failed to delete student' });
                    }
                }
            }
        ]);
    };

    const handleSaveStudent = async () => {
        if (!newStudent.name || !newStudent.email || !newStudent.password) {
            return Toast.show({ type: 'error', text1: 'Please fill all required fields' });
        }
        setIsSaving(true);
        try {
            await api.post('/admin/student/add', { ...newStudent, staffid });
            Toast.show({ type: 'success', text1: 'Student added successfully' });
            setIsAddModalOpen(false);
            setNewStudent({
                name: '', email: '', password: '', staffid,
                residencetype: '', hostelname: '', hostelroomno: '', busno: '', boardingpoint: ''
            });
            fetchStudents();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to add student' });
        } finally {
            setIsSaving(false);
        }
    };

    const getPhoto = (s: any) => {
        if (!s.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'S')}&background=4f46e5&color=fff`;
        return s.photo.startsWith('http') ? s.photo : `${CDN_URL}${s.photo}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.headerTitle}>Assigned Students</Text>
                    <Text style={styles.headerSub}>{staffName}</Text>
                </View>
                <TouchableOpacity style={styles.addBtnHeader} onPress={() => setIsAddModalOpen(true)}>
                    <Text style={styles.addBtnTextHeader}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
                <TextInput
                    style={styles.search}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search by name, reg no..."
                    placeholderTextColor={COLORS.textMuted}
                />
            </View>

            {loading ? <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1 }} /> :
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No students assigned to this staff member yet.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Image source={{ uri: getPhoto(item) }} style={styles.avatar} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.sub}>{item.registerNumber}</Text>
                                <View style={styles.badgeRow}>
                                    <View style={styles.badgeDep}><Text style={styles.badgeDepText}>{item.department}</Text></View>
                                    <View style={styles.badgeYear}><Text style={styles.badgeYearText}>{item.year}</Text></View>
                                </View>
                            </View>
                            <View style={styles.actionCol}>
                                <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate('AdminStudentDetailsScreen', { id: item._id })}>
                                    <Text style={styles.viewBtnText}>View</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item._id, item.name)}>
                                    <Text style={styles.delBtnText}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            }

            <Modal visible={isAddModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, SHADOWS.large, { paddingBottom: insets.bottom || 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Student</Text>
                            <TouchableOpacity onPress={() => setIsAddModalOpen(false)}><Text style={{ fontSize: 24, color: '#6b7280' }}>×</Text></TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Student Name *</Text>
                                <TextInput style={styles.formInput} value={newStudent.name} onChangeText={t => setNewStudent({ ...newStudent, name: t })} placeholder="Enter full name" />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Email Address *</Text>
                                <TextInput style={styles.formInput} value={newStudent.email} onChangeText={t => setNewStudent({ ...newStudent, email: t })} placeholder="Enter email address" keyboardType="email-address" autoCapitalize="none" />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Password *</Text>
                                <TextInput style={styles.formInput} value={newStudent.password} onChangeText={t => setNewStudent({ ...newStudent, password: t })} placeholder="Create password" secureTextEntry />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Residence Type *</Text>
                                <View style={styles.radioRow}>
                                    {['day scholar', 'hostel'].map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.radioBtn, newStudent.residencetype === type && styles.radioBtnActive]}
                                            onPress={() => setNewStudent({ ...newStudent, residencetype: type })}
                                        >
                                            <Text style={[styles.radioText, newStudent.residencetype === type && styles.radioTextActive]}>{type === 'hostel' ? 'Hostel' : 'Day Scholar'}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {newStudent.residencetype === 'hostel' && (
                                <>
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Hostel Name *</Text>
                                        <View style={styles.radioRow}>
                                            {['M.G.R', 'Janaki ammal'].map(name => (
                                                <TouchableOpacity
                                                    key={name}
                                                    style={[styles.radioBtn, newStudent.hostelname === name && styles.radioBtnActive]}
                                                    onPress={() => setNewStudent({ ...newStudent, hostelname: name })}
                                                >
                                                    <Text style={[styles.radioText, newStudent.hostelname === name && styles.radioTextActive]}>{name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Room Number *</Text>
                                        <TextInput style={styles.formInput} value={newStudent.hostelroomno} onChangeText={t => setNewStudent({ ...newStudent, hostelroomno: t })} placeholder="Enter room number" />
                                    </View>
                                </>
                            )}

                            {newStudent.residencetype === 'day scholar' && (
                                <>
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Bus Number *</Text>
                                        <TextInput style={styles.formInput} value={newStudent.busno} onChangeText={t => setNewStudent({ ...newStudent, busno: t })} placeholder="Enter bus number" />
                                    </View>
                                    <View style={styles.formGroup}>
                                        <Text style={styles.formLabel}>Boarding Point *</Text>
                                        <TextInput style={styles.formInput} value={newStudent.boardingpoint} onChangeText={t => setNewStudent({ ...newStudent, boardingpoint: t })} placeholder="Enter boarding point" />
                                    </View>
                                </>
                            )}
                            <View style={{ height: 20 }} />
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                                <Text style={{ color: '#374151', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStudent} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Register Student</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border },
    backBtn: { padding: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.white },
    backText: { fontWeight: '700', color: COLORS.textSecondary },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    headerSub: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginTop: 2 },
    addBtnHeader: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
    addBtnTextHeader: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    
    searchRow: { padding: 16, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
    search: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
    
    list: { padding: 16, gap: 12 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    name: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    sub: { fontSize: 13, color: COLORS.textMuted, fontFamily: 'monospace', marginVertical: 4 },
    badgeRow: { flexDirection: 'row', gap: 6 },
    badgeDep: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
    badgeDepText: { color: '#475569', fontSize: 10, fontWeight: '700' },
    badgeYear: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#dbeafe' },
    badgeYearText: { color: '#2563eb', fontSize: 10, fontWeight: '700' },
    
    actionCol: { alignItems: 'flex-end', gap: 8 },
    viewBtn: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
    viewBtnText: { color: '#475569', fontSize: 12, fontWeight: '600' },
    delBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#fee2e2' },
    delBtnText: { fontSize: 14 },

    empty: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 15 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
    modalHeader: { padding: 20, borderBottomWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    modalBody: { padding: 20 },
    formGroup: { marginBottom: 16 },
    formLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    formInput: { borderWidth: 1, borderColor: '#d1d5db', padding: 12, borderRadius: 10, fontSize: 15, color: '#111827', backgroundColor: COLORS.white },
    
    radioRow: { flexDirection: 'row', gap: 10 },
    radioBtn: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, alignItems: 'center' },
    radioBtnActive: { backgroundColor: '#eff6ff', borderColor: '#6366f1' },
    radioText: { fontSize: 14, fontWeight: '500', color: '#4b5563' },
    radioTextActive: { color: '#4f46e5', fontWeight: '700' },

    modalFooter: { padding: 20, borderTopWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 12, backgroundColor: '#f9fafb' },
    cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: COLORS.white },
    saveBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#4f46e5', minWidth: 140, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});

export default AdminStaffStudentListScreen;
