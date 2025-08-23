import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";
import { ThemeSwitch } from "@/components/theme-switch";
import LogoutButton from "@/components/LogoutButton";
import HomeLoginButton from "@/components/HomeLoginButton";
import { AuthzProvider } from "@/lib/authz/context";
import AppNavMenu from "@/components/AppNavMenu";
import CurrentUserBadge from "@/components/CurrentUserBadge";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <AuthzProvider>
            <div className="relative flex flex-col h-screen">
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                <Link
                  href="/"
                  aria-label="Home"
                  className="rounded-medium border border-default-200 bg-content1 hover:bg-content2 text-default-600 p-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.25 8.25a.75.75 0 1 1-1.06 1.06l-.47-.47V20.4a1.6 1.6 0 0 1-1.6 1.6h-3.2a1.6 1.6 0 0 1-1.6-1.6v-3.2a1.6 1.6 0 0 0-1.6-1.6h-1.6a1.6 1.6 0 0 0-1.6 1.6v3.2a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6v-7.72l-.47.47a.75.75 0 1 1-1.06-1.06l8.25-8.25Z"/>
                  </svg>
                </Link>
                <ThemeSwitch />
                <AppNavMenu requireAuth trigger={<CurrentUserBadge />} />
                <HomeLoginButton />
                <LogoutButton />
              </div>
              <main className="container mx-auto max-w-full sm:max-w-2xl lg:max-w-[1600px] xl:max-w-[1800px] 2xl:max-w-[1920px] px-3 sm:px-6 min-h-[100dvh]">
                {children}
              </main>
            </div>
          </AuthzProvider>
        </Providers>
      </body>
    </html>
  );
}
