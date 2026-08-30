"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Project, Settings } from "@/lib/store";

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
  const [sourceUrl, setSourceUrl] = useState("");
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);

  async function refresh() {
    const res = await fetch("/api/projects");
    setProjects(await res.json());
  }

  useEffect(() => {
    refresh();
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function fetchFromUrl() {
    if (!url.trim()) {
      setError("请先填写网址");
      return;
    }
    setFetching(true);
    setError("");
    const res = await fetch("/api/fetch-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() })
    });
    const json = await res.json();
    setFetching(false);
    if (!res.ok) {
      setError(json.error || "抓取失败");
      return;
    }
    setTitle(json.title);
    setContent(json.content);
    setSourceUrl(url.trim());
  }

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
      body: JSON.stringify({ title, content, sourceUrl: sourceUrl || undefined })
    });
    setCreating(false);
    if (res.ok) {
      setTitle("");
      setContent("");
      setUrl("");
      setSourceUrl("");
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
        <label>网址导入（可选）</label>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="粘贴文章网址，自动抓取标题和正文"
            style={{ flex: 1 }}
          />
          <button onClick={fetchFromUrl} disabled={fetching} style={{ flex: "none" }}>
            {fetching ? "抓取中…" : "抓取文章"}
          </button>
        </div>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          公众号 / 博客 / 新闻页大多可以直接抓；纯脚本渲染或需登录的页面抓不到，直接粘贴正文即可。
        </p>

        <label>文章标题</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="粘贴文章标题" />
        <label>文章正文</label>
        <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="粘贴文章正文（Markdown 也行）" />
        {settings && (
          <p className="muted" style={{ marginTop: 8 }}>
            本次创建将使用缺省风格与 IP（可在项目工作台里改）：
            <span className="tag">{settings.styleId === "custom" ? "自定义风格" : PRESET_NAMES[settings.styleId] || "小黑手绘风"}</span>
            <span className="tag blue">{settings.ips?.find((i) => i.id === settings.activeIpId)?.name || "小黑"}</span>
          </p>
        )}
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

const PRESET_NAMES: Record<string, string> = {
  xiaohei: "小黑手绘风",
  kexue: "科普风",
  shangwu: "商务风",
  dianying: "电影风",
  jianyi: "极简线稿风",
  custom: "自定义"
};
