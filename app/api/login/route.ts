import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken } from '@/lib/auth'

const PHPRADIUS_API = 'https://nosteq.phpradius.com/index.php/api/login'
const SESSION_DURATION = 60 * 60 * 8 // 8 hours

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

    // Call PHP Radius API with FormData as per documentation
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(PHPRADIUS_API, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    // Check if login was successful
    if (!response.ok || !data.data?.token) {
      return NextResponse.json(
        { error: data.message || 'Invalid credentials.' },
        { status: 401 }
      )
    }

    // Extract data from response per documentation
    const apiToken = data.data.token
    const user = data.data.user || {}
    const abilities = data.data.abilities || {}
    const ispDetail = data.data.ispDetail || {}

    // Create session with all user data
    const sessionPayload = {
      username,
      apiToken,
      userId: user.id,
      operatorId: user.operator_id,
      portalLogin: user.portalLogin,
      planId: user.plan_id,
      abilities,
      ispDetail,
    }
    
    console.log('[v0] Session payload:', sessionPayload)
    const sessionToken = await createSessionToken(sessionPayload)
    console.log('[v0] Session token created:', sessionToken.substring(0, 50) + '...')

    // Set cookie and return success
    const res = NextResponse.json({ ok: true })
    res.cookies.set('nosteq_session', sessionToken, {
      httpOnly: true,
      path: '/',
      maxAge: SESSION_DURATION,
      sameSite: 'lax',
    })
    console.log('[v0] Cookie set with name nosteq_session, returning success')

    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
