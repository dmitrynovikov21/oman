import { SidebarNavItem, SiteConfig } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL;

export const siteConfig: SiteConfig = {
  name: "ExpertOS",
  description:
    "Digital Factory for Judicial Experts in Oman. Streamline case management, document intake, and expert workflow.",
  url: site_url,
  ogImage: `${site_url}/_static/og.jpg`,
  links: {
    twitter: "https://twitter.com/expertos",
    github: "https://github.com/expertos",
  },
  mailSupport: "support@expertos.om",
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "Support",
    items: [
      { title: "Help Center", href: "/help" },
      { title: "Contact", href: "/contact" },
    ],
  },
];
