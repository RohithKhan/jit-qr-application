import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { StudentOutpass } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';

const PassApprovalScreen = () => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<StudentOutpass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchOutpasses(); }, []);

    const fetchOutpasses = async () => {
        try {
            const res = await api.get('/staff/outpass/pending');
            const data = (res.data.outpasses || res.data || []).sort((a: StudentOutpass, b: StudentOutpass) =>
                a.outpassType === 'emergency' ? -1 : b.outpassType === 'emergency' ? 1 : 0
            );
            setOutpasses(data);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch requests' }); }
        finally { setLoading(false); }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        Alert.alert(`${action === 'approve' ? 'Approve' : 'Reject'} Outpass`, 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: action === 'approve' ? 'Approve' : 'Reject',
                style: action === 'reject' ? 'destructive' : 'default',
                onPress: async () => {
                    try {
                        await api.put(`/staff/outpass/${id}/${action}`);
                        Toast.show({ type: 'success', text1: `Outpass ${action}d successfully!` });
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Pass Approval ({outpasses.length})</Text>
            </View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <FlatList
                    data={outpasses}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No pending requests.</Text>}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={[styles.card, item.outpassType === 'emergency' && styles.emergencyCard]}>
                            {item.outpassType === 'emergency' && <Text style={styles.emergencyTag}>🚨 EMERGENCY</Text>}
                            <View style={styles.cardHeader}>
                                <Image source={{ uri: getPhoto(item) }} style={styles.avatar} />
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{item.studentId?.name}</Text>
                                    <Text style={styles.studentDetails}>{item.studentId?.registerNumber} • {item.studentId?.year}</Text>
                                    <Text style={styles.studentDetails}>{item.studentId?.department}</Text>
                                </View>
                            </View>
                            <Text style={styles.reasonLabel}>Reason:</Text>
                            <Text style={styles.reason}>{item.reason}</Text>
                            <Text style={styles.date}>📅 {new Date(item.fromDate).toLocaleDateString()} → {new Date(item.toDate).toLocaleDateString()}</Text>
                            <View style={styles.btnRow}>
                                <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(item._id, 'approve')}>
                                    <Text style={styles.approveBtnText}>✅ Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(item._id, 'reject')}>
                                    <Text style={styles.rejectBtnText}>❌ Reject</Text>
                                </TouchableOpacity>
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
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
    backBtn: { padding: 4 },
    backText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    list: { padding: 14, gap: 16 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 2 },
    emergencyCard: { borderLeftWidth: 4, borderLeftColor: COLORS.danger },
    emergencyTag: { fontSize: 11, fontWeight: '800', color: COLORS.danger, marginBottom: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    avatar: { width: 52, height: 52, borderRadius: 26 },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    studentDetails: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    reasonLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },
    reason: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 8, lineHeight: 20 },
    date: { fontSize: 12, color: COLORS.textLight, fontWeight: '600', marginBottom: 14 },
    btnRow: { flexDirection: 'row', gap: 10 },
    approveBtn: { flex: 1, backgroundColor: COLORS.success, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    approveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    rejectBtn: { flex: 1, backgroundColor: COLORS.danger, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    rejectBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export default PassApprovalScreen;
