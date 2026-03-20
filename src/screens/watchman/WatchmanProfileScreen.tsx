import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';
import { handleGlobalLogout } from '../../utils/authHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/config';
import axios from 'axios';

interface WatchmanProfile {
    name: string;
    email: string;
    phone: string;
    photo?: string;
}

const WatchmanProfileScreen = () => {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<WatchmanProfile | null>(null);
    const [editData, setEditData] = useState<WatchmanProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [photoVersion, setPhotoVersion] = useState<number>(Date.now());

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/watchman/profile');
            const profile = res.data.watchman || res.data;
            setData(profile);
            setEditData(profile);
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Failed to load profile', text2: err?.response?.data?.message });
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        if (!isEditing) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Allow photo library access to change your profile picture.' });
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!res.canceled) {
            setImageAsset(res.assets[0]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('name', editData?.name || '');
            formData.append('email', editData?.email || '');
            formData.append('phone', editData?.phone || '');
            if (imageAsset) {
                formData.append('photo', {
                    uri: imageAsset.uri,
                    name: imageAsset.fileName || 'photo.jpg',
                    type: imageAsset.mimeType || 'image/jpeg'
                } as any);
            }
            await axios.put(`${API_URL}/watchman/profile/update`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
            });
            Toast.show({ type: 'success', text1: 'Profile updated successfully' });

            // --- Optimistic update ---
            // Immediately show the edited text fields & keep the locally-picked
            // photo visible (imageUri is NOT cleared here). The CDN may take a
            // moment to propagate; the local uri is the source of truth until then.
            const merged = { ...data, ...editData } as WatchmanProfile;
            setData(merged);
            setEditData(merged);
            setPhotoVersion(Date.now()); // bust CDN cache for future renders
            setIsEditing(false);

            // Re-fetch in background so we eventually get the server's photo URL
            fetchProfile();
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Failed to update profile', text2: err?.response?.data?.message });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(data);  // revert any unsaved text edits
        setImageAsset(null);  // discard unsaved photo pick
    };

    const getPhoto = () => {
        if (imageAsset) return imageAsset.uri;
        const p = data?.photo;
        if (!p) return `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.name || 'W')}&background=00214D&color=fff&size=200`;
        const baseUrl = p.startsWith('http') ? p : `${CDN_URL}${p}`;
        // Append cache-buster so React Native doesn't serve a stale cached image
        return `${baseUrl}?v=${photoVersion}`;
    };

    const calculateCompletion = () => {
        if (!data) return 0;
        const fields: (keyof WatchmanProfile)[] = ['name', 'email', 'phone', 'photo'];
        const filled = fields.filter(f => data[f] && data[f] !== 'N/A');
        return Math.round((filled.length / fields.length) * 100);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    const completion = calculateCompletion();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* Dark top section: completion + avatar */}
                    <View style={styles.topSection}>

                        {/* Profile Completion */}
                        <View style={styles.completionCard}>
                            <View style={styles.completionHeader}>
                                <Text style={styles.completionTitle}>Profile Completion</Text>
                                <Text style={styles.completionPercent}>{completion}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[
                                    styles.progressBarFill,
                                    { width: `${completion}%`, backgroundColor: completion === 100 ? COLORS.success : COLORS.primary }
                                ]} />
                            </View>
                            <Text style={styles.completionSub}>
                                {completion === 100
                                    ? '✅ Great! Your profile is complete.'
                                    : 'Complete your profile to unlock all features.'}
                            </Text>
                        </View>

                        {/* Avatar + name */}
                        <View style={styles.hero}>
                            <TouchableOpacity onPress={pickImage} disabled={!isEditing} style={styles.avatarWrapper}>
                                <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                                {isEditing && (
                                    <View style={styles.editBadge}>
                                        <Text style={{ fontSize: 14 }}>📷</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <Text style={styles.name}>{data?.name || 'Watchman'}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Security</Text>
                            </View>
                        </View>
                    </View>

                    {/* Personal Information Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Personal Information</Text>
                        <Text style={styles.cardSub}>Manage your personal and contact details.</Text>

                        {!isEditing ? (
                            <>
                                <InfoRow emoji="👤" label="Full Name" value={data?.name} />
                                <InfoRow emoji="📧" label="Email Address" value={data?.email} />
                                <InfoRow emoji="📱" label="Phone Number" value={data?.phone} />
                            </>
                        ) : (
                            <View style={{ gap: 16, marginTop: 10 }}>
                                <EditField
                                    label="Full Name"
                                    value={editData?.name}
                                    onChange={(t: string) => setEditData(prev => ({ ...prev!, name: t }))}
                                />
                                <EditField
                                    label="Email"
                                    value={editData?.email}
                                    onChange={(t: string) => setEditData(prev => ({ ...prev!, email: t }))}
                                    keyboardType="email-address"
                                />
                                <EditField
                                    label="Phone"
                                    value={editData?.phone}
                                    onChange={(t: string) => setEditData(prev => ({ ...prev!, phone: t }))}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        {!isEditing ? (
                            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                                <Text style={styles.editBtnText}>Edit Profile</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ gap: 12 }}>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                                    {saving
                                        ? <ActivityIndicator size="small" color={COLORS.white} />
                                        : <Text style={styles.saveBtnText}>Save Changes</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity style={styles.logoutBtn} onPress={handleGlobalLogout}>
                            <Text style={styles.logoutBtnText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

/* ─── Sub-components ─── */

const InfoRow = ({ emoji, label, value }: { emoji: string; label: string; value?: string }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoIconBg}>
            <Text style={{ fontSize: 18 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || 'N/A'}</Text>
        </View>
    </View>
);

const EditField = ({ label, value, onChange, keyboardType = 'default' }: any) => (
    <View>
        <Text style={styles.editLabel}>{label}</Text>
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder={`Enter ${label}`}
            keyboardType={keyboardType}
            placeholderTextColor={COLORS.textLight}
            autoCapitalize="none"
        />
    </View>
);

/* ─── Styles ─── */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.primaryDark,
    },
    headerBtn: { width: 70 },
    headerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },

    // Dark hero area
    topSection: {
        backgroundColor: COLORS.primaryDark,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 24,
        ...SHADOWS.medium,
    },

    completionCard: {
        margin: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    completionTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
    completionPercent: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: '100%', borderRadius: 4 },
    completionSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

    hero: { paddingTop: 8, alignItems: 'center' },
    avatarWrapper: { position: 'relative', marginBottom: 14 },
    avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
    editBadge: {
        position: 'absolute', bottom: 4, right: 4,
        backgroundColor: COLORS.white, borderRadius: 15,
        width: 30, height: 30, justifyContent: 'center', alignItems: 'center',
        ...SHADOWS.small,
    },
    name: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginBottom: 6 },
    badge: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
    badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Card
    card: {
        margin: 16,
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.medium,
        marginTop: -20,
    },
    cardTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    cardSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 16 },

    // Info rows
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    infoIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
    infoLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '700' },

    // Edit fields
    editLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4 },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    // Buttons
    actions: { paddingHorizontal: 16, marginTop: 8 },

    editBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 16, alignItems: 'center', ...SHADOWS.small },
    editBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

    saveBtn: { backgroundColor: COLORS.success, paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

    cancelBtn: { paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },

    logoutBtn: { marginTop: 20, paddingVertical: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
    logoutBtnText: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
});

export default WatchmanProfileScreen;
