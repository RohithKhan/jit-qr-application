import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, SHADOWS, CDN_URL } from '../../constants/config';

const YIStudentViewScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { outpassId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!outpassId) {
            Toast.show({ type: 'error', text1: 'Invalid Outpass ID' });
            navigation.goBack();
            return;
        }
        fetchDetails();
    }, [outpassId]);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/incharge/outpass/${outpassId}`);
            setData(res.data.outpass || res.data);
        } catch (error) {
            console.error("Fetch details error:", error);
            Toast.show({ type: 'error', text1: 'Failed to load details' });
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (status: 'Approved' | 'Rejected') => {
        setSubmitting(true);
        try {
            await api.put(`/incharge/outpass/approve/${outpassId}`, { status });
            Toast.show({ type: 'success', text1: `Outpass ${status} successfully` });
            navigation.goBack();
        } catch (error) {
            console.error("Approval error:", error);
            Toast.show({ type: 'error', text1: 'Failed to process request' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <SafeAreaView style={styles.container}>
            <ActivityIndicator size="large" color="#7c3aed" style={{ flex: 1 }} />
        </SafeAreaView>
    );

    const student = data?.studentid || {};
    const isPending = (data?.yearinchargeapprovalstatus || '').toLowerCase() === 'pending';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Student Details</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileCard}>
                    <Image 
                        source={{ uri: student.photo ? (student.photo.startsWith('http') ? student.photo : `${CDN_URL}${student.photo}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=7c3aed&color=fff` }} 
                        style={styles.avatar} 
                    />
                    <Text style={styles.name}>{student.name || 'Unknown'}</Text>
                    <Text style={styles.regNo}>{student.registerNumber || 'N/A'}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}><Text style={styles.badgeText}>Year {student.year}</Text></View>
                        <View style={styles.badge}><Text style={styles.badgeText}>{student.residencetype}</Text></View>
                    </View>
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Request Details</Text>
                    <DetailRow label="Outpass Type" value={data?.outpasstype} emoji="🎫" />
                    <DetailRow label="From Date" value={new Date(data?.fromDate).toLocaleString()} emoji="🗓️" />
                    <DetailRow label="To Date" value={new Date(data?.toDate).toLocaleString()} emoji="🗓️" />
                    <DetailRow label="Reason" value={data?.reason} emoji="📝" isMultiline />
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Approval Progress</Text>
                    <StatusStep label="Staff Approval" status={data?.staffapprovalstatus} />
                    <StatusStep label="Your Approval" status={data?.yearinchargeapprovalstatus} isLast={student.residencetype?.toLowerCase().includes('dayscholar')} />
                    {student.residencetype?.toLowerCase().includes('hostel') && (
                        <StatusStep label="Warden Approval" status={data?.wardenapprovalstatus} isLast />
                    )}
                </View>

                {isPending && (
                    <View style={styles.actionSection}>
                        <TouchableOpacity 
                            style={[styles.btn, styles.approveBtn]} 
                            onPress={() => handleApproval('Approved')}
                            disabled={submitting}
                        >
                            <Text style={styles.btnText}>Approve Request</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.btn, styles.rejectBtn]} 
                            onPress={() => handleApproval('Rejected')}
                            disabled={submitting}
                        >
                            <Text style={[styles.btnText, { color: '#ef4444' }]}>Reject Request</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const DetailRow = ({ label, value, emoji, isMultiline }: any) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, isMultiline && { lineHeight: 22 }]}>{value || 'N/A'}</Text>
        </View>
    </View>
);

const StatusStep = ({ label, status, isLast }: any) => {
    const s = (status || 'pending').toLowerCase();
    const isApproved = s === 'approved';
    const isRejected = s === 'rejected' || s === 'declined';
    
    return (
        <View style={styles.stepContainer}>
            <View style={styles.stepLeft}>
                <View style={[styles.stepDot, isApproved && styles.dotActive, isRejected && styles.dotError]} />
                {!isLast && <View style={styles.stepLine} />}
            </View>
            <View style={styles.stepRight}>
                <Text style={styles.stepLabel}>{label}</Text>
                <Text style={[styles.stepStatus, isApproved && { color: '#22c55e' }, isRejected && { color: '#ef4444' }]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#5b21b6' },
    headerBtn: { padding: 4 },
    headerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
    scrollContent: { paddingBottom: 40 },
    profileCard: { backgroundColor: '#5b21b6', paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', ...SHADOWS.medium },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 15 },
    name: { color: COLORS.white, fontSize: 22, fontWeight: '800', marginBottom: 4 },
    regNo: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginBottom: 15 },
    badgeRow: { flexDirection: 'row', gap: 10 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
    detailsCard: { margin: 16, backgroundColor: COLORS.white, borderRadius: 24, padding: 24, ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e3a8a', marginBottom: 20 },
    detailRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    detailEmoji: { fontSize: 20 },
    detailLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 4 },
    detailValue: { fontSize: 15, color: '#1e293b', fontWeight: '700' },
    stepContainer: { flexDirection: 'row', height: 60 },
    stepLeft: { width: 30, alignItems: 'center' },
    stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E2E8F0', zIndex: 1 },
    dotActive: { backgroundColor: '#22c55e' },
    dotError: { backgroundColor: '#ef4444' },
    stepLine: { width: 2, flex: 1, backgroundColor: '#F1F5F9', marginTop: -2 },
    stepRight: { flex: 1, paddingLeft: 10, marginTop: -3 },
    stepLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    stepStatus: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
    actionSection: { paddingHorizontal: 16, gap: 12, marginTop: 10 },
    btn: { paddingVertical: 18, borderRadius: 20, alignItems: 'center', ...SHADOWS.small },
    approveBtn: { backgroundColor: '#22c55e' },
    rejectBtn: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#fee2e2' },
    btnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});

export default YIStudentViewScreen;
