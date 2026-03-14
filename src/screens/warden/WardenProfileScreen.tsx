import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS, API_URL, CDN_URL } from '../../constants/config';

interface ProfileData {
    name: string;
    email: string;
    phone: string;
    id: string;
    photo?: string;
}

interface ProfileBaseProps {
    endpoint: string;
    updateEndpoint: string;
    color: string;
    title: string;
    logoutRoute: string;
}

const ProfileBase: React.FC<ProfileBaseProps> = ({ endpoint, updateEndpoint, color, title, logoutRoute }) => {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
            setData(res.data.data || res.data);
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.multiRemove(['token', 'user', 'role']);
        navigation.replace(logoutRoute);
    };

    const pickImage = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
        if (!res.canceled) setImageUri(res.assets[0].uri);
    };

    const handleSave = async () => {
        if (!imageUri) return;
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('photo', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
            await axios.put(`${API_URL}${updateEndpoint}`, formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
            Toast.show({ type: 'success', text1: 'Profile photo updated' });
            setImageUri(null);
            fetchProfile();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to update photo' });
        } finally {
            setSaving(false);
        }
    };

    const getPhoto = () => {
        if (imageUri) return imageUri;
        const p = data?.photo;
        if (!p) return `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.name || 'U')}&background=0047AB&color=fff&size=200`;
        return p.startsWith('http') ? p : `${CDN_URL}${p}`;
    };

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={color} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: color }}>
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                <View style={[styles.header, { backgroundColor: color }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
                </View>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    keyboardShouldPersistTaps="handled"
                    style={{ flex: 1 }}
                >
                    <View style={[styles.hero, { backgroundColor: color }]}>
                        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                            <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                            <View style={styles.editBadge}><Text>📷</Text></View>
                        </TouchableOpacity>
                        <Text style={styles.name}>{data?.name}</Text>
                        {imageUri && (
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '💾 Save Photo'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.card}>
                        {[
                            { label: 'Email', value: data?.email, emoji: '📧' },
                            { label: 'Phone', value: data?.phone, emoji: '📱' },
                            { label: 'ID', value: data?.id, emoji: '🆔' },
                        ].map(({ label, value, emoji }) => value ? (
                            <View key={label} style={styles.infoRow}>
                                <Text style={styles.infoEmoji}>{emoji}</Text>
                                <View>
                                    <Text style={styles.infoLabel}>{label}</Text>
                                    <Text style={styles.infoValue}>{value}</Text>
                                </View>
                            </View>
                        ) : null)}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    backText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
    logoutText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 14 },
    hero: { padding: 28, alignItems: 'center' },
    avatarWrapper: { position: 'relative', marginBottom: 12 },
    avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.white, borderRadius: 15, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
    name: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
    saveBtn: { marginTop: 12, backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    saveBtnText: { fontWeight: '700', fontSize: 14 },
    card: { margin: 16, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, elevation: 2, marginBottom: 32 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    infoEmoji: { fontSize: 22, width: 32 },
    infoLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '700' },
});

export const WardenProfileScreen = () => <ProfileBase endpoint="/warden/profile" updateEndpoint="/warden/profile/update" color="#1a6b4a" title="Warden Profile" logoutRoute="Auth" />;
export const WatchmanProfileScreen = () => <ProfileBase endpoint="/watchman/profile" updateEndpoint="/watchman/profile/update" color="#4a3728" title="Watchman Profile" logoutRoute="Auth" />;
export const YearInchargeProfileScreen = () => <ProfileBase endpoint="/incharge/profile" updateEndpoint="/incharge/profile/update" color="#7c3aed" title="YI Profile" logoutRoute="Auth" />;
export const AdminProfileScreen = () => <ProfileBase endpoint="/admin/profile" updateEndpoint="/admin/profile/update" color="#1e293b" title="Admin Profile" logoutRoute="Auth" />;

export default ProfileBase;
