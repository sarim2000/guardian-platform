// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css'
import '@mantine/charts/styles.css'

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import { MobileNavbar } from '@/components/nav/MobileNavbar'
import { mantineTheme } from '@/themes/theme'

import { Lato } from "next/font/google"

export const metadata = {
  title: 'Guardian',
  description: 'Guardian is a platform for managing and monitoring services.',
}

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
})

export default function RootLayout({ 
  children,
  chat,
}: { 
  children: React.ReactNode,
  chat: React.ReactNode,
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={lato.className}>
        <MantineProvider defaultColorScheme="dark" theme={mantineTheme}>
          <MobileNavbar>{children}</MobileNavbar>
          {chat}
        </MantineProvider>
      </body>
    </html>
  )
} 
