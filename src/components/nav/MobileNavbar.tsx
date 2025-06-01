'use client'

import { useDisclosure } from '@mantine/hooks'
import classes from './MobileNavbar.module.css'
import { Burger, Text, UnstyledButton } from '@mantine/core'
import { Group } from '@mantine/core'
import { AppShell } from '@mantine/core'
import { IconShieldChevron } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'

export function MobileNavbar({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [opened, { toggle }] = useDisclosure()

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
                router.push('/')
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconShieldChevron size={32} className="text-primary" aria-hidden="true" />
              <Text size="lg" fw={600} className="font-heading tracking-wide" component="h1">
                Guardian Platform
              </Text>
            </Group>
            <Group ml="xl" gap={0} visibleFrom="sm">
              <UnstyledButton
                className={classes.control}
                onClick={() => {
                  router.push('/onboarding')
                }}
              >
                Onboarding
              </UnstyledButton>
              <UnstyledButton
                className={classes.control}
                onClick={() => {
                  router.push('/aws-resources')
                }}
              >
                AWS Resources
              </UnstyledButton>
              <UnstyledButton
                className={classes.control}
                onClick={() => {
                  router.push('/admin')
                }}
              >
                Admin
              </UnstyledButton>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4}>
        <UnstyledButton 
          className={classes.control}
          onClick={() => {
            router.push('/')
            toggle()
          }}
        >
          Home
        </UnstyledButton>
        <UnstyledButton 
          className={classes.control}
          onClick={() => {
            router.push('/catalog')
            toggle()
          }}
        >
          Catalog
        </UnstyledButton>
        <UnstyledButton 
          className={classes.control}
          onClick={() => {
            router.push('/onboarding')
            toggle()
          }}
        >
          Onboarding
        </UnstyledButton>
        <UnstyledButton 
          className={classes.control}
          onClick={() => {
            router.push('/aws-resources')
            toggle()
          }}
        >
          AWS Resources
        </UnstyledButton>
        <UnstyledButton 
          className={classes.control}
          onClick={() => {
            router.push('/admin')
            toggle()
          }}
        >
          Admin
        </UnstyledButton>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
