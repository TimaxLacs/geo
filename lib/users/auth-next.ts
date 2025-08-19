import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import http from 'http';

/**
 * Получение токена из NextRequest для GraphQL proxy
 */
export async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Попробуем получить токен из NextAuth JWT
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (token) {
      return JSON.stringify(token);
    }

    // Альтернативно - получаем из Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Или из cookie
    const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                        request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    return sessionToken || null;
  } catch (error) {
    console.error('Error getting token from request:', error);
    return null;
  }
}

/**
 * Получение токена из http.IncomingMessage для WebSocket connections
 */
export async function getTokenFromIncomingMessage(request: http.IncomingMessage): Promise<string | null> {
  try {
    // Получаем из headers
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Получаем из cookie header
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc: Record<string, string>, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});

      const sessionToken = cookies['next-auth.session-token'] || 
                          cookies['__Secure-next-auth.session-token'];
      
      return sessionToken || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting token from incoming message:', error);
    return null;
  }
}
