import { Router, Request, Response } from 'express';
import { StoryService } from '../services/story.service';
import { StoryRequest } from '../types/bedtime-story';
import { authenticateUser } from '../middleware/auth.middleware';
import { createRateLimiters } from '../config/security';

const router = Router();
const storyService = StoryService.getInstance();
const { aiLimiter } = createRateLimiters();

router.post('/generate-bedtime-story',
    authenticateUser,
    aiLimiter,
    async (req: Request, res: Response): Promise<void> => {
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
                res.status(400).json({
                    status: 'error',
                    message: 'childName and theme are required fields'
                });
                return;
            }

            // Validate story length if provided
            if (request.storyLength && !['short', 'medium', 'long'].includes(request.storyLength)) {
                res.status(400).json({
                    status: 'error',
                    message: 'storyLength must be one of: short, medium, long'
                });
                return;
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
    }
);

export default router; 