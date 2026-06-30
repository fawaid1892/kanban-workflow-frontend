import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kanban Workflow Builder",
  description: "A visual workflow builder with Kanban boards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-screen">
          {/* Sidebar placeholder */}
          <aside className="hidden w-64 border-r border-border bg-card md:flex md:flex-col">
            <div className="flex h-14 items-center border-b border-border px-6 font-semibold">
              Kanban Flow
            </div>
            <nav className="flex-1 space-y-1 p-4">
              <a
                href="/"
                className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-border/50"
              >
                Dashboard
              </a>
              <a
                href="/roles"
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-border/50"
              >
                Roles
              </a>
              <a
                href="/workflows"
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-border/50"
              >
                Workflows
              </a>
              <a
                href="/board"
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-border/50"
              >
                Board
              </a>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
