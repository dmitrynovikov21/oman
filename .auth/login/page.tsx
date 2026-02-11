import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { UserAuthForm } from "@/components/forms/user-auth-form";
import { Icons } from "@/components/shared/icons";

export const metadata: Metadata = {
  title: "Login - ExpertOS",
  description: "Sign in to ExpertOS - Digital Factory for Judicial Experts",
};

export default function LoginPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 text-white flex-col justify-between p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />

        {/* Logo */}
        <div className="relative z-20 flex items-center gap-2">
          <Icons.logo className="size-8" />
          <span className="text-xl font-semibold tracking-tight">ExpertOS</span>
        </div>

        {/* Quote */}
        <div className="relative z-20">
          <blockquote className="space-y-4">
            <p className="text-2xl font-light leading-relaxed text-zinc-300">
              "Digital Factory for Judicial Experts — streamline your case management and expert workflow."
            </p>
            <footer className="text-sm text-zinc-500">
              Trusted by Expert Firms across Oman
            </footer>
          </blockquote>
        </div>

        {/* Stats */}
        <div className="relative z-20 flex gap-12">
          <div>
            <span className="text-3xl font-light text-white">500+</span>
            <p className="text-sm text-zinc-500 mt-1">Cases Processed</p>
          </div>
          <div>
            <span className="text-3xl font-light text-white">50+</span>
            <p className="text-sm text-zinc-500 mt-1">Expert Users</p>
          </div>
          <div>
            <span className="text-3xl font-light text-white">99%</span>
            <p className="text-sm text-zinc-500 mt-1">Accuracy Rate</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-zinc-50 p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Icons.logo className="size-8" />
            <span className="text-xl font-semibold tracking-tight text-zinc-900">ExpertOS</span>
          </div>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Welcome back
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              Sign in to your ExpertOS account
            </p>
          </div>

          {/* Demo Access Button */}
          <Link
            href="/dashboard"
            className="w-full bg-zinc-950 text-white rounded-xl py-3.5 font-medium hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
          >
            <span className="text-lg">🚀</span>
            DAYPASS — Quick Demo Access
          </Link>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-50 px-3 text-zinc-400">
                or continue with
              </span>
            </div>
          </div>

          {/* Auth Form */}
          <Suspense>
            <UserAuthForm />
          </Suspense>

          {/* Footer */}
          <p className="text-center text-sm text-zinc-400">
            <Link href="/register" className="hover:text-zinc-900 transition-colors">
              Don't have an account? Contact Admin
            </Link>
          </p>

          <p className="text-center text-xs text-zinc-400">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

