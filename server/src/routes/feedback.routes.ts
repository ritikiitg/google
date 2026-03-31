import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export const feedbackRouter = Router();

// All feedback routes require authentication
feedbackRouter.use(authenticate);

const createFeedbackSchema = z.object({
    decisionId: z.string(),
    outcome: z.string().min(10, 'Outcome must be at least 10 characters'),
    accuracy: z.number().min(1).max(5).optional(),
    notes: z.string().optional(),
});

// Create feedback on a decision's actual outcome by ritik raj
feedbackRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = createFeedbackSchema.parse(req.body);

        // Verify ownership
        const decision = await prisma.decision.findFirst({
            where: { id: data.decisionId, userId: req.userId }
        });

        if (!decision) {
            throw new AppError('Decision not found', 404);
        }

        const feedback = await prisma.feedback.create({
            data: {
                userId: req.userId!,
                decisionId: data.decisionId,
                outcome: data.outcome,
                accuracy: data.accuracy,
                notes: data.notes,
            }
        });

        res.status(201).json({ success: true, data: feedback });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError(error.errors[0].message, 400));
        } else {
            next(error);
        }
    }
});

// Get user's feedback history by ritik raj
feedbackRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const feedback = await prisma.feedback.findMany({
            where: { userId: req.userId },
            include: {
                decision: { select: { id: true, content: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: feedback });
    } catch (error) {
        next(error);
    }
});
