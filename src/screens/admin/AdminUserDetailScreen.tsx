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

interface DetailField {
    label: string;
    key: string;
    type?: 'select' | 'text' | 'email' | 'phone';
    options?: string[];
}

interface AdminDetailProps { 
    route: any;
    title: string;
    endpoint: string;
    updateEndpoint: string;
    deleteEndpoint: string;
    pwdUpdateEndpoint?: string;
    fields: DetailField[];
    roleTitle: string;
    nameKey?: string; // e.g. 'name' or 'routeNumber'
}

const AdminDetail = ({ route, title, endpoint, updateEndpoint, deleteEndpoint, pwdUpdateEndpoint, fields, roleTitle, nameKey = 'name' }: AdminDetailProps) => {
    const navigation = useNavigation<any>();
    const { id } = route.params || {};

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pwdModalOpen, setPwdModalOpen] = useState(false);

    const [formData, setFormData] = useState<any>({});
    const [pwd, setPwd] = useState('');

    useFocusEffect(
        useCallback(() => {
            if (id) fetchUser();
        }, [id])
    );

    const fetchUser = async () => {
        try {
            // Note: Our endpoints look like /admin/wardens/:id or /api/bus/routes/:id
            const res = await api.get(`${endpoint}/${id}`);
            const data = res.data.warden || res.data.staff || res.data.incharge || res.data.watchman || res.data.bus || res.data || res.data[0] || {};
            setUser(data);
            setFormData(data);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to fetch details' });
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        try {
            await api.put(`${updateEndpoint}/${id}`, formData);
            Toast.show({ type: 'success', text1: 'Updated successfully' });
            setIsEditing(false);
            fetchUser();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: err.response?.data?.message || 'Update failed' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Delete', `Are you sure you want to delete ${user?.[nameKey]}?`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`${deleteEndpoint}/${id}`);
                        Toast.show({ type: 'success', text1: 'Deleted successfully' });
                        navigation.goBack();
                    } catch {
                        Toast.show({ type: 'error', text1: 'Failed to delete' });
                    }
                }
            }
        ]);
    };

    const handlePasswordUpdate = async () => {
        if (!pwd) return Toast.show({ type: 'error', text1: 'Enter a password' });
        if (!pwdUpdateEndpoint) return Toast.show({ type: 'error', text1: 'Password reset not supported' });
        try {
            await api.put(`${pwdUpdateEndpoint}/${id}`, { newPassword: pwd });
            Toast.show({ type: 'success', text1: 'Password updated successfully' });
            setPwdModalOpen(false);
            setPwd('');
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to update password' });
        }
    };

    const getImageUrl = (photoSource: string) => {
        if (!photoSource) return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.[nameKey] || 'U')}&background=ea580c&color=fff`;
        if (photoSource.startsWith('http') || photoSource.startsWith('data:')) return photoSource;
        return `${CDN_URL}${photoSource.startsWith('/') ? photoSource : `/${photoSource}`}`;
    };

    if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1, marginTop: 50 }} />;
    if (!user) return <SafeAreaView style={styles.container}><Text style={styles.empty}>User not found</Text></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                {!isEditing ? (
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.lockBtn} onPress={() => setPwdModalOpen(true)}>
                            <Text style={styles.lockText}>🔑 Pwd</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                            <Text style={styles.editBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.delBtn} onPress={handleDelete}>
                            <Text style={styles.delBtnText}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); setFormData(user); }} disabled={isSaving}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>💾 Save</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                {/* ID Card Header */}
                <View style={[styles.mainCard, SHADOWS.medium]}>
                    <View style={styles.coverBg} />
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: getImageUrl(user.photo) }} style={styles.avatarImg} />
                    </View>
                    <View style={styles.infoCenter}>
                        <Text style={styles.nameDisplay}>{user[nameKey]}</Text>
                        <Text style={styles.roleText}>{roleTitle}</Text>
                        <View style={styles.badgesWrapper}>
                            <View style={styles.badgeOrange}><Text style={styles.badgeOrangeText}>{user.hostelname || user.department || user.shift || 'Assigned'}</Text></View>
                            <View style={styles.badgeGray}><Text style={styles.badgeGrayText}>ID: {id?.slice(-6)?.toUpperCase()}</Text></View>
                        </View>
                    </View>
                </View>

                {/* Details Section */}
                <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Information Details</Text>
                    {fields.map(field => (
                        <View key={field.key} style={styles.detailRow}>
                            <Text style={styles.label}>{field.label}</Text>
                            {isEditing ? (
                                field.type === 'select' ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 4 }}>
                                        {field.options?.map(opt => (
                                            <TouchableOpacity 
                                                key={opt} 
                                                style={[styles.selectOption, formData[field.key] === opt && styles.selectOptionActive]}
                                                onPress={() => setFormData({ ...formData, [field.key]: opt })}
                                            >
                                                <Text style={[styles.selectText, formData[field.key] === opt && styles.selectTextActive]}>{opt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                ) : (
                                    <TextInput 
                                        style={styles.inputActive} 
                                        value={formData[field.key] || ''} 
                                        onChangeText={t => setFormData({ ...formData, [field.key]: t })} 
                                        keyboardType={field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : 'default'}
                                        autoCapitalize={field.type === 'email' ? 'none' : 'words'}
                                    />
                                )
                            ) : (
                                <Text style={styles.value}>{user[field.key] || '-'}</Text>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>

            <Modal visible={pwdModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, SHADOWS.large]}>
                        <Text style={styles.modalTitle}>Update Password</Text>
                        <View style={styles.modalBody}>
                            <Text style={styles.label}>New Password for {user[nameKey]}</Text>
                            <TextInput style={styles.inputActive} secureTextEntry value={pwd} onChangeText={setPwd} placeholder="Enter new password..." />
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
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border },
    headerActions: { flexDirection: 'row', gap: 8 },
    backBtn: { padding: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: COLORS.white },
    backText: { fontWeight: '700', color: COLORS.textSecondary },
    lockBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10 },
    lockText: { fontWeight: '600', color: '#4b5563' },
    editBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#4f46e5' },
    editBtnText: { color: COLORS.white, fontWeight: '700' },
    delBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fee2e2' },
    delBtnText: { fontSize: 16 },
    cancelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10 },
    cancelText: { fontWeight: '600', color: '#4b5563' },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#10b981', minWidth: 80, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontWeight: '700' },

    empty: { textAlign: 'center', marginTop: 50, color: COLORS.textMuted },

    mainCard: { backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
    coverBg: { height: 100, backgroundColor: '#ea580c' },
    avatarWrapper: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: COLORS.white, marginTop: -45, alignSelf: 'center', backgroundColor: '#ffedd5', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    infoCenter: { alignItems: 'center', padding: 20, paddingTop: 10 },
    nameDisplay: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    roleText: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
    badgesWrapper: { flexDirection: 'row', gap: 8 },
    badgeOrange: { backgroundColor: '#ffedd5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#fed7aa' },
    badgeOrangeText: { color: '#c2410c', fontSize: 12, fontWeight: '700' },
    badgeGray: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    badgeGrayText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },

    detailSection: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f3f4f6' },
    detailRow: { marginBottom: 16 },
    label: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
    value: { fontSize: 16, fontWeight: '500', color: COLORS.textPrimary },
    inputActive: { borderWidth: 1, borderColor: '#6366f1', padding: 12, borderRadius: 8, fontSize: 15, backgroundColor: COLORS.white },

    selectOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', marginRight: 10, backgroundColor: '#f9fafb' },
    selectOptionActive: { backgroundColor: '#4f46e5', borderColor: '#4338ca' },
    selectText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
    selectTextActive: { color: COLORS.white },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
    modalTitle: { padding: 20, fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: '#f9fafb' },
    modalBody: { padding: 20 },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 20, backgroundColor: '#f9fafb', borderTopWidth: 1, borderColor: COLORS.border },
});

// Exports
export const WardenDetailsAdminScreen = ({ route }: any) => <AdminDetail route={route} title="Warden Details" roleTitle="Hostel Warden" endpoint="/admin/warden" updateEndpoint="/admin/warden/update" deleteEndpoint="/admin/warden/delete" pwdUpdateEndpoint="/admin/warden/forgotpassword" fields={[
    { label: 'Full Name', key: 'name', type: 'text' },
    { label: 'Email Address', key: 'email', type: 'email' },
    { label: 'Phone Number', key: 'phone', type: 'phone' },
    { label: 'Assigned Hostel', key: 'hostelname', type: 'select', options: ['Boys Hostel 1', 'Boys Hostel 2', 'Girls Hostel 1', 'Girls Hostel 2'] },
    { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] }
]} />;

export const YearInchargeDetailsAdminScreen = ({ route }: any) => <AdminDetail route={route} title="Incharge Details" roleTitle="Year Incharge" endpoint="/admin/incharge" updateEndpoint="/admin/incharge/update" deleteEndpoint="/admin/incharge/delete" pwdUpdateEndpoint="/admin/incharge/forgotpassword" fields={[
    { label: 'Full Name', key: 'name', type: 'text' },
    { label: 'Email Address', key: 'email', type: 'email' },
    { label: 'Phone Number', key: 'phone', type: 'phone' },
    { label: 'Department', key: 'department', type: 'select', options: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Admin'] }
]} />;

export const SecurityDetailsAdminScreen = ({ route }: any) => <AdminDetail route={route} title="Security Details" roleTitle="Security Guard" endpoint="/admin/watchman" updateEndpoint="/admin/watchman/update" deleteEndpoint="/admin/watchman/delete" pwdUpdateEndpoint="/admin/watchman/forgotpassword" fields={[
    { label: 'Full Name', key: 'name', type: 'text' },
    { label: 'Email Address', key: 'email', type: 'email' },
    { label: 'Phone Number', key: 'phone', type: 'phone' },
    { label: 'Shift', key: 'shift', type: 'select', options: ['Morning', 'Evening', 'Night'] }
]} />;

export const BusDetailsAdminScreen = ({ route }: any) => <AdminDetail route={route} title="Bus Route Details" roleTitle="Transport Route" nameKey="routeNumber" endpoint="/admin/bus" updateEndpoint="/admin/bus/update" deleteEndpoint="/admin/bus/delete" fields={[
    { label: 'Route Number', key: 'routeNumber', type: 'text' },
    { label: 'From Location', key: 'from', type: 'text' },
    { label: 'To Location', key: 'to', type: 'text' },
    { label: 'Driver Name', key: 'driverName', type: 'text' },
    { label: 'Driver Phone', key: 'driverPhone', type: 'phone' }
]} />;

export default AdminDetail;
