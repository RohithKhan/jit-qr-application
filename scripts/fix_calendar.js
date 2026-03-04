const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('c:/Users/ROHITH/Desktop/college/application/src/screens/student/DashboardScreen.tsx');
let fileContent = fs.readFileSync(targetPath, 'utf8');

// The file currently has a broken block around loading/calendar cells:
//     if (loading) {
//     
// 
//     const firstDay = getFirstDayOfMonth(currentDate);
//     const daysInMonth = getDaysInMonth(currentDate);
//     
//     // Create matrix of days (padding + actual days)
//     const calendarCells = [];
//     for (let i = 0; i < firstDay; i++) calendarCells.push({ empty: true, key: `empty-${i}` });
//     for (let day = 1; day <= daysInMonth; day++) calendarCells.push({ empty: false, day, key: `day-${day}` });
// 
//     return (
//             <SafeAreaView style={styles.container}>
//                 <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
//             </SafeAreaView>
//         );
//     }

const brokenBlockRegex = /    if \(loading\) {[\s\S]*?    return \([\s\S]*?<SafeAreaView style=\{styles\.container\}>[\s\S]*?<ActivityIndicator size="large" color=\{COLORS\.primary\} style=\{\{ flex: 1 \}\} \/>[\s\S]*?<\/SafeAreaView>[\s\S]*?\);[\s\S]*?\}/;

const fixedBlock = `    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }

    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    
    // Create matrix of days (padding + actual days)
    const calendarCells: { empty: boolean; key: string; day?: number }[] = [];
    for (let i = 0; i < firstDay; i++) calendarCells.push({ empty: true, key: \`empty-\${i}\` });
    for (let day = 1; day <= daysInMonth; day++) calendarCells.push({ empty: false, day, key: \`day-\${day}\` });`;

fileContent = fileContent.replace(brokenBlockRegex, fixedBlock);

fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log('Successfully repaired loading and calendarCells structure.');
