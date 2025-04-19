"use client";

import { usePathname } from "next/navigation";
import { LayoutShell } from "./shell";
import { setActiveNavigationItem } from "./navigation";

const navigation = [
  {
    name: "Dashboard",
    icon: "HomeIcon",
    href: "/admin",
    subMenu: [],
  },
  {
    name: "Users",
    icon: "UsersIcon",
    href: "/admin/users",
    subMenu: [],
  },
  {
    name: "Schools",
    icon: "BuildingOffice2Icon",
    href: "/admin/schools",
    subMenu: [],
  },
  {
    name: "Students",
    icon: "AcademicCapIcon",
    href: "/admin/students",
    subMenu: [],
  },
  {
    name: "Providers",
    icon: "UserGroupIcon",
    href: "/admin/providers",
    subMenu: [],
  },
  {
    name: "Therapists",
    icon: "UserIcon",
    href: "/admin/therapists",
    subMenu: [],
  },
  {
    name: "Therapy Services",
    icon: "ClipboardDocumentIcon",
    href: "/admin/therapy-services",
    subMenu: [],
  },
  {
    name: "Teacher Service Requests",
    icon: "BookOpenIcon",
    href: "/admin/teacher-service-requests",
    subMenu: [],
  },
  {
    name: "Reports",
    icon: "DocumentIcon",
    href: "/admin/reports",
    subMenu: [],
  },
  {
    name: "Communications",
    icon: "ChatBubbleLeftEllipsisIcon",
    href: "/admin/communications",
    subMenu: [],
  },
  {
    name: "Contracts",
    icon: "ClipboardDocumentCheckIcon",
    href: "/admin/contracts",
    subMenu: [],
  },
  {
    name: "Documents",
    icon: "FolderIcon",
    href: "/admin/documents",
    subMenu: [],
  },
  {
    name: "Contacts",
    icon: "UserCircleIcon",
    href: "/admin/contacts",
    subMenu: [],
  },
  {
    name: "Training Modules",
    icon: "LightBulbIcon",
    href: "/admin/training-modules",
    subMenu: [],
  },
  {
    name: "Equipment Referrals",
    icon: "WrenchScrewdriverIcon",
    href: "/admin/equipment-referrals",
    subMenu: [],
  },
  {
    name: "Invoices",
    icon: "CurrencyDollarIcon",
    href: "/admin/invoices",
    subMenu: [],
  },
  {
    name: "Settings",
    icon: "Cog6ToothIcon",
    href: "/admin/settings",
    subMenu: [],
  },
  {
    name: "Logs",
    icon: "ClipboardDocumentListIcon",
    href: "/admin/logs",
    subMenu: [],
  },
];

export const AdminLayout = ({ children }: React.PropsWithChildren) => {
  const pathname = usePathname();

  const navigationItems = navigation.map((item) =>
    setActiveNavigationItem(item, pathname),
  );

  return <LayoutShell navigation={navigationItems}>{children}</LayoutShell>;
};
