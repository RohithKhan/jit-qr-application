import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';
import { handleGlobalLogout } from '../../utils/authHelper';
import { Ionicons } from '@expo/vector-icons';

const WardenDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [warden, setWarden] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isProfileComplete, setIsProfileComplete] = useState(true);

    const checkCompletion = (data: any) => {
        const requiredFields = ['name', 'email', 'phone', 'gender', 'hostelname', 'photo'];
        return requiredFields.every(field => {
            const value = data[field];
            return value && value !== 'N/A' && value !== '';
        });
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const profileRes = await api.get('/warden/profile');
            const userData = profileRes.data.warden || profileRes.data;
            setWarden(userData);
            
            const complete = checkCompletion(userData);
            setIsProfileComplete(complete);
            if (!complete) {
                Toast.show({ type: 'info', text1: 'Profile Incomplete', text2: 'Please complete your profile to access all features' });
            }
        } catch { 
            Toast.show({ type: 'error', text1: 'Failed to fetch dashboard data' }); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleLogout = handleGlobalLogout;

    const getPhoto = () => {
        if (!warden?.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(warden?.name || 'Warden')}&background=0047AB&color=fff&size=200`;
        return warden.photo.startsWith('http') ? warden.photo : `${CDN_URL}${warden.photo}`;
    };

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🎓 JIT Warden</Text>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    {warden && <Image source={{ uri: getPhoto() }} style={styles.avatar} />}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
                </View>
            </View>

            {!isProfileComplete && (
                <View style={styles.overlayContainer}>
                    <View style={styles.incompleteCard}>
                        <Text style={styles.warningIcon}>⚠️</Text>
                        <Text style={styles.incompleteTitle}>Profile Incomplete</Text>
                        <Text style={styles.incompleteText}>
                            You must complete your profile information (including photo, phone number, and hostel name) before you can access the Warden Dashboard.
                        </Text>
                        <TouchableOpacity 
                            style={styles.completeProfileBtn}
                            onPress={() => navigation.navigate('WardenProfileTab')}
                        >
                            <Text style={styles.completeProfileBtnText}>Complete Profile Now →</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <ScrollView 
                showsVerticalScrollIndicator={false}
                style={[!isProfileComplete && styles.blurred]}
                scrollEnabled={isProfileComplete}
            >
                <View style={[styles.hero, !isProfileComplete && styles.blurred]}>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>Welcome Back</Text>
                    </View>
                    <Text style={styles.name}>Hello, {warden?.name}! 👋</Text>
                    <Text style={styles.sub}>
                        {warden?.year || 'N/A'} • {warden?.department || 'N/A'}
                    </Text>
                </View>

                <View style={[styles.section, !isProfileComplete && styles.blurred]}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.grid}>
                        {[
                            { emoji: '🚨', label: 'Emergency Outpass', route: 'WardenEmergencyOutpass' },
                            { emoji: '⏳', label: 'Pending Outpass', route: 'WardenPending' },
                            { emoji: '✅', label: 'Outpass List', route: 'WardenHistory' }
                        ].map((a) => (
                            <TouchableOpacity 
                                key={a.route} 
                                style={styles.card} 
                                onPress={() => isProfileComplete ? navigation.navigate(a.route) : null}
                                activeOpacity={isProfileComplete ? 0.7 : 1}
                            >
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
    
    hero: { backgroundColor: '#00214D', margin: 16, borderRadius: 24, padding: 32, ...SHADOWS.large, overflow: 'hidden' },
    badgeContainer: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
    badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
    name: { color: '#87ceeb', fontSize: 26, fontWeight: '800', marginBottom: 8 }, // skyblue
    sub: { color: '#87ceeb', fontSize: 15, fontWeight: '500' },
    
    section: { padding: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    card: { flex: 1, minWidth: '45%', backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center', ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    cardIconContainer: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    cardIcon: { fontSize: 32 },
    cardLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
    
    blurred: { opacity: 0.5 },
    overlayContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
    incompleteCard: { backgroundColor: COLORS.white, padding: 32, borderRadius: 20, width: '85%', alignItems: 'center', ...SHADOWS.large, borderWidth: 1, borderColor: COLORS.border },
    warningIcon: { fontSize: 40, marginBottom: 16 },
    incompleteTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
    incompleteText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    completeProfileBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
    completeProfileBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

export default WardenDashboardScreen;
