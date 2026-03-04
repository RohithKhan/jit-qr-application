const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('c:/Users/ROHITH/Desktop/college/application/src/screens/student/DashboardScreen.tsx');
let fileContent = fs.readFileSync(targetPath, 'utf8');

const importsToAdd = `import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    SafeAreaView, StatusBar, Image, ActivityIndicator, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../../services/api';
import { User } from '../../types';
import { COLORS, CDN_URL, SHADOWS } from '../../constants/config';
import { isProfileComplete } from '../../utils/profileHelper';
import { handleGlobalLogout } from '../../utils/authHelper';

type EventType = 'working' | 'leave' | 'college_event' | 'cia_exam';

interface CalendarEvent {
    id: string;
    date: Date;
    type: EventType;
    title: string;
    description?: string;
    time?: string;
    leaveReason?: string;
}

const INITIAL_EVENTS: CalendarEvent[] = [
    { id: '1', date: new Date(2026, 0, 5), type: 'cia_exam', title: 'CIA 1 - AI & ML', description: 'AI & ML', time: '8:45 AM - 9:15 AM' },
    { id: '2', date: new Date(2026, 0, 6), type: 'cia_exam', title: 'CIA 1 - FDS', description: 'FDS', time: '8:45 AM - 9:15 AM' },
    { id: '3', date: new Date(2026, 0, 7), type: 'cia_exam', title: 'CIA 1 - oops', description: 'oops', time: '8:45 AM - 9:15 AM' },
    { id: '4', date: new Date(2026, 0, 8), type: 'cia_exam', title: 'CIA 1 - Data Structures', description: 'Data Structures', time: '8:45 AM - 9:15 AM' },
    { id: '5', date: new Date(2026, 0, 9), type: 'college_event', title: 'event - DBMS and pongal festival', description: 'DBMS and pongal festival', time: '8:45 AM - 9:15 AM' },
    { id: '6', date: new Date(2026, 0, 10), type: 'cia_exam', title: 'CIA 1 - tamil', description: 'tamil', time: '8:45 AM - 9:15 AM' },
    { id: '7', date: new Date(2026, 0, 26), type: 'leave', title: 'Republic Day', leaveReason: 'National Holiday' },
    { id: '8', date: new Date(2026, 0, 19), type: 'cia_exam', title: 'CIA 1 - english', description: 'english', time: '8:45 AM - 9:15 AM' },
    { id: '9', date: new Date(2026, 0, 11), type: 'leave', title: 'holiday', leaveReason: 'pongal festival' },
    { id: '10', date: new Date(2026, 0, 12), type: 'leave', title: 'holiday', leaveReason: 'pongal festival' },
    { id: '11', date: new Date(2026, 0, 13), type: 'leave', title: 'holiday', leaveReason: 'pongal festival' },
    { id: '12', date: new Date(2026, 0, 14), type: 'leave', title: 'holiday', leaveReason: 'pongal festival' },
    { id: '13', date: new Date(2026, 0, 15), type: 'leave', title: 'holiday', leaveReason: 'pongal festival' },
    { id: '14', date: new Date(2026, 0, 16), type: 'leave', title: 'holiday', leaveReason: 'pongal festival' },
    { id: '15', date: new Date(2026, 0, 17), type: 'leave', title: 'holiday', leaveReason: 'pongal festival' },
    { id: '16', date: new Date(2026, 0, 18), type: 'leave', title: 'holiday', leaveReason: 'pongal festival' },
    { id: '17', date: new Date(2026, 1, 27), type: 'college_event', title: 'Sports Day', description: 'Sports Day', time: '8:45 AM - 9:15 AM' },
    { id: '18', date: new Date(2026, 1, 1), type: 'leave', title: 'holiday', leaveReason: 'sunday' },
    { id: '19', date: new Date(2026, 1, 8), type: 'leave', title: 'holiday', leaveReason: 'sunday' },
    { id: '20', date: new Date(2026, 1, 15), type: 'leave', title: 'holiday', leaveReason: 'sunday' },
    { id: '21', date: new Date(2026, 1, 22), type: 'leave', title: 'holiday', leaveReason: 'sunday' },
    { id: '22', date: new Date(2026, 1, 7), type: 'leave', title: 'holiday', leaveReason: 'saturday' },
    { id: '23', date: new Date(2026, 1, 21), type: 'leave', title: 'holiday', leaveReason: 'saturday' },
    { id: '24', date: new Date(2026, 1, 28), type: 'leave', title: 'holiday', leaveReason: 'saturday' },
    { id: '25', date: new Date(2026, 1, 2), type: 'working', title: 'working', description: 'working day' },
    { id: '26', date: new Date(2026, 1, 3), type: 'working', title: 'working', description: 'working day' },
    { id: '27', date: new Date(2026, 1, 4), type: 'working', title: 'working', description: 'working day' },
    { id: '28', date: new Date(2026, 1, 5), type: 'working', title: 'working', description: 'working day' },
    { id: '29', date: new Date(2026, 1, 6), type: 'working', title: 'working', description: 'working day' },
    { id: '30', date: new Date(2026, 1, 9), type: 'working', title: 'working', description: 'working day' },
    { id: '31', date: new Date(2026, 1, 10), type: 'working', title: 'working', description: 'working day' },
    { id: '32', date: new Date(2026, 1, 11), type: 'working', title: 'working', description: 'working day' },
    { id: '33', date: new Date(2026, 1, 12), type: 'working', title: 'working', description: 'working day' },
    { id: '34', date: new Date(2026, 1, 13), type: 'working', title: 'working', description: 'working day' },
    { id: '35', date: new Date(2026, 1, 16), type: 'working', title: 'working', description: 'working day' },
    { id: '36', date: new Date(2026, 1, 17), type: 'working', title: 'working', description: 'working day' },
    { id: '37', date: new Date(2026, 1, 18), type: 'working', title: 'working', description: 'working day' },
    { id: '38', date: new Date(2026, 1, 19), type: 'working', title: 'working', description: 'working day' },
    { id: '39', date: new Date(2026, 1, 20), type: 'working', title: 'working', description: 'working day' },
    { id: '40', date: new Date(2026, 1, 23), type: 'working', title: 'working', description: 'working day' },
    { id: '41', date: new Date(2026, 1, 24), type: 'working', title: 'working', description: 'working day' },
    { id: '42', date: new Date(2026, 1, 25), type: 'working', title: 'working', description: 'working day' },
    { id: '43', date: new Date(2026, 1, 26), type: 'working', title: 'working', description: 'working day' },
    { id: '44', date: new Date(2026, 1, 14), type: 'working', title: 'working', description: 'working day' },
];`;

