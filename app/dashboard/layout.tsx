"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase, signOut } from "@/lib/supabase";
import { getProfile } from "@/lib/subscription";
import type { User } from "@supabase/supabase-js";

const T = {
  bg: "#f7f3ee",
  bgAlt: "#efebe4",
  surface: "#ffffff",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
  green: "#16a34a",
};

const NAV = [
  { label: "Play",        href: "/dashboard/play",        icon: "♟" },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: "◈" },
  { label: "History",     href: "/dashboard/history",     icon: "↺" },
  { label: "Profile",     href: "/dashboard/profile",     icon: "◯" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [elo, setElo] = useState(1200);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/auth"); return; }
      setUser(data.user);
      const profile = await getProfile(data.user.id);
      setIsPro(profile.is_pro);
      setElo(profile.elo);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace("/auth");
      else {
        setUser(session.user);
        getProfile(session.user.id).then((p) => { setIsPro(p.is_pro); setElo(p.elo); });
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const displayName = user?.user_metadata?.full_name as string | undefined
    ?? user?.email?.split("@")[0]
    ?? "Player";

  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "var(--font-geist), system-ui, sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 56 : 220,
        minHeight: "100vh",
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.18s ease",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
      }}>
        {/* Logo row */}
        <div style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "0" : "0 16px 0 20px",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          {!collapsed && (
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.03em", color: T.text }}>
              KnightCode
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: T.textMut, fontSize: 14, padding: 4,
              display: "flex", alignItems: "center",
            }}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 0", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(({ label, href, icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <a
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "10px 0" : "9px 20px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  textDecoration: "none",
                  borderRadius: "0 8px 8px 0",
                  marginRight: 8,
                  background: active ? T.bgAlt : "transparent",
                  color: active ? T.text : T.textSec,
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  borderLeft: active ? `2px solid ${T.text}` : "2px solid transparent",
                  transition: "background 0.12s",
                }}
              >
                <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
              </a>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          {/* Pro upsell */}
          {!isPro && !collapsed && (
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <a
                href="/pricing"
                style={{
                  display: "block",
                  padding: "8px 12px",
                  background: T.bgAlt,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.green,
                  textAlign: "center",
                }}
              >
                Upgrade to Pro →
              </a>
            </div>
          )}

          {/* User row */}
          <div style={{
            padding: collapsed ? "14px 0" : "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
          }}>
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: T.bgAlt, border: `1.5px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: T.text, flexShrink: 0,
            }}>
              {initial}
            </div>

            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </p>
                <p style={{ fontSize: 11, color: T.textMut, margin: 0, fontFamily: "var(--font-geist-mono), monospace" }}>
                  {elo} ELO{isPro && <span style={{ color: T.green, marginLeft: 6 }}>PRO</span>}
                </p>
              </div>
            )}
          </div>

          {/* Sign out */}
          {!collapsed && (
            <div style={{ padding: "0 16px 14px" }}>
              <button
                onClick={async () => { await signOut(); router.replace("/"); }}
                style={{
                  width: "100%",
                  padding: "7px 0",
                  background: "none",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: T.textMut,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
