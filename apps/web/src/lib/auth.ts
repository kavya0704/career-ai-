import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db/client'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'user@example.com' },
        name: { label: 'Name', type: 'text', placeholder: 'Kavya' }
      },
      async authorize(credentials) {
        console.log("[NextAuth] authorize callback triggered with:", credentials)
        if (!credentials?.email) {
          console.warn("[NextAuth] authorize failed: no email provided")
          return null
        }

        try {
          console.log("[NextAuth] querying user for email:", credentials.email)
          let user = await db.user.findUnique({
            where: { email: credentials.email }
          })
          console.log("[NextAuth] found user:", user)

          if (!user) {
            console.log("[NextAuth] user not found, creating new user...")
            // Auto register on first login for testing convenience
            user = await db.user.create({
              data: {
                email: credentials.email,
                name: credentials.name || 'Anonymous User',
                targetRoles: ['Software Engineer'],
                skills: ['JavaScript', 'Python', 'React', 'Node.js']
              }
            })
            console.log("[NextAuth] created user:", user)
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name
          }
        } catch (dbErr) {
          console.error("[NextAuth] database error in authorize:", dbErr)
          throw dbErr
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  }
}
