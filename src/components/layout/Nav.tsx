"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useCart } from "@/lib/cart/store";

const links = [
  { href: "/menu", label: "Menu", n: "01" },
  { href: "/build", label: "Build one", n: "02" },
  { href: "/#story", label: "Story", n: "03" },
  { href: "/#visit", label: "Find us", n: "04" },
];

export function Nav() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [scrolled, setScrolled] = useState(false);
  // Cart lives in localStorage, so the count is only known after mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-ink/92 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 items-center justify-between px-5 md:h-20 md:px-10" aria-label="Main">
        <Link href="/" className="text-[1.65rem] text-cream md:text-[1.9rem]">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="group flex items-baseline gap-2 text-sm text-cream/80 transition-colors hover:text-cream">
                <span className="type-annot text-fire/80 transition-colors group-hover:text-fire">{l.n}</span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/cart"
          className="group relative flex items-center gap-3 rounded-full border border-cream/15 py-2 pl-4 pr-2 text-sm transition-colors hover:border-fire"
        >
          <span className="hidden sm:inline">Order</span>
          <span className="flex h-8 min-w-8 items-center justify-center gap-1 rounded-full bg-fire px-2 text-ink">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="type-annot !tracking-normal font-medium" aria-label={`${mounted ? count : 0} items in cart`}>
              {mounted ? count : 0}
            </span>
          </span>
        </Link>
      </nav>

      {/* Mobile: the four destinations stay one thumb-reach away */}
      <ul className="flex justify-between border-t border-cream/10 px-5 py-2 md:hidden">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-baseline gap-1.5 py-1 text-xs text-cream/80">
              <span className="type-annot text-fire/80">{l.n}</span>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
}
