import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    SafeAreaView, ActivityIndicator, Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { Subject, SubjectFile } from '../../types';
import { COLORS, CDN_URL } from '../../constants/config';

const SubjectDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const subject: Subject = route.params?.subject;
    const [files, setFiles] = useState<SubjectFile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (subject?._id) fetchFiles(); }, [subject]);

    const fetchFiles = async () => {
        try {
            const res = await api.get(`/api/subjects/${subject._id}/files`);
            setFiles(res.data.files || res.data || []);
        } catch { Toast.show({ type: 'error', text1: 'Failed to load files' }); }
        finally { setLoading(false); }
    };

    const openFile = (url: string) => {
        const fullUrl = url.startsWith('http') ? url : `${CDN_URL}${url}`;
        Linking.openURL(fullUrl);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{subject?.name}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.code}>{subject?.code} • {subject?.department}</Text>
                {subject?.staffId && <Text style={styles.staff}>👨‍🏫 {subject.staffId.name}</Text>}
            </View>
            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> :
                <FlatList
                    data={files}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No files uploaded yet.</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.fileCard} onPress={() => openFile(item.url)}>
                            <Text style={styles.fileIcon}>📄</Text>
                            <View style={styles.fileInfo}>
                                <Text style={styles.fileName}>{item.filename}</Text>
                                <Text style={styles.fileDate}>{new Date(item.uploadedAt).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.downloadIcon}>⬇️</Text>
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
    backBtn: { padding: 4 },
    backText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
    info: { backgroundColor: COLORS.primaryLight, padding: 16, paddingHorizontal: 20 },
    code: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginBottom: 4 },
    staff: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
    list: { padding: 16, gap: 10 },
    fileCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    fileIcon: { fontSize: 28 },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
    fileDate: { fontSize: 12, color: COLORS.textMuted },
    downloadIcon: { fontSize: 20 },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 16 },
});

export default SubjectDetailsScreen;
