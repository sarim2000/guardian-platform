import { NavigationItem } from '@/types/navigation';

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Home',
    href: '/',
    showInDesktop: false,
    showInMobile: true,
  },
  {
    label: 'Onboarding',
    href: '/onboarding',
    showInDesktop: true,
    showInMobile: true,
  },
  {
    label: 'AWS Resources',
    href: '/aws-resources',
    showInDesktop: true,
    showInMobile: true,
  },
  {
    label: 'Admin',
    href: '/admin',
    showInDesktop: true,
    showInMobile: true,
  },
];

export const BRAND_CONFIG = {
  name: 'Guardian Platform',
  homeRoute: '/',
} as const; 
