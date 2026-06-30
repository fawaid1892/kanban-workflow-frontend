import Link from "next/link";

const navCards = [
  {
    title: "Roles",
    description: "Manage user roles and permissions",
    href: "/roles",
    icon: "👤",
  },
  {
    title: "Workflows",
    description: "Design and configure workflows",
    href: "/workflows",
    icon: "⚡",
  },
  {
    title: "Board",
    description: "Visual Kanban board view",
    href: "/board",
    icon: "📋",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col items-center justify-center bg-background p-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Kanban Workflow Builder
        </h1>
        <p className="mt-4 text-lg text-muted">
          Design, manage, and visualize your workflows with an intuitive Kanban
          interface.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {navCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-foreground/20"
          >
            <div className="text-3xl">{card.icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-card-foreground">
              {card.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
