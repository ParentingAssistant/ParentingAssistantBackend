import { Request, Response, NextFunction } from 'express';
import { auth } from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: DecodedIdToken;
        }
    }
}

export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                status: 'error',
                message: 'No authentication token provided'
            });
            return;
        }

        const token = authHeader.split('Bearer ')[1];
        
        try {
            const decodedToken = await auth().verifyIdToken(token);
            req.user = decodedToken;
            next();
        } catch (error) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid authentication token'
            });
            return;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error during authentication'
        });
    }
};

// Role-based authorization middleware
export const authorizeRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
                return;
            }

            const userRoles = req.user.roles || [];
            const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));

            if (!hasAllowedRole) {
                res.status(403).json({
                    status: 'error',
                    message: 'Insufficient permissions'
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Internal server error during authorization'
            });
        }
    };
}; 