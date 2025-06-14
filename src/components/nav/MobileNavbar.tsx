'use client'

import { useDisclosure } from '@mantine/hooks'
import classes from './MobileNavbar.module.css'
import { Burger, Text, UnstyledButton } from '@mantine/core'
import { Group } from '@mantine/core'
import { AppShell } from '@mantine/core'
import { IconShieldChevron } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { NAVIGATION_ITEMS, BRAND_CONFIG } from '@/constants/navigation'

export function MobileNavbar({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [opened, { toggle }] = useDisclosure()

  const desktopNavItems = NAVIGATION_ITEMS.filter((item) => item.showInDesktop)
  const mobileNavItems = NAVIGATION_ITEMS.filter((item) => item.showInMobile)

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group justify="space-between" style={{ flex: 1 }}>
            <Group
              gap={8}
              align="center"
              className="hover:opacity-90 transition-opacity"
              onClick={() => {
                router.push(BRAND_CONFIG.homeRoute)
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconShieldChevron size={32} className="text-primary" aria-hidden="true" />
              <Text size="lg" fw={600} className="font-heading tracking-wide" component="h1">
                {BRAND_CONFIG.name}
              </Text>
            </Group>
            <Group ml="xl" gap={0} visibleFrom="sm">
              {desktopNavItems.map((item) => (
                <UnstyledButton
                  key={item.href}
                  className={classes.control}
                  onClick={() => {
                    router.push(item.href)
                  }}
                >
                  {item.label}
                </UnstyledButton>
              ))}
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4}>
        {mobileNavItems.map((item) => (
          <UnstyledButton
            key={item.href}
            className={classes.control}
            onClick={() => {
              router.push(item.href)
              toggle()
            }}
          >
            {item.label}
          </UnstyledButton>
        ))}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
