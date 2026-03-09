import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TextInput, ScrollView, Modal, Alert, Platform, Linking, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

const PassApprovalScreen = () => {
    const navigation = useNavigation<any>();
    const [outpasses, setOutpasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentStaffName, setCurrentStaffName] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | ApprovalStatus>('all');

    // View States
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [roommates, setRoommates] = useState<any[]>([]);
    const [loadingRoommates, setLoadingRoommates] = useState(false);

    // Modal States
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [actionRemarks, setActionRemarks] = useState('');

    const [documentModalVisible, setDocumentModalVisible] = useState(false);
    const [documentUrl, setDocumentUrl] = useState('');

    useEffect(() => {
        fetchStaffProfile();
        fetchOutpasses();
    }, []);

    const handleViewDocument = (docPath: string) => {
        const fullUrl = `${CDN_URL}/${docPath}`;
        if (Platform.OS === 'web') {
            setDocumentUrl(fullUrl);
            setDocumentModalVisible(true);
        } else {
            Linking.openURL(fullUrl).catch(() => {
                Toast.show({ type: 'error', text1: 'Unable to open document' });
            });
        }
    };

    const fetchStaffProfile = async () => {
        try {
            const res = await api.get('/staff/profile');
            if (res.data?.staff) setCurrentStaffName(res.data.staff.name);
        } catch (error) { console.error('Error fetching staff profile', error); }
    };

    const fetchOutpasses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/staff/outpass/list');

            const mappedStudents = (res.data.outpasses || []).map((item: any) => {
                const studentDetails = item.studentid || {};
                return {
                    id: item._id,
                    studentId: studentDetails.registerNumber || 'N/A',
                    registerNumber: studentDetails.registerNumber || 'N/A',
                    studentname: studentDetails.name || 'Student',
                    year: studentDetails.year || 'N/A',
                    section: studentDetails.section || 'N/A',
                    department: studentDetails.department || 'N/A',
                    mobile: studentDetails.phone || 'N/A',
                    appliedDate: item.createdAt,
                    photo: studentDetails.photo || null,
                    parentContact: studentDetails.parentnumber || 'N/A',
                    hostelname: studentDetails.hostelname || 'N/A',
                    hostelroomno: studentDetails.hostelroomno || 'N/A',
                    boardingPoint: studentDetails.boardingpoint || 'N/A',
                    busNo: studentDetails.busno || 'N/A',
                    reason: item.reason,
                    fromDate: item.fromDate,
                    toDate: item.toDate,
                    staffApproval: item.staffapprovalstatus || 'pending',
                    staffApprovedBy: item.staffApprovedBy,
                    yearInchargeApproval: item.yearinchargeapprovalstatus || 'pending',
                    wardenApproval: item.wardenapprovalstatus || 'pending',
                    outpasstype: item.outpasstype,
                    residencetype: studentDetails.residencetype || 'day scholar',
                    document: item.proof || item.document || item.file || null
                };
            });
            setOutpasses(mappedStudents);
        } catch { Toast.show({ type: 'error', text1: 'Failed to load outpass requests' }); }
        finally { setLoading(false); }
    };

    const fetchOutpassDetails = async (student: any) => {
        setSelectedStudent(student);
        try {
            setLoadingRoommates(true);
            const res = await api.get(`/staff/outpass/${student.id}`);
            if (res.data?.roomMates) setRoommates(res.data.roomMates);
        } catch (error) {
            console.error('Failed to fetch details', error);
        } finally { setLoadingRoommates(false); }
    };

    const handleAction = (type: 'approve' | 'reject') => {
        setActionType(type);
        setActionRemarks('');
        setShowActionModal(true);
    };

    const confirmAction = async () => {
        if (!selectedStudent || !actionRemarks.trim()) {
            Toast.show({ type: 'error', text1: 'Remarks are required.' });
            return;
        }

        try {
            const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
            await api.put('/staff/outpass/approval', {
                outpassId: selectedStudent.id,
                staffapprovalstatus: newStatus,
                staffremarks: actionRemarks
            });

            Toast.show({ type: 'success', text1: `Outpass ${actionType}d successfully` });

            // Update local state
            setOutpasses(prev => prev.map(o => o.id === selectedStudent.id ? { ...o, staffApproval: newStatus } : o));
            setSelectedStudent((prev: any) => prev ? { ...prev, staffApproval: newStatus, staffApprovedBy: actionType === 'approve' ? currentStaffName : undefined } : null);
            setShowActionModal(false);
        } catch (error: any) {
            Toast.show({ type: 'error', text1: error?.response?.data?.message || `Failed to ${actionType}` });
        }
    };

    const getPhoto = (photoSrc: string | null, name: string) => {
        if (!photoSrc || photoSrc === 'undefined') return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'S')}&background=0047AB&color=fff&size=200`;
        const normalizedPath = photoSrc.replace(/\\/g, '/');
        return normalizedPath.startsWith('http') ? normalizedPath : `${CDN_URL}${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const filteredOutpasses = outpasses.filter(student => {
        const matchesSearch = student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) || student.studentname.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || student.staffApproval === filterStatus;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        const isAEmergency = a.outpasstype?.toLowerCase() === 'emergency';
        const isBEmergency = b.outpasstype?.toLowerCase() === 'emergency';
        if (isAEmergency && !isBEmergency) return -1;
        if (!isAEmergency && isBEmergency) return 1;

        if (a.staffApproval === 'pending' && b.staffApproval !== 'pending') return -1;
        if (a.staffApproval !== 'pending' && b.staffApproval === 'pending') return 1;
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
    });

    const renderStatusBadge = (status: ApprovalStatus) => {
        const config = {
            pending: { label: 'Pending', color: COLORS.warning, bg: '#fef3c7' },
            approved: { label: 'Approved', color: COLORS.success, bg: '#d1fae5' },
            rejected: { label: 'Rejected', color: COLORS.danger, bg: '#fee2e2' },
        };
        const c = config[status] || config.pending;
        return (
            <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
                <Text style={[styles.statusText, { color: c.color }]}>● {c.label}</Text>
            </View>
        );
    };

    const renderDetailField = (label: string, value: string | undefined, fullWidth = false) => (
        <View style={[styles.detailField, fullWidth && { width: '100%' }]}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || 'N/A'}</Text>
        </View>
    );

    if (selectedStudent) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
                <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.headerBack}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Approval Details</Text>
                            <Text style={styles.headerSubtitle}>Review outpass request</Text>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
                        <Text style={styles.detailHeaderTitle}>Outpass Approval</Text>

                        {/* Personal Details Card */}
                        <View style={styles.detailCard}>
                            <View style={styles.cardTitleRow}>
                                <Ionicons name="person" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Student Personal Details</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                <Image source={{ uri: getPhoto(selectedStudent.photo, selectedStudent.studentname) }} style={styles.detailAvatar} />
                                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                                    {renderDetailField('STUDENT ID', selectedStudent.id)}
                                    {renderDetailField('STUDENT NAME', selectedStudent.studentname)}
                                    {renderDetailField('DEPARTMENT', selectedStudent.department)}
                                    {renderDetailField('YEAR', `Year ${selectedStudent.year}`)}
                                    {renderDetailField('MOBILE NUMBER', selectedStudent.mobile)}
                                </View>
                            </View>
                        </View>

                        {/* Request Details Card */}
                        <View style={styles.detailCard}>
                            <View style={styles.cardTitleRow}>
                                <Ionicons name="document-text" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Request Details</Text>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                                {renderDetailField('REASON', selectedStudent.reason, true)}
                                {renderDetailField('FROM DATE & TIME', formatDateTime(selectedStudent.fromDate))}
                                {renderDetailField('TO DATE & TIME', formatDateTime(selectedStudent.toDate))}
                                <View style={[styles.detailField, { width: '100%' }]}>
                                    <Text style={styles.detailLabel}>OUTPASS TYPE</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                        <View style={{ backgroundColor: selectedStudent.outpasstype?.toLowerCase() === 'emergency' ? '#fee2e2' : '#E6F0FA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
                                            <Text style={{ color: selectedStudent.outpasstype?.toLowerCase() === 'emergency' ? COLORS.danger : COLORS.primary, fontWeight: '700', fontSize: 13 }}>
                                                {selectedStudent.outpasstype || 'General'}
                                            </Text>
                                        </View>

                                        {selectedStudent.document && (
                                            <TouchableOpacity
                                                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, gap: 6 }}
                                                onPress={() => handleViewDocument(selectedStudent.document)}
                                            >
                                                <Ionicons name="document-text" size={16} color={COLORS.white} />
                                                <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700' }}>View Proof</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Parents Details & Residence Card */}
                        <View style={styles.detailCard}>
                            <View style={styles.cardTitleRow}>
                                <Ionicons name="people" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Parents & Residence Details</Text>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                                {renderDetailField('PARENT CONTACT', selectedStudent.parentContact)}
                                {selectedStudent.residencetype?.toLowerCase() === 'hostel' ? (
                                    <>
                                        {renderDetailField('HOSTEL NAME', selectedStudent.hostelname)}
                                        {renderDetailField('ROOM NUMBER', selectedStudent.hostelroomno)}
                                    </>
                                ) : (
                                    <>
                                        {renderDetailField('BOARDING POINT', selectedStudent.boardingPoint)}
                                        {renderDetailField('BUS NUMBER', selectedStudent.busNo)}
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Approval Workflow */}
                        <View style={styles.detailCard}>
                            <View style={styles.cardTitleRow}>
                                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                                <Text style={styles.cardTitle}>Approval Workflow</Text>
                            </View>

                            <View style={styles.workflowContainer}>
                                <View style={[styles.workflowStep, styles.workflowStepActive]}>
                                    <Text style={styles.workflowDot}>✓</Text>
                                    <View style={styles.workflowTextContainer}>
                                        <Text style={styles.workflowTitle}>Request Submitted</Text>
                                        <Text style={styles.workflowSubtitle}>{formatDateTime(selectedStudent.appliedDate)}</Text>
                                    </View>
                                </View>
                                <View style={styles.workflowLine} />

                                <View style={[styles.workflowStep, selectedStudent.staffApproval === 'approved' ? styles.workflowStepActive : selectedStudent.staffApproval === 'rejected' ? styles.workflowStepRejected : styles.workflowStepPending]}>
                                    <Text style={styles.workflowDot}>{selectedStudent.staffApproval === 'approved' ? '✓' : selectedStudent.staffApproval === 'rejected' ? '✕' : '●'}</Text>
                                    <View style={styles.workflowTextContainer}>
                                        <Text style={[styles.workflowTitle, selectedStudent.staffApproval === 'pending' && { color: COLORS.textMuted }]}>Staff Approval</Text>
                                        <Text style={styles.workflowSubtitle}>
                                            Status: {selectedStudent.staffApproval}
                                            {selectedStudent.staffApproval === 'approved' && selectedStudent.staffApprovedBy && ` by ${selectedStudent.staffApprovedBy}`}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.workflowLine} />

                                <View style={[styles.workflowStep, selectedStudent.yearInchargeApproval === 'approved' ? styles.workflowStepActive : selectedStudent.yearInchargeApproval === 'rejected' ? styles.workflowStepRejected : styles.workflowStepPending]}>
                                    <Text style={styles.workflowDot}>{selectedStudent.yearInchargeApproval === 'approved' ? '✓' : selectedStudent.yearInchargeApproval === 'rejected' ? '✕' : '●'}</Text>
                                    <View style={styles.workflowTextContainer}>
                                        <Text style={[styles.workflowTitle, selectedStudent.yearInchargeApproval === 'pending' && { color: COLORS.textMuted }]}>Year Incharge</Text>
                                        <Text style={styles.workflowSubtitle}>Status: {selectedStudent.yearInchargeApproval}</Text>
                                    </View>
                                </View>

                                {selectedStudent.residencetype?.toLowerCase() === 'hostel' && (
                                    <>
                                        <View style={styles.workflowLine} />
                                        <View style={[styles.workflowStep, selectedStudent.wardenApproval === 'approved' ? styles.workflowStepActive : selectedStudent.wardenApproval === 'rejected' ? styles.workflowStepRejected : styles.workflowStepPending]}>
                                            <Text style={styles.workflowDot}>{selectedStudent.wardenApproval === 'approved' ? '✓' : selectedStudent.wardenApproval === 'rejected' ? '✕' : '●'}</Text>
                                            <View style={styles.workflowTextContainer}>
                                                <Text style={[styles.workflowTitle, selectedStudent.wardenApproval === 'pending' && { color: COLORS.textMuted }]}>Warden Approval</Text>
                                                <Text style={styles.workflowSubtitle}>Status: {selectedStudent.wardenApproval}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    {selectedStudent.staffApproval === 'pending' && (
                        <View style={styles.stickyActionArea}>
                            <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction('approve')}>
                                <Ionicons name="checkmark" size={20} color={COLORS.white} />
                                <Text style={styles.approveBtnText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction('reject')}>
                                <Ionicons name="close" size={20} color={COLORS.white} />
                                <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Modal */}
                    <Modal visible={showActionModal} transparent={true} animationType="fade">
                        <View style={styles.modalBg}>
                            <View style={styles.modalCard}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{actionType === 'approve' ? 'Approve' : 'Reject'} Request</Text>
                                    <TouchableOpacity onPress={() => setShowActionModal(false)}><Ionicons name="close" size={24} color={COLORS.textMuted} /></TouchableOpacity>
                                </View>
                                <Text style={styles.modalLabel}>Remarks (Required)</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder={`Reason for ${actionType}ing...`}
                                    value={actionRemarks}
                                    onChangeText={setActionRemarks}
                                    multiline
                                    textAlignVertical="top"
                                />
                                <TouchableOpacity style={actionType === 'approve' ? styles.approveConfirmBtn : styles.rejectConfirmBtn} onPress={confirmAction}>
                                    <Text style={styles.confirmBtnText}>Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    <Modal visible={documentModalVisible} transparent={true} animationType="fade" onRequestClose={() => setDocumentModalVisible(false)}>
                        <View style={styles.modalBg}>
                            <View style={[styles.modalCard, { flex: 1, padding: 0, overflow: 'hidden', marginVertical: 40 }]}>
                                <View style={[styles.modalHeader, { padding: 20, marginBottom: 0, borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
                                    <Text style={styles.modalTitle}>Document Preview</Text>
                                    <TouchableOpacity onPress={() => setDocumentModalVisible(false)} style={{ padding: 4 }}>
                                        <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                                    </TouchableOpacity>
                                </View>
                                {Platform.OS === 'web' ? (
                                    <iframe src={documentUrl} style={{ flex: 1, width: '100%', height: '100%', border: 'none' }} title="Document Preview" />
                                ) : (
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                        <Ionicons name="document-text-outline" size={64} color={COLORS.textLight} />
                                        <Text style={{ marginTop: 16, textAlign: 'center', color: COLORS.textSecondary }}>
                                            Document opened in external browser.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Modal>
                </View>
            </SafeAreaView>
        );
    }

    if (loading && !outpasses.length) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /></SafeAreaView>;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
            <View style={{ flex: 1, backgroundColor: COLORS.background }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Pass Approvals</Text>
                        <Text style={styles.headerSubtitle}>Manage student outpass requests</Text>
                    </View>
                </View>

                {/* Search and Filters */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search by ID or Name"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={COLORS.textLight}
                        />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                        {(['all', 'pending', 'approved', 'rejected'] as ('all' | ApprovalStatus)[]).map(status => (
                            <TouchableOpacity
                                key={status}
                                style={[styles.filterBtn, filterStatus === status && styles.filterBtnActive]}
                                onPress={() => setFilterStatus(status)}
                            >
                                <Text style={[styles.filterText, filterStatus === status && styles.filterTextActive]}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                    <FlatList
                        data={filteredOutpasses}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="information-circle-outline" size={50} color={COLORS.textMuted} />
                                <Text style={styles.emptyText}>No outpasses match your filters.</Text>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.card} onPress={() => fetchOutpassDetails(item)} activeOpacity={0.8}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.avatar}>
                                        {item.photo ? (
                                            <Image source={{ uri: getPhoto(item.photo, item.studentname) }} style={styles.avatarImage} />
                                        ) : (
                                            <Text style={styles.avatarText}>{item.studentname.charAt(0).toUpperCase()}</Text>
                                        )}
                                    </View>
                                    <View style={styles.studentInfo}>
                                        <Text style={styles.studentName}>{item.studentname}</Text>
                                        <Text style={styles.studentId}>{item.studentId}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        item.staffApproval === 'pending' && { backgroundColor: '#FFFBEB' },
                                        item.staffApproval === 'approved' && { backgroundColor: '#ECFDF5' },
                                        item.staffApproval === 'rejected' && { backgroundColor: '#FEF2F2' },
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            item.staffApproval === 'pending' && { color: '#FBBF24' },
                                            item.staffApproval === 'approved' && { color: '#10B981' },
                                            item.staffApproval === 'rejected' && { color: '#EF4444' },
                                        ]}>
                                            {item.staffApproval}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.cardDetails}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="document-text-outline" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.detailText} numberOfLines={1}>Reason: {item.reason}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.detailText}>
                                            {formatDateTime(item.fromDate)} - {formatDateTime(item.toDate)}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="pricetag-outline" size={16} color={COLORS.textMuted} />
                                        <Text style={styles.detailText}>Type: {item.outpasstype || 'General'}</Text>
                                    </View>
                                </View>
                                <View style={styles.cardFooter}>
                                    <TouchableOpacity style={styles.viewBtn} onPress={() => fetchOutpassDetails(item)}>
                                        <Text style={styles.viewBtnText}>View Details</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                }
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingVertical: 18, paddingTop: 10, gap: 12 },
    headerBack: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },

    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    backText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },

    // Search Content
    searchContainer: { padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOWS.small },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: COLORS.textPrimary },

    // Filters
    filterRow: { flexDirection: 'row', gap: 8 },
    filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: 'transparent' },
    filterBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: 'rgba(65, 105, 225, 0.2)' },
    filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    filterTextActive: { color: COLORS.primary },

    // List Content
    listContent: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 16, ...SHADOWS.small, borderWidth: 1, borderColor: '#f1f5f9' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarImage: { width: 48, height: 48, borderRadius: 24 },
    avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.primary },

    studentInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
    studentId: { fontSize: 13, color: COLORS.textMuted },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

    cardDetails: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14, gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },

    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
    viewBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    viewBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },

    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { color: COLORS.textMuted, fontSize: 15, marginTop: 10 },

    // Detail View Styles
    detailScroll: { padding: 16, paddingBottom: 120 },
    detailHeaderTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
    detailCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.medium },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
    detailAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#e2e8f0' },
    detailField: { width: '45%', marginBottom: 10 },
    detailLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, marginBottom: 4, letterSpacing: 0.5 },
    detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

    // Workflow Styles
    workflowContainer: { paddingVertical: 8 },
    workflowStep: { flexDirection: 'row', gap: 12 },
    workflowDot: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, fontSize: 14, fontWeight: 'bold', color: COLORS.white, overflow: 'hidden' },
    workflowStepActive: { opacity: 1 },
    workflowStepPending: { opacity: 0.7 },
    workflowStepRejected: { opacity: 1 },
    workflowTextContainer: { flex: 1, paddingTop: 2 },
    workflowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
    workflowSubtitle: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: 16 },
    workflowLine: { width: 2, height: 24, backgroundColor: '#e2e8f0', marginLeft: 13, marginVertical: -14, zIndex: -1 },

    // Actions
    stickyActionArea: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.large },
    approveBtn: { flex: 1, backgroundColor: COLORS.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
    approveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
    rejectBtn: { flex: 1, backgroundColor: COLORS.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
    rejectBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, ...SHADOWS.large },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    modalLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
    modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, height: 100, padding: 16, fontSize: 15, color: COLORS.textPrimary, marginBottom: 20 },
    approveConfirmBtn: { backgroundColor: COLORS.success, padding: 16, borderRadius: 12, alignItems: 'center' },
    rejectConfirmBtn: { backgroundColor: COLORS.danger, padding: 16, borderRadius: 12, alignItems: 'center' },
    confirmBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default PassApprovalScreen;

