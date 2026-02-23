import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { StaffUser } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';

const StaffDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [staff, setStaff] = useState<StaffUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/staff/profile');
            setStaff(res.data.staff || res.data);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch profile' }); }
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
        if (!staff?.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(staff?.name || 'Staff')}&background=0047AB&color=fff&size=200`;
        return staff.photo.startsWith('http') ? staff.photo : `${CDN_URL}${staff.photo}`;
    };

    const actions = [
        { emoji: '📋', label: 'Pass Approval', route: 'PassApproval' },
        { emoji: '👥', label: 'Students', route: 'StudentDetails' },
        { emoji: '📝', label: 'Registration', route: 'StudentRegistration' },
        { emoji: '📢', label: 'Notices', route: 'StaffNotices' },
        { emoji: '👤', label: 'My Profile', route: 'StaffProfile' },
    ];

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🏫 Staff Portal</Text>
                <View style={styles.headerRight}>
                    {staff && <Image source={{ uri: getPhoto() }} style={styles.headerAvatar} />}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Text style={styles.welcome}>Welcome Back 👋</Text>
                    <Text style={styles.name}>{staff?.name || 'Staff'}</Text>
                    <Text style={styles.sub}>{staff?.designation || 'Faculty'} • {staff?.department || ''}</Text>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
    logoutBtn: { backgroundColor: COLORS.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    logoutText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    hero: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 28, paddingTop: 4 },
    welcome: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
    name: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginBottom: 4 },
    sub: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
    section: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: { width: '47%', backgroundColor: COLORS.white, borderRadius: 16, padding: 20, alignItems: 'center', elevation: 3 },
    cardIcon: { fontSize: 32, marginBottom: 8 },
    cardLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
});

export default StaffDashboardScreen;
