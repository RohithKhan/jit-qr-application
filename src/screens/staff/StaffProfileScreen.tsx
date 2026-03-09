import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, TextInput, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';
import { StaffUser } from '../../types';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';
import { handleGlobalLogout } from '../../utils/authHelper';
import { DEPARTMENTS, DESIGNATIONS } from '../../constants/dropdownOptions';

const StaffProfileScreen = () => {
    const navigation = useNavigation<any>();
    const [staff, setStaff] = useState<StaffUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    // Edit mode states
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});

    // Temporary states for array inputs
    const [newSubject, setNewSubject] = useState('');
    const [newSkill, setNewSkill] = useState('');
    const [newAchievement, setNewAchievement] = useState('');

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            // 1. Try to load from cache first for instant UI
            const cached = await AsyncStorage.getItem('staff_profile');
            if (cached) {
                const data = JSON.parse(cached);
                setStaff(data);
                setFormData({
                    ...data,
                    subjects: data.subjects || [],
                    skills: data.skills || [],
                    achievements: data.achievements || []
                });
            }

            // 2. Fetch fresh data with cache buster
            const res = await api.get(`/staff/profile?t=${Date.now()}`);
            const freshData = res.data.staff || res.data;

            setStaff(freshData);
            setFormData({
                ...freshData,
                subjects: freshData.subjects || [],
                skills: freshData.skills || [],
                achievements: freshData.achievements || []
            });
            setLastUpdate(Date.now());

            // 3. Persist fresh data
            await AsyncStorage.setItem('staff_profile', JSON.stringify(freshData));
        } catch (err) {
            console.error('Fetch error:', err);
            Toast.show({ type: 'error', text1: 'Failed to fetch profile' });
        } finally { setLoading(false); }
    };

    const handleChange = (name: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleArrayAdd = (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        if (!value.trim()) return;
        setFormData((prev: any) => ({
            ...prev,
            [field]: [...(prev[field] || []), value]
        }));
        setter('');
    };

    const handleArrayRemove = (field: string, index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: prev[field].filter((_: any, i: number) => i !== index)
        }));
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
        setIsEditing(false);
        setSaving(true);
        try {
            const submitData = new FormData();

            // Append basic fields, explicitly ignoring immutable mongo keys and array fields
            Object.keys(formData).forEach(key => {
                if (['subjects', 'skills', 'achievements', 'photo', '_id', '__v', 'createdAt', 'updatedAt', 'id'].includes(key)) return;
                if (formData[key] !== undefined && formData[key] !== null && String(formData[key]).trim() !== '') {
                    submitData.append(key, String(formData[key]));
                }
            });

            // Append arrays
            if (formData.subjects && Array.isArray(formData.subjects)) formData.subjects.forEach((item: string) => submitData.append('subjects', item));
            if (formData.skills && Array.isArray(formData.skills)) formData.skills.forEach((item: string) => submitData.append('skills', item));
            if (formData.achievements && Array.isArray(formData.achievements)) formData.achievements.forEach((item: string) => submitData.append('achievements', item));

            // Append photo
            if (imageUri) {
                if (Platform.OS === 'web') {
                    const blobRes = await fetch(imageUri);
                    const blob = await blobRes.blob();
                    submitData.append('file', blob, 'profile.jpg');
                } else {
                    submitData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'profile.jpg' } as any);
                }
            }

            const response = await api.put('/staff/profile/update', submitData, { headers: { 'Content-Type': 'multipart/form-data' } });

            // Immediately update state and storage from response if available
            const updatedData = response.data.staff || response.data.data || formData;
            setStaff(updatedData);
            await AsyncStorage.setItem('staff_profile', JSON.stringify(updatedData));
            setLastUpdate(Date.now());

            Toast.show({ type: 'success', text1: 'Profile updated successfully!' });
            setImageUri(null);
            fetchProfile(); // Still fetch once to be absolutely sure
        } catch (error: any) {
            console.error('Update Error:', error);
            Toast.show({ type: 'error', text1: 'Update failed', text2: error?.response?.data?.message || 'Internal Server Error' });
            setIsEditing(true);
        } finally {
            setSaving(false);
        }
    };

    const getPhoto = () => {
        if (imageUri) return imageUri;
        const photoSrc = isEditing ? formData.photo : staff?.photo;
        if (!photoSrc || photoSrc === 'undefined') return `https://ui-avatars.com/api/?name=${encodeURIComponent(formData?.name || staff?.name || 'Staff')}&background=0047AB&color=fff&size=200`;
        const normalizedPath = typeof photoSrc === 'string' ? photoSrc.replace(/\\/g, '/') : photoSrc;
        const baseUrl = normalizedPath.startsWith('http') ? normalizedPath : `${CDN_URL}${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
        // Add cache buster to ensure new image content is shown even if filename is same
        return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${lastUpdate}`;
    };

    const getMissingFields = () => {
        if (!staff && !formData.name) return [];
        const data = isEditing ? { ...staff, ...formData } : staff;
        if (!data) return [];

        const missing: string[] = [];
        if (!data.name?.trim()) missing.push('Name');
        if (!data.email?.trim()) missing.push('Email');
        if (!data.contactNumber?.trim() && !data.phone?.trim()) missing.push('Phone Number');
        if (!data.department?.trim()) missing.push('Department');
        if (!data.designation?.trim()) missing.push('Designation');
        if (!data.photo?.trim() && !imageUri) missing.push('Profile Photo');

        if (!data.subjects || data.subjects.length === 0) missing.push('Handling Subjects');
        if (!data.skills || data.skills.length === 0) missing.push('Knowledge & Skills');
        if (!data.achievements || data.achievements.length === 0) missing.push('Achievements');

        return missing;
    };

    const missingFields = getMissingFields();
    const completionPercentage = (() => {
        const missingCount = missingFields.length;
        return Math.round(((9 - missingCount) / 9) * 100);
    })();

    const getProgressColor = (percent: number) => {
        if (percent < 50) return COLORS.danger;
        if (percent < 80) return COLORS.warning;
        return COLORS.success;
    };

    const handleLogout = handleGlobalLogout;

    const renderInput = (label: string, name: string, value: string, placeholder: string, keyboardType: any = 'default', editable: boolean = true) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, !editable && styles.inputDisabled]}
                value={value}
                onChangeText={(text) => handleChange(name, text)}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textLight}
                keyboardType={keyboardType}
                editable={editable}
            />
        </View>
    );

    const renderPicker = (label: string, name: string, value: string, options: string[]) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={value || ''}
                    onValueChange={(itemValue) => handleChange(name, itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label={`Select ${label}`} value="" color={COLORS.textLight} />
                    {options.map((opt) => (
                        <Picker.Item key={opt} label={opt} value={opt} color={COLORS.textPrimary} />
                    ))}
                </Picker>
            </View>
        </View>
    );

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Staff Profile</Text>
                    {!isEditing ? (
                        <TouchableOpacity onPress={() => setIsEditing(true)}>
                            <Text style={styles.editBtnText}>✏️ Edit</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => { setIsEditing(false); setFormData(staff); }}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Completion Progress Bar */}
                    <View style={[styles.card, styles.completionCard]}>
                        <View style={styles.completionHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.completionTitle}>Profile Completion</Text>
                                {missingFields.length > 0 && (
                                    <Text style={styles.missingFieldsText}>Missing: {missingFields.join(', ')}</Text>
                                )}
                            </View>
                            <Text style={[styles.completionValue, { color: getProgressColor(completionPercentage) }]}>
                                {completionPercentage}%
                            </Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${completionPercentage}%`, backgroundColor: getProgressColor(completionPercentage) }]} />
                        </View>
                        {completionPercentage < 100 && (
                            <Text style={styles.completionHint}>Complete your profile to ensure accurate records.</Text>
                        )}
                    </View>

                    {/* Hero Section */}
                    <View style={styles.hero}>
                        <TouchableOpacity onPress={isEditing ? pickImage : undefined} style={styles.avatarContainer} disabled={!isEditing}>
                            <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                            {isEditing && (
                                <View style={styles.editBadge}><Text style={styles.editBadgeText}>📷</Text></View>
                            )}
                        </TouchableOpacity>

                        {!isEditing ? (
                            <>
                                <Text style={styles.name}>{staff?.name}</Text>
                                <Text style={styles.designation}>{staff?.designation || 'Faculty'}</Text>
                                <View style={styles.badge}><Text style={styles.badgeText}>{staff?.department || 'Department'}</Text></View>
                            </>
                        ) : (
                            <View style={styles.editBasics}>
                                {renderInput('Full Name', 'name', formData.name, 'Enter full name')}
                                {renderPicker('Designation', 'designation', formData.designation, DESIGNATIONS)}
                                {renderPicker('Department', 'department', formData.department, DEPARTMENTS)}
                                {renderInput('Experience (Years)', 'experience', String(formData.experience || ''), 'E.g., 5', 'numeric')}
                                {renderInput('Qualification', 'qualification', formData.qualification, 'E.g., Ph.D, M.Tech')}
                            </View>
                        )}
                    </View>

                    {/* Info Card */}
                    {!isEditing && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>📋 Basic Information</Text>
                            {[
                                { label: 'Email', value: staff?.email, emoji: '📧' },
                                { label: 'Phone', value: staff?.phone || staff?.contactNumber, emoji: '📱', fallback: 'Not provided' },
                                { label: 'Staff ID', value: staff?.id, emoji: '🆔' },
                                { label: 'Qualification', value: staff?.qualification, emoji: '🎓', fallback: 'Not provided' },
                                { label: 'Experience', value: staff?.experience ? `${staff.experience} Years` : null, emoji: '⏳', fallback: 'Not provided' },
                            ].map(({ label, value, emoji, fallback }) => (value || fallback) ? (
                                <View key={label} style={styles.infoRow}>
                                    <Text style={styles.infoEmoji}>{emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoLabel}>{label}</Text>
                                        <Text style={styles.infoValue}>{value || fallback}</Text>
                                    </View>
                                </View>
                            ) : null)}
                        </View>
                    )}

                    {isEditing && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>📞 Contact Information</Text>
                            {renderInput('Email Address', 'email', formData.email, 'Enter email address', 'email-address')}
                            {renderInput('Phone Number', 'contactNumber', formData.contactNumber || formData.phone, 'Enter phone number', 'phone-pad')}
                        </View>
                    )}

                    {/* Arrays Sections */}
                    {/* Subjects */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>📚 Subjects Handled</Text>
                        {!isEditing ? (
                            <View style={styles.tagsContainer}>
                                {staff?.subjects && staff.subjects.length > 0 ? (
                                    staff.subjects.map((sub: string, i: number) => (
                                        <View key={i} style={styles.tag}>
                                            <Text style={styles.tagText}>{sub}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.textMuted}>No subjects added yet.</Text>
                                )}
                            </View>
                        ) : (
                            <View>
                                {formData.subjects?.map((sub: string, i: number) => (
                                    <View key={i} style={styles.editArrayRow}>
                                        <Text style={styles.editArrayText}>📖 {sub}</Text>
                                        <TouchableOpacity onPress={() => handleArrayRemove('subjects', i)}>
                                            <Text style={styles.removeBtn}>✖</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <View style={styles.addArrayRow}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                        value={newSubject}
                                        onChangeText={setNewSubject}
                                        placeholder="Add new subject"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                    <TouchableOpacity style={styles.addBtn} onPress={() => handleArrayAdd('subjects', newSubject, setNewSubject)}>
                                        <Text style={styles.addBtnText}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Skills */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>💡 Knowledge & Skills</Text>
                        {!isEditing ? (
                            <View style={styles.tagsContainer}>
                                {staff?.skills && staff.skills.length > 0 ? (
                                    staff.skills.map((skill: string, i: number) => (
                                        <View key={i} style={[styles.tag, styles.skillTag]}>
                                            <Text style={[styles.tagText, styles.skillTagText]}>{skill}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.textMuted}>No skills added yet.</Text>
                                )}
                            </View>
                        ) : (
                            <View>
                                <View style={styles.tagsContainer}>
                                    {formData.skills?.map((skill: string, i: number) => (
                                        <View key={i} style={[styles.tag, styles.skillTag, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                                            <Text style={[styles.tagText, styles.skillTagText]}>{skill}</Text>
                                            <TouchableOpacity onPress={() => handleArrayRemove('skills', i)}>
                                                <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: 'bold' }}>✖</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                                <View style={[styles.addArrayRow, { marginTop: 12 }]}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                        value={newSkill}
                                        onChangeText={setNewSkill}
                                        placeholder="Add skill"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                    <TouchableOpacity style={styles.addBtn} onPress={() => handleArrayAdd('skills', newSkill, setNewSkill)}>
                                        <Text style={styles.addBtnText}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Achievements */}
                    <View style={[styles.card, { marginBottom: 40 }]}>
                        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
                        {!isEditing ? (
                            <View style={{ gap: 12 }}>
                                {staff?.achievements && staff.achievements.length > 0 ? (
                                    staff.achievements.map((achievement: string, i: number) => (
                                        <View key={i} style={styles.achievementRow}>
                                            <Text style={styles.achievementCheck}>✓</Text>
                                            <Text style={styles.achievementText}>{achievement}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.textMuted}>No achievements added yet.</Text>
                                )}
                            </View>
                        ) : (
                            <View>
                                {formData.achievements?.map((achievement: string, i: number) => (
                                    <View key={i} style={styles.editArrayRow}>
                                        <Text style={[styles.editArrayText, { flex: 1 }]}>✓ {achievement}</Text>
                                        <TouchableOpacity onPress={() => handleArrayRemove('achievements', i)}>
                                            <Text style={styles.removeBtn}>✖</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <View style={[styles.addArrayRow, { marginTop: 8 }]}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                        value={newAchievement}
                                        onChangeText={setNewAchievement}
                                        placeholder="Add achievement"
                                        placeholderTextColor={COLORS.textLight}
                                    />
                                    <TouchableOpacity style={styles.addBtn} onPress={() => handleArrayAdd('achievements', newAchievement, setNewAchievement)}>
                                        <Text style={styles.addBtnText}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {isEditing && (imageUri || formData !== staff) && (
                        <TouchableOpacity
                            style={[styles.saveBtnBottom, saving && styles.btnDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '💾 Save All Changes'}</Text>
                        </TouchableOpacity>
                    )}

                    {!isEditing && (
                        <TouchableOpacity style={{ alignItems: 'center', marginTop: 10, marginBottom: 40 }} onPress={handleLogout}>
                            <Text style={{ color: COLORS.danger, fontWeight: '600', fontSize: 16 }}>Logout</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingVertical: 18, gap: 12 },
    backBtn: { padding: 4 },
    backText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 19, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
    editBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15, paddingHorizontal: 8 },
    cancelBtnText: { color: '#fca5a5', fontWeight: '700', fontSize: 15, paddingHorizontal: 8 },
    hero: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 10, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, alignItems: 'center', ...SHADOWS.medium },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: COLORS.primary, ...SHADOWS.medium },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 15, width: 34, height: 34, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
    editBadgeText: { fontSize: 16 },
    name: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 6, letterSpacing: -0.5, textAlign: 'center' },
    designation: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 14, fontWeight: '500' },
    badge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    badgeText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    card: { backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 20, ...SHADOWS.medium, borderWidth: 1, borderColor: COLORS.border },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16, letterSpacing: -0.3 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    infoEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
    infoLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '700' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tag: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(65, 105, 225, 0.2)' },
    tagText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '700' },
    skillTag: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
    skillTagText: { color: '#374151' },
    achievementRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    achievementCheck: { color: '#10B981', fontSize: 18, fontWeight: '800' },
    achievementText: { color: COLORS.textPrimary, fontSize: 14, flex: 1, fontWeight: '500', lineHeight: 20 },
    textMuted: { color: COLORS.textMuted, fontStyle: 'italic', fontSize: 14 },

    // Completion Card Styles
    completionCard: { marginTop: -20, marginHorizontal: 20, zIndex: 10 },
    completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    completionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    missingFieldsText: { fontSize: 12, color: COLORS.danger, fontWeight: '500', marginTop: 4 },
    completionValue: { fontSize: 20, fontWeight: '800' },
    progressTrack: { width: '100%', height: 10, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 10 },
    completionHint: { marginTop: 10, fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

    // Form Edit Styles
    editBasics: { width: '100%', marginTop: 12, backgroundColor: COLORS.white, padding: 20, borderRadius: 20 },
    inputGroup: { marginBottom: 16, width: '100%' },
    inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary },
    inputDisabled: { backgroundColor: '#f1f5f9', color: COLORS.textMuted },
    pickerContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, overflow: 'hidden' },
    picker: Platform.OS === 'web' ? {
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
        backgroundColor: 'transparent',
        borderWidth: 0,
        outlineWidth: 0,
        width: '100%'
    } as any : {
        color: COLORS.textPrimary,
        height: 50,
        backgroundColor: 'transparent',
        width: '100%'
    },
    editArrayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
    editArrayText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
    removeBtn: { color: COLORS.danger, fontSize: 16, fontWeight: 'bold', paddingHorizontal: 8 },
    addArrayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    addBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 16, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    addBtnText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: 14 },

    saveBtnBottom: { backgroundColor: COLORS.primary, marginHorizontal: 16, marginBottom: 24, paddingVertical: 16, borderRadius: 16, alignItems: 'center', ...SHADOWS.medium },
    saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
    btnDisabled: { opacity: 0.65 },
    scrollContent: { paddingBottom: 120, flexGrow: 1 },
});

export default StaffProfileScreen;
