import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { StudentOutpass } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';

interface Props { endpoint: string; color: string; }

const OutpassHistoryList = ({ endpoint, color }: Props) => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<StudentOutpass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchOutpasses(); }, []);
    const fetchOutpasses = async () => {
        try {
            const res = await api.get(endpoint);
            setOutpasses(res.data.outpasses || res.data || []);
        } catch { Toast.show({ type: 'error', text1: 'Failed to load outpass list' }); }
        finally { setLoading(false); }
    };

    const statusColor: Record<string, string> = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', 'staff-approved': '#3b82f6', 'warden-approved': '#8b5cf6' };

    const getPhoto = (item: StudentOutpass) => {
        const p = item.studentId?.photo;
        if (!p) return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.studentId?.name || 'S')}&background=0047AB&color=fff`;
        return p.startsWith('http') ? p : `${CDN_URL}${p}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { backgroundColor: color }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>All Outpasses</Text>
            </View>
            {loading ? <ActivityIndicator size="large" color={color} style={{ flex: 1 }} /> :
                <FlatList
                    data={outpasses} keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No outpasses found.</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.row}>
                                <Image source={{ uri: getPhoto(item) }} style={styles.avatar} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.name}>{item.studentId?.name}</Text>
                                    <Text style={styles.sub}>{item.studentId?.registerNumber}</Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: statusColor[item.status] || '#6b7280' }]}>
                                    <Text style={styles.badgeTxt}>{item.status}</Text>
                                </View>
                            </View>
                            <Text style={styles.reason}>{item.reason}</Text>
                            <Text style={styles.date}>📅 {new Date(item.fromDate).toLocaleDateString()} → {new Date(item.toDate).toLocaleDateString()}</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    backText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
    list: { padding: 14, gap: 12 },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    name: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    sub: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeTxt: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
    reason: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6, lineHeight: 20 },
    date: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
    empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export const WardenOutpassListScreen = () => <OutpassHistoryList endpoint="/warden/outpass/all" color="#1a6b4a" />;
export const WatchmanOutpassListScreen = () => <OutpassHistoryList endpoint="/watchman/outpass/all" color="#4a3728" />;
export const YIOutpassListScreen = () => <OutpassHistoryList endpoint="/year-incharge/outpass/all" color="#7c3aed" />;

export default OutpassHistoryList;
