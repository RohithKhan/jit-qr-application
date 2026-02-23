import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { User } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';

const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const [user, setUser] = useState<User>({
        name: '', staffid: { id: '', name: '' }, registerNumber: '', department: '',
        semester: 0, year: '', email: '', phone: '', photo: '', batch: '', gender: 'male',
        parentnumber: '', residencetype: '', hostelname: '', hostelroomno: '', busno: '', boardingpoint: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [completionPercentage, setCompletionPercentage] = useState(0);

    useEffect(() => { fetchProfile(); }, []);

    useEffect(() => {
        const fields: (keyof User)[] = ['name', 'email', 'phone', 'parentnumber', 'registerNumber',
            'department', 'year', 'semester', 'batch', 'gender', 'photo', 'residencetype'];
        let required = [...fields];
        if (user.residencetype === 'hostel') required.push('hostelname', 'hostelroomno');
        else if (user.residencetype === 'day scholar') required.push('busno', 'boardingpoint');
        const filled = required.filter(f => {
            const v = user[f];
            return v !== null && v !== undefined && v !== '' && v !== 0;
        });
        setCompletionPercentage(Math.round((filled.length / required.length) * 100));
    }, [user]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/api/profile');
            if (res.status === 200) setUser(prev => ({ ...prev, ...res.data.user }));
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch profile' }); }
        finally { setLoading(false); }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required', 'Gallery permission is needed.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const compressed = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 800 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
            setImageUri(compressed.uri);
            setUser(prev => ({ ...prev, photo: compressed.uri }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (imageUri) {
                const formData = new FormData();
                Object.keys(user).forEach(key => {
                    const val = user[key as keyof User];
                    if (val !== null && val !== undefined && key !== 'photo') {
                        formData.append(key, String(val));
                    }
                });
                formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'profile.jpg' } as any);
                await api.put('/api/profile/update', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.put('/api/profile/update', user);
            }
            Toast.show({ type: 'success', text1: 'Profile updated successfully!' });
            setIsEditing(false);
            setImageUri(null);
        } catch {
            Toast.show({ type: 'error', text1: 'Failed to update profile' });
        } finally { setSaving(false); }
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
        if (!user.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0047AB&color=fff&size=200`;
        if (user.photo.startsWith('http') || user.photo.startsWith('file')) return user.photo;
        return `${CDN_URL}${user.photo}`;
    };

    if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
            </View>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.card}>
                    <TouchableOpacity onPress={isEditing ? pickImage : undefined} style={styles.avatarContainer}>
                        <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                        {isEditing && <View style={styles.avatarBadge}><Text style={styles.avatarBadgeText}>📷</Text></View>}
                    </TouchableOpacity>
                    <Text style={styles.name}>{user.name || 'Your Name'}</Text>
                    <Text style={styles.role}>Student</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>{user.department || 'Department'}</Text></View>

                    {/* Progress */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Profile Completion</Text>
                            <Text style={styles.progressValue}>{completionPercentage}%</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${completionPercentage}%` as any, backgroundColor: completionPercentage === 100 ? COLORS.success : COLORS.primary }]} />
                        </View>
                    </View>

                    {!isEditing
                        ? <TouchableOpacity style={styles.btn} onPress={() => setIsEditing(true)}><Text style={styles.btnText}>Edit Profile</Text></TouchableOpacity>
                        : <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.btnText}>Save Changes</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnGhost} onPress={() => setIsEditing(false)}><Text style={styles.btnGhostText}>Cancel</Text></TouchableOpacity>
                        </View>
                    }
                </View>

                {/* Personal Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.card}>
                        {[
                            { label: 'Full Name', key: 'name', keyboard: 'default' },
                            { label: 'Email', key: 'email', keyboard: 'email-address' },
                            { label: 'Phone', key: 'phone', keyboard: 'phone-pad' },
                            { label: 'Parent Phone', key: 'parentnumber', keyboard: 'phone-pad' },
                            { label: 'Register Number', key: 'registerNumber', keyboard: 'default' },
                        ].map(({ label, key, keyboard }) => (
                            <View key={key} style={styles.inputGroup}>
                                <Text style={styles.label}>{label}</Text>
                                <TextInput
                                    style={[styles.input, !isEditing && styles.inputDisabled]}
                                    value={String(user[key as keyof User] || '')}
                                    onChangeText={(v) => setUser(prev => ({ ...prev, [key]: v }))}
                                    editable={isEditing}
                                    keyboardType={keyboard as any}
                                    autoCapitalize="none"
                                />
                            </View>
                        ))}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={[styles.pickerWrap, !isEditing && styles.inputDisabled]}>
                                <Picker selectedValue={user.gender} onValueChange={(v) => isEditing && setUser(prev => ({ ...prev, gender: v }))} enabled={isEditing}>
                                    <Picker.Item label="Male" value="male" />
                                    <Picker.Item label="Female" value="female" />
                                </Picker>
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Year</Text>
                            <View style={[styles.pickerWrap, !isEditing && styles.inputDisabled]}>
                                <Picker selectedValue={user.year} onValueChange={(v) => isEditing && setUser(prev => ({ ...prev, year: v }))} enabled={isEditing}>
                                    <Picker.Item label="Select Year" value="" />
                                    {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <Picker.Item key={y} label={y} value={y} />)}
                                </Picker>
                            </View>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Batch</Text>
                            <View style={[styles.pickerWrap, !isEditing && styles.inputDisabled]}>
                                <Picker selectedValue={user.batch} onValueChange={(v) => isEditing && setUser(prev => ({ ...prev, batch: v }))} enabled={isEditing}>
                                    <Picker.Item label="Select Batch" value="" />
                                    {['2022-2026', '2023-2027', '2024-2028', '2025-2029', '2026-2030'].map(b => <Picker.Item key={b} label={b} value={b} />)}
                                </Picker>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Residence Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Residence Details</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Residence Type</Text>
                            <View style={[styles.pickerWrap, !isEditing && styles.inputDisabled]}>
                                <Picker selectedValue={user.residencetype} onValueChange={(v) => isEditing && setUser(prev => ({ ...prev, residencetype: v }))} enabled={isEditing}>
                                    <Picker.Item label="Select Type" value="" />
                                    <Picker.Item label="Day Scholar" value="day scholar" />
                                    <Picker.Item label="Hostel" value="hostel" />
                                </Picker>
                            </View>
                        </View>
                        {user.residencetype === 'hostel' && <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Hostel Name</Text>
                                <View style={[styles.pickerWrap, !isEditing && styles.inputDisabled]}>
                                    <Picker selectedValue={user.hostelname} onValueChange={(v) => isEditing && setUser(prev => ({ ...prev, hostelname: v }))} enabled={isEditing}>
                                        <Picker.Item label="Select Hostel" value="" />
                                        <Picker.Item label="M.G.R illam" value="M.G.R" />
                                        <Picker.Item label="Janaki ammal illam" value="Janaki ammal" />
                                    </Picker>
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Room Number</Text>
                                <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={user.hostelroomno} onChangeText={v => setUser(prev => ({ ...prev, hostelroomno: v }))} editable={isEditing} />
                            </View>
                        </>}
                        {user.residencetype === 'day scholar' && <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Bus Number</Text>
                                <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={user.busno} onChangeText={v => setUser(prev => ({ ...prev, busno: v }))} editable={isEditing} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Boarding Point</Text>
                                <TextInput style={[styles.input, !isEditing && styles.inputDisabled]} value={user.boardingpoint} onChangeText={v => setUser(prev => ({ ...prev, boardingpoint: v }))} editable={isEditing} />
                            </View>
                        </>}
                    </View>
                </View>

                {/* Academic Details */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                    <Text style={styles.sectionTitle}>Academic Details</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.statBox, { backgroundColor: '#EFF6FF' }]}>
                                <Text style={styles.statVal}>{user.cgpa ?? '—'}</Text>
                                <Text style={styles.statLabel}>CGPA</Text>
                            </View>
                            <View style={[styles.statBox, { backgroundColor: '#FFF7ED' }]}>
                                <Text style={styles.statVal}>{user.arrears ?? '0'}</Text>
                                <Text style={styles.statLabel}>Arrears</Text>
                            </View>
                        </View>
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
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
    scroll: { flex: 1 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18, marginHorizontal: 16, marginTop: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    avatarContainer: { alignSelf: 'center', marginBottom: 12, position: 'relative' },
    avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: COLORS.primary },
    avatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
    avatarBadgeText: { fontSize: 14 },
    name: { textAlign: 'center', fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    role: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, marginBottom: 8 },
    badge: { alignSelf: 'center', backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
    badgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
    progressContainer: { marginBottom: 16 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
    progressValue: { fontSize: 13, color: COLORS.primary, fontWeight: '800' },
    progressBar: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    btn: { backgroundColor: COLORS.primary, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    btnGhost: { borderWidth: 1.5, borderColor: COLORS.border, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flex: 1, marginLeft: 8 },
    btnGhostText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 15 },
    actionRow: { flexDirection: 'row', gap: 8 },
    section: { marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: 16, paddingTop: 12, marginBottom: 0 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
    input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.border },
    inputDisabled: { backgroundColor: '#f1f5f9', opacity: 0.7 },
    pickerWrap: { backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden' },
    row: { flexDirection: 'row', gap: 12 },
    statBox: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
    statVal: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
    statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 4 },
});

export default ProfileScreen;
