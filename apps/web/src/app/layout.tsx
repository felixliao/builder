import './globals.css'

import { Toaster } from '@/components/ui/toaster'
import Provider from '@/components/provider'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata = {
  title: 'Context Builder (dev)',
  description: 'Generated by create next app',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Provider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <body className="h-full">
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </Provider>
  )
}
