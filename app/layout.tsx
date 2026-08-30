import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "素材流水线",
  description: "文章 → 分镜 → 配图 → 旁白 → 发布包"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <nav className="topnav">
          <Link href="/" className="brand">素材流水线</Link>
          <span className="brand-sub">文章 → 分镜 → 配图 → 旁白 → 发布包</span>
          <Link href="/settings" className="navlink">设置</Link>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
