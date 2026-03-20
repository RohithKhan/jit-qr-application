import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, 
    TextInput, Platform, Image, Modal, Linking, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';

interface Props { endpoint: string; color: string; role?: string; }

// Date Filter Types
type DateFilter = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month';

const OutpassHistoryList = ({ endpoint, color, role }: Props) => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters and Search
    const [filterStatus, setFilterStatus] = useState<'All' | 'Approved' | 'Rejected'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');

    // Document Modal State
    const [showDocModal, setShowDocModal] = useState(false);
    const [docUrl, setDocUrl] = useState<string | null>(null);

    const themeColor = role === 'warden' ? '#0047AB' : color;

    useFocusEffect(
        useCallback(() => {
            fetchOutpasses();
        }, [])
    );

    const fetchOutpasses = async () => {
        try {
            const res = await api.get(endpoint);
            console.log("Outpass List API Response:", res.data);
            const rawData = res.data.outpasses || res.data.filterOutpass || res.data.outpass || res.data.data || res.data.students || res.data || [];
            let list = Array.isArray(rawData) ? rawData : [];
            
            if (role === 'watchman') {
                list = list.filter((item: any) => {
                    const resType = (item.studentid?.residencetype || '').toLowerCase().trim().replace(/\s/g, '');
                    const isDayScholar = resType === 'dayscholar';
                    if (isDayScholar) {
                        return (item.yearinchargeapprovalstatus || '').toLowerCase() === 'approved';
                    }
                    return (item.wardenapprovalstatus || '').toLowerCase() === 'approved';
                });
            }
            
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

    // --- Filtering Logic ---
    const filteredOutpasses = useMemo(() => {
        let result = outpasses;

        // 1. Status Filter (Warden/Incharge)
        if (role !== 'watchman') {
            result = result.filter((item) => {
                const approvalStatus = (item.wardenapprovalstatus || item.status || '').toLowerCase();
                if (filterStatus === 'All') return approvalStatus === 'approved' || approvalStatus === 'rejected' || approvalStatus === 'declined' || approvalStatus === 'pending';
                if (filterStatus === 'Approved') return approvalStatus === 'approved';
                if (filterStatus === 'Rejected') return approvalStatus === 'rejected' || approvalStatus === 'declined';
                return true;
            });
        }

        // 2. Search Filter (Name, RegNo, Date)
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter((item) => {
                const student = item.studentid || item.studentId || item || {};
                const name = (student.name || item.studentName || '').toLowerCase();
                const regNo = (student.registerNumber || item.register_number || '').toLowerCase();
                const appliedDate = new Date(item.createdAt || item.outDate || Date.now());
                const dateStr = appliedDate.toLocaleDateString();
                
                return name.includes(query) || regNo.includes(query) || dateStr.includes(query);
            });
        }

        // 3. Date Filter
        if (dateFilter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            result = result.filter(item => {
                const appliedDate = new Date(item.createdAt || item.outDate || Date.now());
                
                if (dateFilter === 'today') return appliedDate >= today;
                if (dateFilter === 'yesterday') {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    return appliedDate >= yesterday && appliedDate < today;
                }
                if (dateFilter === 'this_week') {
                    const thisWeek = new Date(today);
                    thisWeek.setDate(today.getDate() - today.getDay());
                    return appliedDate >= thisWeek;
                }
                if (dateFilter === 'this_month') {
                    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    return appliedDate >= thisMonth;
                }
                return true;
            });
        }

        return result;
    }, [outpasses, filterStatus, role, searchQuery, dateFilter]);

    // --- Document Viewer ---
    const handleViewDocument = async (url: string) => {
        const fullUrl = url.startsWith('http') ? url : `${CDN_URL}${url.replace(/^\//, '')}`;
        if (fullUrl.toLowerCase().endsWith('.pdf')) {
            try {
                const supported = await Linking.canOpenURL(fullUrl);
                if (supported) {
                    await Linking.openURL(fullUrl);
                } else {
                    Toast.show({ type: 'error', text1: 'Cannot open PDF from this device' });
                }
            } catch (err) {
                Toast.show({ type: 'error', text1: 'Error opening document' });
            }
        } else {
            setDocUrl(fullUrl);
            setShowDocModal(true);
        }
    };

    const DatePill = ({ id, label }: { id: DateFilter; label: string }) => (
        <TouchableOpacity 
            style={[styles.filterPill, dateFilter === id && { backgroundColor: themeColor, borderColor: themeColor }]}
            onPress={() => setDateFilter(id)}
        >
            <Text style={[styles.filterText, dateFilter === id && { color: COLORS.white }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    {role !== 'watchman' && (
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
                    )}
                </View>
                <Text style={styles.headerTitle}>Outpass List</Text>
                
                {/* Search Bar */}
                <View style={[styles.searchContainer, { borderColor: themeColor + '40' }]}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search name, reg no, date..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={COLORS.textMuted}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Date Filters Horizontal scroll */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingVertical: 12, gap: 10 }}
                >
                    <DatePill id="all" label="All Time" />
                    <DatePill id="today" label="Today" />
                    <DatePill id="yesterday" label="Yesterday" />
                    <DatePill id="this_week" label="This Week" />
                    <DatePill id="this_month" label="This Month" />
                </ScrollView>
            </View>
            
            {loading ? <ActivityIndicator size="large" color={themeColor} style={{ flex: 1, marginTop: 40 }} /> :
                <FlatList
                    data={filteredOutpasses}
                    keyExtractor={(item, index) => item._id || item.id || String(index)}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📂</Text>
                            <Text style={styles.empty}>
                                {searchQuery || dateFilter !== 'all' ? 'No matches found' : 'No outpasses found'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const student = item.studentid || item.studentId || {};
                        const isEmergency = item.outpassType?.toLowerCase() === 'emergency' || item.type?.toLowerCase() === 'emergency';
                        const status = (item.status || item.wardenapprovalstatus || 'pending').toLowerCase();
                        const isRejected = status === 'rejected' || status === 'declined';
                        const documentAttached = item.proof || item.document || item.file || item.outpassdoc;
                        
                        return (
                            <View style={styles.card}>
                                <LinearGradient 
                                    colors={['#2563eb', '#1e40af']} 
                                    start={{ x: 0, y: 0 }} 
                                    end={{ x: 1, y: 1 }}
                                    style={styles.cardBadge}
                                >
                                    <Text style={styles.cardBadgeText}>{student.registerNumber || item.register_number || 'N/A'}</Text>
                                </LinearGradient>
                                
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
                                        {/* Watchman Document Viewer */}
                                        {documentAttached && (
                                            <TouchableOpacity 
                                                style={[styles.docBtn, { marginLeft: 'auto' }]}
                                                onPress={() => handleViewDocument(documentAttached)}
                                            >
                                                <Text style={styles.docBtnText}>📄 Doc</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    <View style={styles.cardFooter}>
                                        <View style={styles.footerActions}>
                                            <View style={[styles.statusPill, isRejected ? styles.statusRejected : styles.statusApproved]}>
                                                <Text style={[styles.statusPillText, isRejected ? styles.statusTextRejected : styles.statusTextApproved]}>
                                                    • {capitalize(status)}
                                                </Text>
                                            </View>
                                            
                                            {/* View Document Inline Button */}
                                            {documentAttached && (
                                                <TouchableOpacity 
                                                    style={styles.docBtn}
                                                    onPress={() => handleViewDocument(documentAttached)}
                                                >
                                                    <Text style={styles.docBtnText}>📄 Doc</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        
                                        <TouchableOpacity 
                                            style={styles.viewLinkRow}
                                            onPress={() => {
                                                const outpassId = item._id || item.id;
                                                const studentId = item.studentID || item.studentId?._id || item.studentid?._id;
                                                
                                                if (outpassId) {
                                                    if (role === 'warden') {
                                                        navigation.navigate('WardenStudentView', { outpassId: outpassId });
                                                    } else if (role === 'yearincharge' && studentId) {
                                                        navigation.navigate('StudentDetails', { studentId: studentId });
                                                    }
                                                }
                                            }}
                                        >
                                            <Text style={[styles.viewLinkText, { color: themeColor }]}>View →</Text>
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
                                        <Text style={[styles.viewLinkText, { color: themeColor }]}>View Details →</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    }}
                    showsVerticalScrollIndicator={false}
                />
            }

            {/* Document Modal */}
            <Modal visible={showDocModal} transparent={true} animationType="fade" onRequestClose={() => setShowDocModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Supporting Document</Text>
                            <TouchableOpacity onPress={() => setShowDocModal(false)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.imageContainer}>
                            {docUrl && <Image source={{ uri: docUrl }} style={styles.docImage} resizeMode="contain" />}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    
    // Header
    header: { padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 },
    backBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    backText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
    tabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
    tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    tabActive: { backgroundColor: COLORS.white, ...SHADOWS.small },
    tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: COLORS.primaryDark },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
    
    // Search and Filters
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, marginTop: 12, borderWidth: 1 },
    searchIcon: { fontSize: 16, marginRight: 8, color: COLORS.textLight },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary },
    clearBtn: { padding: 6, backgroundColor: '#e2e8f0', borderRadius: 12 },
    clearBtnText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '900' },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
    filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

    // List
    list: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
    cardBadge: { paddingVertical: 6, borderRadius: 8, alignItems: 'center', marginBottom: 14 },
    cardBadgeText: { color: COLORS.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    cardName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    cardDetails: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
    emergencyBadge: { backgroundColor: '#fee2e2', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ef4444', marginBottom: 16 },
    emergencyText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
    footerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    statusApproved: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
    statusRejected: { backgroundColor: '#fee2e2', borderColor: '#f87171' },
    statusPending: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
    statusDeclined: { backgroundColor: '#fee2e2', borderColor: '#f87171' },
    statusPillText: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
    statusTextApproved: { color: '#166534' },
    statusTextRejected: { color: '#991b1b' },
    statusTextPending: { color: '#92400e' },
    statusTextDeclined: { color: '#991b1b' },
    
    // Document Button
    docBtn: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    docBtnText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },

    // Watchman Extra Grids
    cardFooterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, alignItems: 'center' },
    statusBadgeMobile: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    
    viewLinkRow: { flexDirection: 'row', alignItems: 'center' },
    viewLinkText: { fontSize: 14, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    empty: { textAlign: 'center', color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', height: '80%', backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
    closeBtn: { padding: 4 },
    closeBtnText: { fontSize: 20, color: COLORS.textMuted, fontWeight: '800' },
    imageContainer: { flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    docImage: { width: '100%', height: '100%' },
});

export const WardenOutpassListScreen = () => <OutpassHistoryList endpoint="/warden/outpass/list/all" color="#0047AB" role="warden" />;
export const WatchmanOutpassListScreen = () => <OutpassHistoryList endpoint="/watchman/outpass/list" color="#4a3728" role="watchman" />;
export const YIOutpassListScreen = () => <OutpassHistoryList endpoint="/incharge/outpass/all" color="#7c3aed" role="yearincharge" />;

export default OutpassHistoryList;
