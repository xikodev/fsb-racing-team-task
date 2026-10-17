import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'FSB Racing Team',
  description: 'Student engineering, teamwork, and a passion for racing.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
