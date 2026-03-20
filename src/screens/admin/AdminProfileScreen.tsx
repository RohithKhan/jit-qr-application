import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, ActivityIndicator, Image, Modal, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';
import { handleGlobalLogout } from '../../utils/authHelper';

const AdminProfileScreen = () => {
    const navigation = useNavigation<any>();
    const [admin, setAdmin] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pwdModalOpen, setPwdModalOpen] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState<any>({ name: '', email: '', phone: '', photo: '' });
    const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    useFocusEffect(
        useCallback(() => { fetchProfile(); }, [])
    );

    const fetchProfile = async () => {
        try {
            const res = await api.get('/admin/profile');
            const data = res.data.admin || res.data;
            setAdmin(data);
            setFormData(data);
        } catch { 
            Toast.show({ type: 'error', text1: 'Failed to load profile' }); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'photo' && typeof formData[key] === 'object') {
                    // Mobile ImagePicker payload
                    payload.append('photo', formData[key] as any);
                } else if (key !== 'photo' && formData[key] !== null) {
                    payload.append(key, String(formData[key]));
                }
            });

            await api.put('/admin/profile/update', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Toast.show({ type: 'success', text1: 'Profile updated!' });
            setIsEditing(false);
            fetchProfile();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Update failed' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            return Toast.show({ type: 'error', text1: 'Passwords do not match' });
        }
        try {
            await api.post('/admin/forgot/password', {
                email: admin.email,
                currentPassword: pwdForm.currentPassword,
                newPassword: pwdForm.newPassword
            });
            Toast.show({ type: 'success', text1: 'Password changed successfully' });
            setPwdModalOpen(false);
            setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to change password' });
        }
    };

    const pickImage = async () => {
        if (!isEditing) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setFormData({
                ...formData,
                photo: {
                    uri,
                    name: uri.split('/').pop() || 'photo.jpg',
                    type: result.assets[0].mimeType || 'image/jpeg',
                }
            });
        }
    };

    const getImageUrl = (photoSource: any) => {
        if (!photoSource) return '';
        if (typeof photoSource === 'object' && photoSource.uri) return photoSource.uri; // Local pick
        if (typeof photoSource === 'string') {
            if (photoSource.startsWith('http')) return photoSource;
            return `${CDN_URL}${photoSource.startsWith('/') ? photoSource : `/${photoSource}`}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'A')}&background=3b82f6&color=fff`;
    };

    if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1, marginTop: 50 }} />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Dashboard</Text>
                </TouchableOpacity>
                {!isEditing ? (
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.lockBtn} onPress={() => setPwdModalOpen(true)}>
                            <Text style={styles.lockText}>🔒 Pwd</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                            <Text style={styles.editBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); setFormData(admin); }} disabled={isSaving}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>💾 Save</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                <View style={[styles.mainCard, SHADOWS.medium]}>
                    <View style={styles.coverBg} />
                    
                    <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} disabled={!isEditing}>
                        {(formData.photo || admin?.photo) ? (
                            <Image source={{ uri: getImageUrl(formData.photo || admin?.photo) }} style={styles.avatarImg} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitials}>{(admin?.name || 'A').charAt(0)}</Text>
                            </View>
                        )}
                        {isEditing && <View style={styles.camOverlay}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>📷 EDIT</Text></View>}
                    </TouchableOpacity>

                    <View style={styles.infoWrapper}>
                        {isEditing ? (
                            <TextInput style={styles.nameInputActive} value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} placeholder="Full Name" />
                        ) : (
                            <Text style={styles.nameDisplay}>{admin?.name}</Text>
                        )}
                        <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>Administrator</Text></View>
                    </View>

                    <View style={styles.detailsGrid}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Email Address</Text>
                            {isEditing ? (
                                <TextInput style={styles.inputActive} value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} keyboardType="email-address" autoCapitalize="none" />
                            ) : (
                                <Text style={styles.value}>{admin?.email}</Text>
                            )}
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Phone Number</Text>
                            {isEditing ? (
                                <TextInput style={styles.inputActive} value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })} keyboardType="phone-pad" />
                            ) : (
                                <Text style={styles.value}>{admin?.phone || '-'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleGlobalLogout}>
                    <Text style={styles.logoutText}>Sign Out from Administrator</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Password Modal */}
            <Modal visible={pwdModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, SHADOWS.large]}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        
                        <View style={styles.modalBody}>
                            <Text style={styles.label}>Current Password</Text>
                            <TextInput style={styles.inputActive} secureTextEntry value={pwdForm.currentPassword} onChangeText={t => setPwdForm({ ...pwdForm, currentPassword: t })} />
                            
                            <Text style={[styles.label, { marginTop: 12 }]}>New Password</Text>
                            <TextInput style={styles.inputActive} secureTextEntry value={pwdForm.newPassword} onChangeText={t => setPwdForm({ ...pwdForm, newPassword: t })} />
                            
                            <Text style={[styles.label, { marginTop: 12 }]}>Confirm New Password</Text>
                            <TextInput style={styles.inputActive} secureTextEntry value={pwdForm.confirmPassword} onChangeText={t => setPwdForm({ ...pwdForm, confirmPassword: t })} />
                        </View>
                        
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPwdModalOpen(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border },
    headerActions: { flexDirection: 'row', gap: 8 },
    backBtn: { padding: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.white },
    backText: { fontWeight: '700', color: COLORS.textSecondary },
    lockBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: COLORS.white },
    lockText: { fontWeight: '600', color: '#4b5563' },
    editBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#3b82f6' },
    editBtnText: { color: COLORS.white, fontWeight: '700' },
    cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, backgroundColor: COLORS.white },
    cancelText: { fontWeight: '600', color: '#4b5563' },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#10b981', minWidth: 80, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontWeight: '700' },

    mainCard: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    coverBg: { height: 100, backgroundColor: '#e0e7ff' },
    avatarWrapper: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: COLORS.white, marginTop: -45, marginLeft: 20, backgroundColor: '#eff6ff', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    avatarInitials: { fontSize: 32, fontWeight: '800', color: '#3b82f6' },
    camOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 4, alignItems: 'center' },

    infoWrapper: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1, borderColor: COLORS.border },
    nameDisplay: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
    nameInputActive: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, borderBottomWidth: 2, borderColor: '#3b82f6', paddingVertical: 4 },
    roleBadge: { backgroundColor: '#eff6ff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
    roleBadgeText: { color: '#1d4ed8', fontSize: 13, fontWeight: '700' },

    detailsGrid: { padding: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderColor: COLORS.border },
    detailRow: { marginBottom: 16 },
    label: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6 },
    value: { fontSize: 16, fontWeight: '500', color: COLORS.textPrimary },
    inputActive: { borderWidth: 1, borderColor: '#d1d5db', padding: 10, borderRadius: 8, fontSize: 15, backgroundColor: COLORS.white },

    logoutBtn: { marginTop: 20, backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
    logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
    modalTitle: { padding: 20, fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: '#f9fafb' },
    modalBody: { padding: 20 },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 20, backgroundColor: '#f9fafb', borderTopWidth: 1, borderColor: COLORS.border },
});

export default AdminProfileScreen;
