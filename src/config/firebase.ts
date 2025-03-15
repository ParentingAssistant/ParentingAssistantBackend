import * as admin from 'firebase-admin';
import { AIResponse } from '../types/ai-response';

export const initializeFirebase = () => {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });

        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        process.exit(1);
    }
};

export const db = admin.firestore();

// Collection reference
const aiResponsesCollection = db.collection('ai-responses');

// Firebase helper functions
export const firebaseStorage = {
    // Store AI response in Firestore
    storeResponse: async (response: AIResponse): Promise<string> => {
        try {
            const docRef = await aiResponsesCollection.add({
                ...response,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error storing response in Firestore:', error);
            throw error;
        }
    },

    // Retrieve AI response from Firestore
    getResponse: async (id: string): Promise<AIResponse | null> => {
        try {
            const doc = await aiResponsesCollection.doc(id).get();
            return doc.exists ? (doc.data() as AIResponse) : null;
        } catch (error) {
            console.error('Error retrieving response from Firestore:', error);
            throw error;
        }
    },

    // Query responses by prompt
    queryResponsesByPrompt: async (prompt: string, limit: number = 5): Promise<AIResponse[]> => {
        try {
            const snapshot = await aiResponsesCollection
                .where('prompt', '==', prompt)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AIResponse));
        } catch (error) {
            console.error('Error querying responses from Firestore:', error);
            throw error;
        }
    },

    // Delete expired responses
    deleteExpiredResponses: async (expirationTime: number): Promise<void> => {
        try {
            const expiredDocs = await aiResponsesCollection
                .where('timestamp', '<', expirationTime)
                .get();

            const batch = db.batch();
            expiredDocs.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        } catch (error) {
            console.error('Error deleting expired responses:', error);
            throw error;
        }
    }
}; 