import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS'

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