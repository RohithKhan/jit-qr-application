import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { StaffUser } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';

const StaffProfileScreen = () => {
    const navigation = useNavigation<any>();
    const [staff, setStaff] = useState<StaffUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/staff/profile');
            setStaff(res.data.staff || res.data);
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
            await api.put('/staff/profile/update', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            Toast.show({ type: 'success', text1: 'Profile photo updated!' });
            setImageUri(null);
            fetchProfile();
        } catch { Toast.show({ type: 'error', text1: 'Update failed' }); }
        finally { setSaving(false); }
    };

    const getPhoto = () => {
        if (imageUri) return imageUri;
        if (!staff?.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(staff?.name || 'Staff')}&background=0047AB&color=fff&size=200`;
        return staff.photo.startsWith('http') ? staff.photo : `${CDN_URL}${staff.photo}`;
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

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                        <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                        <View style={styles.editBadge}><Text style={styles.editBadgeText}>📷</Text></View>
                    </TouchableOpacity>
                    <Text style={styles.name}>{staff?.name}</Text>
                    <Text style={styles.role}>{staff?.designation || 'Faculty'}</Text>
                    <View style={styles.dept}><Text style={styles.deptText}>{staff?.department}</Text></View>
                    {imageUri && (
                        <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
                            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '💾 Save Photo'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.infoCard}>
                    {[
                        { label: 'Email', value: staff?.email, emoji: '📧' },
                        { label: 'Phone', value: staff?.phone, emoji: '📱' },
                        { label: 'Department', value: staff?.department, emoji: '🏛️' },
                        { label: 'Designation', value: staff?.designation, emoji: '💼' },
                        { label: 'Staff ID', value: staff?.id, emoji: '🆔' },
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
    card: { backgroundColor: COLORS.white, margin: 16, borderRadius: 20, padding: 24, alignItems: 'center', elevation: 4 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.primary },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    editBadgeText: { fontSize: 14 },
    name: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    role: { color: COLORS.textMuted, fontSize: 14, marginBottom: 10 },
    dept: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
    deptText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
    saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    btnDisabled: { opacity: 0.65 },
    saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    infoCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 24, borderRadius: 16, padding: 16, elevation: 2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    infoEmoji: { fontSize: 22, width: 32 },
    infoLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '700' },
});

export default StaffProfileScreen;
