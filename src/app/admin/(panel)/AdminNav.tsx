"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Bell, Boxes, ChefHat, ExternalLink, FileText, LogOut, Menu as MenuIcon, Package, Percent,
  Receipt, Star, Store, Tags, Users, UserCog, X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { logout } from "../actions/auth";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/ingredients", label: "Builder ingredients", icon: ChefHat },
  { href: "/admin/coupons", label: "Coupons", icon: Percent },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/content", label: "Website & settings", icon: FileText },
  { href: "/admin/branches", label: "Branches & delivery", icon: Store },
  { href: "/admin/team", label: "Team & account", icon: UserCog },
];

export function AdminNav({ name, role, unread }: { name: string; role: string; unread: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <>
      <div className="flex items-center justify-between border-b border-cream/10 px-5 py-4 md:hidden">
        <Link href="/admin" className="text-2xl"><Logo /></Link>
        <button onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>
      <aside className={`${open ? "block" : "hidden"} border-r border-cream/10 md:sticky md:top-0 md:block md:h-dvh md:overflow-y-auto`}>
        <div className="hidden px-6 pb-4 pt-7 md:block">
          <Link href="/admin" className="text-2xl"><Logo /></Link>
          <p className="type-annot mt-2 text-fire">Kitchen office</p>
        </div>
        <nav aria-label="Admin" className="px-3 py-3">
          <ul className="space-y-0.5">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active(href) ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active(href) ? "bg-fire/15 text-cream" : "text-cream/65 hover:bg-cream/5 hover:text-cream"}`}
                >
                  <Icon className={`h-4 w-4 ${active(href) ? "text-fire" : ""}`} aria-hidden="true" />
                  {label}
                  {href === "/admin" && unread > 0 && (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-fire px-1.5 text-[11px] font-semibold text-ink">
                      <Bell className="h-3 w-3" aria-hidden="true" />{unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 border-t border-cream/10 px-6 py-5 text-sm">
          <p className="text-cream">{name}</p>
          <p className="type-annot text-cream/40">{role.toLowerCase()}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/" target="_blank" className="inline-flex items-center gap-2 text-cream/60 hover:text-fire">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> View website
            </Link>
            <form action={logout}>
              <button className="inline-flex items-center gap-2 text-cream/60 hover:text-fire">
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
