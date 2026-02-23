import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    SafeAreaView, StatusBar, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { User } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';
import { isProfileComplete } from '../../utils/profileHelper';

const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const [user, setUser] = useState<User>({
        name: '', staffid: { id: '', name: '' }, registerNumber: '', department: '',
        semester: 0, year: '', email: '', phone: '', photo: '', batch: '', gender: 'male',
        parentnumber: '', residencetype: '', hostelname: '', hostelroomno: '', busno: '', boardingpoint: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/api/profile');
            if (response.status === 200) {
                setUser(response.data.user);
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to fetch profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout', style: 'destructive', onPress: async () => {
                    await AsyncStorage.multiRemove(['token', 'isLoggedIn', 'userType']);
                    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                }
            }
        ]);
    };

    const handleQuickAction = (route: string) => {
        const restricted = ['Staffs', 'SubjectsTab', 'OutpassTab'];
        if (restricted.includes(route) && !isProfileComplete(user)) {
            Toast.show({ type: 'info', text1: 'Complete your profile first', text2: 'Fill all required fields to unlock this feature.' });
            return;
        }
        if (route === 'Staffs') navigation.navigate('HomeTab', { screen: 'Staffs' });
        else if (route === 'profile') navigation.navigate('ProfileTab');
        else navigation.navigate(route);
    };

    const getPhotoUrl = () => {
        if (!user.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0047AB&color=fff&size=200`;
        if (user.photo.startsWith('http')) return user.photo;
        return `${CDN_URL}${user.photo}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>🎓 JIT Portal</Text>
                </View>
                <View style={styles.headerRight}>
                    <Image source={{ uri: getPhotoUrl() }} style={styles.headerAvatar} />
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.welcomeBadge}>Welcome Back 👋</Text>
                    <Text style={styles.heroName}>Hello, {user.name || 'Student'}!</Text>
                    <Text style={styles.heroSub}>{user.year} • {user.department}</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        {[
                            { emoji: '👥', label: 'Find Staff', route: 'Staffs' },
                            { emoji: '📚', label: 'My Subjects', route: 'SubjectsTab' },
                            { emoji: '👤', label: 'Edit Profile', route: 'profile' },
                            { emoji: '📝', label: 'Outpass', route: 'OutpassTab' },
                        ].map((item) => (
                            <TouchableOpacity key={item.route} style={styles.actionCard} onPress={() => handleQuickAction(item.route)}>
                                <Text style={styles.actionIcon}>{item.emoji}</Text>
                                <Text style={styles.actionLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Department Info */}
                <View style={styles.section}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>🏛️ Department Info</Text>
                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Class Advisor</Text>
                                <Text style={styles.infoValue}>{user.staffid?.name || '—'}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Semester</Text>
                                <Text style={styles.infoValue}>{user.semester || '—'}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Batch</Text>
                                <Text style={styles.infoValue}>{user.batch || '—'}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Reg. Number</Text>
                                <Text style={styles.infoValue}>{user.registerNumber || '—'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Vision */}
                <View style={styles.section}>
                    <View style={styles.visionCard}>
                        <Text style={styles.visionTitle}>🚀 Vision & Mission</Text>
                        <Text style={styles.visionText}>
                            Jeppiaar Institute of Technology aspires to provide technical education in futuristic technologies with innovative, industrial, and social applications for the betterment of humanity.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14,
    },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
    logoutBtn: { backgroundColor: COLORS.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    logoutText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    scroll: { flex: 1 },
    hero: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20, paddingBottom: 28, paddingTop: 4,
    },
    welcomeBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)', color: COLORS.white,
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
        fontSize: 12, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 8,
    },
    heroName: { color: COLORS.white, fontSize: 26, fontWeight: '800', marginBottom: 4 },
    heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
    section: { paddingHorizontal: 16, paddingTop: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    actionCard: {
        width: '47%', backgroundColor: COLORS.white, borderRadius: 16,
        padding: 20, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    actionIcon: { fontSize: 32, marginBottom: 8 },
    actionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
    card: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    infoItem: { width: '47%' },
    infoLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '700' },
    visionCard: {
        backgroundColor: COLORS.primaryDark, borderRadius: 16, padding: 20, marginBottom: 24,
    },
    visionTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    visionText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 22 },
});

export default DashboardScreen;
