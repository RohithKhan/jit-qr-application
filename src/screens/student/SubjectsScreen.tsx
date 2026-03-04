import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    TextInput, ActivityIndicator, ScrollView,
    Platform, UIManager, LayoutAnimation
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { Subject } from '../../types';
import { COLORS, SHADOWS } from '../../constants/config';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SubjectsScreen = () => {
    const navigation = useNavigation<any>();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [filtered, setFiltered] = useState<Subject[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedSem, setExpandedSem] = useState<number | null>(null);

    useEffect(() => { fetchSubjects(); }, []);
    useEffect(() => {
        setFiltered(subjects.filter(s =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.code.toLowerCase().includes(query.toLowerCase())
        ));
    }, [query, subjects]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/api/subjects');
            if (res.status === 200) {
                const data = res.data.subjects || res.data;
                setSubjects(data);
                setFiltered(data);

                // Auto-expand the first semester after load if we have data
                if (data.length > 0) {
                    const firstSem = Math.min(...data.map((s: Subject) => s.semester || 0));
                    setExpandedSem(firstSem);
                }
            }
        } catch { Toast.show({ type: 'error', text1: 'Failed to fetch subjects' }); }
        finally { setLoading(false); }
    };

    const toggleSem = (sem: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSem(expandedSem === sem ? null : sem);
    };

    const subjectsBySem = filtered.reduce((acc, subject) => {
        const sem = subject.semester || 0;
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(subject);
        return acc;
    }, {} as Record<number, Subject[]>);

    const semesters = Object.keys(subjectsBySem).map(Number).sort((a, b) => a - b);

    const renderSubject = (item: Subject) => (
        <TouchableOpacity key={item._id} style={styles.card} onPress={() => navigation.navigate('SubjectDetails', { subject: item })}>
            <View style={styles.cardLeft}>
                <View style={styles.iconBox}>
                    <Text style={styles.iconText}>📚</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.subjectCode}>{item.code}</Text>
                    {item.staffId && <Text style={styles.staffName}>👨‍🏫 {item.staffId.name}</Text>}
                </View>
            </View>
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Academic Subjects</Text>
                <Text style={styles.headerSub}>Browse course materials by semester.</Text>
            </View>
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Search subjects..." placeholderTextColor={COLORS.textLight} />
                </View>
            </View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                    {semesters.length === 0 ? (
                        <Text style={styles.emptyText}>No subjects found.</Text>
                    ) : (
                        semesters.map(sem => {
                            const isExpanded = expandedSem === sem;
                            return (
                                <View key={sem} style={[styles.semesterGroup, isExpanded && styles.semesterGroupExpanded]}>
                                    <TouchableOpacity style={styles.semesterHeader} onPress={() => toggleSem(sem)} activeOpacity={0.7}>
                                        <Text style={styles.semTitle}>{sem === 0 ? 'General Subjects' : `Semester ${sem}`}</Text>
                                        <View style={styles.semHeaderRight}>
                                            <View style={styles.countBadge}>
                                                <Text style={styles.countText}>{subjectsBySem[sem].length}</Text>
                                            </View>
                                            <Text style={[styles.chevron, isExpanded && styles.chevronExpanded]}>▼</Text>
                                        </View>
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.semesterContent}>
                                            {subjectsBySem[sem].map(renderSubject)}
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
    headerSub: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
    searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border },
    searchIcon: { fontSize: 16, marginRight: 8, opacity: 0.6 },
    search: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary },
    list: { padding: 16, gap: 16, paddingBottom: 40 },
    semesterGroup: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.small },
    semesterGroupExpanded: { borderColor: COLORS.primaryLight, ...SHADOWS.medium },
    semesterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: COLORS.white },
    semTitle: { fontSize: 17, fontWeight: '700', color: COLORS.primaryDark, letterSpacing: -0.3 },
    semHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    countBadge: { backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    countText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
    chevron: { fontSize: 14, color: COLORS.textMuted, opacity: 0.6 },
    chevronExpanded: { transform: [{ rotate: '180deg' }], color: COLORS.primary },
    semesterContent: { padding: 16, paddingTop: 0, gap: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surfaceLight },
    card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginTop: 4 },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, paddingRight: 10 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
    iconText: { fontSize: 20 },
    subjectName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
    subjectCode: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginBottom: 3, letterSpacing: 0.5 },
    staffName: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
    arrow: { fontSize: 22, color: COLORS.textMuted },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export default SubjectsScreen;
