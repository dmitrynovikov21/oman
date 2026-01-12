import { SidebarNavItem } from "types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "WORKSPACE",
    items: [
      { href: "/dashboard", icon: "dashboard", title: "Dashboard" },
      { href: "/cases", icon: "fileText", title: "Cases", badge: 12 },
      { href: "/cases/new", icon: "add", title: "New Case" },
      { href: "/calendar", icon: "timer", title: "Calendar" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { href: "/analytics", icon: "lineChart", title: "Analytics" },
      {
        href: "/dashboard/billing",
        icon: "billing",
        title: "Finance",
      },
    ],
  },
  {
    title: "ADMIN",
    items: [
      {
        href: "/admin",
        icon: "laptop",
        title: "Admin Panel",
        authorizeOnly: "ADMIN",
      },
      {
        href: "/admin/orders",
        icon: "package",
        title: "Orders",
        badge: 2,
        authorizeOnly: "ADMIN",
      },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { href: "/dashboard/settings", icon: "settings", title: "Settings" },
      { href: "/help", icon: "bookOpen", title: "Help" },
      { href: "/", icon: "home", title: "Home" },
    ],
  },
];

