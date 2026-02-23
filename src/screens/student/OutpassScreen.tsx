import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { StudentOutpass } from '../../types';
import { COLORS } from '../../constants/config';

const statusColor: Record<string, string> = {
    pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444',
    'staff-approved': '#3b82f6', 'warden-approved': '#8b5cf6',
};

const OutpassScreen = () => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<StudentOutpass[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { fetchOutpasses(); }, []);

    const fetchOutpasses = async () => {
        try {
            const res = await api.get('/api/outpass');
            const data = (res.data.outpasses || res.data || []).sort((a: StudentOutpass, b: StudentOutpass) =>
                a.outpassType === 'emergency' ? -1 : b.outpassType === 'emergency' ? 1 : 0
            );
            setOutpasses(data);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch outpasses' }); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const getStatusLabel = (status: string) => ({
        pending: '⏳ Pending', approved: '✅ Approved', rejected: '❌ Rejected',
        'staff-approved': '👍 Staff Approved', 'warden-approved': '🏠 Warden Approved',
    }[status] || status);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📝 My Outpass Requests</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NewOutpass')}>
                    <Text style={styles.addText}>+ New</Text>
                </TouchableOpacity>
            </View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <FlatList
                    data={outpasses}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No outpass requests yet.</Text>}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOutpasses(); }} />}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={[styles.card, item.outpassType === 'emergency' && styles.emergencyCard]}>
                            {item.outpassType === 'emergency' && <Text style={styles.emergencyBadge}>🚨 EMERGENCY</Text>}
                            <View style={styles.cardHeader}>
                                <Text style={styles.type}>{item.outpassType || 'Regular'}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: statusColor[item.status] || '#6b7280' }]}>
                                    <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                                </View>
                            </View>
                            <Text style={styles.reason}>{item.reason}</Text>
                            <Text style={styles.date}>📅 {new Date(item.fromDate).toLocaleDateString()} → {new Date(item.toDate).toLocaleDateString()}</Text>
                        </View>
                    )}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    addText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    list: { padding: 16, gap: 12 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    emergencyCard: { borderLeftWidth: 4, borderLeftColor: COLORS.danger },
    emergencyBadge: { fontSize: 11, fontWeight: '800', color: COLORS.danger, marginBottom: 6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    type: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textTransform: 'capitalize' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
    reason: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8, lineHeight: 20 },
    date: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export default OutpassScreen;
