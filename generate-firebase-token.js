#!/usr/bin/env node

/**
 * This script generates a Firebase ID token for testing purposes.
 * It uses the Firebase Admin SDK to create a custom token, which can be exchanged for an ID token.
 */

const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

// Check if Firebase credentials are available
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Firebase credentials not found in environment variables.');
  console.error('Please make sure you have a .env file with the following variables:');
  console.error('FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

// Initialize Firebase Admin SDK
try {
  // Process the private key
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.split('\\n').join('\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    })
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Generate a custom token for a test user
async function generateCustomToken() {
  try {
    // You can specify a user ID or let Firebase generate one
    const uid = 'test-user-' + Date.now();
    
    // Optional: Add custom claims to the token
    const additionalClaims = {
      role: 'user',
      premiumAccount: true
    };
    
    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    console.log('✅ Custom token generated successfully');
    console.log('📝 Custom Token:', customToken);
    
    return { customToken, uid };
  } catch (error) {
    console.error('❌ Error generating custom token:', error);
    throw error;
  }
}

// Exchange custom token for an ID token
async function exchangeCustomToken(customToken) {
  try {
    // You need a Firebase API Key for this step
    if (!process.env.FIREBASE_API_KEY) {
      console.error('❌ FIREBASE_API_KEY not found in environment variables');
      console.error('Please add your Firebase Web API Key to the .env file');
      process.exit(1);
    }
    
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );
    
    const idToken = response.data.idToken;
    console.log('✅ ID token obtained successfully');
    console.log('📝 ID Token:', idToken);
    console.log('\n✨ Use this token in your Authorization header:');
    console.log(`Authorization: Bearer ${idToken}`);
    
    return idToken;
  } catch (error) {
    console.error('❌ Error exchanging custom token for ID token:', error);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🔑 Generating Firebase token for testing...');
    const { customToken } = await generateCustomToken();
    await exchangeCustomToken(customToken);
  } catch (error) {
    console.error('❌ Failed to generate token:', error);
  } finally {
    // Clean up Firebase Admin app
    await admin.app().delete();
  }
}

// Run the script
main(); 