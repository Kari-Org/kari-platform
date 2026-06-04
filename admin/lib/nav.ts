import {
  IdCard,
  LayoutDashboard,
  type LucideIcon,
  Map,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import type { Permission } from '@kari/types';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Sidebar structure. Each item is gated by a permission from the shared RBAC map. */
export const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
      { href: '/live', label: 'Live Rides', icon: Map, permission: 'fleet:view' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/trips', label: 'Trips', icon: Route, permission: 'trips:read' },
      { href: '/users', label: 'Users', icon: Users, permission: 'riders:read' },
      { href: '/dedicated-drivers', label: 'Dedicated Drivers', icon: IdCard, permission: 'dedicated:read' },
      { href: '/tickets', label: 'Tickets', icon: Ticket, permission: 'tickets:read' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { href: '/revenue', label: 'Revenue', icon: TrendingUp, permission: 'finance:read' },
      { href: '/payouts', label: 'Driver Payouts', icon: Wallet, permission: 'finance:read' },
      { href: '/promotions', label: 'Promotions', icon: Tag, permission: 'finance:manage' },
      { href: '/fare-config', label: 'Fare Configuration', icon: SlidersHorizontal, permission: 'finance:manage' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admins', label: 'Admins & Roles', icon: ShieldCheck, permission: 'admins:manage' },
      { href: '/audit', label: 'Audit Log', icon: ScrollText, permission: 'audit:read' },
      { href: '/settings', label: 'Settings', icon: Settings, permission: 'settings:manage' },
    ],
  },
];
