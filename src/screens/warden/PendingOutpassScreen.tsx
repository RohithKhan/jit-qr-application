import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Image, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { StudentOutpass } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';

interface Props { role: 'warden' | 'year-incharge'; endpoint: string; approveEndpoint: string; rejectEndpoint: string; color: string; }

const OutpassApprovalList = ({ role, endpoint, approveEndpoint, rejectEndpoint, color }: Props) => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<StudentOutpass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchOutpasses(); }, []);

    const fetchOutpasses = async () => {
        try {
            const res = await api.get(endpoint);
            const data = (res.data.outpasses || res.data || []).sort((a: StudentOutpass, b: StudentOutpass) =>
                a.outpassType === 'emergency' ? -1 : b.outpassType === 'emergency' ? 1 : 0
            );
            setOutpasses(data);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch requests' }); }
        finally { setLoading(false); }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        Alert.alert(`${action === 'approve' ? 'Approve' : 'Reject'}?`, 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: action === 'approve' ? 'Approve' : 'Reject', style: action === 'reject' ? 'destructive' : 'default', onPress: async () => {
                    try {
                        const ep = action === 'approve' ? approveEndpoint.replace(':id', id) : rejectEndpoint.replace(':id', id);
                        await api.put(ep);
                        Toast.show({ type: 'success', text1: `Outpass ${action}d!` });
                        fetchOutpasses();
                    } catch { Toast.show({ type: 'error', text1: `Failed to ${action}` }); }
                }
            }
        ]);
    };

    const getPhoto = (item: StudentOutpass) => {
        const p = item.studentId?.photo;
        if (!p) return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.studentId?.name || 'S')}&background=0047AB&color=fff`;
        return p.startsWith('http') ? p : `${CDN_URL}${p}`;
    };

    return (
        <SafeAreaView style={[styles.container]}>
            <View style={[styles.header, { backgroundColor: color }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Outpass ({outpasses.length})</Text>
            </View>
            {loading ? <ActivityIndicator size="large" color={color} style={{ flex: 1 }} /> :
                <FlatList
                    data={outpasses} keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No pending outpass requests.</Text>}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={[styles.card, item.outpassType === 'emergency' && styles.emergency]}>
                            {item.outpassType === 'emergency' && <Text style={styles.emergencyTag}>🚨 EMERGENCY</Text>}
                            <View style={styles.row}>
                                <Image source={{ uri: getPhoto(item) }} style={styles.avatar} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.name}>{item.studentId?.name}</Text>
                                    <Text style={styles.sub}>{item.studentId?.registerNumber} • {item.studentId?.year}</Text>
                                    <Text style={styles.sub}>{item.studentId?.department}</Text>
                                </View>
                            </View>
                            <Text style={styles.reasonLabel}>Reason:</Text>
                            <Text style={styles.reason}>{item.reason}</Text>
                            <Text style={styles.date}>📅 {new Date(item.fromDate).toLocaleDateString()} → {new Date(item.toDate).toLocaleDateString()}</Text>
                            <View style={styles.btnRow}>
                                <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(item._id, 'approve')}><Text style={styles.approveTxt}>✅ Approve</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(item._id, 'reject')}><Text style={styles.rejectTxt}>❌ Reject</Text></TouchableOpacity>
                            </View>
                        </View>
                    )}
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
    list: { padding: 14, gap: 14 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 2 },
    emergency: { borderLeftWidth: 4, borderLeftColor: COLORS.danger },
    emergencyTag: { fontSize: 11, fontWeight: '800', color: COLORS.danger, marginBottom: 8 },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
    avatar: { width: 52, height: 52, borderRadius: 26 },
    name: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    sub: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    reasonLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },
    reason: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 8, lineHeight: 20 },
    date: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 12 },
    btnRow: { flexDirection: 'row', gap: 10 },
    approveBtn: { flex: 1, backgroundColor: COLORS.success, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    approveTxt: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    rejectBtn: { flex: 1, backgroundColor: COLORS.danger, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    rejectTxt: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

// Warden pending outpass screen
export const WardenPendingOutpassScreen = () => (
    <OutpassApprovalList role="warden" endpoint="/warden/outpass/pending" approveEndpoint="/warden/outpass/:id/approve" rejectEndpoint="/warden/outpass/:id/reject" color="#1a6b4a" />
);

// Year Incharge pending outpass screen
export const YIPendingOutpassScreen = () => (
    <OutpassApprovalList role="year-incharge" endpoint="/year-incharge/outpass/pending" approveEndpoint="/year-incharge/outpass/:id/approve" rejectEndpoint="/year-incharge/outpass/:id/reject" color="#7c3aed" />
);

export default OutpassApprovalList;
