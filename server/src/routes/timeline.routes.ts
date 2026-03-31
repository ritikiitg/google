import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export const timelineRouter = Router();

// All timeline routes require authentication
timelineRouter.use(authenticate);

// Get a specific timeline with all details
timelineRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const timeline = await prisma.timeline.findFirst({
            where: { id: req.params.id as string },
            include: {
                events: { orderBy: { order: 'asc' } },
                decision: {
                    select: { id: true, content: true, userId: true }
                }
            }
        });

        if (!timeline) {
            throw new AppError('Timeline not found', 404);
        }

        // Verify ownership by ritik raj
        if (timeline.decision.userId !== req.userId) {
            throw new AppError('Not authorized', 403);
        }

        res.json({
            success: true,
            data: {
                ...timeline,
                metrics: JSON.parse(timeline.metrics),
                tradeoffs: JSON.parse(timeline.tradeoffs),
                secondOrderEffects: JSON.parse(timeline.secondOrderEffects),
            }
        });
    } catch (error) {
        next(error);
    }
});
