"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/site", label: "Site content" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/tools", label: "AI tools" },
  { href: "/admin/messages", label: "Inquiries" },
];

export function AdminNav({ unread }: { unread: number }) {
  const path = usePathname();
  return (
    <nav className="adm__nav" aria-label="Dashboard">
      {ITEMS.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}>
            {i.label}
            {i.href === "/admin/messages" && unread > 0 && <span className="adm__badge" aria-label={`${unread} unread`}>{unread}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
