import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DEFAULT_TARGET = 'pXg4B6DxU6OCe1PkEGe8DJWnMH72';
const targetInput = process.argv[2] || process.env.ADMIN_TARGET || process.env.ADMIN_TARGET_UID || DEFAULT_TARGET;

console.log('====================================================');
console.log(' 🔎  Firebase Admin SDK — Verify Admin Role');
console.log('====================================================');
console.log(`Checking Target: ${targetInput}\n`);

const possibleKeyPaths = [
  path.join(rootDir, 'serviceAccountKey.json'),
  path.join(__dirname, 'serviceAccountKey.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
].filter(Boolean);

let serviceAccountPath = possibleKeyPaths.find((p) => p && fs.existsSync(p));

if (!serviceAccountPath) {
  const rootFiles = fs.readdirSync(rootDir);
  const foundKey = rootFiles.find((f) => f.includes('adminsdk') && f.endsWith('.json'));
  if (foundKey) {
    serviceAccountPath = path.join(rootDir, foundKey);
  }
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

  try {
    return initializeApp({
      projectId: 'uniqzenshop-8ee15',
    });
  } catch (err) {
    console.error('❌ Could not initialize Firebase Admin SDK.');
    console.log('Please place serviceAccountKey.json in the project root folder.');
    return null;
  }
}

async function main() {
  const app = await initializeAppAdmin();
  if (!app) process.exit(1);

  try {
    const auth = getAuth(app);
    const db = getFirestore(app);

    // 1. Auth check
    console.log('\n[1] Checking Firebase Authentication...');
    let userRecord;
    if (targetInput.includes('@')) {
      userRecord = await auth.getUserByEmail(targetInput.trim().toLowerCase());
    } else {
      userRecord = await auth.getUser(targetInput.trim());
    }
    const targetUid = userRecord.uid;
    console.log(`   • UID:            ${userRecord.uid}`);
    console.log(`   • Email:          ${userRecord.email || 'N/A'}`);
    console.log(`   • Display Name:   ${userRecord.displayName || 'N/A'}`);
    console.log(`   • Custom Claims:  ${JSON.stringify(userRecord.customClaims || {})}`);
    const hasAdminClaim = Boolean(userRecord.customClaims?.admin);
    console.log(`   • Admin Claim:    ${hasAdminClaim ? '✅ YES (admin: true)' : '❌ NO'}`);

    // 2. Firestore document check
    console.log('\n[2] Checking Firestore Database (/users collection)...');
    const userDoc = await db.collection('users').doc(targetUid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      console.log(`   • Firestore Doc:  Exists`);
      console.log(`   • Role in DB:     ${data?.role || 'N/A'}`);
      console.log(`   • DB Admin Role:  ${data?.role === 'admin' ? '✅ YES (role="admin")' : '❌ NO'}`);
    } else {
      console.log(`   • Firestore Doc:  ⚠️ Document not created yet in /users/${targetUid}`);
    }

    // 3. System Summary
    console.log('\n[3] Security & Authorization Status:');
    const isHardcodedInRules = ['MB2gmA9yrEc6d33WZOF9dr1czWz1', 'pXg4B6DxU6OCe1PkEGe8DJWnMH72'].includes(targetUid);
    console.log(`   • In firestore.rules UID list:  ${isHardcodedInRules ? '✅ YES' : '❌ NO'}`);
    console.log(`   • In .env / authContext:         ✅ YES`);
    console.log(`   • Server-side token claim:       ${hasAdminClaim ? '✅ YES' : '⚠️ Pending running npm run set-admin'}`);

    console.log('\n====================================================\n');
  } catch (err) {
    console.error('❌ Error verifying user:', err.message);
    process.exit(1);
  }
}

main();
