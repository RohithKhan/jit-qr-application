import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

const WatchmanStudentViewScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { outpassId } = route.params || {};

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (outpassId) {
            fetchStudentDetails();
        } else {
            setLoading(false);
            Toast.show({ type: 'error', text1: 'Missing outpass ID' });
        }
    }, [outpassId]);

    const fetchStudentDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/watchman/outpass/${outpassId}`);
            setStudent(res.data.outpass || res.data.outpassdetail || res.data);
        } catch (error) {
            console.error('Failed to fetch student details:', error);
            Toast.show({ type: 'error', text1: 'Failed to load details' });
        } finally {
            setLoading(false);
        }
    };

    const getPhoto = (photoUrl?: string) => {
        if (!photoUrl) return `https://ui-avatars.com/api/?name=${encodeURIComponent('Student')}&background=4a3728&color=fff`;
        return photoUrl.startsWith('http') ? photoUrl : `${CDN_URL}${photoUrl}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4a3728" />
            </SafeAreaView>
        );
    }

    if (!student) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>Student details not found.</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const s = student.studentid || {};

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
                    <Text style={styles.headerBackText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Security View</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>👤 Student Personal Details</Text>
                    </View>
                    <View style={styles.sectionBody}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: getPhoto(s.photo) }} style={styles.avatar} />
                        </View>
                        
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>STUDENT NAME</Text>
                            <View style={styles.displayBox}><Text style={styles.displayText}>{s.name || 'N/A'}</Text></View>
                        </View>
                        
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>MOBILE NUMBER</Text>
                            <View style={styles.displayBox}><Text style={styles.displayText}>{s.phone || 'N/A'}</Text></View>
                        </View>
                        
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>EMAIL</Text>
                            <View style={styles.displayBox}><Text style={styles.displayText}>{s.email || 'N/A'}</Text></View>
                        </View>
                    </View>
                </View>

                <View style={[styles.sectionCard, styles.highlightBorder]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>📄 Outpass Request Details</Text>
                    </View>
                    <View style={styles.sectionBody}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>REASON FOR OUTPASS</Text>
                            <View style={styles.displayBox}>
                                <Text style={styles.displayText}>{student.reason || 'N/A'}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>FROM DATE & TIME</Text>
                            <View style={styles.displayBox}>
                                <Text style={styles.displayText}>
                                    {student.fromDate ? new Date(student.fromDate).toLocaleString() : 'N/A'}
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>TO DATE & TIME</Text>
                            <View style={styles.displayBox}>
                                <Text style={styles.displayText}>
                                    {student.toDate ? new Date(student.toDate).toLocaleString() : 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerContainer: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: '#475569', marginBottom: 20 },
    backBtn: { backgroundColor: '#4a3728', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    backBtnText: { color: COLORS.white, fontWeight: '600' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#4a3728' },
    headerBackBtn: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    headerBackText: { color: '#4a3728', fontWeight: '600', fontSize: 13 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    
    scrollContent: { padding: 16, paddingBottom: 40 },
    
    sectionCard: { backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 24, overflow: 'hidden', ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    highlightBorder: { borderColor: '#fbbf24', borderWidth: 2 },
    sectionHeader: { backgroundColor: '#4a3728', paddingVertical: 14, paddingHorizontal: 16 },
    sectionTitle: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
    sectionBody: { padding: 20 },
    
    avatarContainer: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#4a3728' },
    
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, marginBottom: 6 },
    displayBox: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 12, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
    displayText: { fontSize: 14, color: '#1f2937', fontWeight: '500' }
});

export default WatchmanStudentViewScreen;
