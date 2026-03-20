import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, 
    TextInput, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../constants/config';

type DateFilter = 'All' | 'Today' | 'Yesterday' | 'This Week' | 'This Month';
type TypeFilter = 'All' | 'OD' | 'Home Pass' | 'Outing' | 'Emergency';

const OutpassAdminScreen = () => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterType, setFilterType] = useState<TypeFilter>('All');
    const [filterTime, setFilterTime] = useState<DateFilter>('All');
    const [searchTerm, setSearchTerm] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchOutpasses();
        }, [])
    );

    const fetchOutpasses = async () => {
        try {
            const res = await api.get('/admin/outpass/list');
            console.log("OUTPASS RESPONSE:", res.data);
            const data = res.data.outpasses || res.data.filterOutpass || res.data.data || [];
            
            const list = Array.isArray(data) ? data : [];
            setOutpasses(list);
        } catch { 
            Toast.show({ type: 'error', text1: 'Failed to load outpasses' }); 
        } finally { 
            setLoading(false); 
        }
    };

    // Helpers based on Web
    const getStudentName = (op: any) => op.studentid?.name || op.student?.name || op.studentName || '-';
    const getStudentRegNo = (op: any) => op.studentid?.registerNumber || '-';
    const getType = (op: any) => op.outpassType || op.outpasstype || op.type || '-';
    const getFromDate = (op: any) => op.fromDate || op.outDate || '';
    const getStatus = (op: any) => op.outpassStatus || op.status || 'Pending';

    // Filters
    const isDateMatch = (dateStr: string, timeFilter: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (timeFilter === 'Today') return dateDay.getTime() === today.getTime();
        if (timeFilter === 'Yesterday') return dateDay.getTime() === yesterday.getTime();
        if (timeFilter === 'This Week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return date >= startOfWeek;
        }
        if (timeFilter === 'This Month') return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        return true;
    };

    const filteredOutpasses = outpasses.filter(op => {
        const type = getType(op).toLowerCase().replace(/\s+/g, '');
        const filter = filterType.toLowerCase().replace(/\s+/g, '');
        const date = getFromDate(op);
        const search = searchTerm.toLowerCase();

        const typeMatch = filterType === 'All' || type === filter || type.includes(filter);
        const timeMatch = filterTime === 'All' || isDateMatch(date, filterTime);

        const name = getStudentName(op).toLowerCase();
        const regNo = getStudentRegNo(op).toLowerCase();
        const fromDateStr = new Date(getFromDate(op)).toLocaleDateString().toLowerCase();

        const searchMatch = !searchTerm || name.includes(search) || regNo.includes(search) || fromDateStr.includes(search) || date.includes(search);

        return typeMatch && timeMatch && searchMatch;
    });

    const stats = {
        total: outpasses.length,
        od: outpasses.filter(o => getType(o).toLowerCase() === 'od').length,
        home: outpasses.filter(o => getType(o).toLowerCase().replace(/\s+/g, '').includes('home')).length,
        outing: outpasses.filter(o => getType(o).toLowerCase() === 'outing').length,
        emergency: outpasses.filter(o => getType(o).toLowerCase() === 'emergency').length,
    };

    const handleDownload = () => {
        Toast.show({ type: 'info', text1: 'CSV Download is only supported on the Web Dashboard.' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Outpass Management</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Stats Grid */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total</Text>
                        <Text style={[styles.statValue, { color: '#111827' }]}>{stats.total}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>OD</Text>
                        <Text style={[styles.statValue, { color: '#6366f1' }]}>{stats.od}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Home Pass</Text>
                        <Text style={[styles.statValue, { color: '#ec4899' }]}>{stats.home}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Outing</Text>
                        <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.outing}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Emergency</Text>
                        <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.emergency}</Text>
                    </View>
                </ScrollView>

                {/* Filters */}
                <View style={styles.controls}>
                    <View style={styles.searchBox}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput 
                            style={styles.search} 
                            value={searchTerm} 
                            onChangeText={setSearchTerm} 
                            placeholder="Search name, reg no..." 
                            placeholderTextColor={COLORS.textLight} 
                        />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {['All', 'OD', 'Home Pass', 'Outing', 'Emergency'].map((t) => (
                            <TouchableOpacity key={t} style={[styles.filterPill, filterType === t && styles.filterPillActive]} onPress={() => setFilterType(t as TypeFilter)}>
                                <Text style={[styles.filterPillText, filterType === t && styles.filterPillTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 10 }}>
                        {['All', 'Today', 'Yesterday', 'This Week', 'This Month'].map((t) => (
                            <TouchableOpacity key={t} style={[styles.filterPill, filterTime === t && styles.filterPillActive]} onPress={() => setFilterTime(t as DateFilter)}>
                                <Text style={[styles.filterPillText, filterTime === t && styles.filterPillTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading ? <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} /> :
                    <View style={styles.list}>
                        {filteredOutpasses.length === 0 ? (
                            <Text style={styles.emptyText}>No outpasses found.</Text>
                        ) : (
                            filteredOutpasses.map((op, index) => {
                                const status = getStatus(op).toLowerCase();
                                const isEmergency = getType(op).toLowerCase() === 'emergency';
                                
                                return (
                                    <View key={op._id || Math.random()} style={styles.card}>
                                        <LinearGradient 
                                            colors={['#4f46e5', '#4338ca']} 
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                            style={styles.cardBadge}
                                        >
                                            <Text style={styles.cardBadgeText}>{getStudentRegNo(op)}</Text>
                                        </LinearGradient>

                                        <Text style={styles.cardName}>
                                            {getStudentName(op)}
                                            {isEmergency && <Text style={{ color: '#ef4444', fontSize: 12 }}> (EMERGENCY)</Text>}
                                        </Text>

                                        <Text style={styles.cardDetails}>
                                            {op.studentid?.department || '-'} • {getType(op)} • {new Date(getFromDate(op) || Date.now()).toLocaleDateString()}
                                        </Text>

                                        <View style={styles.cardFooter}>
                                            <View style={[styles.statusPill, (styles as any)[`status_${status}`]]}>
                                                <Text style={[styles.statusText, (styles as any)[`statusText_${status}`]]}>{status.toUpperCase()}</Text>
                                            </View>
                                            {/* Minimal representation of approvals */}
                                            <TouchableOpacity 
                                                style={styles.downloadBtn}
                                                onPress={handleDownload}
                                            >
                                                <Text style={styles.downloadText}>📥 CSV</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                }
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    backText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },

    statsScroll: { padding: 16, gap: 12 },
    statCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, minWidth: 110, ...SHADOWS.small },
    statLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6 },
    statValue: { fontSize: 24, fontWeight: '800' },

    controls: { paddingHorizontal: 16, marginBottom: 8 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
    searchIcon: { fontSize: 16, marginRight: 8 },
    search: { flex: 1, paddingVertical: 10, fontSize: 15 },

    filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
    filterPillActive: { backgroundColor: '#4f46e5', borderColor: '#4338ca' },
    filterPillText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
    filterPillTextActive: { color: COLORS.white },

    list: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
    cardBadge: { paddingVertical: 6, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
    cardBadgeText: { color: COLORS.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    cardName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    cardDetails: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    statusText: { fontSize: 11, fontWeight: '800' },

    status_pending: { backgroundColor: '#fff7ed', borderColor: '#fdba74' },
    statusText_pending: { color: '#c2410c' },
    status_approved: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
    statusText_approved: { color: '#166534' },
    status_rejected: { backgroundColor: '#fee2e2', borderColor: '#f87171' },
    statusText_rejected: { color: '#991b1b' },
    status_declined: { backgroundColor: '#fee2e2', borderColor: '#f87171' },
    statusText_declined: { color: '#991b1b' },

    downloadBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    downloadText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },

    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 15 },
});

export default OutpassAdminScreen;
