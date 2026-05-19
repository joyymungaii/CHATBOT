/**
 * lib/firebase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side Firebase Admin SDK utility.
 * Uses the Admin SDK (not the client SDK) so it runs only on the server with
 * full privileges. The service account key is stored in environment variables.
 *
 * Environment variables required in .env.local:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY      (the full private key string, with \n newlines)
 *
 * Firestore collections used:
 *   knowledge_base   — FAQ / support articles for context injection
 *   chat_logs        — Conversation history per session
 *   users            — Customer profile / account mapping
 * ─────────────────────────────────────────────────────────────────────────────
 */

import admin from 'firebase-admin'

// ── Singleton initialisation ──────────────────────────────────────────────────
// Next.js hot-reloads modules in dev, so we guard against re-initialising.

function getFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // Private key comes from env with literal \n — replace with real newlines
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials not configured. ' +
      'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local'
    )
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })
}

// ── Firestore instance ────────────────────────────────────────────────────────

function getDb(): admin.firestore.Firestore {
  getFirebaseAdmin()
  return admin.firestore()
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatLogEntry {
  sessionId: string
  userMessage: string
  botReply: string
  timestamp: admin.firestore.FieldValue
  username?: string          // Radius username if identified
  integrationData?: object   // What context was injected into Gemini
}

export interface KnowledgeBaseArticle {
  id: string
  title: string
  content: string
  tags: string[]
  category: string
}

export interface FirebaseResult<T> {
  success: boolean
  data?: T
  error?: string
}

// ── Knowledge Base ────────────────────────────────────────────────────────────

/**
 * Fetches FAQ articles matching a category or tag.
 * Used to inject relevant support knowledge into the Gemini prompt.
 */
export async function getKnowledgeBaseArticles(
  category?: string
): Promise<FirebaseResult<KnowledgeBaseArticle[]>> {
  try {
    const db = getDb()
    let query: admin.firestore.Query = db.collection('knowledge_base')

    if (category) {
      query = query.where('category', '==', category)
    }

    const snapshot = await query.limit(5).get()

    const articles: KnowledgeBaseArticle[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<KnowledgeBaseArticle, 'id'>),
    }))

    return { success: true, data: articles }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch knowledge base',
    }
  }
}

// ── Chat Logs ─────────────────────────────────────────────────────────────────

/**
 * Saves a conversation turn to Firestore for audit and analytics.
 * Non-blocking — failures are logged but do not affect the chat response.
 */
export async function logChatMessage(entry: Omit<ChatLogEntry, 'timestamp'>): Promise<void> {
  try {
    const db = getDb()
    await db.collection('chat_logs').add({
      ...entry,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
  } catch (error) {
    // Logging failure should never break the chat — just warn
    console.warn('[Firebase] Failed to log chat message:', error)
  }
}

// ── User Lookup ───────────────────────────────────────────────────────────────

/**
 * Looks up a customer record by their Radius username.
 * Returns null if not found — callers should handle gracefully.
 */
export async function getUserByUsername(
  username: string
): Promise<FirebaseResult<Record<string, unknown>>> {
  try {
    const db = getDb()
    const snapshot = await db
      .collection('users')
      .where('radius_username', '==', username)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return { success: true, data: undefined }
    }

    return {
      success: true,
      data: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    }
  }
}
