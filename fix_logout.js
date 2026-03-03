const fs = require('fs');
const path = require('path');

const files = [
    'src/screens/student/DashboardScreen.tsx',
    'src/screens/student/ProfileScreen.tsx',
    'src/screens/staff/StaffDashboardScreen.tsx',
    'src/screens/staff/StaffProfileScreen.tsx',
    'src/screens/warden/WardenDashboardScreen.tsx',
    'src/screens/warden/WardenProfileScreen.tsx',
    'src/screens/watchman/WatchmanDashboardScreen.tsx',
    'src/screens/year-incharge/YearInchargeDashboardScreen.tsx'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');

    // add import if not present
    if (!content.includes('import { handleGlobalLogout }')) {
        const lastImportIndex = content.lastIndexOf('import ');
        const nextLineIndex = content.indexOf('\n', lastImportIndex);
        const importStr = `\nimport { handleGlobalLogout } from '../../utils/authHelper';`;
        content = content.slice(0, nextLineIndex) + importStr + content.slice(nextLineIndex);
    }

    // replace handleLogout body
    const regex = /const\s+handleLogout\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?navigation\.reset\(\{[\s\S]*?\}\s*\]\);\s*\};/g;

    const newContent = content.replace(regex, 'const handleLogout = handleGlobalLogout;');
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Updated', file);
    } else {
        console.log('No regex match in', file);
    }
});
