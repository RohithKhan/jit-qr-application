import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { StudentOutpass } from '../../types';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';

interface Props { endpoint: string; color: string; role?: string; }

const OutpassHistoryList = ({ endpoint, color, role }: Props) => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Approved' | 'Rejected'>('All');

    const themeColor = role === 'warden' ? '#0047AB' : color;

    useEffect(() => { fetchOutpasses(); }, []);

    const fetchOutpasses = async () => {
        try {
            const res = await api.get(endpoint);
            const outpassData = res.data.outpasses || res.data.data || res.data || [];
            const list = Array.isArray(outpassData) ? outpassData : [];
            
            const sortedList = list.sort((a: any, b: any) => {
                const isAEmergency = a.outpassType?.toLowerCase() === 'emergency' || a.type?.toLowerCase() === 'emergency';
                const isBEmergency = b.outpassType?.toLowerCase() === 'emergency' || b.type?.toLowerCase() === 'emergency';
                if (isAEmergency && !isBEmergency) return -1;
                if (!isAEmergency && isBEmergency) return 1;

                return new Date(b.createdAt || b.outDate || Date.now()).getTime() - new Date(a.createdAt || a.outDate || Date.now()).getTime();
            });
            
            setOutpasses(sortedList);
        } catch { 
            Toast.show({ type: 'error', text1: 'Failed to load outpass list' }); 
        } finally { 
            setLoading(false); 
        }
    };

    const capitalize = (str: any) => {
        if (!str) return 'Pending';
        const s = String(str);
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };

    const getPhoto = (item: any) => {
        const student = item.studentid || item.studentId || item;
        const p = student?.photo;
        if (!p) return `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'S')}&background=0047AB&color=fff`;
        return p.startsWith('http') ? p : `${CDN_URL}${p}`;
    };

    const filteredOutpasses = useMemo(() => {
        return outpasses.filter((item) => {
            const approvalStatus = (item.wardenapprovalstatus || item.status || '').toLowerCase();
            if (filterStatus === 'All') return approvalStatus === 'approved' || approvalStatus === 'rejected' || approvalStatus === 'declined' || approvalStatus === 'pending';
            if (filterStatus === 'Approved') return approvalStatus === 'approved';
            if (filterStatus === 'Rejected') return approvalStatus === 'rejected' || approvalStatus === 'declined';
            return true;
        });
    }, [outpasses, filterStatus]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <View style={styles.tabs}>
                        {['All', 'Approved', 'Rejected'].map((tab) => (
                            <TouchableOpacity 
                                key={tab}
                                style={[styles.tabBtn, filterStatus === tab && styles.tabActive]}
                                onPress={() => setFilterStatus(tab as any)}
                            >
                                <Text style={[styles.tabText, filterStatus === tab && styles.tabTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <Text style={styles.headerTitle}>Outpass List</Text>
            </View>

            {loading ? <ActivityIndicator size="large" color={themeColor} style={{ flex: 1 }} /> :
                <FlatList
                    data={filteredOutpasses}
                    keyExtractor={(item, index) => item._id || item.id || String(index)}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📂</Text>
                            <Text style={styles.empty}>No outpasses found</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const student = item.studentid || item.studentId || {};
                        const isEmergency = item.outpassType?.toLowerCase() === 'emergency' || item.type?.toLowerCase() === 'emergency';
                        const status = (item.status || item.wardenapprovalstatus || 'pending').toLowerCase();
                        const isRejected = status === 'rejected' || status === 'declined';
                        
                        return (
                            <View style={styles.card}>
                                <View style={styles.cardBadge}>
                                    <Text style={styles.cardBadgeText}>{student.registerNumber || item.register_number || 'N/A'}</Text>
                                </View>
                                
                                <Text style={styles.cardName}>{student.name || item.studentName || 'Unknown'}</Text>
                                
                                <Text style={styles.cardDetails}>
                                    {student.year ? `Year ${student.year} • ` : ''}
                                    Applied on {new Date(item.createdAt || item.outDate).toLocaleDateString()}
                                </Text>
                                
                                {isEmergency && (
                                    <View style={styles.emergencyBadge}>
                                        <Text style={styles.emergencyText}>🚨 EMERGENCY</Text>
                                    </View>
                                )}

                                {role === 'watchman' ? (
                                    <View style={styles.cardFooterGrid}>
                                        <View style={[styles.statusBadgeMobile, (styles as any)[`status${capitalize(item.staffapprovalstatus || 'Pending')}`]]}>
                                            <Text style={[styles.statusBadgeText, (styles as any)[`statusText${capitalize(item.staffapprovalstatus || 'Pending')}`]]}>Staff: {capitalize(item.staffapprovalstatus)}</Text>
                                        </View>
                                        <View style={[styles.statusBadgeMobile, (styles as any)[`status${capitalize(item.yearinchargeapprovalstatus || 'Pending')}`]]}>
                                            <Text style={[styles.statusBadgeText, (styles as any)[`statusText${capitalize(item.yearinchargeapprovalstatus || 'Pending')}`]]}>Incharge: {capitalize(item.yearinchargeapprovalstatus)}</Text>
                                        </View>
                                        {student?.residencetype?.toLowerCase() !== 'dayscholar' && (
                                            <View style={[styles.statusBadgeMobile, (styles as any)[`status${capitalize(item.wardenapprovalstatus || 'Pending')}`]]}>
                                                <Text style={[styles.statusBadgeText, (styles as any)[`statusText${capitalize(item.wardenapprovalstatus || 'Pending')}`]]}>Warden: {capitalize(item.wardenapprovalstatus)}</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View style={styles.cardFooter}>
                                        <View style={[styles.statusPill, isRejected ? styles.statusRejected : styles.statusApproved]}>
                                            <Text style={[styles.statusPillText, isRejected ? styles.statusTextRejected : styles.statusTextApproved]}>
                                                • {capitalize(status)}
                                            </Text>
                                        </View>
                                        
                                        <TouchableOpacity 
                                            style={styles.viewLinkRow}
                                            onPress={() => {
                                                const sId = item.studentID || item.studentId?._id || item.studentid?._id || item.id || item._id;
                                                const outpassId = item._id || item.id;
                                                if (outpassId) {
                                                    if (role === 'warden') {
                                                        navigation.navigate('WardenStudentView', { outpassId: outpassId });
                                                    } else if (role === 'watchman') {
                                                        navigation.navigate('WatchmanStudentView', { outpassId: outpassId });
                                                    }
                                                }
                                            }}
                                        >
                                            <Text style={styles.viewLinkText}>View →</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {role === 'watchman' && (
                                    <TouchableOpacity 
                                        style={[styles.viewLinkRow, { alignSelf: 'flex-end', marginTop: 12 }]}
                                        onPress={() => {
                                            const outpassId = item._id || item.id;
                                            if (outpassId) navigation.navigate('WatchmanStudentView', { outpassId: outpassId });
                                        }}
                                    >
                                        <Text style={styles.viewLinkText}>View Details →</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    }}
                    showsVerticalScrollIndicator={false}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
    backBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    backText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: '600' },
    tabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
    tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    tabActive: { backgroundColor: COLORS.white, ...SHADOWS.small },
    tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: COLORS.primaryDark },
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
    statusPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    statusApproved: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
    statusRejected: { backgroundColor: '#fee2e2', borderColor: '#f87171' },
    statusPending: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
    statusDeclined: { backgroundColor: '#fee2e2', borderColor: '#f87171' },
    statusPillText: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
    statusTextApproved: { color: '#166534' },
    statusTextRejected: { color: '#991b1b' },
    statusTextPending: { color: '#92400e' },
    statusTextDeclined: { color: '#991b1b' },
    cardFooterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
    statusBadgeMobile: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    viewLinkRow: { flexDirection: 'row', alignItems: 'center' },
    viewLinkText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    empty: { textAlign: 'center', color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
});

export const WardenOutpassListScreen = () => <OutpassHistoryList endpoint="/warden/outpass/list/all" color="#1a6b4a" role="warden" />;
export const WatchmanOutpassListScreen = () => <OutpassHistoryList endpoint="/watchman/outpass/list" color="#4a3728" role="watchman" />;
export const YIOutpassListScreen = () => <OutpassHistoryList endpoint="/year-incharge/outpass/all" color="#7c3aed" />;

export default OutpassHistoryList;
