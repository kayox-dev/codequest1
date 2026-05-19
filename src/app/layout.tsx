import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'CodeQuest',
  description: 'Aprenda programacao como um game',
  icons: {
    icon: '/favicon_cq.png',
    shortcut: '/favicon_cq.png',
    apple: '/favicon_cq.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-body bg-bg-base">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#181830',
                color: '#EEEAFF',
                border: '1px solid rgba(124,63,255,.35)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
