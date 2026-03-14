import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { StaffUser } from '../../types';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';
import { handleGlobalLogout } from '../../utils/authHelper';

const StaffDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [staff, setStaff] = useState<StaffUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            // 1. Try to load from cache first for instant UI
            const cached = await AsyncStorage.getItem('staff_profile');
            if (cached) {
                setStaff(JSON.parse(cached));
            }

            // 2. Fetch fresh data with cache buster
            const res = await api.get(`/staff/profile?t=${Date.now()}`);
            const freshData = res.data.staff || res.data;

            setStaff(freshData);
            setLastUpdate(Date.now());

            // 3. Persist fresh data
            await AsyncStorage.setItem('staff_profile', JSON.stringify(freshData));
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            Toast.show({ type: 'error', text1: 'Failed to fetch profile' });
        } finally { setLoading(false); }
    };

    const handleLogout = handleGlobalLogout;

    const getPhoto = () => {
        if (!staff?.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(staff?.name || 'Staff')}&background=0047AB&color=fff&size=200`;
        const baseUrl = staff.photo.startsWith('http') ? staff.photo : `${CDN_URL}${staff.photo}`;
        // Add cache buster to ensure new image content is shown even if filename is same
        return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${lastUpdate}`;
    };

    const actions = [
        { icon: 'checkmark-circle', label: 'Pass Approvals', tab: 'ApprovalTab', screen: 'PassApproval', color: COLORS.primary, bgColor: COLORS.primaryLight },
        { icon: 'people', label: 'Students List', tab: 'StudentTab', screen: 'StudentRegistration', params: { initialTab: 'added' }, color: COLORS.secondary, bgColor: '#e0f2fe' },
        { icon: 'person-add', label: 'Registration', tab: 'StudentTab', screen: 'StudentRegistration', params: { initialTab: 'bulk' }, color: '#8b5cf6', bgColor: '#ede9fe' },
        { icon: 'person', label: 'My Profile', tab: 'ProfileTab', screen: 'StaffProfile', color: COLORS.textMuted, bgColor: '#f1f5f9' },
    ];

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>🏫 Staff Portal</Text>
                    <View style={styles.headerRight}>
                        {staff && <Image source={{ uri: getPhoto() }} style={styles.headerAvatar} />}
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.hero}>
                        <Text style={styles.welcome}>Welcome Back 👋</Text>
                        <Text style={styles.name}>{staff?.name || 'Staff'}</Text>
                        <Text style={styles.sub}>{staff?.designation || 'Faculty'} • {staff?.department || ''}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Overview Actions</Text>
                        <View style={styles.grid}>
                            {actions.map((a) => (
                                <TouchableOpacity
                                    key={a.label}
                                    style={styles.card}
                                    onPress={() => navigation.navigate(a.tab, { screen: a.screen, params: a.params })}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: a.bgColor }]}>
                                        <Ionicons name={a.icon as any} size={28} color={a.color} />
                                    </View>
                                    <Text style={styles.cardLabel}>{a.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },
    logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    logoutText: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },

    // Hero Section
    hero: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 10, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...SHADOWS.medium },
    welcome: { color: COLORS.primaryLight, fontSize: 14, fontWeight: '600', marginBottom: 4, opacity: 0.9 },
    name: { color: COLORS.white, fontSize: 26, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
    sub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500' },

    // Main Content
    section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
    sectionTitle: { fontSize: 19, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 18, letterSpacing: -0.3 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },

    // Modern Action Card
    card: { width: '47%', backgroundColor: COLORS.white, borderRadius: 20, paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', ...SHADOWS.small, borderWidth: 1, borderColor: '#f1f5f9' },
    iconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    cardLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center' },

    scrollContent: { paddingBottom: 120 },
});

export default StaffDashboardScreen;
