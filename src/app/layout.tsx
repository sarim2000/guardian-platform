// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css'

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import { MobileNavbar } from '@/components/nav/MobileNavbar'
import { mantineTheme } from '@/themes/theme'

import { Lato } from "next/font/google"

export const metadata = {
  title: 'My Mantine app',
  description: 'I have followed setup instructions carefully',
}

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={lato.className}>
        <MantineProvider defaultColorScheme="dark" theme={mantineTheme}>
          <MobileNavbar>{children}</MobileNavbar>
        </MantineProvider>
      </body>
    </html>
  )
} 
