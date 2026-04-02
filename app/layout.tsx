import { Dices, RotateCw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UserMenu } from "~/components/user-menu";
import { ClickIdProvider } from "~/lib/click-id";
import { PlayerProvider } from "~/lib/player";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sample Casino — WOMO Integration Demo",
  description:
    "A standalone demo app showing how operators integrate with the WOMO platform.",
};

const NAV_ITEMS = [
  { href: "/casino", label: "Rock Paper Scissors", icon: Dices },
  { href: "/spin", label: "Spin the Wheel", icon: RotateCw },
] as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Suspense>
          <ClickIdProvider>
            <PlayerProvider>
              <aside className="flex w-56 shrink-0 flex-col border-border border-r bg-card p-4">
                <Link href="/" className="mb-8 font-bold text-lg text-primary">
                  Sample Casino
                </Link>
                <nav className="flex flex-1 flex-col gap-1">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 rounded-md px-3 py-2 font-medium text-card-foreground text-sm transition hover:bg-muted"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <UserMenu />
              </aside>
              <main className="flex-1 overflow-y-auto">{children}</main>
            </PlayerProvider>
          </ClickIdProvider>
        </Suspense>
      </body>
    </html>
  );
}
