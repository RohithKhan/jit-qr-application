import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, TextInput, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

import { API_URL, COLORS, SHADOWS } from '../../constants/config';

const YearInchargeProfileScreen = () => {
    const { width } = useWindowDimensions();
    const isMediumScreen = width >= 768;
    const navigation = useNavigation<any>();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: 'Rohith',
        email: '',
        phone: '',
        gender: 'Male',
        handlingYear: '3rd Year',
        handlingBatch: '2023–2027',
        handlingDepartment: 'Information Technology',
    });

    const years = ['1st Year', '2nd Year', '3rd Year'];
    const batches = ['2022–2026', '2023–2027', '2024–2028', '2025–2029'];
    const departments = ['Information Technology', 'Electronics and Communication Engineering', 'Computer Science and Engineering'];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/incharge/profile`, { headers: { Authorization: `Bearer ${token}` } });
            const profile = res.data.yearincharge || res.data;
            if (profile) {
                setForm(prev => ({
                    ...prev,
                    name: profile.name || prev.name,
                    email: profile.email || prev.email,
                    phone: profile.phone || prev.phone,
                    gender: profile.gender || prev.gender,
                }));
            }
        } catch (err) {
            console.log('Profile fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.multiRemove(['token', 'isLoggedIn', 'userType']);
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    };

    const pickImage = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5
        });
        if (!res.canceled) setImageUri(res.assets[0].uri);
    };

    const getPhoto = () => {
        if (imageUri) return imageUri;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'S')}&background=3b82f6&color=fff&size=200`;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            Toast.show({ type: 'success', text1: 'Profile saved successfully!' });
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to save profile' });
        } finally {
            setSaving(false);
        }
    };

    const SelectablePill = ({ label, selected, onPress }: any) => (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.pill, selected && styles.pillSelected]}
            activeOpacity={0.7}
        >
            <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
        </TouchableOpacity>
    );

    const SelectableTag = ({ label, selected, onPress }: any) => (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.tag, selected && styles.tagSelected]}
            activeOpacity={0.7}
        >
            <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 5 }}
                contentContainerStyle={[styles.scrollContent, isMediumScreen && styles.scrollContentLarge]}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
            >
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    <View style={[styles.layoutRow, !isMediumScreen && styles.layoutCol]}>

                        {/* Profile Card Left */}
                        <View style={[styles.card, styles.leftCard, isMediumScreen && { flex: 1, marginRight: 24 }]}>
                            <View style={styles.profileHeader}>
                                <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                                    <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                                    <View style={styles.editIconBadge}>
                                        <Text style={{ fontSize: 16 }}>✏️</Text>
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.profileName}>{form.name}</Text>
                                <Text style={styles.profileRole}>Year Incharge</Text>
                                <TouchableOpacity style={styles.editProfileBtn}>
                                    <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.quickInfoSection}>
                                <View style={styles.quickInfoRow}>
                                    <Text style={styles.quickInfoIcon}>📧</Text>
                                    <View>
                                        <Text style={styles.quickInfoLabel}>Email</Text>
                                        <Text style={styles.quickInfoValue}>{form.email || 'Not provided'}</Text>
                                    </View>
                                </View>
                                <View style={styles.quickInfoRow}>
                                    <Text style={styles.quickInfoIcon}>📱</Text>
                                    <View>
                                        <Text style={styles.quickInfoLabel}>Phone</Text>
                                        <Text style={styles.quickInfoValue}>{form.phone || 'Not provided'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Form Card Right */}
                        <View style={[styles.card, styles.rightCard, isMediumScreen && { flex: 2.2 }]}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Personal Information</Text>
                                <Text style={styles.sectionSubtitle}>Manage your personal details.</Text>
                            </View>

                            <View style={[styles.formGrid, isMediumScreen && styles.formGridLarge]}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.name}
                                        onChangeText={val => setForm({ ...form, name: val })}
                                        placeholder="E.g. Rohith"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.email}
                                        onChangeText={val => setForm({ ...form, email: val })}
                                        placeholder="admin@college.edu"
                                        keyboardType="email-address"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Phone Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.phone}
                                        onChangeText={val => setForm({ ...form, phone: val })}
                                        placeholder="+91 9876543210"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Gender</Text>
                                    <View style={styles.pickerWrapper}>
                                        <Picker
                                            selectedValue={form.gender}
                                            onValueChange={(val) => setForm({ ...form, gender: val })}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Male" value="Male" />
                                            <Picker.Item label="Female" value="Female" />
                                            <Picker.Item label="Other" value="Other" />
                                        </Picker>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.sectionTitleSmall}>Handling Year</Text>
                            <View style={styles.chipsContainer}>
                                {years.map(yr => (
                                    <SelectablePill
                                        key={yr}
                                        label={yr}
                                        selected={form.handlingYear === yr}
                                        onPress={() => setForm({ ...form, handlingYear: yr })}
                                    />
                                ))}
                            </View>

                            <Text style={styles.sectionTitleSmall}>Handling Batch</Text>
                            <View style={styles.chipsContainer}>
                                {batches.map(bt => (
                                    <SelectableTag
                                        key={bt}
                                        label={bt}
                                        selected={form.handlingBatch === bt}
                                        onPress={() => setForm({ ...form, handlingBatch: bt })}
                                    />
                                ))}
                            </View>

                            <Text style={styles.sectionTitleSmall}>Handling Department</Text>
                            <View style={styles.chipsContainer}>
                                {departments.map(dept => (
                                    <SelectablePill
                                        key={dept}
                                        label={dept}
                                        selected={form.handlingDepartment === dept}
                                        onPress={() => setForm({ ...form, handlingDepartment: dept })}
                                    />
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 18,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: { padding: 8, marginLeft: -8 },
    backText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
    logoutBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 14 },

    scrollContent: { padding: 16, paddingBottom: 120 },
    scrollContentLarge: { padding: 40, paddingBottom: 120 },

    layoutRow: { flexDirection: 'row', width: '100%', maxWidth: 1000, alignSelf: 'center' },
    layoutCol: { flexDirection: 'column', width: '100%', alignSelf: 'center' },

    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        ...Platform.select({
            web: { boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)' } as any,
            default: {
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4
            }
        }),
        marginBottom: 24,
    },
    leftCard: { alignItems: 'center', paddingVertical: 36 },
    rightCard: { padding: 32 },

    profileHeader: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: { position: 'relative', marginBottom: 20 },
    avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: '#eff6ff' },
    editIconBadge: { position: 'absolute', bottom: 4, right: 8, backgroundColor: '#ffffff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
    profileName: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    profileRole: { fontSize: 16, color: '#64748b', fontWeight: '500', marginBottom: 20 },
    editProfileBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
    editProfileBtnText: { color: '#3b82f6', fontWeight: '700', fontSize: 14 },

    quickInfoSection: { width: '100%', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 24, gap: 20 },
    quickInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    quickInfoIcon: { fontSize: 22, width: 32, textAlign: 'center' },
    quickInfoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 2 },
    quickInfoValue: { fontSize: 14, color: '#334155', fontWeight: '600' },

    sectionHeader: { marginBottom: 32 },
    sectionTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    sectionSubtitle: { fontSize: 15, color: '#64748b' },

    formGrid: { flexWrap: 'wrap', flexDirection: 'column', gap: 20, marginBottom: 32, width: '100%' },
    formGridLarge: { flexDirection: 'row', justifyContent: 'space-between' },
    inputGroup: { flex: 1, minWidth: '100%', width: '100%' },
    label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0f172a' },
    pickerWrapper: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' },
    picker: { height: 50, color: '#0f172a', ...Platform.select({ web: { outline: 'none', border: 'none', backgroundColor: 'transparent' } as any, default: {} }) },

    divider: { height: 1, backgroundColor: '#f1f5f9', width: '100%', marginBottom: 32 },

    sectionTitleSmall: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },

    pill: { backgroundColor: '#f1f5f9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: 'transparent' },
    pillSelected: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
    pillText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    pillTextSelected: { color: '#2563eb', fontWeight: '700' },

    tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
    tagSelected: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
    tagText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
    tagTextSelected: { color: '#2563eb', fontWeight: '700' },

    saveBtn: { backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16, ...Platform.select({ web: { boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)' } as any, default: {} }) },
    saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});

export default YearInchargeProfileScreen;
