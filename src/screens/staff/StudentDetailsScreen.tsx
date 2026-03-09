import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput, Platform, Linking, Dimensions, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

const DEPARTMENTS = ['Computer Science and Engineering', 'Mechanical Engineering', 'Information Technology', 'Electronics and Communication Engineering', 'Artificial Intelligence and Data Science', 'Master of Business Administration'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const StudentDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params || {};

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'residence'>('profile');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) {
            Toast.show({ type: 'error', text1: 'Student ID missing' });
            navigation.goBack();
            return;
        }
        fetchStudentDetails();
    }, [id]);

    const fetchStudentDetails = async () => {
        setLoading(true);
        try {
            const res = await api.post('/staff/student', { id });
            setStudent(res.data?.student || null);
            setFormData(res.data?.student || {});
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Failed to fetch details', text2: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await api.post(`/staff/student/update/${id}`, formData);
            Toast.show({ type: 'success', text1: 'Student updated successfully' });
            setIsEditing(false);
            fetchStudentDetails();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to update student' });
        } finally {
            setSaving(false);
        }
    };

    const handleBlockToggle = async () => {
        const newStatus = !student?.isblocked;
        try {
            await api.post(`/staff/student/update/${id}`, { isblocked: newStatus });
            Toast.show({ type: 'success', text1: newStatus ? 'Student blocked' : 'Student unblocked' });
            setStudent({ ...student, isblocked: newStatus });
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to change block status' });
        }
    };

    const handleDelete = () => {
        // Implement full delete logic if needed or show a confirmation modal first.
        Toast.show({ type: 'info', text1: 'Delete functionality requires confirmation modal' });
    };

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (!student) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>Student not found</Text>
                <TouchableOpacity style={styles.backBtnWrapper} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const renderField = (label: string, fieldKey: string, keyboardType: any = 'default', isPicker: boolean = false, options: string[] = []) => {
        const value = formData[fieldKey];
        if (!isEditing) {
            return (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value || 'Not Provided'}</Text>
                </View>
            );
        }

        return (
            <View style={styles.editRow}>
                <Text style={styles.editLabel}>{label}</Text>
                {isPicker ? (
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={value || ''}
                            onValueChange={(val) => handleChange(fieldKey, val)}
                            style={styles.picker}
                        >
                            <Picker.Item label={`Select ${label}`} value="" color={COLORS.textLight} />
                            {options.map((opt) => (
                                <Picker.Item key={opt} label={opt} value={opt} />
                            ))}
                        </Picker>
                    </View>
                ) : (
                    <TextInput
                        style={styles.fieldInput}
                        value={value?.toString() || ''}
                        onChangeText={(val) => handleChange(fieldKey, val)}
                        keyboardType={keyboardType}
                        placeholder={`Enter ${label}`}
                        placeholderTextColor={COLORS.textLight}
                    />
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Student Profile</Text>
                    <TouchableOpacity onPress={() => {
                        if (isEditing) fetchStudentDetails(); // Reset
                        setIsEditing(!isEditing);
                    }}>
                        <Text style={[styles.headerAction, isEditing && styles.headerActionCancel]}>
                            {isEditing ? 'Cancel' : 'Edit'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Top Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            {student.photo ? (
                                <View style={[styles.avatar, { overflow: 'hidden', backgroundColor: 'transparent' }]}>
                                    <Image
                                        source={{ uri: student.photo.startsWith('http') ? student.photo : `${CDN_URL}${student.photo}` }}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </View>
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{student.name?.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                        {isEditing ? (
                            <View style={{ marginHorizontal: 20, marginTop: 16 }}>
                                <TextInput
                                    style={[styles.fieldInput, { textAlign: 'center', fontSize: 20, fontWeight: '700', backgroundColor: 'transparent', borderBottomWidth: 2, borderRadius: 0, paddingVertical: 4 }]}
                                    value={formData.name}
                                    onChangeText={(val) => handleChange('name', val)}
                                    placeholder="Full Name"
                                />
                            </View>
                        ) : (
                            <Text style={styles.profileName}>{student.name}</Text>
                        )}
                        <View style={styles.badgeRow}>
                            <Text style={styles.regBadge}>{student.registerNumber || student.registerNo || 'No Reg No'}</Text>
                            {student.isblocked && <Text style={styles.blockedBadge}>Blocked</Text>}
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        {[
                            { id: 'profile', icon: 'person-outline', label: 'Profile' },
                            { id: 'academic', icon: 'school-outline', label: 'Academic' },
                            { id: 'residence', icon: 'business-outline', label: 'Residence' },
                        ].map(tab => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                                onPress={() => setActiveTab(tab.id as any)}
                            >
                                <Ionicons name={tab.icon as any} size={20} color={activeTab === tab.id ? COLORS.primary : COLORS.textMuted} />
                                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Content */}
                    <View style={styles.contentSection}>
                        {activeTab === 'profile' && (
                            <View style={styles.infoCard}>
                                <Text style={styles.sectionTitle}>Personal details</Text>
                                {renderField('Email Address', 'email', 'email-address')}
                                {renderField('Phone Number', 'phone', 'phone-pad')}
                                {renderField('Parent Number', 'parentnumber', 'phone-pad')}
                                {renderField('Gender', 'gender', 'default', true, ['male', 'female'])}

                                {!isEditing && (
                                    <View style={styles.actionsContainer}>
                                        <TouchableOpacity style={[styles.actionBtn, student.isblocked ? styles.btnSuccess : styles.btnDanger]} onPress={handleBlockToggle}>
                                            <MaterialIcons name={student.isblocked ? "check-circle" : "block"} size={20} color={student.isblocked ? COLORS.success : COLORS.danger} />
                                            <Text style={[styles.actionBtnText, { color: student.isblocked ? COLORS.success : COLORS.danger }]}>
                                                {student.isblocked ? 'Unblock Student' : 'Block Student'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'academic' && (
                            <View style={styles.infoCard}>
                                <Text style={styles.sectionTitle}>Academic details</Text>
                                {renderField('Department', 'department', 'default', true, DEPARTMENTS)}
                                {renderField('Year', 'year', 'default', true, YEARS)}
                                {renderField('Semester', 'semester', 'numeric')}
                                {renderField('Batch', 'batch')}
                                {renderField('CGPA', 'cgpa', 'numeric')}
                                {renderField('Arrears', 'arrears', 'numeric')}
                            </View>
                        )}

                        {activeTab === 'residence' && (
                            <View style={styles.infoCard}>
                                <Text style={styles.sectionTitle}>Residence Details</Text>
                                {renderField('Residence Type', 'residencetype', 'default', true, ['hostel', 'day scholar'])}

                                {(formData.residencetype === 'hostel' || student.residencetype === 'hostel') && (
                                    <>
                                        {renderField('Hostel Name', 'hostelname')}
                                        {renderField('Room Number', 'hostelroomno')}
                                    </>
                                )}

                                {(formData.residencetype === 'day scholar' || student.residencetype === 'day scholar') && (
                                    <>
                                        {renderField('Boarding Point', 'boardingpoint')}
                                        {renderField('Bus Number', 'busno')}
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>

                {isEditing && (
                    <View style={styles.floatingFooter}>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={saving}>
                            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    errorText: { fontSize: 18, color: COLORS.textSecondary, marginBottom: 16 },
    backBtnWrapper: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: COLORS.primaryLight, borderRadius: 8 },
    backBtnText: { color: COLORS.primary, fontWeight: '600' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primaryDark, paddingHorizontal: 16, paddingVertical: 18, paddingTop: 10 },
    headerBack: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
    headerAction: { fontSize: 16, fontWeight: '700', color: COLORS.primaryLight, padding: 4 },
    headerActionCancel: { color: '#fca5a5' },

    profileCard: { backgroundColor: COLORS.primaryDark, paddingTop: 10, paddingBottom: 32, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...SHADOWS.medium },
    avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 16 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 36, fontWeight: '700', color: COLORS.primary },
    profileName: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 8 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    regBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, color: COLORS.white, fontSize: 13, fontWeight: '600', overflow: 'hidden' },
    blockedBadge: { backgroundColor: COLORS.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, color: COLORS.white, fontSize: 13, fontWeight: '700', overflow: 'hidden' },

    tabsContainer: { flexDirection: 'row', backgroundColor: COLORS.white, marginTop: 16, marginHorizontal: 16, borderRadius: 16, padding: 4, ...SHADOWS.small },
    tab: { flex: 1, flexDirection: 'row', paddingVertical: 12, justifyContent: 'center', alignItems: 'center', gap: 6, borderRadius: 12 },
    activeTab: { backgroundColor: COLORS.primaryLight },
    tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    activeTabText: { color: COLORS.primary },

    contentSection: { padding: 16 },
    infoCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, ...SHADOWS.small },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },

    infoRow: { marginBottom: 16 },
    infoLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
    editRow: { marginBottom: 16 },
    editLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
    pickerContainer: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, overflow: 'hidden' },

    fieldDisplay: { marginBottom: 16 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    fieldValue: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
    fieldInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: COLORS.textPrimary },
    pickerWrap: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, overflow: 'hidden' },
    picker: Platform.OS === 'web' ? { paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: COLORS.textPrimary, backgroundColor: 'transparent', borderWidth: 0, outlineWidth: 0, width: '100%' } as any : { color: COLORS.textPrimary, height: 45, width: '100%' },

    actionsContainer: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
    btnDanger: { borderColor: COLORS.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
    btnSuccess: { borderColor: COLORS.success, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    actionBtnText: { fontSize: 15, fontWeight: '600' },

    floatingFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.medium },
    saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default StudentDetailsScreen;
