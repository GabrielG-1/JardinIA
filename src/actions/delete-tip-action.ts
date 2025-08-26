'use server';

import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

// Helper function to initialize Firebase Admin SDK
const initializeAdminApp = () => {
  if (getApps().length > 0) {
    return admin.app();
  }

  // Check if the service account key is available in environment variables
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (!serviceAccount) {
    // This will be logged on the server, not visible to clients
    console.error('Firebase service account key is not available. Deletion will fail.');
    // We don't throw here to avoid crashing the server on startup,
    // but operations will fail.
    return null;
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
};

const isAdminEmail = (email?: string): boolean => {
    if (!email) return false;
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
        .split(',')
        .map(e => e.trim());
    return adminEmails.includes(email);
};

export async function deleteTipAsAdmin(tipId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminApp = initializeAdminApp();
    if (!adminApp) {
        return { success: false, error: 'Server not configured for admin operations.' };
    }

    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
      return { success: false, error: 'Authentication required.' };
    }
    
    const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    
    if (!isAdminEmail(decodedToken.email)) {
        return { success: false, error: 'Permission denied. Not an administrator.' };
    }
    
    // User is an admin, proceed with deletion
    await adminApp.firestore().collection('community-tips').doc(tipId).delete();
    
    return { success: true };

  } catch (error: any) {
    console.error('Error in deleteTipAsAdmin:', error);
    let errorMessage = 'An unexpected error occurred during deletion.';
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/invalid-session-cookie') {
        errorMessage = 'Your session has expired. Please sign in again.';
    } else if(error.code === 'auth/argument-error'){
        errorMessage = 'Authentication token is invalid.';
    }
    
    return { success: false, error: errorMessage };
  }
}
