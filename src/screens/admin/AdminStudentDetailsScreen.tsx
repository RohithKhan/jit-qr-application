import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Image, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';
import { DEPARTMENTS, YEARS, BATCHES, GENDERS } from '../../constants/dropdownOptions';

interface FieldProps {
    label: string;
    value: any;
    fieldKey: string;
    isEditing: boolean;
    onChange: (key: string, val: string) => void;
    options?: string[];
    type?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}

const Field = ({ label, value, fieldKey, isEditing, onChange, options, type = 'default' }: FieldProps) => (
    <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isEditing ? (
            options ? (
                <View style={[styles.selectWrapper, { zIndex: 10 }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 2 }}>
                        {options.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.selectOption, value === opt && styles.selectOptionActive]}
                                onPress={() => onChange(fieldKey, opt)}
                            >
                                <Text style={[styles.selectText, value === opt && styles.selectTextActive]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            ) : (
                <TextInput
                    style={styles.fieldInput}
                    value={(value !== null && value !== undefined) ? String(value) : ''}
                    onChangeText={t => onChange(fieldKey, t)}
                    keyboardType={type}
                    autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                />
            )
        ) : (
            <Text style={styles.fieldValue}>{value || (value === 0 ? '0' : '-')}</Text>
        )}
    </View>
);