fileContent = fileContent.replace(/import React[\s\S]*?import { handleGlobalLogout } from '\.\.\/\.\.\/utils\/authHelper';/, importsToAdd);

const stateToAdd = `    const [loading, setLoading] = useState(true);

    // Calendar State
    const [events] = useState<CalendarEvent[]>(INITIAL_EVENTS);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    useEffect(() => {`;

fileContent = fileContent.replace(/    const \[loading, setLoading\] = useState\(true\);\r?\n\r?\n    useEffect\(\(\) => {/, stateToAdd);

const helpersToAdd = `    const getPhotoUrl = () => {
        if (!user.photo) return \`https://ui-avatars.com/api/?name=\${encodeURIComponent(user.name)}&background=0047AB&color=fff&size=200\`;
        if (user.photo.startsWith('http')) return user.photo;
        return \`\${CDN_URL}\${user.photo}\`;
    };

    // Calendar Helpers
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    
    const getEventsForDate = (day: number) => {
        return events.filter(event => {
            const evDate = new Date(event.date);
            return evDate.getDate() === day && evDate.getMonth() === currentDate.getMonth() && evDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    const changeMonth = (delta: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    const getEventColor = (type: EventType) => {
        switch (type) {
            case 'working': return '#3B82F6';
            case 'leave': return '#EF4444';
            case 'college_event': return '#F59E0B';
            case 'cia_exam': return '#8B5CF6';
            default: return COLORS.primary;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    
    // Create matrix of days (padding + actual days)
    const calendarCells = [];
    for (let i = 0; i < firstDay; i++) calendarCells.push({ empty: true, key: \`empty-\${i}\` });
    for (let day = 1; day <= daysInMonth; day++) calendarCells.push({ empty: false, day, key: \`day-\${day}\` });

    return (`;

fileContent = fileContent.replace(/    const getPhotoUrl = \(\) => {[\s\S]*?    if \(loading\) {[\s\S]*?    return \(/, helpersToAdd);

const layoutToAdd = `                </View>

                {/* Monthly Calendar Section */}
                <View style={styles.section}>
                    <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                        <View style={styles.calendarHeaderWrapper}>
                            <View>
                                <Text style={styles.calendarHeaderTitle}>📅 Monthly Calendar</Text>
                                <Text style={styles.calendarHeaderSub}>Track your schedule and events</Text>
                            </View>
                            <TouchableOpacity style={styles.todayBtn} onPress={() => setCurrentDate(new Date())}>
                                <Text style={styles.todayText}>Today</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.calendarControls}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
                                <Text style={styles.monthNavText}>← Prev</Text>
                            </TouchableOpacity>
                            <Text style={styles.currentMonthYear}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
                                <Text style={styles.monthNavText}>Next →</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.calendarGrid}>
                            {/* Weekday Headers */}
                            <View style={styles.weekRow}>
                                {weekDays.map(d => <Text key={d} style={styles.weekDayText}>{d}</Text>)}
                            </View>

                            {/* Days Matrix */}
                            <View style={styles.daysMatrix}>
                                {calendarCells.map((cell) => {
                                    if (cell.empty) return <View key={cell.key} style={styles.dayBox} />;
                                    
                                    const dayEvents = getEventsForDate(cell.day!);
                                    const isDayToday = isToday(cell.day!);
                                    const hasEvent = dayEvents.length > 0;
                                    
                                    return (
                                        <TouchableOpacity 
                                            key={cell.key} 
                                            activeOpacity={hasEvent ? 0.7 : 1}
                                            style={[styles.dayBox, isDayToday && styles.todayBox]}
                                            onPress={() => hasEvent && setSelectedEvent(dayEvents[0])}
                                        >
                                            <Text style={[styles.dayNumber, isDayToday && styles.todayNumber]}>{cell.day}</Text>
                                            {hasEvent && (
                                                <View style={styles.eventDots}>
                                                    {dayEvents.slice(0, 3).map((ev, i) => (
                                                        <View key={i} style={[styles.eventDot, { backgroundColor: getEventColor(ev.type) }]} />
                                                    ))}
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Calendar Legend */}
                        <View style={styles.legendContainer}>
                            <Text style={styles.legendTitle}>Legend</Text>
                            <View style={styles.legendGrid}>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendText}>Working Day</Text></View>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Leave / Holiday</Text></View>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>College Events</Text></View>
                                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} /><Text style={styles.legendText}>CIA Exams</Text></View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Vision */}
                <View style={styles.section}>
                    <View style={styles.visionCard}>
                        <Text style={styles.visionTitle}>🚀 Vision & Mission</Text>
                        <Text style={styles.visionText}>
                            Jeppiaar Institute of Technology aspires to provide technical education in futuristic technologies with innovative, industrial, and social applications for the betterment of humanity.
                        </Text>
                    </View>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Event Modal */}
            <Modal visible={!!selectedEvent} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Event Details</Text>
                            <TouchableOpacity onPress={() => setSelectedEvent(null)} style={styles.modalClose}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {selectedEvent && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.modalTypeBadge}>
                                    <View style={[styles.legendDot, { backgroundColor: getEventColor(selectedEvent.type), marginRight: 6 }]} />
                                    <Text style={styles.modalTypeLabel}>
                                        {selectedEvent.type.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </View>
                                
                                <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
                                
                                <View style={styles.eventDetailRow}>
                                    <Text style={styles.eventDetailIcon}>📅</Text>
                                    <View>
                                        <Text style={styles.eventDetailLabel}>Date</Text>
                                        <Text style={styles.eventDetailValue}>{selectedEvent.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                    </View>
                                </View>

                                {selectedEvent.time && (
                                    <View style={styles.eventDetailRow}>
                                        <Text style={styles.eventDetailIcon}>🕐</Text>
                                        <View>
                                            <Text style={styles.eventDetailLabel}>Time</Text>
                                            <Text style={styles.eventDetailValue}>{selectedEvent.time}</Text>
                                        </View>
                                    </View>
                                )}

                                {selectedEvent.description && (
                                    <View style={styles.eventDetailRow}>
                                        <Text style={styles.eventDetailIcon}>📝</Text>
                                        <View>
                                            <Text style={styles.eventDetailLabel}>Description</Text>
                                            <Text style={styles.eventDetailValue}>{selectedEvent.description}</Text>
                                        </View>
                                    </View>
                                )}

                                {selectedEvent.leaveReason && (
                                    <View style={styles.eventDetailRow}>
                                        <Text style={styles.eventDetailIcon}>ℹ️</Text>
                                        <View>
                                            <Text style={styles.eventDetailLabel}>Reason</Text>
                                            <Text style={styles.eventDetailValue}>{selectedEvent.leaveReason}</Text>
                                        </View>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};`;

fileContent = fileContent.replace(/                <\/View>\r?\n\r?\n                {\/\* Vision \*\/}[\s\S]*?    \);\r?\n};/, layoutToAdd);

const stylesToAdd = `    visionCard: {
        backgroundColor: COLORS.primaryDark, borderRadius: 20, padding: 24, marginBottom: 32,
        ...SHADOWS.large,
    },
    visionTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },
    visionText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 24 },

    // Calendar Specific Styles
    calendarHeaderWrapper: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    calendarHeaderTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4, letterSpacing: -0.3 },
    calendarHeaderSub: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
    todayBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    todayText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
    calendarControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    monthNavBtn: { backgroundColor: COLORS.background, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    monthNavText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 },
    currentMonthYear: { fontSize: 16, fontWeight: '800', color: COLORS.primaryDark },
    calendarGrid: { paddingHorizontal: 16, paddingBottom: 16 },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    weekDayText: { width: \`\${100/7}%\`, textAlign: 'center', fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
    daysMatrix: { flexDirection: 'row', flexWrap: 'wrap' },
    dayBox: { width: \`\${100/7}%\`, aspectRatio: 1, justifyContent: 'flex-start', alignItems: 'center', paddingVertical: 6, borderRadius: 12 },
    todayBox: { backgroundColor: COLORS.primary, ...SHADOWS.small },
    dayNumber: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 4 },
    todayNumber: { color: COLORS.white, fontWeight: '800' },
    eventDots: { flexDirection: 'row', gap: 2 },
    eventDot: { width: 6, height: 6, borderRadius: 3 },
    legendContainer: { padding: 20, backgroundColor: COLORS.background, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    legendTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
    legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', width: '46%', gap: 8 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.white, width: '100%', borderRadius: 24, maxHeight: '80%', ...SHADOWS.large },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    modalClose: { padding: 4 },
    closeIcon: { fontSize: 20, color: COLORS.textMuted, fontWeight: '800' },
    modalBody: { padding: 20 },
    modalTypeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
    modalTypeLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
    eventTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 20, letterSpacing: -0.3 },
    eventDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
    eventDetailIcon: { fontSize: 24 },
    eventDetailLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    eventDetailValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600', lineHeight: 22 },
});

export default DashboardScreen;`;

fileContent = fileContent.replace(/    visionCard: {[\s\S]*?export default DashboardScreen;/, stylesToAdd);

fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log('Successfully injected Calendar into DashboardScreen.tsx');
