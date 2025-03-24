require('dotenv').config();
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Generate a custom token
const uid = 'test-user-' + Date.now();
admin.auth().createCustomToken(uid)
    .then(customToken => {
        // Exchange custom token for ID token
        return fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: customToken,
                returnSecureToken: true
            })
        });
    })
    .then(response => response.json())
    .then(data => {
        console.log('Generated Firebase ID token:');
        console.log(data.idToken);
        console.log('\nTo use this token:');
        console.log(`export FIREBASE_TOKEN="${data.idToken}"`);
    })
    .catch(error => {
        console.error('Error generating token:', error);
        process.exit(1);
    }); 