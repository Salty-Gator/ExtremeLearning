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
