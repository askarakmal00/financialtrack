"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", emoji: "📊" },
  { path: "/transactions", label: "Transaksi", emoji: "💸" },
  { path: "/accounts", label: "Akun", emoji: "💳" },
  { path: "/debts", label: "Hutang", emoji: "🏦" },
  { path: "/bills", label: "Tagihan", emoji: "📃" },
  { path: "/budget", label: "Budget", emoji: "🎯" },
  { path: "/goals", label: "Target", emoji: "⭐" },
  { path: "/calendar", label: "Kalender", emoji: "📅" },
  { path: "/reports", label: "Laporan", emoji: "📈" },
  { path: "/settings", label: "Pengaturan", emoji: "⚙️" },
];

const BOTTOM_NAV = [
  { path: "/", label: "Dashboard", emoji: "📊" },
  { path: "/transactions", label: "Transaksi", emoji: "💸" },
  { path: "/budget", label: "Budget", emoji: "🎯" },
  { path: "/goals", label: "Target", emoji: "⭐" },
  { path: "/reports", label: "Laporan", emoji: "📈" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="app-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <div className="sidebar-logo-icon">💰</div>
            <div>
              <div className="sidebar-logo-text">FinTrack</div>
              <div className="sidebar-logo-sub">Personal Finance</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu Utama</div>
          {NAV_ITEMS.slice(0, 7).map((item) => (
            <button
              key={item.path}
              className={`nav-item ${pathname === item.path ? "active" : ""}`}
              onClick={() => { router.push(item.path); setSidebarOpen(false); }}
            >
              <span style={{ fontSize: "0.9rem" }}>{item.emoji}</span>
              {item.label}
            </button>
          ))}

          <div className="sidebar-section-title" style={{ marginTop: "0.5rem" }}>Lainnya</div>
          {NAV_ITEMS.slice(7).map((item) => (
            <button
              key={item.path}
              className={`nav-item ${pathname === item.path ? "active" : ""}`}
              onClick={() => { router.push(item.path); setSidebarOpen(false); }}
            >
              <span style={{ fontSize: "0.9rem" }}>{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center" }}>
            FinTrack v1.0 • Data tersimpan lokal
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Mobile topbar */}
        <div style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }} className="mobile-topbar">
          <button
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--text-primary)" }}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>💰 FinTrack</span>
          <div style={{ width: 32 }} />
        </div>

        {mounted ? children : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.5 }}>
            Memuat data...
          </div>
        )}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map((item) => (
          <button
            key={item.path}
            className={`bottom-nav-item ${pathname === item.path ? "active" : ""}`}
            onClick={() => router.push(item.path)}
          >
            <span style={{ fontSize: "1.1rem" }}>{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