const AdminStudentDetailsScreen = ({ route }: any) => {
    const { id } = route.params || {};
    const navigation = useNavigation<any>();

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pwdModalOpen, setPwdModalOpen] = useState(false);

    const [formData, setFormData] = useState<any>({});
    const [pwd, setPwd] = useState('');

    useFocusEffect(
        useCallback(() => {
            if (id) fetchStudent();
        }, [id])
    );

    const fetchStudent = async () => {
        try {
            const res = await api.get(`/admin/student/${id}`);
            const data = res.data.student || res.data || {};
            setStudent(data);
            setFormData(data);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to load student details' });
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key: string, val: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: val }));
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            await api.put(`/admin/student/update/${id}`, formData);
            Toast.show({ type: 'success', text1: 'Student updated successfully' });
            setIsEditing(false);
            fetchStudent();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to update' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Delete Student', `Are you sure you want to remove ${student?.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/admin/student/delete/${id}`);
                        Toast.show({ type: 'success', text1: 'Student deleted successfully' });
                        navigation.goBack();
                    } catch {
                        Toast.show({ type: 'error', text1: 'Failed to delete student' });
                    }
                }
            }
        ]);
    };

    const handlePasswordUpdate = async () => {
        if (!pwd) return Toast.show({ type: 'error', text1: 'Enter a password' });
        try {
            await api.put(`/admin/student/forgotpassword/${id}`, { newPassword: pwd });
            Toast.show({ type: 'success', text1: 'Password updated successfully' });
            setPwdModalOpen(false);
            setPwd('');
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to update password' });
        }
    };

    const getImageUrl = (photoSource: string) => {
        if (!photoSource) return `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'S')}&background=4f46e5&color=fff`;
        if (photoSource.startsWith('http') || photoSource.startsWith('data:')) return photoSource;
        return `${CDN_URL}${photoSource.startsWith('/') ? photoSource : `/${photoSource}`}`;
    };

    if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1, marginTop: 50 }} />;
    if (!student) return <SafeAreaView style={styles.container}><Text style={styles.empty}>Student not found</Text></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    {!isEditing ? (
                        <>
                            <TouchableOpacity style={styles.lockBtn} onPress={() => setPwdModalOpen(true)}>
                                <Text style={styles.lockText}>🔑 Pwd</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                                <Text style={styles.editBtnText}>✏️ Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.delBtn} onPress={handleDelete}>
                                <Text style={styles.delBtnText}>🗑️</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); setFormData(student); }} disabled={isSaving}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>💾 Save</Text>}
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                {/* ID Card Header */}
                <View style={[styles.mainCard, SHADOWS.medium]}>
                    <View style={styles.coverBg} />
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: getImageUrl(student.photo) }} style={styles.avatarImg} />
                    </View>
                    <View style={styles.infoCenter}>
                        <Text style={styles.nameDisplay}>{student.name}</Text>
                        <Text style={styles.roleText}>Student</Text>
                        <View style={styles.badgesWrapper}>
                            <View style={styles.badgeBlue}><Text style={styles.badgeBlueText}>{student.department || 'No Dept'}</Text></View>
                        </View>
                    </View>
                </View>

                {/* Mini Stats Card */}
                <View style={[styles.miniStatsCard, SHADOWS.small]}>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>CGPA</Text>
                        <Text style={styles.statValue}>{student.cgpa || 'N/A'}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>Arrears</Text>
                        <Text style={[styles.statValue, { color: '#ef4444' }]}>{student.arrears || '0'}</Text>
                    </View>
                </View>

                {/* Details Section */}
                <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.gridFields}>
                        <Field label="Full Name" fieldKey="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} />
                        <Field label="Email Address" fieldKey="email" value={formData.email} isEditing={isEditing} onChange={handleInputChange} type="email-address" />
                        <Field label="Phone Number" fieldKey="phone" value={formData.phone} isEditing={isEditing} onChange={handleInputChange} type="phone-pad" />
                        <Field label="Gender" fieldKey="gender" value={formData.gender} isEditing={isEditing} onChange={handleInputChange} options={GENDERS} />
                        <Field label="Parent Phone" fieldKey="parentnumber" value={formData.parentnumber} isEditing={isEditing} onChange={handleInputChange} type="phone-pad" />
                    </View>
                </View>

                <View style={[styles.detailSection, { marginTop: 16 }]}>
                    <Text style={styles.sectionTitle}>Academic Details</Text>
                    <View style={styles.gridFields}>
                        <Field label="Register Number" fieldKey="registerNumber" value={formData.registerNumber} isEditing={isEditing} onChange={handleInputChange} />
                        <Field label="Department" fieldKey="department" value={formData.department} isEditing={isEditing} onChange={handleInputChange} options={DEPARTMENTS} />
                        <Field label="Batch" fieldKey="batch" value={formData.batch} isEditing={isEditing} onChange={handleInputChange} options={BATCHES} />
                        <Field label="Year" fieldKey="year" value={String(formData.year)} isEditing={isEditing} onChange={handleInputChange} options={YEARS} />
                        <Field label="Semester" fieldKey="semester" value={formData.semester} isEditing={isEditing} onChange={handleInputChange} type="numeric" />
                        <Field label="CGPA" fieldKey="cgpa" value={formData.cgpa} isEditing={isEditing} onChange={handleInputChange} type="numeric" />
                        <Field label="Arrears" fieldKey="arrears" value={formData.arrears} isEditing={isEditing} onChange={handleInputChange} type="numeric" />
                    </View>
                </View>

                <View style={[styles.detailSection, { marginTop: 16 }]}>
                    <Text style={styles.sectionTitle}>Residence & Transport</Text>
                    <View style={styles.gridFields}>
                        <Field
                            label="Residence Type"
                            fieldKey="residencetype"
                            value={formData.residencetype}
                            isEditing={isEditing}
                            onChange={handleInputChange}
                            options={['hostel', 'day scholar']}
                        />
                        {formData.residencetype === 'hostel' && (
                            <>
                                <Field
                                    label="Hostel Name"
                                    fieldKey="hostelname"
                                    value={formData.hostelname}
                                    isEditing={isEditing}
                                    onChange={handleInputChange}
                                    options={['M.G.R', 'Janaki ammal']}
                                />
                                <Field label="Room Number" fieldKey="hostelroomno" value={formData.hostelroomno} isEditing={isEditing} onChange={handleInputChange} />
                            </>
                        )}
                        {formData.residencetype === 'day scholar' && (
                            <>
                                <Field label="Bus Number" fieldKey="busno" value={formData.busno} isEditing={isEditing} onChange={handleInputChange} />
                                <Field label="Boarding Point" fieldKey="boardingpoint" value={formData.boardingpoint} isEditing={isEditing} onChange={handleInputChange} />
                            </>
                        )}
                    </View>
                </View>
                <View style={{height: 40}} />
            </ScrollView>

            <Modal visible={pwdModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, SHADOWS.large]}>
                        <Text style={styles.modalTitle}>Update Password</Text>
                        <View style={styles.modalBody}>
                            <Text style={styles.fieldLabel}>New Password for {student?.name}</Text>
                            <TextInput style={styles.fieldInput} secureTextEntry value={pwd} onChangeText={setPwd} placeholder="Enter new password..." />
                        </View>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPwdModalOpen(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handlePasswordUpdate}>
                                <Text style={styles.saveBtnText}>Update</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border, zIndex: 10 },
    headerActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    backBtn: { padding: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.white },
    backText: { fontWeight: '700', color: COLORS.textSecondary },
    
    lockBtn: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10 },
    lockText: { fontWeight: '600', color: '#4b5563', fontSize: 13 },
    editBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#4f46e5' },
    editBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
    delBtn: { paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fee2e2' },
    delBtnText: { fontSize: 14 },
    cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10 },
    cancelText: { fontWeight: '600', color: '#4b5563', fontSize: 13 },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#10b981', minWidth: 80, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

    empty: { textAlign: 'center', marginTop: 50, color: COLORS.textMuted },

    mainCard: { backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
    coverBg: { height: 100, backgroundColor: '#0ea5e9' },
    avatarWrapper: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: COLORS.white, marginTop: -45, alignSelf: 'center', backgroundColor: '#e0f2fe', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    infoCenter: { alignItems: 'center', padding: 20, paddingTop: 10 },
    nameDisplay: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    roleText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
    badgesWrapper: { flexDirection: 'row', gap: 8 },
    badgeBlue: { backgroundColor: '#e0f2fe', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20 },
    badgeBlueText: { color: '#0369a1', fontSize: 13, fontWeight: '700' },

    miniStatsCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    statCol: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
    statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 4 },
    statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },

    detailSection: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    gridFields: { gap: 16 },
    fieldGroup: { flexDirection: 'column', gap: 6 },
    fieldLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    fieldValue: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
    fieldInput: { borderWidth: 1, borderColor: '#d1d5db', padding: 10, borderRadius: 8, fontSize: 14, backgroundColor: COLORS.white, color: COLORS.textPrimary, marginBottom: 4 },
    
    selectWrapper: { marginTop: 4 },
    selectOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', marginRight: 8, backgroundColor: '#f9fafb' },
    selectOptionActive: { backgroundColor: '#4f46e5', borderColor: '#4338ca' },
    selectText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
    selectTextActive: { color: COLORS.white },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
    modalTitle: { padding: 20, fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: '#f9fafb' },
    modalBody: { padding: 20, gap: 8 },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 20, backgroundColor: '#f9fafb', borderTopWidth: 1, borderColor: COLORS.border },
});

export default AdminStudentDetailsScreen;
