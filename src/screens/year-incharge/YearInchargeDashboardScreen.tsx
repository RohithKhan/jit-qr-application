import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';
import { handleGlobalLogout } from '../../utils/authHelper';
import { LinearGradient } from 'expo-linear-gradient';

const YearInchargeDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const [profileRes, outpassRes] = await Promise.all([
                api.get('/incharge/profile'),
                api.get('/incharge/outpass/list')
            ]);

            const userData = profileRes.data.yearincharge || profileRes.data.user || profileRes.data;
            setUser(userData);

            const outpasses = outpassRes.data.outpasses || outpassRes.data.outpasslist || [];
            const pending = outpasses.filter((o: any) =>
                (o.staffapprovalstatus || '').toLowerCase() === 'approved' &&
                (o.yearinchargeapprovalstatus || '').toLowerCase() === 'pending'
            ).length;

            const approved = outpasses.filter((o: any) => (o.yearinchargeapprovalstatus || '').toLowerCase() === 'approved').length;
            const rejected = outpasses.filter((o: any) => (o.yearinchargeapprovalstatus || '').toLowerCase() === 'rejected').length;

            setStats({
                total: outpasses.length,
                pending,
                approved,
                rejected
            });
        } catch (error: any) {
            console.error("Dashboard fetch error:", error);
            Toast.show({ type: 'error', text1: 'Failed to fetch dashboard data' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleLogout = handleGlobalLogout;

    const getPhoto = () => {
        if (!user?.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'YI')}&background=7c3aed&color=fff&size=200`;
        return user.photo.startsWith('http') ? user.photo : `${CDN_URL}${user.photo}`;
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={'#7c3aed'} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            >
                <LinearGradient
                    colors={['#0047AB', '#00214D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.header}>
                        <View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Welcome Back</Text>
                            </View>
                            <Text style={styles.name}>Hello, {user?.name || 'Incharge'}! 👋</Text>
                            <Text style={styles.sub}>Year Incharge • {user?.department || 'Administration'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('YearInchargeProfile')}>
                            <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statIcon}>📊</Text>
                            <View>
                                <Text style={styles.statValue}>{stats.total}</Text>
                                <Text style={styles.statLabel}>Total Requests</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionGrid}>
                        <ActionCard 
                            emoji="⏳" 
                            label="Pending Outpass" 
                            route="YIPendingOutpass" 
                            onPress={() => navigation.navigate('YIPendingOutpass')}
                            count={stats.pending}
                        />
                        <ActionCard 
                            emoji="✅" 
                            label="Outpass List" 
                            route="YIOutpassList" 
                            onPress={() => navigation.navigate('YIOutpassList')}
                        />
                        <ActionCard 
                            emoji="👥" 
                            label="Student View" 
                            route="YIStudentView" 
                            onPress={() => navigation.navigate('YIStudentView')}
                        />
                        <ActionCard 
                            emoji="👤" 
                            label="My Profile" 
                            route="YearInchargeProfile" 
                            onPress={() => navigation.navigate('YearInchargeProfile')}
                        />
                    </View>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutBtnText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const ActionCard = ({ emoji, label, onPress, count }: any) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>{emoji}</Text>
        </View>
        <Text style={styles.cardLabel}>{label}</Text>
        {count !== undefined && count > 0 && (
            <View style={styles.countBadge}>
                <Text style={styles.countText}>{count}</Text>
            </View>
        )}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    hero: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...SHADOWS.medium
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 10
    },
    badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
    name: { color: 'skyblue', fontSize: 24, fontWeight: '800', marginBottom: 4 },
    sub: { color: 'skyblue', fontSize: 14, opacity: 0.9 },
    avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
    statsContainer: {
        flexDirection: 'row',
        gap: 15
    },
    statCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        minWidth: 160,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    statIcon: { fontSize: 24 },
    statValue: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
    statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
    content: {
        padding: 24,
        marginTop: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 20
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between'
    },
    card: {
        width: '47%',
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        marginBottom: 16,
        position: 'relative'
    },
    cardIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    cardIcon: { fontSize: 32 },
    cardLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
    countBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: COLORS.danger,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6
    },
    countText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
    logoutBtn: {
        marginTop: 20,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: COLORS.white
    },
    logoutBtnText: { color: COLORS.danger, fontSize: 16, fontWeight: '700' },
});

export default YearInchargeDashboardScreen;
