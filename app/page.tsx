"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Project } from "@/lib/store";

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  shots: "分镜已出",
  images: "配图中",
  voiceover: "旁白已出",
  package: "发布包就绪"
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const res = await fetch("/api/projects");
    setProjects(await res.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create() {
    if (!title.trim() || !content.trim()) {
      setError("标题和正文都不能为空");
      return;
    }
    setCreating(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    setCreating(false);
    if (res.ok) {
      setTitle("");
      setContent("");
      refresh();
    } else {
      setError((await res.json()).error || "创建失败");
    }
  }

  async function remove(id: string) {
    if (!confirm("确定删除这个项目？配图也会一并删除。")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <>
      <div className="card">
        <h1>新建项目</h1>
        <label>文章标题</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="粘贴文章标题" />
        <label>文章正文</label>
        <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="粘贴文章正文（Markdown 也行）" />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="primary" onClick={create} disabled={creating}>
            {creating ? "创建中…" : "创建项目"}
          </button>
          <span className="muted">创建后进入工作台：分镜 → 配图 → 旁白 → 发布包</span>
        </div>
        {error && <div className="err">{error}</div>}
      </div>

      <div className="card">
        <h1>我的项目（{projects.length}）</h1>
        {projects.length === 0 && <p className="muted">还没有项目，从上面粘贴一篇文章开始。</p>}
        <ul className="plist">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`}>{p.title}</Link>
              <span className="tag">{STATUS_LABEL[p.status] || p.status}</span>
              <span className="muted">{new Date(p.createdAt).toLocaleDateString("zh-CN")}</span>
              <button className="small" onClick={() => remove(p.id)}>删除</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
