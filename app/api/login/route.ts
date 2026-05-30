import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE_OPTIONS } from '@/lib/auth'

const PHPRADIUS_API = 'https://devs1.phpradius.com/index.php/api/login'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      )
    }

    // Call PHP Radius login API using form-data as per documentation
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(PHPRADIUS_API, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    // Check if login was successful
    if (!response.ok || data.error || !data.data?.token) {
      return NextResponse.json(
        { error: data.message || data.error || 'Invalid credentials.' },
        { status: 401 }
      )
    }

    // Extract token and user data from response
    const token = data.data.token
    const user = data.data.user || {}
    const abilities = data.data.abilities || {}
    const ispDetail = data.data.ispDetail || {}

    // Create session token
    const sessionToken = await createSessionToken({
      username,
      token,
      userId: user.id,
      operatorId: user.operator_id,
      portalLogin: user.portalLogin,
      planId: user.plan_id,
      abilities,
      ispDetail,
    })

    // Set HTTP-only cookie and return success
    const res = NextResponse.json({
      ok: true,
      username,
      user,
    })

    res.cookies.set({
      ...SESSION_COOKIE_OPTIONS,
      value: sessionToken,
    })

    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Authentication server is unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
