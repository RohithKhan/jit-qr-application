import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../constants/config';

const YIPendingOutpassScreen = () => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOutpasses = async () => {
        try {
            const res = await api.get('/incharge/outpass/list');
            const list = res.data.outpasses || res.data.outpasslist || [];
            
            const pendingData = list.filter((o: any) =>
                (o.staffapprovalstatus || '').toLowerCase() === 'approved' &&
                (o.yearinchargeapprovalstatus || '').toLowerCase() === 'pending'
            ).sort((a: any, b: any) => {
                const aType = (a.outpasstype || '').toLowerCase();
                const bType = (b.outpasstype || '').toLowerCase();
                if (aType === 'emergency' && bType !== 'emergency') return -1;
                if (aType !== 'emergency' && bType === 'emergency') return 1;
                return new Date(b.fromDate || b.createdAt).getTime() - new Date(a.fromDate || a.createdAt).getTime();
            });

            setOutpasses(pendingData);
        } catch (error) { 
            console.error("Fetch pending outpasses error:", error);
            Toast.show({ type: 'error', text1: 'Failed to fetch pending requests' }); 
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Approvals</Text>
                <Text style={styles.headerSub}>Requests waiting for your decision</Text>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#7c3aed" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={outpasses} 
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>✨</Text>
                            <Text style={styles.empty}>No pending outpasses</Text>
                            <Text style={styles.emptySub}>All caught up! Check back later.</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.card}
                            onPress={() => navigation.navigate('YIStudentView', { outpassId: item._id })}
                        >
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
                                <View style={styles.statusPill}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusPillText}>Pending</Text>
                                </View>
                                <Text style={styles.dateText}>Applied: {new Date(item.fromDate).toLocaleDateString()}</Text>
                                <Text style={styles.viewLink}>View Details →</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 24, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { marginBottom: 12 },
    backText: { color: '#64748b', fontSize: 15, fontWeight: '600' },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1e3a8a', marginBottom: 4 },
    headerSub: { fontSize: 14, color: '#64748b' },
    list: { padding: 20, paddingBottom: 40 },
    card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    idBadge: { backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, ...SHADOWS.small },
    idText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
    emergencyBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ef4444' },
    emergencyText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },
    cardName: { fontSize: 19, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
    cardDetails: { fontSize: 14, color: '#64748b', marginBottom: 16 },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#fcd34d' },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' },
    statusPillText: { fontSize: 12, fontWeight: '700', color: '#d97706' },
    dateText: { fontSize: 12, color: '#94a3b8' },
    viewLink: { fontSize: 13, fontWeight: '700', color: '#7c3aed' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, padding: 40 },
    emptyIcon: { fontSize: 60, marginBottom: 20, opacity: 0.2 },
    empty: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});

export default YIPendingOutpassScreen;
