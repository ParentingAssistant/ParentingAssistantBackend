import { getFirestore } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { AIResponse } from '../types/ai-response';
import { Timestamp } from 'firebase-admin/firestore';

export interface StoredPrompt {
    id: string;
    userId: string;
    prompt: string;
    type: 'meal-plan' | 'story';
    createdAt: Timestamp;
}

export class StorageService {
    private static instance: StorageService;
    private readonly COLLECTION_NAME = 'prompts';

    private constructor() {}

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    async storePrompt(prompt: Omit<StoredPrompt, 'id' | 'createdAt'>): Promise<StoredPrompt> {
        const docRef = await db.collection(this.COLLECTION_NAME).add({
            ...prompt,
            createdAt: Timestamp.now()
        });

        return {
            id: docRef.id,
            ...prompt,
            createdAt: Timestamp.now()
        };
    }

    async getPromptById(id: string): Promise<StoredPrompt | null> {
        const docRef = await db.collection(this.COLLECTION_NAME).doc(id).get();
        if (!docRef.exists) {
            return null;
        }
        return { id: docRef.id, ...docRef.data() } as StoredPrompt;
    }

    async getPromptsByUserId(userId: string): Promise<StoredPrompt[]> {
        const querySnapshot = await db.collection(this.COLLECTION_NAME)
            .where('userId', '==', userId)
            .get();
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as StoredPrompt[];
    }

    async getPromptsByType(userId: string, type: StoredPrompt['type']): Promise<StoredPrompt[]> {
        const querySnapshot = await db.collection(this.COLLECTION_NAME)
            .where('userId', '==', userId)
            .where('type', '==', type)
            .get();
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as StoredPrompt[];
    }

    async store(data: AIResponse): Promise<string> {
        try {
            const docRef = await db.collection(this.COLLECTION_NAME).add(data);
            return docRef.id;
        } catch (error) {
            console.error('Error storing data:', error);
            throw error;
        }
    }

    async get(id: string): Promise<AIResponse | null> {
        try {
            const docRef = await db.collection(this.COLLECTION_NAME).doc(id).get();
            
            if (!docRef.exists) {
                return null;
            }
            
            return docRef.data() as AIResponse;
        } catch (error) {
            console.error('Error retrieving data:', error);
            throw error;
        }
    }

    async getByPrompt(prompt: string): Promise<AIResponse | null> {
        try {
            const querySnapshot = await db.collection(this.COLLECTION_NAME)
                .where('prompt', '==', prompt)
                .get();
            
            if (querySnapshot.empty) {
                return null;
            }
            
            // Return the first matching document
            const doc = querySnapshot.docs[0];
            return doc.data() as AIResponse;
        } catch (error) {
            console.error('Error retrieving data by prompt:', error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await db.collection(this.COLLECTION_NAME).doc(id).delete();
        } catch (error) {
            console.error('Error deleting data:', error);
            throw error;
        }
    }

    async getAll(): Promise<AIResponse[]> {
        try {
            const querySnapshot = await db.collection(this.COLLECTION_NAME).get();
            return querySnapshot.docs.map(doc => doc.data() as AIResponse);
        } catch (error) {
            console.error('Error retrieving all data:', error);
            throw error;
        }
    }
} 