import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { getUserById, updateUserProfile } from '../services/auth.service.js';
import { AppError } from '../middleware/error.middleware.js';

export const userRouter = Router();

// All user routes require authentication by ritik raj
userRouter.use(authenticate);

const updateProfileSchema = z.object({
    name: z.string().optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
    priorities: z.array(z.string()).optional(),
    currentSituation: z.string().optional(),
});

userRouter.get('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await getUserById(req.userId!);
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

userRouter.patch('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = updateProfileSchema.parse(req.body);
        const user = await updateUserProfile(req.userId!, data);
        res.json({ success: true, data: user });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError(error.errors[0].message, 400));
        } else {
            next(error);
        }
    }
});
