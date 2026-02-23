import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS } from '../../constants/config';

interface AdminListScreenProps { title: string; endpoint: string; deleteEndpoint?: string; fields: string[]; }

const AdminManageScreen = ({ title, endpoint, deleteEndpoint, fields }: AdminListScreenProps) => {
    const navigation = useNavigation<any>();
    const [items, setItems] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        setFiltered(items.filter((item: any) =>
            fields.some(f => String(item[f] || '').toLowerCase().includes(query.toLowerCase()))
        ));
    }, [query, items]);

    const fetchData = async () => {
        try {
            const res = await api.get(endpoint);
            const data = res.data.staff || res.data.wardens || res.data.yearIncharges || res.data.security || res.data.bus || res.data.outpasses || res.data || [];
            setItems(data); setFiltered(data);
        } catch { Toast.show({ type: 'error', text1: `Failed to load ${title}` }); }
        finally { setLoading(false); }
    };

    const handleDelete = (id: string, name: string) => {
        if (!deleteEndpoint) return;
        Alert.alert('Delete', `Delete ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(deleteEndpoint.replace(':id', id));
                        Toast.show({ type: 'success', text1: 'Deleted successfully!' });
                        fetchData();
                    } catch { Toast.show({ type: 'error', text1: 'Delete failed' }); }
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <View style={styles.searchBox}>
                <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search..." placeholderTextColor={COLORS.textLight} />
            </View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <FlatList
                    data={filtered} keyExtractor={(item) => item._id || item.id || String(Math.random())}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No records found.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{item.name || item.routeNumber || item.registerNumber || item.reason || 'N/A'}</Text>
                                <Text style={styles.sub}>{item.email || item.department || item.status || ''}</Text>
                                {item.phone && <Text style={styles.sub2}>{item.phone}</Text>}
                            </View>
                            {deleteEndpoint && (
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id || item.id, item.name || 'item')}>
                                    <Text style={styles.deleteBtnText}>🗑️</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 14 },
    backText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
    searchBox: { padding: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    search: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1.5, borderColor: COLORS.border, color: COLORS.textPrimary },
    list: { padding: 14, gap: 10 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    sub: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
    sub2: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
    deleteBtn: { padding: 10 },
    deleteBtnText: { fontSize: 20 },
    empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export const ManageStaffScreen = () => <AdminManageScreen title="Manage Staff" endpoint="/admin/staff" deleteEndpoint="/admin/staff/:id" fields={['name', 'email', 'department']} />;
export const ManageWardenScreen = () => <AdminManageScreen title="Manage Wardens" endpoint="/admin/wardens" deleteEndpoint="/admin/wardens/:id" fields={['name', 'email']} />;
export const ManageYearInchargeScreen = () => <AdminManageScreen title="Year Incharge" endpoint="/admin/year-incharge" deleteEndpoint="/admin/year-incharge/:id" fields={['name', 'email', 'department']} />;
export const ManageSecurityScreen = () => <AdminManageScreen title="Security / Watchman" endpoint="/admin/security" deleteEndpoint="/admin/security/:id" fields={['name', 'email']} />;
export const ManageBusScreen = () => <AdminManageScreen title="Bus Routes" endpoint="/api/bus/routes" fields={['routeNumber', 'name']} />;
export const OutpassAdminScreen = () => <AdminManageScreen title="All Outpasses" endpoint="/admin/outpasses" fields={['reason', 'status']} />;

export default AdminManageScreen;
