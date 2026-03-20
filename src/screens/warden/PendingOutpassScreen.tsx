import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, 
    TextInput, Platform, Image, Modal, Linking, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';
import { LinearGradient } from 'expo-linear-gradient';

interface Props { role: 'warden' | 'year-incharge'; endpoint: string; color: string; }

// Date Filter Types
type DateFilter = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month';

const OutpassApprovalList = ({ role, endpoint, color }: Props) => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
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
            console.log("Pending Outpass API Response Data:", res.data);

            const rawData = res.data.outpasses || res.data.filterOutpass || res.data.data || res.data.students || res.data || [];
            const allData = Array.isArray(rawData) ? rawData : [];
            
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

            console.log("Pending Outpass Filtered Data:", pendingData.length, "items");
            setOutpasses(pendingData);
        } catch (error) { 
            console.error("Failed to fetch pending requests", error);
            Toast.show({ type: 'error', text1: 'Failed to fetch pending requests' }); 
        } finally { 
            setLoading(false); 
        }
    };

    // --- Filtering Logic ---
    const filteredOutpasses = outpasses.filter(s => {
        let matchesDate = true;
        const student = s.studentid || s.studentId || {};
        const appliedDate = new Date(s.createdAt || s.outDate || Date.now());
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Date Filter
        if (dateFilter === 'today') {
            matchesDate = appliedDate >= today;
        } else if (dateFilter === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            matchesDate = appliedDate >= yesterday && appliedDate < today;
        } else if (dateFilter === 'this_week') {
            const thisWeek = new Date(today);
            thisWeek.setDate(today.getDate() - today.getDay());
            matchesDate = appliedDate >= thisWeek;
        } else if (dateFilter === 'this_month') {
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            matchesDate = appliedDate >= thisMonth;
        }

        // Search Term (Name, RegNo, Date)
        const nameMatch = (student.name || s.studentName || s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const regMatch = (student.registerNumber || s.register_number || '').toLowerCase().includes(searchTerm.toLowerCase());
        const dateStr = appliedDate.toLocaleDateString();
        const matchesSearch = searchTerm === "" || nameMatch || regMatch || dateStr.includes(searchTerm.toLowerCase());

        return matchesDate && matchesSearch;
    });

    // --- Document Viewer ---
    const handleViewDocument = async (url: string) => {
        const fullUrl = url.startsWith('http') ? url : `${CDN_URL}${url.replace(/^\//, '')}`;
        if (fullUrl.toLowerCase().endsWith('.pdf')) {
            // Ensure PDFs open in a browser or PDF viewer natively instead of inline Image component
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
            // For images (jpg, png), show them in the React Native modal
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
                <Text style={styles.headerTitle}>Pending Outpass</Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search name, reg no, date..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor={COLORS.textLight}
                    />
                </View>

                {/* Date Filters Horizontal scroll */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingVertical: 10, gap: 10 }}
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
                            <Text style={styles.emptyIcon}>✨</Text>
                            <Text style={styles.empty}>
                                {searchTerm || dateFilter !== 'all' ? 'No matches found' : 'No pending outpasses'}
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const student = item.studentid || item.studentId || {};
                        const isEmergency = item.outpassType?.toLowerCase() === 'emergency' || item.outpasstype?.toLowerCase() === 'emergency' || item.type?.toLowerCase() === 'emergency';
                        const documentAttached = item.proof || item.document || item.file || item.outpassdoc;
                        
                        return (
                            <View style={styles.card}>
                                <LinearGradient 
                                    colors={['#2563eb', '#1e40af']} 
                                    start={{ x: 0, y: 0 }} 
                                    end={{ x: 1, y: 1 }}
                                    style={styles.cardBadge}
                                >
                                    <Text style={styles.cardBadgeText}>{student.registerNumber || item.register_number || item.department || 'N/A'}</Text>
                                </LinearGradient>
                                
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
                                    <View style={styles.footerActions}>
                                        <View style={styles.statusPill}>
                                            <Text style={styles.statusPillText}>• Pending</Text>
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
                                            if (Platform.OS === 'web') {
                                                // @ts-ignore
                                                document.activeElement?.blur?.();
                                            }
                                            const sId = item.studentID || item.studentId?._id || item.studentid?._id || item.id || item._id;
                                            const outpassId = item._id || item.id;
                                            if (outpassId && role === 'warden') {
                                                navigation.navigate('WardenStudentView', { outpassId: outpassId });
                                            } else if (sId && role === 'year-incharge') {
                                                // Assuming Year incharge needs to go here based on existing code routing
                                                navigation.navigate('StudentDetails', { studentId: sId });
                                            }
                                        }}
                                    >
                                        <Text style={[styles.viewLinkText, { color: themeColor }]}>View →</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
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
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start', ...SHADOWS.small },
    backText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },

    // Search and Filters
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, marginBottom: 6 },
    searchIcon: { fontSize: 16, marginRight: 8, color: COLORS.textLight },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary },
    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
    filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

    // List
    list: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
    cardBadge: { paddingVertical: 6, borderRadius: 8, alignItems: 'center', marginBottom: 14 },
    cardBadgeText: { color: COLORS.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    cardName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    cardDetails: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
    
    // Emergency
    emergencyBadge: { backgroundColor: '#fee2e2', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ef4444', marginBottom: 12 },
    emergencyText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },
    
    // Footer
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
    footerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
    statusPillText: { fontSize: 13, fontWeight: '700', color: '#d97706' },
    viewLinkRow: { padding: 8 },
    viewLinkText: { fontSize: 14, fontWeight: '700' },
    
    docBtn: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    docBtnText: { color: '#3b82f6', fontSize: 12, fontWeight: '700' },

    // Empty State
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

// Re-exports
export const WardenPendingOutpassScreen = () => (
    <OutpassApprovalList role="warden" endpoint="/warden/outpass/list" color="#0047AB" />
);

export const YIPendingOutpassScreen = () => (
    <OutpassApprovalList role="year-incharge" endpoint="/year-incharge/outpass/pending" color="#7c3aed" />
);

export default OutpassApprovalList;
