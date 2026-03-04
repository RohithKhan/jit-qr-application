const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('c:/Users/ROHITH/Desktop/college/application/src/screens/student/ProfileScreen.tsx');
let fileContent = fs.readFileSync(targetPath, 'utf8');

// Replace the Save Changes button
if (fileContent.includes('style={[styles.btn, saving && styles.btnDisabled]}')) {
    fileContent = fileContent.replace(
        'style={[styles.btn, saving && styles.btnDisabled]}',
        'style={[styles.btn, { flex: 1 }, saving && styles.btnDisabled]}'
    );
}

// Replace the Cancel button
if (fileContent.includes('style={styles.btnGhost} onPress={() => setIsEditing(false)}')) {
    fileContent = fileContent.replace(
        'style={styles.btnGhost} onPress={() => setIsEditing(false)}',
        'style={[styles.btnGhost, { marginLeft: 0 }]} onPress={() => setIsEditing(false)}'
    );
}

fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log("Successfully aligned buttons.");
