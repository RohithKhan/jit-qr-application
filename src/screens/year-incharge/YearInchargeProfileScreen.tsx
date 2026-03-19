import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, TextInput, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';
import { handleGlobalLogout } from '../../utils/authHelper';

interface ProfileData {
    name: string;
    email: string;
    phone: string;
    id: string;
    photo?: string;
    gender?: string;
    year?: string;
    role: string;
    handlingyears: string[];
    handlingbatches: string[];
    handlingdepartments: string[];
}

const YearInchargeProfileScreen = () => {
    const navigation = useNavigation<any>();
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<ProfileData | null>(null);

    // Options for multi-select
    const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const batchOptions = ['2022-2026', '2023-2027', '2024-2028', '2025-2029', '2026-2030'];
    const deptOptions = [
        'Computer Science and Engineering', 'Electrical and Electronics Engineering', 'Mechanical Engineering', 'Information Technology', 'Artificial Intelligence and Data Science', 'Master of Business Administration'
    ];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/incharge/profile');
            const raw = res.data.yearincharge || res.data;
            const profile: ProfileData = {
                name: raw.name || '',
                email: raw.email || '',
                phone: raw.phone || '',
                id: raw._id || raw.id || '',
                photo: raw.photo || '',
                gender: raw.gender || 'male',
                year: raw.year || '',
                role: raw.role || 'Year Incharge',
                handlingyears: Array.isArray(raw.handlingyears) ? raw.handlingyears : raw.handlingyears ? [raw.handlingyears] : [],
                handlingbatches: Array.isArray(raw.handlingbatches) ? raw.handlingbatches : raw.handlingbatches ? [raw.handlingbatches] : [],
                handlingdepartments: Array.isArray(raw.handlingdepartments) ? raw.handlingdepartments : raw.handlingdepartments ? [raw.handlingdepartments] : []
            };
            
            setData(profile);
            setEditData(JSON.parse(JSON.stringify(profile)));
        } catch (err) {
            console.error("Fetch profile error:", err);
            Toast.show({ type: 'error', text1: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = handleGlobalLogout;

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

    const toggleArrayItem = (field: keyof ProfileData, item: string) => {
        if (!editData) return;
        const current = [...(editData[field] as string[])];
        const index = current.indexOf(item);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(item);
        }
        setEditData(prev => ({ ...prev!, [field]: current }));
    };

    const handleSave = async () => {
        if (!editData) return;
        if (editData.handlingyears.length === 0 || editData.handlingbatches.length === 0 || editData.handlingdepartments.length === 0) {
            Toast.show({ type: 'error', text1: 'Selection Required', text2: 'Please select at least one option for all handling details' });
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();

            if (imageUri) {
                formData.append('photo', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
            }

            formData.append('name', editData.name);
            formData.append('email', editData.email);
            formData.append('phone', editData.phone);
            formData.append('gender', editData.gender || 'male');
            formData.append('year', editData.year || '');
            
            editData.handlingyears.forEach((y: string) => formData.append('handlingyears', y));
            editData.handlingbatches.forEach((b: string) => formData.append('handlingbatches', b));
            editData.handlingdepartments.forEach((d: string) => formData.append('handlingdepartments', d));

            const response = await api.put('/incharge/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Toast.show({ type: 'success', text1: 'Profile updated successfully' });
            setImageUri(null);
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            console.error("Update profile error:", err);
            Toast.show({ type: 'error', text1: 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const getPhoto = () => {
        if (imageUri) return imageUri;
        const p = data?.photo;
        if (!p) return `https://ui-avatars.com/api/?name=${encodeURIComponent(data?.name || 'U')}&background=7c3aed&color=fff&size=200`;
        return p.startsWith('http') ? p : `${CDN_URL}${p}`;
    };

    const calculateCompletion = () => {
        if (!data) return 0;
        const fields = ['name', 'email', 'phone', 'gender', 'photo', 'handlingyears', 'handlingbatches', 'handlingdepartments'];
        const filled = fields.filter(f => {
            const val = data[f as keyof ProfileData];
            if (Array.isArray(val)) return val.length > 0;
            return val && val !== 'N/A' && val !== 'undefined' && val !== '';
        });
        return Math.round((filled.length / fields.length) * 100);
    };

    if (loading) return (
        <SafeAreaView style={styles.container}>
            <ActivityIndicator size="large" color="#7c3aed" style={{ flex: 1 }} />
        </SafeAreaView>
    );

    const completion = calculateCompletion();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#5b21b6' }}>
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Incharge Profile</Text>
                    <View style={{ width: 80 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View style={styles.topSection}>
                        <View style={styles.completionCard}>
                            <View style={styles.completionHeader}>
                                <Text style={styles.completionTitle}>Profile Completion</Text>
                                <Text style={styles.completionPercent}>{completion}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${completion}%`, backgroundColor: completion === 100 ? COLORS.success : '#a78bfa' }]} />
                            </View>
                            <Text style={styles.completionSub}>
                                {completion === 100 ? "Perfect! Your profile is fully complete." : "Please complete all fields for a professional profile."}
                            </Text>
                        </View>

                        <View style={styles.hero}>
                            <TouchableOpacity onPress={pickImage} disabled={!isEditing} style={styles.avatarWrapper}>
                                <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                                {isEditing && <View style={styles.editBadge}><Text style={{ fontSize: 12 }}>📷</Text></View>}
                            </TouchableOpacity>
                            <Text style={styles.name}>{data?.name}</Text>
                            <View style={styles.badge}><Text style={styles.badgeText}>{data?.role}</Text></View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Personal Information</Text>
                        <Text style={styles.cardSubText}>Your basic profile and contact details.</Text>

                        {!isEditing ? (
                            <>
                                <InfoRow label="Full Name" value={data?.name} emoji="👤" />
                                <InfoRow label="Email Address" value={data?.email} emoji="📧" />
                                <InfoRow label="Phone Number" value={data?.phone} emoji="📱" />
                                <InfoRow label="Gender" value={data?.gender ? (data.gender.charAt(0).toUpperCase() + data.gender.slice(1)) : 'Not specified'} emoji="🚻" />
                            </>
                        ) : (
                            <View style={{ gap: 16, marginTop: 10 }}>
                                <EditField label="Full Name" value={editData?.name} onChange={(t: string) => setEditData(prev => ({ ...prev!, name: t }))} />
                                <EditField label="Email" value={editData?.email} onChange={(t: string) => setEditData(prev => ({ ...prev!, email: t }))} keyboardType="email-address" />
                                <EditField label="Phone" value={editData?.phone} onChange={(t: string) => setEditData(prev => ({ ...prev!, phone: t }))} keyboardType="phone-pad" />
                                
                                <View>
                                    <Text style={styles.editLabel}>Gender</Text>
                                    <View style={styles.pickerContainer}>
                                        {['male', 'female'].map((g: string) => (
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
                            </View>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Handling Details</Text>
                        <Text style={styles.cardSubText}>Manage years, batches, and departments.</Text>
                        
                        <View style={{ marginTop: 10, gap: 20 }}>
                            <MultiSelectSection 
                                label="Handling Years" 
                                selected={isEditing ? editData!.handlingyears : data!.handlingyears} 
                                options={yearOptions}
                                isEditing={isEditing}
                                onToggle={(item: string) => toggleArrayItem('handlingyears', item)}
                                emoji="📅"
                            />
                            <MultiSelectSection 
                                label="Handling Batches" 
                                selected={isEditing ? editData!.handlingbatches : data!.handlingbatches} 
                                options={batchOptions}
                                isEditing={isEditing}
                                onToggle={(item: string) => toggleArrayItem('handlingbatches', item)}
                                emoji="🎓"
                            />
                            <MultiSelectSection 
                                label="Handling Departments" 
                                selected={isEditing ? editData!.handlingdepartments : data!.handlingdepartments} 
                                options={deptOptions}
                                isEditing={isEditing}
                                onToggle={(item: string) => toggleArrayItem('handlingdepartments', item)}
                                emoji="🏛️"
                            />
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                        {!isEditing ? (
                            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                                <Text style={styles.editBtnText}>Edit Profile</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ gap: 12 }}>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                                    {saving && <ActivityIndicator animating={saving} size="small" color={COLORS.white} style={{ position: 'absolute', left: 20 }} />}
                                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsEditing(false); setEditData(JSON.parse(JSON.stringify(data))); setImageUri(null); }}>
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

const MultiSelectSection = ({ label, selected, options, isEditing, onToggle, emoji }: any) => (
    <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 18 }}>{emoji}</Text>
            <Text style={styles.editLabel}>{label}</Text>
        </View>
        <View style={styles.chipContainer}>
            {(isEditing ? options : selected).map((item: string) => {
                const isActive = selected.includes(item);
                if (!isEditing && !isActive) return null;
                return (
                    <TouchableOpacity 
                        key={item} 
                        disabled={!isEditing}
                        onPress={() => onToggle(item)}
                        style={[
                            styles.chip, 
                            isActive && styles.chipActive,
                            !isEditing && { paddingRight: 16 }
                        ]}
                    >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item}</Text>
                        {isEditing && (
                            <View style={[styles.chipIndicator, isActive && styles.chipIndicatorActive]}>
                                <Text style={{ fontSize: 10, color: isActive ? COLORS.white : '#94a3b8' }}>{isActive ? '✓' : '+'}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
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
        backgroundColor: '#5b21b6'
    },
    headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80 },
    headerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },

    topSection: { backgroundColor: '#5b21b6', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 20, ...SHADOWS.medium },

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
    badge: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

    card: { margin: 16, backgroundColor: COLORS.white, borderRadius: 24, padding: 20, ...SHADOWS.medium, marginTop: -20 },
    cardTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    cardSubText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 16 },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 12 },
    infoIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
    infoLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '700' },

    editLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 0, marginLeft: 4 },
    input: { backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },

    pickerContainer: { flexDirection: 'row', gap: 10, marginTop: 8 },
    pickerItem: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.white },
    pickerItemActive: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
    pickerText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
    pickerTextActive: { color: '#7c3aed' },

    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingLeft: 16, paddingRight: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
    chipActive: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
    chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
    chipTextActive: { color: '#7c3aed' },
    chipIndicator: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f1f5f9', marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
    chipIndicatorActive: { backgroundColor: '#7c3aed' },

    editBtn: { backgroundColor: '#7c3aed', paddingVertical: 15, borderRadius: 16, alignItems: 'center', ...SHADOWS.small },
    editBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

    saveBtn: { backgroundColor: COLORS.success, paddingVertical: 15, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

    cancelBtn: { paddingVertical: 12, alignItems: 'center' },
    cancelBtnText: { color: COLORS.textMuted, fontSize: 15, fontWeight: '600' },

    logoutBtn: { marginTop: 20, paddingVertical: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
    logoutBtnText: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
});

export default YearInchargeProfileScreen;
