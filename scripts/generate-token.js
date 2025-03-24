require('dotenv').config({ path: '.env.test' });
const admin = require('firebase-admin');

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
    .then(token => {
        console.log('Generated Firebase token:');
        console.log(token);
        console.log('\nTo use this token:');
        console.log(`export FIREBASE_TOKEN="${token}"`);
    })
    .catch(error => {
        console.error('Error generating token:', error);
        process.exit(1);
    }); 