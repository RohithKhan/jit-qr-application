import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StudentOutpass } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';
import api from '../../services/api';

interface RouteParams {
    outpass: StudentOutpass;
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    pending: { label: 'Pending', bg: '#fef3c7', text: '#f59e0b' },
    approved: { label: 'Approved', bg: '#d1fae5', text: '#10b981' },
    rejected: { label: 'Rejected', bg: '#fee2e2', text: '#ef4444' },
    declined: { label: 'Rejected', bg: '#fee2e2', text: '#ef4444' },
};

const getStatusTheme = (status?: string) => {
    return statusConfig[String(status || 'pending').toLowerCase()] || statusConfig['pending'];
};

const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return String(dateStr);
    }
};

const OutpassDetailsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const [residenceType, setResidenceType] = useState<string>('loading');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/api/profile');
                if (res.status === 200) {
                    setResidenceType(res.data.user?.residencetype?.toLowerCase() || '');
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
                setResidenceType('');
            }
        };
        fetchProfile();
    }, []);

    // Fallback if accessed incorrectly
    if (!route.params || !(route.params as RouteParams).outpass) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={{ fontSize: 24, color: COLORS.textPrimary }}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Details</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.textMuted }}>No data provided.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { outpass } = route.params as RouteParams;
    const documentUrl = outpass.document || outpass.proof || outpass.file;

    const handleViewDocument = () => {
        if (documentUrl) {
            const url = documentUrl.startsWith('http') ? documentUrl : `${CDN_URL}${documentUrl}`;
            Linking.openURL(url).catch(() => { });
        }
    };

    const displayType = outpass.outpassType || (outpass as any).outpasstype || 'Regular';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={{ fontSize: 24, color: COLORS.textPrimary }}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Outpass Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Basic Information Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>ℹ️</Text>
                        <Text style={styles.cardTitle}>Basic Information</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Applied On</Text>
                        <Text style={styles.value}>{formatDateTime(outpass.createdAt)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Type</Text>
                        <View style={[styles.typeBadge, {
                            backgroundColor: displayType.toLowerCase() === 'emergency' ? '#fee2e2' : '#e0f2fe',
                            borderColor: displayType.toLowerCase() === 'emergency' ? '#fca5a5' : '#7dd3fc'
                        }]}>
                            <Text style={[styles.typeText, {
                                color: displayType.toLowerCase() === 'emergency' ? '#ef4444' : '#0ea5e9',
                            }]}>
                                {displayType}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>From</Text>
                        <Text style={styles.value}>{formatDateTime(outpass.fromDate)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>To</Text>
                        <Text style={styles.value}>{formatDateTime(outpass.toDate)}</Text>
                    </View>

                    <View style={styles.infoCol}>
                        <Text style={styles.label}>Reason</Text>
                        <View style={styles.reasonBox}>
                            <Text style={styles.reasonText}>{outpass.reason || 'No reason specified'}</Text>
                        </View>
                    </View>
                </View>

                {/* Proof Document Card */}
                {documentUrl && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>📄</Text>
                            <Text style={styles.cardTitle}>Supporting Document</Text>
                        </View>
                        <View style={styles.docRow}>
                            <View>
                                <Text style={styles.docTitle}>Proof Document</Text>
                                <Text style={styles.docSub}>Uploaded by student</Text>
                            </View>
                            <TouchableOpacity style={styles.viewDocBtn} onPress={handleViewDocument}>
                                <Text style={styles.viewDocText}>👁️ View</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Approvals Title */}
                <Text style={styles.sectionTitle}>Approvals</Text>

                {/* Staff Approval */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>👨‍🏫</Text>
                        <Text style={styles.cardTitle}>Staff Approval</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Status</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusTheme(outpass.staffapprovalstatus || outpass.staffApproval).bg }]}>
                            <Text style={{ fontSize: 10, color: getStatusTheme(outpass.staffapprovalstatus || outpass.staffApproval).text }}>●</Text>
                            <Text style={[styles.statusText, { color: getStatusTheme(outpass.staffapprovalstatus || outpass.staffApproval).text }]}>
                                {getStatusTheme(outpass.staffapprovalstatus || outpass.staffApproval).label}
                            </Text>
                        </View>
                    </View>
                    {outpass.staffid?.name && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Approved By</Text>
                            <Text style={styles.value}>{outpass.staffid.name}</Text>
                        </View>
                    )}
                    {(outpass.staffremarks || outpass.staffComment) && (
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Remarks</Text>
                            <Text style={styles.remarkText}>{outpass.staffremarks || outpass.staffComment}</Text>
                        </View>
                    )}
                </View>

                {/* Year Incharge Approval */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>🧑‍💼</Text>
                        <Text style={styles.cardTitle}>Year Incharge Approval</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Status</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusTheme(outpass.yearinchargeapprovalstatus || outpass.yearInchargeApproval).bg }]}>
                            <Text style={{ fontSize: 10, color: getStatusTheme(outpass.yearinchargeapprovalstatus || outpass.yearInchargeApproval).text }}>●</Text>
                            <Text style={[styles.statusText, { color: getStatusTheme(outpass.yearinchargeapprovalstatus || outpass.yearInchargeApproval).text }]}>
                                {getStatusTheme(outpass.yearinchargeapprovalstatus || outpass.yearInchargeApproval).label}
                            </Text>
                        </View>
                    </View>
                    {outpass.inchargeid?.name && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Approved By</Text>
                            <Text style={styles.value}>{outpass.inchargeid.name}</Text>
                        </View>
                    )}
                    {(outpass.yearinchargeremarks || outpass.yearInchargeComment) && (
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Remarks</Text>
                            <Text style={styles.remarkText}>{outpass.yearinchargeremarks || outpass.yearInchargeComment}</Text>
                        </View>
                    )}
                </View>

                {/* Warden Approval */}
                {residenceType === 'hostel' && (outpass.wardenapprovalstatus || outpass.wardenApproval || outpass.wardenid) && (
                    <View style={[styles.card, { marginBottom: 16 }]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardIcon}>👔</Text>
                            <Text style={styles.cardTitle}>Warden Approval</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusTheme(outpass.wardenapprovalstatus || outpass.wardenApproval).bg }]}>
                                <Text style={{ fontSize: 10, color: getStatusTheme(outpass.wardenapprovalstatus || outpass.wardenApproval).text }}>●</Text>
                                <Text style={[styles.statusText, { color: getStatusTheme(outpass.wardenapprovalstatus || outpass.wardenApproval).text }]}>
                                    {getStatusTheme(outpass.wardenapprovalstatus || outpass.wardenApproval).label}
                                </Text>
                            </View>
                        </View>
                        {outpass.wardenid?.name && (
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Approved By</Text>
                                <Text style={styles.value}>{outpass.wardenid.name}</Text>
                            </View>
                        )}
                        {(outpass.wardenremarks || outpass.wardenComment) && (
                            <View style={styles.infoCol}>
                                <Text style={styles.label}>Remarks</Text>
                                <Text style={styles.remarkText}>{outpass.wardenremarks || outpass.wardenComment}</Text>
                            </View>
                        )}
                    </View>
                )}

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
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
        marginBottom: 16,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10 },
    cardIcon: { marginRight: 8 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    infoCol: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12, marginTop: 4 },
    label: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    value: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'right', flex: 1, marginLeft: 20 },
    reasonBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginTop: 8, width: '100%', borderWidth: 1, borderColor: COLORS.border },
    reasonText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 },
    remarkText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22, marginTop: 4 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    typeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginLeft: 6, marginBottom: 12, marginTop: 8 },
    docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    docTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    docSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    viewDocBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
    viewDocText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
});

export default OutpassDetailsScreen;
