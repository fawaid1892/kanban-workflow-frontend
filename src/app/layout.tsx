import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { ErrorBoundary } from "@/components/error-boundary";

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
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="hidden w-64 border-r bg-white md:flex md:flex-col">
              <div className="flex h-14 items-center border-b px-6 font-bold text-gray-900">
                Kanban Flow
              </div>
              <nav className="flex-1 space-y-1 p-4">
                <a
                  href="/"
                  className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 bg-indigo-50"
                >
                  Workflows
                </a>
              </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
