import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StaffUser } from '../../types';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';

const StudentViewStaffProfileScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const staff: StaffUser = route.params?.staff;

    const getPhoto = () => {
        if (!staff?.photo) return `https://ui-avatars.com/api/?name=${encodeURIComponent(staff?.name || 'Staff')}&background=0047AB&color=fff&size=200`;
        return staff.photo.startsWith('http') ? staff.photo : `${CDN_URL}${staff.photo}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Staff Profile</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Image source={{ uri: getPhoto() }} style={styles.avatar} />
                    <Text style={styles.name}>{staff?.name}</Text>
                    <Text style={styles.designation}>{staff?.designation || 'Faculty'}</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>{staff?.department || 'Department'}</Text></View>
                </View>
                <View style={styles.card}>
                    {[
                        { label: 'Email', value: staff?.email, emoji: '📧' },
                        { label: 'Phone', value: staff?.phone || staff?.contactNumber, emoji: '📱', fallback: 'Not provided' },
                        { label: 'Department', value: staff?.department, emoji: '🏛️', fallback: 'N/A' },
                        { label: 'Designation', value: staff?.designation, emoji: '💼', fallback: 'Faculty' },
                        { label: 'Qualification', value: staff?.qualification, emoji: '🎓', fallback: 'N/A' },
                        { label: 'Experience', value: staff?.experience ? `${staff.experience} Years` : null, emoji: '⏳', fallback: 'N/A' },
                        { label: 'Gender', value: staff?.gender, emoji: '👤' }
                    ].map(({ label, value, emoji, fallback }) => (value || fallback) ? (
                        <View key={label} style={styles.infoRow}>
                            <Text style={styles.infoEmoji}>{emoji}</Text>
                            <View>
                                <Text style={styles.infoLabel}>{label}</Text>
                                <Text style={styles.infoValue}>{value || fallback}</Text>
                            </View>
                        </View>
                    ) : null)}
                </View>

                {/* Optional Subjects Section if available in real API data */}
                {(staff as any)?.subjects && (staff as any).subjects.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>📚 Subjects Handled</Text>
                        <View style={styles.tagsContainer}>
                            {(staff as any).subjects.map((sub: string, i: number) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{sub}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Knowledge & Skills Section */}
                {staff?.skills && staff.skills.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>💡 Knowledge & Skills</Text>
                        <View style={styles.tagsContainer}>
                            {staff.skills.map((skill: string, i: number) => (
                                <View key={i} style={[styles.tag, styles.skillTag]}>
                                    <Text style={[styles.tagText, styles.skillTagText]}>{skill}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Achievements Section */}
                {staff?.achievements && staff.achievements.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
                        <View style={{ gap: 12 }}>
                            {staff.achievements.map((achievement: string, i: number) => (
                                <View key={i} style={styles.achievementRow}>
                                    <Text style={styles.achievementCheck}>✓</Text>
                                    <Text style={styles.achievementText}>{achievement}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', gap: 12 },
    backBtn: { padding: 4 },
    backText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 19, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
    hero: { backgroundColor: COLORS.primaryDark, padding: 28, alignItems: 'center', paddingBottom: 36, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, ...SHADOWS.small },
    avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: COLORS.white, marginBottom: 16, ...SHADOWS.medium },
    name: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
    designation: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 14, fontWeight: '500' },
    badge: { backgroundColor: COLORS.surfaceLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    badgeText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    card: { backgroundColor: COLORS.white, margin: 16, borderRadius: 20, padding: 22, ...SHADOWS.medium, borderWidth: 1, borderColor: COLORS.border },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16, letterSpacing: -0.3 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
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
});

export default StudentViewStaffProfileScreen;
