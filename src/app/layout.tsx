import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ShortcutsHelp } from "@/components/shortcuts-help";
import { ThemeToggle } from "@/components/theme-toggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kanban Workflow Builder",
  description: "Visual workflow builder with isolated Kanban boards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased dark:bg-gray-900 dark:text-gray-100`}>
        <QueryProvider>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="hidden w-64 border-r bg-white dark:border-gray-800 dark:bg-gray-900 md:flex md:flex-col">
              <div className="flex h-14 items-center justify-between border-b px-6 dark:border-gray-800">
                <span className="font-bold text-gray-900 dark:text-gray-100">Kanban Flow</span>
                <ThemeToggle />
              </div>
              <nav className="flex-1 space-y-1 p-4">
                <a
                  href="/"
                  className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 bg-indigo-50 dark:text-gray-100 dark:bg-indigo-900/30"
                >
                  Workflows
                </a>
              </nav>
            </aside>

            {/* Mobile header */}
            <div className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:hidden">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Kanban Flow</span>
              <ThemeToggle />
            </div>

            {/* Main content */}
            <main className="flex-1 pt-12 md:pt-0">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
          <ShortcutsHelp />
        </QueryProvider>
      </body>
    </html>
  );
}
