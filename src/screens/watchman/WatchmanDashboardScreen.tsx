import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, CDN_URL } from '../../constants/config';
import { handleGlobalLogout } from '../../utils/authHelper';

const WatchmanDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [watchman, setWatchman] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/watchman/profile');
            setWatchman(res.data.watchman || res.data);
        } catch (err: any) {
            console.error('[WatchmanDashboard] fetchProfile error:', err?.response?.status, err?.response?.data);
            Toast.show({ type: 'error', text1: 'Failed to fetch profile', text2: err?.response?.data?.message || 'Server error' });
        }
        finally { setLoading(false); }
    };

    const handleLogout = handleGlobalLogout;

    const getPhoto = () => {
        if (!watchman?.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(watchman?.name || 'Watchman')}&background=00214D&color=fff&size=200`;
        return watchman.photo.startsWith('http') ? watchman.photo : `${CDN_URL}${watchman.photo}`;
    };

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={'#00214D'} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🔐 Watchman Portal</Text>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    {watchman && <Image source={{ uri: getPhoto() }} style={styles.avatar} />}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
                </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>Welcome Back</Text>
                    </View>
                    <Text style={styles.name}>Hello, {watchman?.name || 'Watchman'}! 👋</Text>
                    <Text style={styles.sub}>Security</Text>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.grid}>
                        {[
                            { emoji: '✅', label: 'Outpass List', route: 'WatchmanHistory' },
                        ].map((a) => (
                            <TouchableOpacity key={a.route} style={styles.card} onPress={() => navigation.navigate(a.route)}>
                                <View style={styles.cardIconContainer}>
                                    <Text style={styles.cardIcon}>{a.emoji}</Text>
                                </View>
                                <Text style={styles.cardLabel}>{a.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10 },
    headerTitle: { color: COLORS.primaryDark, fontSize: 20, fontWeight: '700' },
    avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)' },
    logoutBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    logoutText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
    
    hero: { backgroundColor: '#00214D', margin: 16, borderRadius: 24, padding: 32, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    badgeContainer: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
    badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
    name: { color: '#87ceeb', fontSize: 26, fontWeight: '800', marginBottom: 8 },
    sub: { color: '#87ceeb', fontSize: 15, fontWeight: '500' },
    
    section: { padding: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    card: { flex: 1, minWidth: '45%', backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    cardIconContainer: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    cardIcon: { fontSize: 32 },
    cardLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
});

export default WatchmanDashboardScreen;
