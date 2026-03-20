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

interface FieldProps {
    label: string;
    value: string;
    fieldKey: string;
    isEditing: boolean;
    onChange: (key: string, val: string) => void;
    options?: string[];
    type?: 'default' | 'email-address' | 'phone-pad';
}

const Field = ({ label, value, fieldKey, isEditing, onChange, options, type = 'default' }: FieldProps) => (
    <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isEditing ? (
            options ? (
                <View style={styles.selectWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    value={value || ''}
                    onChangeText={t => onChange(fieldKey, t)}
                    keyboardType={type}
                    autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                />
            )
        ) : (
            <Text style={styles.fieldValue}>{value || '-'}</Text>
        )}
    </View>
);

const AdminStaffDetailsScreen = ({ route }: any) => {
    const { id } = route.params || {};
    const navigation = useNavigation<any>();

    const [staff, setStaff] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pwdModalOpen, setPwdModalOpen] = useState(false);

    const [formData, setFormData] = useState<any>({});
    const [pwd, setPwd] = useState('');

    const [newSubject, setNewSubject] = useState('');
    const [newSkill, setNewSkill] = useState('');
    const [newAchievement, setNewAchievement] = useState('');

    useFocusEffect(
        useCallback(() => {
            if (id) fetchStaff();
        }, [id])
    );

    const fetchStaff = async () => {
        try {
            const res = await api.get(`/admin/staff/${id}`);
            const data = res.data.staff || res.data || {};
            setStaff(data);
            setFormData({
                ...data,
                subjects: data.subjects || [],
                skills: data.skills || [],
                achievements: data.achievements || []
            });
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to load staff details' });
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key: string, val: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: val }));
    };

    const handleArrayAdd = (field: 'subjects' | 'skills' | 'achievements', value: string, setter: any) => {
        if (!value.trim()) return;
        setFormData((prev: any) => ({
            ...prev,
            [field]: [...(prev[field] || []), value]
        }));
        setter('');
    };

    const handleArrayRemove = (field: 'subjects' | 'skills' | 'achievements', index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: prev[field].filter((_: any, i: number) => i !== index)
        }));
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            await api.put(`/admin/staff/update/${id}`, formData);
            Toast.show({ type: 'success', text1: 'Staff updated successfully' });
            setIsEditing(false);
            fetchStaff();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to update' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Delete Staff', `Are you sure you want to remove ${staff?.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/admin/staff/delete/${id}`);
                        Toast.show({ type: 'success', text1: 'Staff deleted successfully' });
                        navigation.navigate('ManageStaff');
                    } catch {
                        Toast.show({ type: 'error', text1: 'Failed to delete staff' });
                    }
                }
            }
        ]);
    };

    const handlePasswordUpdate = async () => {
        if (!pwd) return Toast.show({ type: 'error', text1: 'Enter a password' });
        try {
            await api.put(`/admin/staff/forgotpassword/${id}`, { newPassword: pwd });
            Toast.show({ type: 'success', text1: 'Password updated successfully' });
            setPwdModalOpen(false);
            setPwd('');
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to update password' });
        }
    };

    const handleViewStudents = () => {
        navigation.navigate('AdminStaffStudentListScreen', { staffid: id, staffName: staff?.name });
    };

    const getImageUrl = (photoSource: string) => {
        if (!photoSource) return `https://ui-avatars.com/api/?name=${encodeURIComponent(staff?.name || 'S')}&background=6366f1&color=fff`;
        if (photoSource.startsWith('http') || photoSource.startsWith('data:')) return photoSource;
        return `${CDN_URL}${photoSource.startsWith('/') ? photoSource : `/${photoSource}`}`;
    };

    if (loading) return <ActivityIndicator size="large" color="#6366f1" style={{ flex: 1, marginTop: 50 }} />;
    if (!staff) return <SafeAreaView style={styles.container}><Text style={styles.empty}>Staff not found</Text></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.studentBtn} onPress={handleViewStudents}>
                        <Text style={styles.studentBtnText}>👨‍🎓 Students</Text>
                    </TouchableOpacity>
                    {!isEditing ? (
                        <>
                            <TouchableOpacity style={styles.lockBtn} onPress={() => setPwdModalOpen(true)}>
                                <Text style={styles.lockText}>🔑</Text>
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
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); setFormData(staff); }} disabled={isSaving}>
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
                        <Image source={{ uri: getImageUrl(staff.photo) }} style={styles.avatarImg} />
                    </View>
                    <View style={styles.infoCenter}>
                        <Text style={styles.nameDisplay}>{staff.name}</Text>
                        <Text style={styles.roleText}>{staff.designation || 'Staff Member'}</Text>
                        <View style={styles.badgesWrapper}>
                            <View style={styles.badgeBlue}><Text style={styles.badgeBlueText}>{staff.department || 'Unassigned'}</Text></View>
                        </View>
                    </View>
                </View>

                {/* Details Section */}
                <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.gridFields}>
                        <Field label="Full Name" fieldKey="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} />
                        <Field label="Email Address" fieldKey="email" value={formData.email} isEditing={isEditing} onChange={handleInputChange} type="email-address" />
                        <Field label="Phone Number" fieldKey="contactNumber" value={formData.contactNumber} isEditing={isEditing} onChange={handleInputChange} type="phone-pad" />
                        <Field label="Qualification" fieldKey="qualification" value={formData.qualification} isEditing={isEditing} onChange={handleInputChange} />
                        <Field label="Experience (Years)" fieldKey="experience" value={formData.experience} isEditing={isEditing} onChange={handleInputChange} type="phone-pad" />
                    </View>
                </View>

                <View style={[styles.detailSection, { marginTop: 16 }]}>
                    <Text style={styles.sectionTitle}>Academic Details</Text>
                    <View style={styles.gridFields}>
                        <Field
                            label="Department" fieldKey="department" value={formData.department} isEditing={isEditing} onChange={handleInputChange}
                            options={['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Admin']}
                        />
                        <Field
                            label="Designation" fieldKey="designation" value={formData.designation} isEditing={isEditing} onChange={handleInputChange}
                            options={['Professor', 'Associate Professor', 'Assistant Professor', 'Lab Assistant']}
                        />
                    </View>

                    {/* Array Fields */}
                    <View style={styles.fullWidthField}>
                        <Text style={styles.fieldLabel}>Subjects Handled</Text>
                        <View style={styles.tagsContainer}>
                            {(isEditing ? formData.subjects : staff.subjects)?.map((sub: string, idx: number) => (
                                <View key={idx} style={styles.tagBlue}>
                                    <Text style={styles.tagBlueText}>{sub}</Text>
                                    {isEditing && (
                                        <TouchableOpacity onPress={() => handleArrayRemove('subjects', idx)} style={styles.removeTagBtn}>
                                            <Text style={styles.removeTagText}>×</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            {(!staff.subjects?.length && !isEditing) && <Text style={styles.emptyText}>No subjects assigned</Text>}
                        </View>
                        {isEditing && (
                            <View style={styles.addRow}>
                                <TextInput style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]} value={newSubject} onChangeText={setNewSubject} placeholder="Add new subject" />
                                <TouchableOpacity style={styles.addBtn} onPress={() => handleArrayAdd('subjects', newSubject, setNewSubject)}>
                                    <Text style={styles.addBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.fullWidthField}>
                        <Text style={styles.fieldLabel}>Skills & Expertise</Text>
                        <View style={styles.tagsContainer}>
                            {(isEditing ? formData.skills : staff.skills)?.map((skill: string, idx: number) => (
                                <View key={idx} style={styles.tagGreen}>
                                    <Text style={styles.tagGreenText}>{skill}</Text>
                                    {isEditing && (
                                        <TouchableOpacity onPress={() => handleArrayRemove('skills', idx)} style={styles.removeTagBtn}>
                                            <Text style={styles.removeTagTextGreen}>×</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            {(!staff.skills?.length && !isEditing) && <Text style={styles.emptyText}>No skills listed</Text>}
                        </View>
                        {isEditing && (
                            <View style={styles.addRow}>
                                <TextInput style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]} value={newSkill} onChangeText={setNewSkill} placeholder="Add skill" />
                                <TouchableOpacity style={styles.addBtn} onPress={() => handleArrayAdd('skills', newSkill, setNewSkill)}>
                                    <Text style={styles.addBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.fullWidthField}>
                        <Text style={styles.fieldLabel}>Achievements</Text>
                        <View style={styles.listContainer}>
                            {(isEditing ? formData.achievements : staff.achievements)?.map((ach: string, idx: number) => (
                                <View key={idx} style={styles.listItem}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.listText}>{ach}</Text>
                                    {isEditing && (
                                        <TouchableOpacity onPress={() => handleArrayRemove('achievements', idx)}>
                                            <Text style={styles.listRemoveText}>Remove</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                            {(!staff.achievements?.length && !isEditing) && <Text style={styles.emptyText}>No achievements listed</Text>}
                        </View>
                        {isEditing && (
                            <View style={styles.addRow}>
                                <TextInput style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]} value={newAchievement} onChangeText={setNewAchievement} placeholder="Add achievement" />
                                <TouchableOpacity style={styles.addBtn} onPress={() => handleArrayAdd('achievements', newAchievement, setNewAchievement)}>
                                    <Text style={styles.addBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
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
                            <Text style={styles.fieldLabel}>New Password for {staff?.name}</Text>
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
    
    studentBtn: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: '#f9fafb' },
    studentBtnText: { fontWeight: '600', color: '#4b5563', fontSize: 13 },
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
    coverBg: { height: 100, backgroundColor: '#6366f1' },
    avatarWrapper: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: COLORS.white, marginTop: -45, alignSelf: 'center', backgroundColor: '#e0e7ff', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    infoCenter: { alignItems: 'center', padding: 20, paddingTop: 10 },
    nameDisplay: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    roleText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
    badgesWrapper: { flexDirection: 'row', gap: 8 },
    badgeBlue: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#dbeafe' },
    badgeBlueText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },

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

    fullWidthField: { marginTop: 20 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    tagBlue: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e7ff', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, gap: 4 },
    tagBlueText: { color: '#4338ca', fontWeight: '500', fontSize: 13 },
    tagGreen: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, gap: 4 },
    tagGreenText: { color: '#166534', fontWeight: '500', fontSize: 13 },
    removeTagBtn: { marginLeft: 2, padding: 2 },
    removeTagText: { color: '#4338ca', fontSize: 16, fontWeight: '800', opacity: 0.6 },
    removeTagTextGreen: { color: '#166534', fontSize: 16, fontWeight: '800', opacity: 0.6 },
    emptyText: { color: '#9ca3af', fontSize: 13, fontStyle: 'italic' },
    
    addRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
    addBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    addBtnText: { color: '#475569', fontWeight: '600', fontSize: 13 },

    listContainer: { marginTop: 8, gap: 8 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#9ca3af', marginTop: 8 },
    listText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
    listRemoveText: { color: '#ef4444', fontSize: 12, textDecorationLine: 'underline', marginTop: 2 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
    modalTitle: { padding: 20, fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: '#f9fafb' },
    modalBody: { padding: 20, gap: 8 },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 20, backgroundColor: '#f9fafb', borderTopWidth: 1, borderColor: COLORS.border },
});

export default AdminStaffDetailsScreen;
