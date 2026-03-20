import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, 
    ActivityIndicator, Alert, Modal, ScrollView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../constants/config';

interface FormField {
    label: string;
    key: string;
    type: 'text' | 'email' | 'password' | 'phone' | 'select' | 'number';
    options?: string[];
}

interface AdminListScreenProps { 
    title: string; 
    endpoint: string; 
    deleteEndpoint?: string; 
    fields: string[]; 
    formConfig?: FormField[];
    addEndpoint?: string;
    detailRoute?: string;
}

const AdminManageScreen = ({ title, endpoint, deleteEndpoint, fields, formConfig, addEndpoint, detailRoute }: AdminListScreenProps) => {
    const navigation = useNavigation<any>();
    const [items, setItems] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    useEffect(() => {
        setFiltered(items.filter((item: any) =>
            fields.some(f => String(item[f] || '').toLowerCase().includes(query.toLowerCase()))
        ));
    }, [query, items]);

    const fetchData = async () => {
        try {
            const res = await api.get(endpoint);
            const data = res.data.staff || res.data.wardens || res.data.incharges || res.data.watchman || res.data.buses || res.data.outpasses || res.data || [];
            
            // Sort appropriately (Newest first base heuristic)
            const sorted = (Array.isArray(data) ? data : []).sort((a: any, b: any) => 
                new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
            );

            setItems(sorted); 
            setFiltered(sorted);
        } catch { 
            Toast.show({ type: 'error', text1: `Failed to load ${title}` }); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (!deleteEndpoint) return;
        Alert.alert('Delete', `Are you sure you want to delete ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        const targetEndpoint = deleteEndpoint.replace(':id', id);
                        await api.delete(targetEndpoint);
                        Toast.show({ type: 'success', text1: 'Deleted successfully!' });
                        fetchData();
                    } catch { 
                        Toast.show({ type: 'error', text1: 'Failed to delete record' }); 
                    }
                }
            }
        ]);
    };

    const handleCreate = async () => {
        if (!addEndpoint) return;
        setSubmitting(true);
        try {
            await api.post(addEndpoint, formData);
            Toast.show({ type: 'success', text1: `${title} created successfully!` });
            setModalVisible(false);
            setFormData({});
            fetchData();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: error.response?.data?.message || 'Failed to create record' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCardPress = (id: string) => {
        if (detailRoute && id) {
            navigation.navigate(detailRoute, { id });
        }
    };

    const renderInput = (field: FormField) => {
        if (field.type === 'select') {
            return (
                <View key={field.key} style={styles.formGroup}>
                    <Text style={styles.formLabel}>{field.label}</Text>
                    {/* Simplified mobile select picker via text input fallback or scrolling */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectScroll}>
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
                </View>
            );
        }

        return (
            <View key={field.key} style={styles.formGroup}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <TextInput
                    style={styles.formInput}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor={COLORS.textLight}
                    value={formData[field.key] || ''}
                    onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                    secureTextEntry={field.type === 'password'}
                    keyboardType={field.type === 'email' ? 'email-address' : field.type === 'phone' || field.type === 'number' ? 'phone-pad' : 'default'}
                    autoCapitalize={field.type === 'email' || field.type === 'password' ? 'none' : 'words'}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    {formConfig && addEndpoint && (
                        <TouchableOpacity style={styles.addBtn} onPress={() => { setFormData({}); setModalVisible(true); }}>
                            <Text style={styles.addBtnText}>+ Add New</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>

            <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput 
                    style={styles.search} 
                    value={query} 
                    onChangeText={setQuery} 
                    placeholder="Search by name, email, department..." 
                    placeholderTextColor={COLORS.textLight} 
                />
            </View>

            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, marginTop: 40 }} /> :
                <FlatList
                    data={filtered} 
                    keyExtractor={(item) => item._id || item.id || String(Math.random())}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>✨</Text>
                            <Text style={styles.empty}>{query ? 'No matching records found' : `No ${title.toLowerCase()} found.`}</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item._id || item.id)} disabled={!detailRoute}>
                            <View style={styles.cardContent}>
                                <View style={styles.cardAvatar}>
                                    <Text style={styles.avatarText}>{(item.name || item.routeNumber || item.registerNumber || item.reason || '?').charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.name}>{item.name || item.routeNumber || item.registerNumber || item.reason || 'N/A'}</Text>
                                    <View style={styles.badgeRow}>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{item.hostelname || item.department || item.shift || item.from || item.status || 'Active'}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.sub}>{item.email || item.driverName || 'No email provided'}</Text>
                                    {(item.phone || item.driverPhone) && <Text style={styles.sub2}>{item.phone || item.driverPhone}</Text>}
                                </View>
                            </View>

                            <View style={styles.cardActions}>
                                {detailRoute && (
                                    <View style={styles.viewLink}>
                                        <Text style={styles.viewLinkText}>View →</Text>
                                    </View>
                                )}
                                {deleteEndpoint && (
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id || item.id, item.name || item.routeNumber || 'item')}>
                                        <Text style={styles.deleteBtnText}>🗑️</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                />
            }

            {/* Dynamic Creation Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New {title.replace('Manage ', '')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {formConfig?.map(renderInput)}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Create Record</Text>}
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
    header: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    backBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start', ...SHADOWS.small },
    backText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
    addBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
    
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 16, marginBottom: 8, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    searchIcon: { fontSize: 16, marginRight: 8, color: COLORS.textLight },
    search: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary },

    list: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
    cardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    cardAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 2, borderColor: '#fed7aa' },
    avatarText: { color: '#ea580c', fontSize: 20, fontWeight: '800' },
    cardInfo: { flex: 1 },
    name: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    badgeRow: { flexDirection: 'row', marginBottom: 6 },
    badge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
    badgeText: { color: '#1d4ed8', fontSize: 11, fontWeight: '700' },
    sub: { fontSize: 13, color: COLORS.textMuted },
    sub2: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
    viewLink: { paddingHorizontal: 8 },
    viewLinkText: { color: '#4f46e5', fontSize: 14, fontWeight: '700' },
    deleteBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
    deleteBtnText: { fontSize: 16 },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    empty: { textAlign: 'center', color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', ...SHADOWS.large },
    modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
    closeBtn: { padding: 4 },
    closeBtnText: { fontSize: 24, color: COLORS.textMuted, fontWeight: 'bold' },
    modalBody: { padding: 20 },
    formGroup: { marginBottom: 20 },
    formLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
    formInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: COLORS.white },
    
    selectScroll: { flexDirection: 'row' },
    selectOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', marginRight: 10, backgroundColor: '#f9fafb' },
    selectOptionActive: { backgroundColor: '#4f46e5', borderColor: '#4338ca' },
    selectText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
    selectTextActive: { color: COLORS.white },

    modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 12, backgroundColor: '#f9fafb', paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: COLORS.white },
    cancelBtnText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 15 },
    submitBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#4f46e5', minWidth: 120, alignItems: 'center' },
    submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});

// Extracted Forms Schemas
const staffForm: FormField[] = [
    { label: 'Full Name', key: 'name', type: 'text' },
    { label: 'Email Address', key: 'email', type: 'email' },
    { label: 'Password', key: 'password', type: 'password' },
    { label: 'Department', key: 'department', type: 'select', options: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Admin'] }
];

const wardenForm: FormField[] = [
    { label: 'Full Name', key: 'name', type: 'text' },
    { label: 'Email Address', key: 'email', type: 'email' },
    { label: 'Password', key: 'password', type: 'password' },
    { label: 'Hostel Name', key: 'hostelname', type: 'select', options: ['Boys Hostel 1', 'Boys Hostel 2', 'Girls Hostel 1', 'Girls Hostel 2'] }
];

const securityForm: FormField[] = [
    { label: 'Full Name', key: 'name', type: 'text' },
    { label: 'Email Address', key: 'email', type: 'email' },
    { label: 'Password', key: 'password', type: 'password' },
    { label: 'Shift', key: 'shift', type: 'select', options: ['Morning', 'Evening', 'Night'] }
];

const busForm: FormField[] = [
    { label: 'Route Number', key: 'routeNumber', type: 'text' },
    { label: 'From Location', key: 'from', type: 'text' },
    { label: 'To Location', key: 'to', type: 'text' },
    { label: 'Driver Name', key: 'driverName', type: 'text' },
    { label: 'Driver Phone', key: 'driverPhone', type: 'phone' }
];

export const ManageStaffScreen = () => <AdminManageScreen title="Manage Staff" endpoint="/admin/staff/list" addEndpoint="/admin/staff/add" deleteEndpoint="/admin/staff/delete/:id" detailRoute="StaffDetailsAdmin" fields={['name', 'email', 'department']} formConfig={staffForm} />;
export const ManageWardenScreen = () => <AdminManageScreen title="Manage Wardens" endpoint="/admin/warden/list" addEndpoint="/admin/warden/add" deleteEndpoint="/admin/warden/delete/:id" detailRoute="WardenDetailsAdmin" fields={['name', 'email', 'hostelname']} formConfig={wardenForm} />;
export const ManageYearInchargeScreen = () => <AdminManageScreen title="Year Incharges" endpoint="/admin/incharge/list" addEndpoint="/admin/incharge/add" deleteEndpoint="/admin/incharge/delete/:id" detailRoute="YearInchargeDetailsAdmin" fields={['name', 'email', 'department']} formConfig={staffForm} />;
export const ManageSecurityScreen = () => <AdminManageScreen title="Security Guards" endpoint="/admin/watchman/list" addEndpoint="/admin/watchman/add" deleteEndpoint="/admin/watchman/delete/:id" detailRoute="SecurityDetailsAdmin" fields={['name', 'email', 'shift']} formConfig={securityForm} />;
export const ManageBusScreen = () => <AdminManageScreen title="Bus Routes" endpoint="/admin/bus/list" addEndpoint="/admin/bus/add" deleteEndpoint="/admin/bus/delete/:id" detailRoute="BusDetailsAdmin" fields={['routeNumber', 'driverName']} formConfig={busForm} />;

// We'll leave OutpassAdmin out of this export block since it needs its own complex file matching web
export default ManageStaffScreen;
