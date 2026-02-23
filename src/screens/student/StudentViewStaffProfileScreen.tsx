import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StaffUser } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';

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
                        { label: 'Phone', value: staff?.phone, emoji: '📱' },
                        { label: 'Department', value: staff?.department, emoji: '🏛️' },
                        { label: 'Designation', value: staff?.designation, emoji: '💼' },
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
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
    backBtn: { padding: 4 },
    backText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    hero: { backgroundColor: COLORS.primary, padding: 28, alignItems: 'center', paddingBottom: 36 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', marginBottom: 16 },
    name: { color: COLORS.white, fontSize: 22, fontWeight: '800', marginBottom: 4 },
    designation: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 12 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
    badgeText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    card: { backgroundColor: COLORS.white, margin: 16, borderRadius: 16, padding: 20, elevation: 2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    infoEmoji: { fontSize: 22, width: 32 },
    infoLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
    infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '700' },
});

export default StudentViewStaffProfileScreen;
