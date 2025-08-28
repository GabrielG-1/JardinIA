import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Initialize Firebase Admin SDK
const initializeAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;
  if (!serviceAccount) {
    throw new Error('Firebase service account key is not available.');
  }
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

/**
 * POST handler to create a session cookie from an ID token.
 */
export async function POST(request: NextRequest) {
  try {
    initializeAdminApp();
    const authorization = request.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
      const idToken = authorization.split('Bearer ')[1];
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
      
      cookies().set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' });
      
      return NextResponse.json({ status: 'success' });
    }
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error('Session Login Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE handler to clear the session cookie.
 */
export async function DELETE() {
  try {
    cookies().delete('session');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Session Logout Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
