import { type Icons } from "@/components/shared/icons";

export interface NavItem {
    title: string;
    href?: string;
    disabled?: boolean;
    external?: boolean;
    icon?: keyof typeof Icons;
    label?: string;
    description?: string;
}

export interface SidebarNavItem {
    title: string;
    disabled?: boolean;
    external?: boolean;
    icon?: keyof typeof Icons;
    items: NavItem[];
}
