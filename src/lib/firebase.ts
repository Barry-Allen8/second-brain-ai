/**
 * Firebase Admin SDK initialization.
 * 
 * Supports two authentication methods:
 * 1. Environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) - preferred for deployment
 * 2. Service account JSON file (GOOGLE_APPLICATION_CREDENTIALS) - optional for local dev
 */

import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// Interface for environment variable credentials
interface FirebaseCredentials {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

// Function to get credentials from env vars
function getCredentialsFromEnv(): FirebaseCredentials | null {
    const projectId = process.env['APP_FIREBASE_PROJECT_ID'] || process.env['FIREBASE_PROJECT_ID'];
    const clientEmail = process.env['APP_FIREBASE_CLIENT_EMAIL'] || process.env['FIREBASE_CLIENT_EMAIL'];
    const privateKey = process.env['APP_FIREBASE_PRIVATE_KEY'] || process.env['FIREBASE_PRIVATE_KEY'];

    if (projectId && clientEmail && privateKey) {
        return {
            projectId,
            clientEmail,
            // Handle private key potentially having \n literals or being base64 encoded
            privateKey: privateKey.replace(/\\n/g, '\n'),
        };
    }
    return null;
}

// Lazy initialization
let initialized = false;

function initFirebase() {
    if (initialized) return;

    if (admin.apps.length > 0) {
        initialized = true;
        return;
    }

    const credentials = getCredentialsFromEnv();

    if (credentials) {
        admin.initializeApp({
            credential: admin.credential.cert(credentials as ServiceAccount),
        });
        console.log('🔥 Firebase Admin initialized with environment variables');
    } else {
        // Fallback to default application credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS file)
        // This allows using a service-account.json file locally if env vars aren't set
        try {
            admin.initializeApp();
            console.log('🔥 Firebase Admin initialized with default credentials');
        } catch (error) {
            console.warn('⚠️ Firebase initialization failed. Firestore will not work.');
            console.warn('   Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
        }
    }

    initialized = true;
}

// Ensure initialization before exporting db
initFirebase();

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
