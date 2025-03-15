export interface StoryRequest {
    childName: string;
    theme: string;
    ageGroup?: string;
    storyLength?: 'short' | 'medium' | 'long';
    includesMorals?: boolean;
}

export interface Story {
    id?: string;
    title: string;
    content: string;
    theme: string;
    targetAge: string;
    morals?: string[];
    characters: {
        name: string;
        role: string;
    }[];
    metadata: {
        length: number; // Word count
        readingTime: number; // Minutes
        difficulty: 'easy' | 'medium' | 'hard';
    };
    generatedAt: number;
} 