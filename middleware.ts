import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: () => true
  }
})

export const config = {
  matcher: [
    '/deconstruct',
    '/history',
    '/api/deconstruct',
    '/api/identify',
    '/api/knowledge-card',
    '/api/sessions/:path*'
  ]
}
