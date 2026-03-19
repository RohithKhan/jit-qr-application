import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../constants/config';

interface Props { role: 'warden' | 'year-incharge'; endpoint: string; color: string; }

const OutpassApprovalList = ({ role, endpoint, color }: Props) => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const themeColor = role === 'warden' ? '#0047AB' : color;

    useEffect(() => { fetchOutpasses(); }, []);

    const fetchOutpasses = async () => {
        try {
            const res = await api.get(endpoint);
            const allData = res.data.outpasses || res.data.data || res.data.students || res.data || [];
            
            const pendingData = allData.filter((item: any) => {
                const ws = (item.wardenapprovalstatus || item.status || '').toLowerCase();
                return ws !== 'approved' && ws !== 'rejected' && ws !== 'declined';
            }).sort((a: any, b: any) => {
                const isAEmergency = a.outpassType?.toLowerCase() === 'emergency' || a.type?.toLowerCase() === 'emergency' || a.outpasstype?.toLowerCase() === 'emergency';
                const isBEmergency = b.outpassType?.toLowerCase() === 'emergency' || b.type?.toLowerCase() === 'emergency' || b.outpasstype?.toLowerCase() === 'emergency';
                if (isAEmergency && !isBEmergency) return -1;
                if (!isAEmergency && isBEmergency) return 1;

                return new Date(b.createdAt || b.outDate || Date.now()).getTime() - new Date(a.createdAt || a.outDate || Date.now()).getTime();
            });

            setOutpasses(pendingData);
        } catch { 
            Toast.show({ type: 'error', text1: 'Failed to fetch pending requests' }); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { backgroundColor: COLORS.white }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity 
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                // @ts-ignore
                                document.activeElement?.blur?.();
                            }
                            navigation.goBack();
                        }} 
                        style={styles.backBtn}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerTitle}>Pending Outpass Students</Text>
            </View>

            {loading ? <ActivityIndicator size="large" color={themeColor} style={{ flex: 1 }} /> :
                <FlatList
                    data={outpasses} 
                    keyExtractor={(item, index) => item._id || item.id || String(index)}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>✨</Text>
                            <Text style={styles.empty}>No pending outpasses</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const student = item.studentid || item.studentId || {};
                        const isEmergency = item.outpassType?.toLowerCase() === 'emergency' || item.outpasstype?.toLowerCase() === 'emergency' || item.type?.toLowerCase() === 'emergency';
                        
                        return (
                            <View style={styles.card}>
                                <View style={styles.cardBadge}>
                                    <Text style={styles.cardBadgeText}>{student.registerNumber || item.register_number || item.department || 'N/A'}</Text>
                                </View>
                                
                                <Text style={styles.cardName}>
                                    {student.name || item.studentName || item.name || 'Unknown'}
                                </Text>
                                
                                <Text style={styles.cardDetails}>
                                    {student.year ? `Year ${student.year} • ` : ''}
                                    {item.outpasstype || item.outpassType || 'General'} • 
                                    Applied on {new Date(item.createdAt || item.outDate || Date.now()).toLocaleDateString()}
                                </Text>
                                
                                {isEmergency && (
                                    <View style={styles.emergencyBadge}>
                                        <Text style={styles.emergencyText}>🚨 EMERGENCY</Text>
                                    </View>
                                )}

                                <View style={styles.cardFooter}>
                                    <View style={styles.statusPill}>
                                        <Text style={styles.statusPillText}>• Pending</Text>
                                    </View>
                                    
                                    <TouchableOpacity 
                                        style={styles.viewLinkRow}
                                        onPress={() => {
                                            if (Platform.OS === 'web') {
                                                // @ts-ignore
                                                document.activeElement?.blur?.();
                                            }
                                            const sId = item.studentID || item.studentId?._id || item.studentid?._id || item.id || item._id;
                                            const outpassId = item._id || item.id;
                                            if (outpassId && role === 'warden') {
                                                navigation.navigate('WardenStudentView', { outpassId: outpassId });
                                            } else if (sId && role === 'year-incharge') {
                                                navigation.navigate('StudentDetails', { studentId: sId });
                                            }
                                        }}
                                    >
                                        <Text style={styles.viewLinkText}>View →</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    backText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.primaryDark },
    list: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
    cardBadge: { backgroundColor: COLORS.primary, paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
    cardBadgeText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
    cardName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    cardDetails: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
    emergencyBadge: { backgroundColor: '#fee2e2', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ef4444', marginBottom: 16 },
    emergencyText: { color: '#ef4444', fontSize: 10, fontWeight: '700' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
    statusPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
    statusPillText: { fontSize: 14, fontWeight: '700', color: '#d97706' },
    viewLinkRow: { flexDirection: 'row', alignItems: 'center' },
    viewLinkText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    empty: { textAlign: 'center', color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
});

// Warden pending outpass screen
export const WardenPendingOutpassScreen = () => (
    <OutpassApprovalList role="warden" endpoint="/warden/outpass/list" color="#1a6b4a" />
);

// Year Incharge pending outpass screen
export const YIPendingOutpassScreen = () => (
    <OutpassApprovalList role="year-incharge" endpoint="/year-incharge/outpass/pending" color="#7c3aed" />
);

export default OutpassApprovalList;
