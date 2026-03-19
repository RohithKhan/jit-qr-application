import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

const WardenStudentViewScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { studentId, outpassId } = route.params || {};
    const id = studentId || outpassId;

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'approved' | 'rejected' | null>(null);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (id) fetchStudent();
        else {
            Toast.show({ type: 'error', text1: 'Invalid Request ID' });
            navigation.goBack();
        }
    }, [id]);

    const fetchStudent = async () => {
        try {
            const res = await api.get(`/warden/outpass/${id}`);
            setStudent(res.data.outpassdetail || null);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to load student details' });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!modalType || !remarks.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter remarks' });
            return;
        }

        try {
            await api.put(`/warden/outpass/update`, {
                outpassId: id,
                wardenapprovalstatus: modalType,
                wardenremarks: remarks,
            });

            Toast.show({ type: 'success', text1: `Outpass ${modalType} successfully!` });
            setModalVisible(false);
            fetchStudent();
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to update status' });
        }
    };

    const handleViewDocument = (url: string) => {
        const fullUrl = `${CDN_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
        Linking.openURL(fullUrl).catch(() => Toast.show({ type: 'error', text1: 'Cannot open document' }));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    if (!student) {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={{ textAlign: 'center', marginTop: 40, color: COLORS.textMuted }}>No details found.</Text>
            </SafeAreaView>
        );
    }

    const s = student.studentid || {};

    const getPhoto = () => {
        if (!s.photo) return null;
        return s.photo.startsWith('http') || s.photo.startsWith('data:')
            ? s.photo
            : `${CDN_URL.replace(/\/$/, '')}/${s.photo.replace(/^\//, '')}`;
    };

    const photoUrl = getPhoto();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Outpass Approval</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Section 1: Personal Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>👤 Student Personal Details</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.avatarContainer}>
                            {photoUrl ? (
                                <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
                            ) : (
                                <View style={styles.avatarInitials}>
                                    <Text style={styles.avatarInitialsText}>{s.name ? s.name.charAt(0).toUpperCase() : 'NA'}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.gridContainer}>
                            <InfoField label="REGISTER NUMBER" value={s.registerNumber || "N/A"} />
                            <InfoField label="STUDENT NAME" value={s.name || "N/A"} />
                            <InfoField label="DEPARTMENT" value={s.department || "N/A"} />
                            <InfoField label="YEAR" value={s.year ? `${s.year} Year` : "N/A"} />
                            <InfoField label="MOBILE NUMBER" value={s.phone || "N/A"} />
                            
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>PARENT CONTACT</Text>
                                <View style={styles.displayBoxRow}>
                                    <Text style={styles.displayBoxText}>{s.parentPhone || s.parentnumber || "N/A"}</Text>
                                    {(s.parentPhone || s.parentnumber) && (
                                        <TouchableOpacity 
                                            style={styles.dialBtn}
                                            onPress={() => Linking.openURL(`tel:${s.parentPhone || s.parentnumber}`)}
                                        >
                                            <Ionicons name="call" size={16} color="white" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Section 3: Hostel Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>🏢 Hostel Details</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.gridContainer}>
                            <InfoField label="HOSTEL NAME" value={s.hostelname || "N/A"} />
                            <InfoField label="ROOM NUMBER" value={s.hostelroomno || "N/A"} />
                        </View>
                    </View>
                </View>

                {/* Section 4: Request Details */}
                <View style={[styles.card, styles.highlightBorder]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>📄 Outpass Request Details</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <InfoField label="REASON FOR OUTPASS" value={student.reason} fullWidth />
                        <View style={[styles.gridContainer, { marginTop: 16 }]}>
                            <InfoField label="FROM DATE & TIME" value={new Date(student.fromDate).toLocaleString()} />
                            <InfoField label="TO DATE & TIME" value={new Date(student.toDate).toLocaleString()} />
                        </View>

                        {(student.proof || student.document || student.file) && (
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.fieldLabel}>SUPPORTING DOCUMENT</Text>
                                <TouchableOpacity 
                                    style={styles.viewDocBtn}
                                    onPress={() => handleViewDocument(student.proof || student.document || student.file)}
                                >
                                    <Text style={styles.viewDocBtnText}>👁️ View Document</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Section 5: Approval Workflow */}
                {(!student.wardenapprovalstatus || student.wardenapprovalstatus === 'pending') && (
                    <View style={styles.workflowActions}>
                        <TouchableOpacity style={styles.btnApprove} onPress={() => { setModalType('approved'); setRemarks(''); setModalVisible(true); }}>
                            <Text style={styles.btnApproveText}>Approve Request</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnReject} onPress={() => { setModalType('rejected'); setRemarks(''); setModalVisible(true); }}>
                            <Text style={styles.btnRejectText}>Reject Request</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTitle}>{modalType === 'approved' ? 'Approve Outpass' : 'Reject Outpass'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.modalLabel}>Remarks (Required)</Text>
                            <TextInput
                                style={styles.remarksInput}
                                value={remarks}
                                onChangeText={setRemarks}
                                placeholder={modalType === 'approved' ? 'Approval remarks...' : 'Reason for rejection...'}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.btnConfirm, modalType === 'approved' ? styles.btnConfirmApprove : styles.btnConfirmReject, !remarks.trim() && styles.btnDisabled]} 
                                onPress={handleConfirmAction}
                                disabled={!remarks.trim()}
                            >
                                <Text style={styles.btnConfirmText}>{modalType === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const InfoField = ({ label, value, fullWidth = false }: { label: string, value: string, fullWidth?: boolean }) => (
    <View style={[styles.fieldGroup, fullWidth && { width: '100%' }]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.displayBox}>
            <Text style={styles.displayBoxText}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1e3a8a' },
    backBtn: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    backText: { color: '#1e3a8a', fontWeight: '600', fontSize: 13 },
    headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    
    card: { backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 16, overflow: 'hidden', ...SHADOWS.small, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    highlightBorder: { borderColor: '#fbbf24', borderWidth: 2 },
    cardHeader: { backgroundColor: '#1e3a8a', paddingVertical: 12, paddingHorizontal: 16 },
    cardHeaderTitle: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
    cardBody: { padding: 16 },
    
    avatarContainer: { alignItems: 'center', marginBottom: 20 },
    avatarImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#e2e8f0' },
    avatarInitials: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
    avatarInitialsText: { color: COLORS.white, fontSize: 28, fontWeight: '700' },
    
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    fieldGroup: { minWidth: '45%', flex: 1, marginBottom: 12 },
    fieldLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', marginBottom: 6, letterSpacing: 0.5 },
    displayBox: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, minHeight: 40, justifyContent: 'center' },
    displayBoxRow: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    displayBoxText: { fontSize: 13, color: '#1f2937', fontWeight: '500' },
    
    dialBtn: { backgroundColor: '#10b981', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    viewDocBtn: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    viewDocBtnText: { color: '#1e3a8a', fontWeight: '600', fontSize: 14 },
    
    workflowActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
    btnApprove: { backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
    btnApproveText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
    btnReject: { backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
    btnRejectText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { width: '90%', maxWidth: 400, backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden' },
    modalHeader: { backgroundColor: '#1e3a8a', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalHeaderTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    closeBtn: { padding: 4 },
    closeBtnText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
    modalBody: { padding: 20 },
    modalLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
    remarksInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, height: 100, fontSize: 14, color: '#1f2937', backgroundColor: '#f8fafc' },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 12 },
    btnCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9' },
    btnCancelText: { color: '#475569', fontWeight: '600' },
    btnConfirm: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    btnConfirmApprove: { backgroundColor: '#10b981' },
    btnConfirmReject: { backgroundColor: '#ef4444' },
    btnDisabled: { opacity: 0.5 },
    btnConfirmText: { color: COLORS.white, fontWeight: '600' }
});

export default WardenStudentViewScreen;
