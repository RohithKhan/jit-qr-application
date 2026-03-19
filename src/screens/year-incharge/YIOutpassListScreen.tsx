import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../constants/config';

const YIOutpassListScreen = () => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Approved' | 'Rejected'>('All');

    const fetchOutpasses = async () => {
        try {
            const res = await api.get('/incharge/outpass/list/all');
            const list = res.data.outpasslist || res.data.outpasses || [];
            
            const sortedList = list.sort((a: any, b: any) => {
                const aType = (a.outpasstype || '').toLowerCase();
                const bType = (b.outpasstype || '').toLowerCase();
                if (aType === 'emergency' && bType !== 'emergency') return -1;
                if (aType !== 'emergency' && bType === 'emergency') return 1;
                return new Date(b.fromDate || b.createdAt).getTime() - new Date(a.fromDate || a.createdAt).getTime();
            });

            setOutpasses(sortedList);
        } catch (error) { 
            console.error("Fetch outpass history error:", error);
            Toast.show({ type: 'error', text1: 'Failed to fetch outpass records' }); 
        } finally { 
            setLoading(false); 
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOutpasses();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOutpasses();
    };

    const filteredOutpasses = useMemo(() => {
        return outpasses.filter(item => {
            const matchesSearch = 
                item.studentid?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.studentid?.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const status = (item.yearinchargeapprovalstatus || '').toLowerCase();
            const matchesFilter = 
                filterStatus === 'All' ? true :
                filterStatus === 'Approved' ? status === 'approved' :
                status === 'rejected' || status === 'declined';

            return matchesSearch && matchesFilter;
        });
    }, [outpasses, searchTerm, filterStatus]);

    const capitalize = (str: string) => {
        if (!str) return 'N/A';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const getStatusColors = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'approved') return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0', dot: '#22c55e' };
        if (s === 'rejected' || s === 'declined') return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', dot: '#ef4444' };
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a', dot: '#f59e0b' };
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Records</Text>
                
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search Name or Register No..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.filterTabs}>
                    {['All', 'Approved', 'Rejected'].map((tab) => (
                        <TouchableOpacity 
                            key={tab}
                            style={[styles.tab, filterStatus === tab && styles.tabActive]}
                            onPress={() => setFilterStatus(tab as any)}
                        >
                            <Text style={[styles.tabText, filterStatus === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#7c3aed" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={filteredOutpasses} 
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📂</Text>
                            <Text style={styles.empty}>No records found</Text>
                            <Text style={styles.emptySub}>Try adjusting your search or filter</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const colors = getStatusColors(item.yearinchargeapprovalstatus);
                        return (
                            <View style={styles.card}>
                                <View style={styles.cardTop}>
                                    <View style={styles.idBadge}>
                                        <Text style={styles.idText}>{item.studentid?.registerNumber || 'N/A'}</Text>
                                    </View>
                                    {item.outpasstype?.toLowerCase() === 'emergency' && (
                                        <View style={styles.emergencyBadge}>
                                            <Text style={styles.emergencyText}>EMERGENCY</Text>
                                        </View>
                                    )}
                                </View>
                                
                                <Text style={styles.cardName}>{item.studentid?.name || 'Unknown'}</Text>
                                
                                <Text style={styles.cardDetails}>
                                    Year {item.studentid?.year || 'N/A'} • {item.outpasstype || 'General'}
                                </Text>
                                
                                <View style={styles.divider} />
                                
                                <View style={styles.cardFooter}>
                                    <View style={[styles.statusPill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                                        <View style={[styles.statusDot, { backgroundColor: colors.dot }]} />
                                        <Text style={[styles.statusPillText, { color: colors.text }]}>
                                            Incharge: {capitalize(item.yearinchargeapprovalstatus)}
                                        </Text>
                                    </View>
                                    <View style={styles.approvalChain}>
                                        <Text style={styles.chainText}>Staff: {capitalize(item.staffapprovalstatus)}</Text>
                                        {item.studentid?.residencetype?.toLowerCase().includes('hostel') && (
                                            <Text style={styles.chainText}>Warden: {capitalize(item.wardenapprovalstatus)}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { marginBottom: 12 },
    backText: { color: '#64748b', fontSize: 15, fontWeight: '600' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e3a8a', marginBottom: 16 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, height: 44, fontSize: 15, color: '#1e293b' },
    filterTabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 4, borderRadius: 12 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: COLORS.white, ...SHADOWS.small },
    tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    tabTextActive: { color: '#1e3a8a' },
    list: { padding: 20, paddingBottom: 40 },
    card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    idBadge: { backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    idText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
    emergencyBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ef4444' },
    emergencyText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },
    cardName: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
    cardDetails: { fontSize: 13, color: '#64748b', marginBottom: 16 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
    cardFooter: { gap: 12 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusPillText: { fontSize: 12, fontWeight: '700' },
    approvalChain: { flexDirection: 'row', gap: 12 },
    chainText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, padding: 40 },
    emptyIcon: { fontSize: 60, marginBottom: 20, opacity: 0.2 },
    empty: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});

export default YIOutpassListScreen;
