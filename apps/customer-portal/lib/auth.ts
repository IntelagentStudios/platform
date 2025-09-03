import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { NextAuthOptions } from 'next-auth'

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS'

// NextAuth configuration (placeholder for now)
export const authOptions: NextAuthOptions = {
  providers: [],
  secret: JWT_SECRET,
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.license_key = (user as any).license_key;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.license_key) {
        (session.user as any).license_key = token.license_key;
      }
      return session;
    }
  }
}

export interface AuthToken {
  license_key: string
  email?: string
  name?: string
  exp: number
}

export function createAuthToken(license_key: string, email?: string, name?: string): string {
  const token = jwt.sign(
    { 
      license_key, 
      email,
      name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  return token
}

export function verifyAuthToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken
    return decoded
  } catch {
    return null
  }
}

export async function getAuthFromCookies(): Promise<AuthToken | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')
  
  if (!token) {
    // Check for license_key directly (backward compatibility)
    const licenseKey = cookieStore.get('license_key')
    if (licenseKey) {
      return {
        license_key: licenseKey.value,
        exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      }
    }
    return null
  }
  
  return verifyAuthToken(token.value)
}

export async function verifyAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  licenseKey?: string;
  email?: string;
  userId?: string;
}> {
  // Check for session cookie
  const sessionToken = request.cookies.get('session')?.value || request.cookies.get('auth-token')?.value;
  
  if (!sessionToken) {
    return { isAuthenticated: false };
  }
  
  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;
    
    // Handle both new session format and old auth-token format
    if (decoded.userId) {
      return {
        isAuthenticated: true,
        licenseKey: decoded.licenseKey,
        email: decoded.email,
        userId: decoded.userId
      };
    } else if (decoded.license_key) {
      // Old format compatibility
      return {
        isAuthenticated: true,
        licenseKey: decoded.license_key,
        email: decoded.email
      };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    return { isAuthenticated: false };
  }
}