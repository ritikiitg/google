import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import {
    createDecision,
    getDecisionById,
    getUserDecisions,
    injectDecision
} from '../services/decision.service.js';
import { AppError } from '../middleware/error.middleware.js';

export const decisionRouter = Router();

// All decision routes require authentication
decisionRouter.use(authenticate);

const createDecisionSchema = z.object({
    content: z.string().min(10, 'Decision must be at least 10 characters'),
    category: z.string().optional(),
    context: z.record(z.unknown()).optional(),
});

const injectDecisionSchema = z.object({
    timelineId: z.string(),
    newDecision: z.string().min(10, 'Decision must be at least 10 characters'),
});

// Create a new decision and generate timelines
decisionRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = createDecisionSchema.parse(req.body);
        const result = await createDecision(req.userId!, data);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError(error.errors[0].message, 400));
        } else {
            next(error);
        }
    }
});

// Get all user decisions
decisionRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const decisions = await getUserDecisions(req.userId!);
        res.json({ success: true, data: decisions });
    } catch (error) {
        next(error);
    }
});

// Get a specific decision with its timelines
decisionRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const decision = await getDecisionById(req.params.id as string, req.userId!);
        res.json({ success: true, data: decision });
    } catch (error) {
        next(error);
    }
});

// Inject a new decision into an existing timeline by ritik raj
decisionRouter.post('/:id/inject', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = injectDecisionSchema.parse(req.body);
        const result = await injectDecision(
            req.params.id as string,
            data.timelineId,
            data.newDecision,
            req.userId!
        );
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError(error.errors[0].message, 400));
        } else {
            next(error);
        }
    }
});
