const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('c:/Users/ROHITH/Desktop/college/application/src/screens/student/DashboardScreen.tsx');
let fileContent = fs.readFileSync(targetPath, 'utf8');

fileContent = fileContent.replace(
    `    return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
            </SafeAreaView>
        );
    }`,
    ''
);

fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log('Successfully removed duplicate block.');
