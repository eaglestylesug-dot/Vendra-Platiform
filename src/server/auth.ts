import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.ts';
import { User } from '../types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'vendra-production-jwt-secure-signing-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function standardizeUgandaPhone(input: string): string {
  let cleaned = input.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+256' + cleaned.slice(1);
  } else if (cleaned.startsWith('256')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+256' + cleaned;
  }
  return cleaned;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      phone: user.phone,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = db.getUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: 'User session expired or account not found.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact customer support.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    next();
  });
}
