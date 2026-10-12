import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Target UID or Email requested
const DEFAULT_TARGET = 'pXg4B6DxU6OCe1PkEGe8DJWnMH72';
const targetInput = process.argv[2] || process.env.ADMIN_TARGET || process.env.ADMIN_TARGET_UID || DEFAULT_TARGET;

console.log('====================================================');
console.log(' 🛡️  Firebase Admin SDK — Role Management Script');
console.log('====================================================');
console.log(`Target: ${targetInput}`);

// Locate service account credentials
const possibleKeyPaths = [
  path.join(rootDir, 'serviceAccountKey.json'),
  path.join(__dirname, 'serviceAccountKey.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
].filter(Boolean);

let serviceAccountPath = possibleKeyPaths.find((p) => p && fs.existsSync(p));

if (!serviceAccountPath) {
  // Check if any *-adminsdk-*.json file exists in root
  const rootFiles = fs.readdirSync(rootDir);
  const foundKey = rootFiles.find((f) => f.includes('adminsdk') && f.endsWith('.json'));
  if (foundKey) {
    serviceAccountPath = path.join(rootDir, foundKey);
  }
}

function printInstructions() {
  console.log('\n----------------------------------------------------');
  console.log('📋 HOW TO EXECUTE THIS WITH YOUR SERVICE ACCOUNT:');
  console.log('----------------------------------------------------');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select project "uniqzenshop-8ee15"');
  console.log('3. Click Gear ⚙️ (Project settings) -> "Service accounts" tab');
  console.log('4. Click "Generate new private key" -> "Generate key"');
  console.log('5. Save/rename the file as: serviceAccountKey.json');
  console.log('6. Place it in: ' + rootDir);
  console.log('7. Run: node scripts/setAdminRole.js user@example.com');
  console.log('----------------------------------------------------\n');
}

async function initializeAppAdmin() {
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    console.log(`🔑 Using Service Account credentials: ${path.basename(serviceAccountPath)}`);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || 'uniqzenshop-8ee15',
    });
  }

  // Try Application Default Credentials
  try {
    console.log('⚠️  serviceAccountKey.json not found in project folder.');
    console.log('Attempting Application Default Credentials (e.g. gcloud)...');
    return initializeApp({
      projectId: 'uniqzenshop-8ee15',
    });
  } catch (err) {
    console.error('\n❌ Could not initialize Firebase Admin SDK.');
    printInstructions();
    return null;
  }
}

async function main() {
  const app = await initializeAppAdmin();
  if (!app) {
    process.exit(1);
  }

  try {
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('\n[1/3] 🔍 Verifying User exists in Firebase Authentication...');
    let userRecord;
    try {
      if (targetInput.includes('@')) {
        userRecord = await auth.getUserByEmail(targetInput.trim().toLowerCase());
      } else {
        userRecord = await auth.getUser(targetInput.trim());
      }
      console.log(`   ✅ User found! Email: ${userRecord.email || '(No email)'}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Created: ${userRecord.metadata.creationTime}`);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        console.error(`\n❌ Error: User "${targetInput}" was not found in Firebase Authentication.`);
        console.error('   Please make sure the user has logged in / signed up at least once.');
        process.exit(1);
      }
      throw authErr;
    }

    const targetUid = userRecord.uid;


    console.log('\n[2/3] 🔐 Setting Admin Custom Claims on Firebase Auth Token...');
    const existingClaims = userRecord.customClaims || {};
    const newClaims = {
      ...existingClaims,
      admin: true,
      role: 'admin',
    };

    await auth.setCustomUserClaims(targetUid, newClaims);
    console.log('   ✅ Custom Claims applied:');
    console.log('  ', JSON.stringify(newClaims, null, 2));

    console.log('\n[3/3] 💾 Syncing Admin Role to Firestore Database (/users collection)...');
    const userDocRef = db.collection('users').doc(targetUid);
    await userDocRef.set(
      {
        uid: targetUid,
        email: userRecord.email || '',
        displayName: userRecord.displayName || '',
        role: 'admin',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`   ✅ Firestore document /users/${targetUid} updated with role="admin".`);

    // Verify final status
    const verifiedUser = await auth.getUser(targetUid);
    console.log('\n====================================================');
    console.log(' 🎉 SUCCESS: Admin Role Granted Successfully!');
    console.log('====================================================');
    console.log(`UID:           ${verifiedUser.uid}`);
    console.log(`Email:         ${verifiedUser.email}`);
    console.log(`Custom Claims: ${JSON.stringify(verifiedUser.customClaims)}`);
    console.log('\nNext steps:');
    console.log('1. If the user is currently signed in, they must Sign Out and Sign back in to receive the updated token.');
    console.log('2. Log in at: /admin/login');
    console.log('3. The server-side Firestore security rules and client Admin portal will now fully authorize this user.\n');
  } catch (error) {
    console.error('\n❌ An error occurred during execution:', error.message || error);
    if (!serviceAccountPath) {
      printInstructions();
    }
    process.exit(1);
  }
}

main();
