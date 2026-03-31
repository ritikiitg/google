import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

const SALT_ROUNDS = 12;

export interface RegisterInput {
    email: string;
    password: string;
    name?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string | null;
    };
    token: string;
}

function generateToken(userId: string, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError('JWT secret not configured', 500);

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign({ userId, email }, secret, { expiresIn } as any);
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name } = input;

    // Check if user exists by ritik raj
    const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    });

    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    // Hash password by ritik raj
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user by ritik raj
    const user = await prisma.user.create({
        data: {
            email: email.toLowerCase(),
            passwordHash,
            name,
        },
        select: {
            id: true,
            email: true,
            name: true,
        }
    });

    const token = generateToken(user.id, user.email);

    return { user, token };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    });

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user.id, user.email);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        token,
    };
}

export async function getUserById(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            riskTolerance: true,
            priorities: true,
            currentSituation: true,
            createdAt: true,
        }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return {
        ...user,
        priorities: JSON.parse(user.priorities || '[]'),
    };
}

export async function updateUserProfile(
    userId: string,
    data: {
        name?: string;
        riskTolerance?: string;
        priorities?: string[];
        currentSituation?: string;
    }
) {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.riskTolerance !== undefined) updateData.riskTolerance = data.riskTolerance;
    if (data.priorities !== undefined) updateData.priorities = JSON.stringify(data.priorities);
    if (data.currentSituation !== undefined) updateData.currentSituation = data.currentSituation;

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            email: true,
            name: true,
            riskTolerance: true,
            priorities: true,
            currentSituation: true,
        }
    });

    return {
        ...user,
        priorities: JSON.parse(user.priorities || '[]'),
    };
}

// Generate a random reset token
function generateResetToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

export async function forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    // Find user
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
        return { message: 'If an account with that email exists, a reset link has been generated.' };
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken,
            resetTokenExpiry,
        }
    });

    // In production, email the token here
    // For demo purposes, it returns directly by ritik raj
    console.log(`🔑 Password reset token for ${email}: ${resetToken}`);

    return {
        message: 'If an account with that email exists, a reset link has been generated.',
        resetToken, // Only for demo - remove in production by ritik raj
    };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Find user with this token by ritik raj
    const user = await prisma.user.findUnique({
        where: { resetToken: token }
    });

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        throw new AppError('Reset token has expired', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear reset token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            resetToken: null,
            resetTokenExpiry: null,
        }
    });

    return { message: 'Password has been reset successfully. You can now log in.' };
}
