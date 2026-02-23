import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, CDN_URL } from '../../constants/config';

interface Props { endpoint: string; updateEndpoint: string; color: string; title: string; logoutRoute: string; }

const ProfileBase = ({ endpoint, updateEndpoint, color, title, logoutRoute }: Props) => {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get(endpoint);
            setData(res.data.warden || res.data.watchman || res.data.yearIncharge || res.data.admin || res.data);
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch profile' }); }
        finally { setLoading(false); }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!result.canceled && result.assets[0]) {
            const compressed = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 800 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
            setImageUri(compressed.uri);
        }
    };

    const handleSave = async () => {
        if (!imageUri) return;
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'profile.jpg' } as any);
            await api.put(updateEndpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            Toast.show({ type: 'success', text1: 'Photo updated!' });
            setImageUri(null);
            fetchProfile();
        } catch { Toast.show({ type: 'error', text1: 'Update failed' }); }
        finally { setSaving(false); }
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
        if (imageUri) return imageUri;
        const p = data?.photo;
        if (!p) return `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.name || 'U')}&background=0047AB&color=fff&size=200`;
        return p.startsWith('http') ? p : `${CDN_URL}${p}`;
    };

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={color} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { backgroundColor: color }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
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
export const YearInchargeProfileScreen = () => <ProfileBase endpoint="/year-incharge/profile" updateEndpoint="/year-incharge/profile/update" color="#7c3aed" title="YI Profile" logoutRoute="Auth" />;
export const AdminProfileScreen = () => <ProfileBase endpoint="/admin/profile" updateEndpoint="/admin/profile/update" color="#1e293b" title="Admin Profile" logoutRoute="Auth" />;

export default ProfileBase;
