import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { register, login, forgotPassword, resetPassword } from '../services/auth.service.js';
import { AppError } from '../middleware/error.middleware.js';

export const authRouter = Router();

const registerSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email'),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

authRouter.post('/register', async (req, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await register(data);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError(error.errors[0].message, 400));
        } else {
            next(error);
        }
    }
});

authRouter.post('/login', async (req, res: Response, next: NextFunction) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await login(data);
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError(error.errors[0].message, 400));
        } else {
            next(error);
        }
    }
});

// Request password reset - generates token and returns it (in production, would email it)
authRouter.post('/forgot-password', async (req, res: Response, next: NextFunction) => {
    try {
        const data = forgotPasswordSchema.parse(req.body);
        const result = await forgotPassword(data.email);
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError(error.errors[0].message, 400));
        } else {
            next(error);
        }
    }
});

// Reset password using token
authRouter.post('/reset-password', async (req, res: Response, next: NextFunction) => {
    try {
        const data = resetPasswordSchema.parse(req.body);
        const result = await resetPassword(data.token, data.password);
        res.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError(error.errors[0].message, 400));
        } else {
            next(error);
        }
    }
});
