"use client";

import { useContext } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useSession } from "next-auth/react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ModalContext } from "@/components/modals/providers";
import { Icons } from "@/components/shared/icons";
import { QuickSearch } from "@/components/shared/quick-search";
import { NotificationsDropdown } from "@/components/shared/notifications";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

// Nav links for ExpertOS
const mainNavLinks = [
  { title: "Dashboard", href: "/dashboard", disabled: false },
  { title: "Cases", href: "/cases", disabled: false },
  { title: "Calendar", href: "/calendar", disabled: false },
];

interface NavBarProps {
  scroll?: boolean;
  large?: boolean;
}

export function NavBar({ scroll = false }: NavBarProps) {
  const scrolled = useScroll(50);
  const { data: session, status } = useSession();
  const { setShowSignInModal } = useContext(ModalContext);

  const selectedLayout = useSelectedLayoutSegment();

  return (
    <header
      className={`sticky top-0 z-40 flex w-full justify-center bg-background/60 backdrop-blur-xl transition-all ${scroll ? (scrolled ? "border-b" : "bg-transparent") : "border-b"
        }`}
    >
      <MaxWidthWrapper
        className="flex h-14 items-center justify-between py-4"
        large={false}
      >
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-1.5">
            <Icons.logo />
            <span className="font-urban text-xl font-bold">
              {siteConfig.name}
            </span>
          </Link>

          {mainNavLinks && mainNavLinks.length > 0 ? (
            <nav className="hidden gap-6 md:flex">
              {mainNavLinks.map((item, index) => (
                <Link
                  key={index}
                  href={item.disabled ? "#" : item.href}
                  prefetch={true}
                  className={cn(
                    "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                    item.href.startsWith(`/${selectedLayout}`)
                      ? "text-foreground"
                      : "text-foreground/60",
                    item.disabled && "cursor-not-allowed opacity-80",
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Search */}
          <div className="hidden md:block">
            <QuickSearch />
          </div>

          {session ? (
            <>
              {/* Notifications */}
              <NotificationsDropdown />

              {/* User Menu */}
              <Link
                href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                className="hidden md:block"
              >
                <Button
                  className="gap-2 px-4"
                  variant="default"
                  size="sm"
                  rounded="full"
                >
                  <Icons.user className="size-4" />
                  <span>{session.user.name?.split(' ')[0] || 'Dashboard'}</span>
                </Button>
              </Link>
            </>
          ) : status === "unauthenticated" ? (
            <Button
              className="hidden gap-2 px-5 md:flex"
              variant="default"
              size="sm"
              rounded="full"
              onClick={() => setShowSignInModal(true)}
            >
              <span>Sign In</span>
              <Icons.arrowRight className="size-4" />
            </Button>
          ) : (
            <Skeleton className="hidden h-9 w-28 rounded-full lg:flex" />
          )}
        </div>
      </MaxWidthWrapper>
    </header>
  );
}
