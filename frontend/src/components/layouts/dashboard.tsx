"use client";

import { usePathname } from "next/navigation";
import { LayoutShell } from "./shell";

import { UserRole } from "@/lib/api/types";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { setActiveNavigationItem } from "./navigation";

const ALL_ROLES = [
  UserRole.ADMIN,
  UserRole.TEACHER,
  UserRole.THERAPIST,
  UserRole.PROVIDER,
  UserRole.SUPERVISOR,
];

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "HomeIcon",
    roles: ALL_ROLES,
    subMenu: [],
  },
  // TEACHER
  {
    name: "Students",
    icon: "UserGroupIcon",
    roles: [UserRole.TEACHER],
    subMenu: [
      {
        name: "All Students",
        href: "/dashboard/teacher/students",
      },
      {
        name: "Services",
        href: "/dashboard/teacher/students/services",
      },
    ],
  },
  {
    name: "Therapy Services",
    href: "/dashboard/teacher/therapy-services",
    icon: "ClipboardDocumentCheckIcon",
    roles: [UserRole.TEACHER],
    subMenu: [],
  },
  {
    name: "Equipment",
    href: "/dashboard/teacher/equipment",
    icon: "WrenchScrewdriverIcon",
    roles: [UserRole.TEACHER],
    subMenu: [],
  },
  {
    name: "Attendance",
    href: "/dashboard/teacher/attendance",
    icon: "ClipboardDocumentListIcon",
    roles: [UserRole.TEACHER],
    subMenu: [],
  },
  {
    name: "Communications",
    href: "/dashboard/teacher/communications",
    icon: "ChatBubbleLeftIcon",
    roles: [UserRole.TEACHER],
    subMenu: [],
  },
  // THERAPIST
  {
    name: "Tests",
    href: "/dashboard/therapist/tests",
    icon: "ClipboardDocumentListIcon",
    roles: [UserRole.THERAPIST],
    subMenu: [],
  },
  {
    name: "Attendance",
    href: "/dashboard/therapist/attendance",
    icon: "CheckIcon",
    roles: [UserRole.THERAPIST],
    subMenu: [],
  },
  {
    name: "Accommodations",
    href: "/dashboard/therapist/accommodations",
    icon: "WrenchScrewdriverIcon",
    roles: [UserRole.THERAPIST],
    subMenu: [],
  },
  {
    name: "Equipment",
    href: "/dashboard/therapist/equipment",
    icon: "WrenchScrewdriverIcon",
    roles: [UserRole.THERAPIST],
    subMenu: [],
  },
  {
    name: "Communications",
    href: "/dashboard/therapist/communications",
    icon: "ChatBubbleLeftIcon",
    roles: [UserRole.THERAPIST],
    subMenu: [],
  },
  {
    name: "Room Schedule",
    href: "/dashboard/therapist/room-schedule",
    icon: "CalendarIcon",
    roles: [UserRole.THERAPIST],
    subMenu: [],
  },
  // PROVIDER
  {
    name: "Tests",
    href: "/dashboard/provider/tests",
    icon: "ClipboardDocumentListIcon",
    roles: [UserRole.PROVIDER],
    subMenu: [],
  },
  {
    name: "Schedule",
    href: "/dashboard/provider/schedule",
    icon: "CalendarIcon",
    roles: [UserRole.PROVIDER],
    subMenu: [],
  },
  {
    name: "Confirm Site",
    href: "/dashboard/provider/confirm-site",
    icon: "CheckBadgeIcon",
    roles: [UserRole.PROVIDER],
    subMenu: [],
  },
  {
    name: "Absence",
    href: "/dashboard/provider/absence",
    icon: "XMarkIcon",
    roles: [UserRole.PROVIDER],
    subMenu: [],
  },
  {
    name: "Communications",
    href: "/dashboard/provider/communications",
    icon: "ChatBubbleLeftIcon",
    roles: [UserRole.PROVIDER],
    subMenu: [],
  },
  {
    name: "Attendance",
    href: "/dashboard/provider/attendance",
    icon: "CheckIcon",
    roles: [UserRole.PROVIDER],
    subMenu: [],
  },
  // SUPERVISOR
  {
    name: "Tests",
    href: "/dashboard/supervisor/tests",
    icon: "ClipboardDocumentListIcon",
    roles: [UserRole.SUPERVISOR],
    subMenu: [],
  },
  {
    name: "Location",
    href: "/dashboard/supervisor/location",
    icon: "MapPinIcon",
    roles: [UserRole.SUPERVISOR],
    subMenu: [],
  },
  {
    name: "Details",
    href: "/dashboard/supervisor/details",
    icon: "InformationCircleIcon",
    roles: [UserRole.SUPERVISOR],
    subMenu: [],
  },
  {
    name: "Reminders",
    href: "/dashboard/supervisor/reminders",
    icon: "BellIcon",
    roles: [UserRole.SUPERVISOR],
    subMenu: [],
  },
  {
    name: "Results",
    href: "/dashboard/supervisor/results",
    icon: "ChartBarIcon",
    roles: [UserRole.SUPERVISOR],
    subMenu: [],
  },
  {
    name: "Communications",
    href: "/dashboard/supervisor/communications",
    icon: "ChatBubbleLeftIcon",
    roles: [UserRole.SUPERVISOR],
    subMenu: [],
  },
  {
    name: "Inbox",
    href: "/dashboard/supervisor/inbox",
    icon: "InboxIcon",
    roles: [UserRole.SUPERVISOR],
    subMenu: [],
  },
  // NOTIFICATIONS & SETTINGS
  {
    name: "Notifications",
    icon: "BellIcon",
    roles: ALL_ROLES,
    subMenu: [
      {
        name: "All Notifications",
        href: "/dashboard/notifications",
        icon: "BellAlertIcon",
      },
      {
        name: "Read",
        href: "/dashboard/notifications/read",
        icon: "InboxArrowDownIcon",
      },
      {
        name: "Unread",
        href: "/dashboard/notifications/unread",
        icon: "EnvelopeIcon",
      },
      {
        name: "Notification Settings",
        href: "/dashboard/notifications/settings",
        icon: "AdjustmentsHorizontalIcon",
      },
    ],
  },
  {
    name: "Settings",
    icon: "CogIcon",
    roles: ALL_ROLES,
    subMenu: [
      {
        name: "Profile",
        href: "/dashboard/settings/profile",
        icon: "UserIcon",
      },
      {
        name: "Preferences",
        href: "/dashboard/settings/preferences",
        icon: "AdjustmentsHorizontalIcon",
      },
      {
        name: "Security",
        href: "/dashboard/settings/security",
        icon: "ShieldCheckIcon",
      },
    ],
  },
];

export const DashboardLayout = ({ children }: React.PropsWithChildren) => {
  const role = useUserRole();

  const pathname = usePathname();

  const navigationItems = navigation
    .filter((item) => role && item.roles.includes(role))
    .map((item) => setActiveNavigationItem(item, pathname));

  return <LayoutShell navigation={navigationItems}>{children}</LayoutShell>;
};
