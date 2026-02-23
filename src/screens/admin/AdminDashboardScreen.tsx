import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, CDN_URL } from '../../constants/config';

const AdminDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [admin, setAdmin] = useState<any>(null);
    const [stats, setStats] = useState({ students: 0, staff: 0, outpasses: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [profileRes, statsRes] = await Promise.allSettled([
                api.get('/admin/profile'),
                api.get('/admin/stats'),
            ]);
            if (profileRes.status === 'fulfilled') setAdmin(profileRes.value.data.admin || profileRes.value.data);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch data' }); }
        finally { setLoading(false); }
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout', style: 'destructive', onPress: async () => {
                    await AsyncStorage.multiRemove(['token', 'isLoggedIn', 'userType']);
                    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                }
            }
        ]);
    };

    const getPhoto = () => {
        if (!admin?.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name || 'Admin')}&background=1e293b&color=fff&size=200`;
        return admin.photo.startsWith('http') ? admin.photo : `${CDN_URL}${admin.photo}`;
    };

    const actions = [
        { emoji: '📋', label: 'Manage Students', route: 'ManageStudents' },
        { emoji: '📝', label: 'Register Student', route: 'StudentRegistration' },
        { emoji: '👥', label: 'Manage Staff', route: 'ManageStaff' },
        { emoji: '🏠', label: 'Manage Warden', route: 'ManageWarden' },
        { emoji: '👨‍💼', label: 'Year Incharge', route: 'ManageYearIncharge' },
        { emoji: '🔐', label: 'Security', route: 'ManageSecurity' },
        { emoji: '🚌', label: 'Bus Routes', route: 'ManageBus' },
        { emoji: '📑', label: 'Outpasses', route: 'OutpassAdmin' },
        { emoji: '👤', label: 'My Profile', route: 'AdminProfile' },
    ];

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={'#1e293b'} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>⚙️ Admin Portal</Text>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    {admin && <Image source={{ uri: getPhoto() }} style={styles.avatar} />}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
                </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Text style={styles.welcome}>Welcome Back 👋</Text>
                    <Text style={styles.name}>{admin?.name || 'Admin'}</Text>
                </View>
                {/* Stats */}
                <View style={styles.statsRow}>
                    {[
                        { label: 'Students', val: stats.students, emoji: '🎓' },
                        { label: 'Staff', val: stats.staff, emoji: '👨‍🏫' },
                        { label: 'Outpasses', val: stats.outpasses, emoji: '📝' },
                    ].map(({ label, val, emoji }) => (
                        <View key={label} style={styles.statCard}>
                            <Text style={styles.statEmoji}>{emoji}</Text>
                            <Text style={styles.statValue}>{val}</Text>
                            <Text style={styles.statLabel}>{label}</Text>
                        </View>
                    ))}
                </View>
                {/* Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Administration</Text>
                    <View style={styles.grid}>
                        {actions.map((a) => (
                            <TouchableOpacity key={a.route} style={styles.card} onPress={() => navigation.navigate(a.route)}>
                                <Text style={styles.cardIcon}>{a.emoji}</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 14 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
    avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
    logoutBtn: { backgroundColor: COLORS.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    logoutText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    hero: { backgroundColor: '#1e293b', paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 },
    welcome: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
    name: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
    statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
    statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 16, alignItems: 'center', elevation: 2 },
    statEmoji: { fontSize: 24, marginBottom: 6 },
    statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
    statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    section: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: { width: '47%', backgroundColor: COLORS.white, borderRadius: 16, padding: 20, alignItems: 'center', elevation: 3 },
    cardIcon: { fontSize: 32, marginBottom: 8 },
    cardLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
});

export default AdminDashboardScreen;
