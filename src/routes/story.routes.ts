import { Router } from 'express';
import { StoryService } from '../services/story.service';
import { StoryRequest } from '../types/bedtime-story';

const router = Router();
const storyService = StoryService.getInstance();

router.post('/generate-bedtime-story', async (req, res) => {
    try {
        const request: StoryRequest = {
            childName: req.body.childName,
            theme: req.body.theme,
            ageGroup: req.body.ageGroup,
            storyLength: req.body.storyLength,
            includesMorals: req.body.includesMorals
        };

        // Validate required fields
        if (!request.childName || !request.theme) {
            return res.status(400).json({
                status: 'error',
                message: 'childName and theme are required fields'
            });
        }

        // Validate story length if provided
        if (request.storyLength && !['short', 'medium', 'long'].includes(request.storyLength)) {
            return res.status(400).json({
                status: 'error',
                message: 'storyLength must be one of: short, medium, long'
            });
        }

        const story = await storyService.generateStory(request);
        
        res.json({
            status: 'success',
            data: story
        });
    } catch (error) {
        console.error('Error generating bedtime story:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error generating bedtime story'
        });
    }
});

export default router; 