import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Image, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL, CDN_URL, COLORS, SHADOWS } from '../../constants/config';

const WardenEmergencyOutpassScreen = () => {
    const navigation = useNavigation<any>();
    
    // Search State
    const [searchRoom, setSearchRoom] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    
    // Apply State
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 1. Search students by room
    const handleSearch = async () => {
        if (!searchRoom.trim()) {
            Toast.show({ type: 'info', text1: 'Please enter a room number' });
            return;
        }

        setIsSearching(true);
        setSelectedStudent(null);
        setReason('');
        
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/warden/students/roomno/${searchRoom.trim()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const roomStudents = res.data.students || [];
            
            setStudents(roomStudents);
            
            if (roomStudents.length === 0) {
                Toast.show({ type: 'info', text1: `No students found in room ${searchRoom}` });
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to fetch students. Check room number.';
            Toast.show({ type: 'error', text1: 'Search Failed', text2: msg });
            setStudents([]);
        } finally {
            setIsSearching(false);
        }
    };

    // 2. Apply Emergency Outpass
    const handleApply = async () => {
        if (!selectedStudent) {
            Toast.show({ type: 'info', text1: 'Please select a student first' });
            return;
        }
        if (!reason.trim()) {
            Toast.show({ type: 'info', text1: 'Please provide a reason' });
            return;
        }

        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const studentId = selectedStudent._id || selectedStudent.id;
            
            await axios.post(
                `${API_URL}/warden/outpass/apply/${studentId}`,
                { reason: reason.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Toast.show({ type: 'success', text1: 'Emergency outpass created and approved!' });
            
            // Go back to the dashboard or history list
            navigation.goBack();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to create emergency outpass';
            Toast.show({ type: 'error', text1: 'Apply Failed', text2: msg });
        } finally {
            setSubmitting(false);
        }
    };

    const renderAvatar = (student: any) => {
        if (student.photo) {
            const uri = student.photo.startsWith('http') ? student.photo : `${CDN_URL}${student.photo}`;
            return <Image source={{ uri }} style={styles.avatar} />;
        }
        return (
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{student.name.charAt(0).toUpperCase()}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emergency Outpass</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.headerInfo}>
                    <Text style={styles.headerInfoTitle}>🚨 Apply Emergency Outpass</Text>
                    <Text style={styles.headerInfoSub}>For critical issues. Outpass is instantly approved.</Text>
                </View>

                {/* Step 1: Search */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>1. Search Student Room</Text>
                    <View style={styles.searchRow}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Room Number (e.g., 101)"
                            value={searchRoom}
                            onChangeText={setSearchRoom}
                            placeholderTextColor={COLORS.textLight}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        <TouchableOpacity 
                            style={[styles.searchBtn, isSearching && { opacity: 0.7 }]} 
                            onPress={handleSearch}
                            disabled={isSearching}
                        >
                            {isSearching ? (
                                <ActivityIndicator color={COLORS.white} size="small" />
                            ) : (
                                <Text style={styles.searchBtnText}>Search</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Step 2: Select Student */}
                {students.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>2. Select Student from Room {searchRoom}</Text>
                        
                        {students.map((student) => {
                            const isSelected = selectedStudent?._id === student._id;
                            return (
                                <TouchableOpacity
                                    key={student._id}
                                    style={[styles.studentCard, isSelected && styles.studentCardSelected]}
                                    onPress={() => setSelectedStudent(student)}
                                    activeOpacity={0.7}
                                >
                                    {renderAvatar(student)}
                                    <View style={styles.studentInfo}>
                                        <Text style={styles.studentName}>{student.name}</Text>
                                        <Text style={styles.studentReg}>{student.registerNumber || student.register_number}</Text>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{student.department} - Year {student.year}</Text>
                                        </View>
                                    </View>
                                    {/* Selected Checkmark */}
                                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                                        {isSelected && <View style={styles.radioInner} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Step 3: Apply */}
                {selectedStudent && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>3. Emergency Details</Text>
                        
                        <View style={styles.selectedSummary}>
                            <Text style={styles.summaryText}>
                                <Text style={{ fontWeight: 'bold' }}>Selected: </Text>
                                {selectedStudent.name} ({selectedStudent.registerNumber || selectedStudent.register_number})
                            </Text>
                        </View>

                        <Text style={styles.label}>Reason for Emergency <Text style={{ color: COLORS.danger }}>*</Text></Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Describe the medical emergency or critical situation..."
                            value={reason}
                            onChangeText={setReason}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholderTextColor={COLORS.textLight}
                        />

                        <View style={styles.alertBox}>
                            <Text style={styles.alertText}>
                                <Text style={{ fontWeight: 'bold' }}>Note: </Text>
                                This will create an outpass of type <Text style={{ fontStyle: 'italic' }}>HostelEmergency</Text> and automatically set the status to <Text style={{ fontWeight: 'bold' }}>Approved</Text> across all levels.
                            </Text>
                        </View>

                        <TouchableOpacity 
                            style={[styles.applyBtn, submitting && { opacity: 0.7 }]}
                            onPress={handleApply}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.applyBtnText}>Create & Approve Emergency Outpass</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

/* ─── Styles ─── */

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        zIndex: 10,
    },
    headerBtn: { width: 70, paddingVertical: 5 },
    headerBtnText: { color: COLORS.primaryDark, fontSize: 16, fontWeight: '600' },
    headerTitle: { color: COLORS.primaryDark, fontSize: 18, fontWeight: '700' },

    scrollContent: { padding: 16, paddingBottom: 40 },

    headerInfo: { marginBottom: 20 },
    headerInfoTitle: { fontSize: 22, fontWeight: '800', color: COLORS.danger, marginBottom: 8 },
    headerInfoSub: { fontSize: 14, color: COLORS.textMuted },

    // Card general
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)'
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },

    // Search Step
    searchRow: { flexDirection: 'row', gap: 12 },
    searchInput: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    searchBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.small,
    },
    searchBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },

    // Student list step
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: COLORS.white,
    },
    studentCardSelected: {
        borderColor: COLORS.danger,
        backgroundColor: '#fef2f2',
    },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.border },
    avatarPlaceholder: {
        width: 48, height: 48, borderRadius: 24, 
        backgroundColor: COLORS.border,
        justifyContent: 'center', alignItems: 'center'
    },
    avatarLetter: { fontSize: 18, fontWeight: '700', color: COLORS.textMuted },
    studentInfo: { flex: 1, marginLeft: 14 },
    studentName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
    studentReg: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6 },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.background,
        paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
    
    // Custom Radio Button
    radio: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: COLORS.border,
        justifyContent: 'center', alignItems: 'center',
        marginLeft: 10
    },
    radioActive: { borderColor: COLORS.danger },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger },

    // Apply Step
    selectedSummary: {
        backgroundColor: '#fef2f2',
        borderWidth: 1, borderColor: COLORS.danger, borderStyle: 'dashed',
        padding: 12, borderRadius: 8, marginBottom: 20
    },
    summaryText: { color: '#991b1b', fontSize: 14 },
    
    label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
    textArea: {
        backgroundColor: COLORS.background,
        borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 12, padding: 14,
        fontSize: 15, color: COLORS.textPrimary,
        minHeight: 100, marginBottom: 20,
    },
    
    alertBox: {
        backgroundColor: '#fffbeb',
        borderLeftWidth: 4, borderLeftColor: COLORS.warning,
        padding: 14, borderRadius: 6, marginBottom: 20,
    },
    alertText: { color: '#b45309', fontSize: 13, lineHeight: 18 },

    applyBtn: {
        backgroundColor: COLORS.danger,
        borderRadius: 12, paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.medium,
    },
    applyBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default WardenEmergencyOutpassScreen;
