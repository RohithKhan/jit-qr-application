import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, TextInput, Modal } from 'react-native';
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
    gender?: string;
    hostelname?: string;
}

interface ProfileBaseProps {
    endpoint: string;
    updateEndpoint: string;
    color: string;
    title: string;
    logoutRoute: string;
    role: string;
}

const ProfileBase: React.FC<ProfileBaseProps> = ({ endpoint, updateEndpoint, color, title, logoutRoute, role }) => {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<ProfileData | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
            const profile = res.data.warden || res.data.data || res.data;
            setData(profile);
            setEditData(profile);
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
        if (!isEditing) return;
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5
        });
        if (!res.canceled) setImageUri(res.assets[0].uri);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();

            if (imageUri) {
                formData.append('photo', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
            }

            if (editData) {
                formData.append('name', editData.name || '');
                formData.append('email', editData.email || '');
                formData.append('phone', editData.phone || '');
                formData.append('gender', editData.gender || 'male');
                formData.append('hostelname', editData.hostelname || '');
            }

            await axios.put(`${API_URL}${updateEndpoint}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            Toast.show({ type: 'success', text1: 'Profile updated successfully' });
            setImageUri(null);
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to update profile' });
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

    const calculateCompletion = () => {
        if (!data) return 0;
        const fields = ['name', 'email', 'phone', 'gender', 'hostelname'];
        const filled = fields.filter(f => {
            const val = data[f as keyof ProfileData];
            return val && val !== 'N/A' && val !== 'undefined';
        });
        return Math.round((filled.length / fields.length) * 100);
    };

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

    const completion = calculateCompletion();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View style={styles.topSection}>
                        <View style={styles.completionCard}>
                            <View style={styles.completionHeader}>
                                <Text style={styles.completionTitle}>Profile Completion</Text>
                                <Text style={styles.completionPercent}>{completion}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${completion}%`, backgroundColor: completion === 100 ? COLORS.success : COLORS.primary }]} />
                            </View>
                            <Text style={styles.completionSub}>
                                {completion === 100 ? "Great! Your profile is complete." : "Complete your profile to unlock all features."}
                            </Text>
                        </View>

                        <View style={styles.hero}>
                            <TouchableOpacity onPress={pickImage} disabled={!isEditing} style={styles.avatarWrapper}>
                                <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                                {isEditing && <View style={styles.editBadge}><Text style={{ fontSize: 12 }}>📷</Text></View>}
                            </TouchableOpacity>
                            <Text style={styles.name}>{data?.name}</Text>
                            <View style={styles.badge}><Text style={styles.badgeText}>{role}</Text></View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Personal Information</Text>
                        <Text style={styles.cardSubText}>Manage your personal and contact details.</Text>

                        {!isEditing ? (
                            <>
                                <InfoRow label="Full Name" value={data?.name} emoji="👤" />
                                <InfoRow label="Email Address" value={data?.email} emoji="📧" />
                                <InfoRow label="Phone Number" value={data?.phone} emoji="📱" />
                                <InfoRow label="Gender" value={data?.gender || 'Not specified'} emoji="🚻" />
                                <InfoRow label="Hostel" value={data?.hostelname || 'Not assigned'} emoji="🏠" />
                            </>
                        ) : (
                            <View style={{ gap: 16, marginTop: 10 }}>
                                <EditField label="Full Name" value={editData?.name} onChange={(t: string) => setEditData(prev => ({ ...prev!, name: t }))} />
                                <EditField label="Email" value={editData?.email} onChange={(t: string) => setEditData(prev => ({ ...prev!, email: t }))} keyboardType="email-address" />
                                <EditField label="Phone" value={editData?.phone} onChange={(t: string) => setEditData(prev => ({ ...prev!, phone: t }))} keyboardType="phone-pad" />

                                <View>
                                    <Text style={styles.editLabel}>Gender</Text>
                                    <View style={styles.pickerContainer}>
                                        {['male', 'female'].map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[styles.pickerItem, editData?.gender?.toLowerCase() === g && styles.pickerItemActive]}
                                                onPress={() => setEditData(prev => ({ ...prev!, gender: g }))}
                                            >
                                                <Text style={[styles.pickerText, editData?.gender?.toLowerCase() === g && styles.pickerTextActive]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View>
                                    <Text style={styles.editLabel}>Hostel</Text>
                                    <View style={styles.pickerContainer}>
                                        {['Boys Hostel', 'Girls Hostel'].map(h => (
                                            <TouchableOpacity
                                                key={h}
                                                style={[styles.pickerItem, editData?.hostelname === h && styles.pickerItemActive]}
                                                onPress={() => setEditData(prev => ({ ...prev!, hostelname: h }))}
                                            >
                                                <Text style={[styles.pickerText, editData?.hostelname === h && styles.pickerTextActive]}>{h}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                        {!isEditing ? (
                            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                                <Text style={styles.editBtnText}>Edit Profile</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ gap: 12 }}>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                                    <ActivityIndicator animating={saving} size="small" color={COLORS.white} style={{ position: 'absolute', left: 20 }} />
                                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); setEditData(data); setImageUri(null); }}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <Text style={styles.logoutBtnText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const InfoRow = ({ label, value, emoji }: any) => (
    <View style={styles.infoRow}>
        <View style={styles.infoIconBg}><Text style={{ fontSize: 18 }}>{emoji}</Text></View>
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
        />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.primaryDark
    },
    headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80 },
    headerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },

    topSection: { backgroundColor: COLORS.primaryDark, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, ...SHADOWS.medium },

    completionCard: { margin: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    completionTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
    completionPercent: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: '100%', borderRadius: 4 },
    completionSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

    hero: { padding: 10, alignItems: 'center' },
    avatarWrapper: { position: 'relative', marginBottom: 16 },
    avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
    editBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: COLORS.white, borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
    name: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginBottom: 6 },
    badge: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

    card: { margin: 16, backgroundColor: COLORS.white, borderRadius: 24, padding: 20, ...SHADOWS.medium, marginTop: -20 },
    cardTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    cardSubText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 16 },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12 },
    infoIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
    infoLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '700' },

    editLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },

    pickerContainer: { flexDirection: 'row', gap: 10 },
    pickerItem: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.white },
    pickerItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
    pickerText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
    pickerTextActive: { color: COLORS.primary },

    editBtn: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 16, alignItems: 'center', ...SHADOWS.small },
    editBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

    saveBtn: { backgroundColor: COLORS.success, paddingVertical: 15, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

    cancelBtn: { paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },

    logoutBtn: { marginTop: 20, paddingVertical: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
    logoutBtnText: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
});

export const WardenProfileScreen = () => <ProfileBase endpoint="/warden/profile" updateEndpoint="/warden/profile/update" color={COLORS.primary} title="Warden Profile" logoutRoute="Auth" role="Warden" />;
export const WatchmanProfileScreen = () => <ProfileBase endpoint="/watchman/profile" updateEndpoint="/watchman/profile/update" color="#4a3728" title="Watchman Profile" logoutRoute="Auth" role="Watchman" />;
export const YearInchargeProfileScreen = () => <ProfileBase endpoint="/year-incharge/profile" updateEndpoint="/year-incharge/profile/update" color="#7c3aed" title="Year Incharge" logoutRoute="Auth" role="Year Incharge" />;
export const AdminProfileScreen = () => <ProfileBase endpoint="/admin/profile" updateEndpoint="/admin/profile/update" color="#1e293b" title="Administrator" logoutRoute="Auth" role="Admin" />;

export default ProfileBase;
