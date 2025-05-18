'use client'

import { useDisclosure } from '@mantine/hooks'
import classes from './MobileNavbar.module.css'
import { Burger, Text, UnstyledButton } from '@mantine/core'
import { Group } from '@mantine/core'
import { AppShell } from '@mantine/core'
import { IconShieldChevron } from '@tabler/icons-react'

export function MobileNavbar({ children }: { children: React.ReactNode }) {
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
            <Group gap={8} align="center" className="hover:opacity-90 transition-opacity">
              <IconShieldChevron 
                size={32} 
                className="text-primary"
                aria-hidden="true"
              />
              <Text 
                size="lg" 
                fw={600}
                className="font-heading tracking-wide"
                component="h1"
              >
                Guardian Platform
              </Text>
            </Group>
            <Group ml="xl" gap={0} visibleFrom="sm">
              <UnstyledButton className={classes.control}>Home</UnstyledButton>
              <UnstyledButton className={classes.control}>Blog</UnstyledButton>
              <UnstyledButton className={classes.control}>Contacts</UnstyledButton>
              <UnstyledButton className={classes.control}>Support</UnstyledButton>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4}>
        <UnstyledButton className={classes.control}>Home</UnstyledButton>
        <UnstyledButton className={classes.control}>Blog</UnstyledButton>
        <UnstyledButton className={classes.control}>Contacts</UnstyledButton>
        <UnstyledButton className={classes.control}>Support</UnstyledButton>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
