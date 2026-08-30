"use client";

import { useEffect, useState } from "react";
import { Settings } from "@/lib/store";

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setS);
  }, []);

  if (!s) return <p className="muted">加载中…</p>;

  function set(path: "llm" | "image", key: string, v: string) {
    setS((prev) => (prev ? { ...prev, [path]: { ...prev[path], [key]: v } } : prev));
  }

  async function save() {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className="card">
        <h1>设置</h1>
        <p className="muted" style={{ marginBottom: 8 }}>
          本应用使用 OpenAI 兼容接口。LLM 用于分镜/旁白/发布包，图像接口用于生成插画。
          也支持任何兼容此格式的服务商（如硅基流动等），换掉 Base URL 和模型名即可。
        </p>

        <h2>LLM 接口（分镜 · 旁白 · 发布包）</h2>
        <label>Base URL</label>
        <input value={s.llm.baseUrl} onChange={(e) => set("llm", "baseUrl", e.target.value)} placeholder="https://api.openai.com/v1" />
        <label>API Key</label>
        <input type="password" value={s.llm.apiKey} onChange={(e) => set("llm", "apiKey", e.target.value)} placeholder="sk-…" />
        <label>模型名</label>
        <input value={s.llm.model} onChange={(e) => set("llm", "model", e.target.value)} placeholder="gpt-4o-mini" />

        <h2 style={{ marginTop: 24 }}>图像接口（配图生成）</h2>
        <label>Base URL</label>
        <input value={s.image.baseUrl} onChange={(e) => set("image", "baseUrl", e.target.value)} placeholder="https://api.openai.com/v1" />
        <label>API Key</label>
        <input type="password" value={s.image.apiKey} onChange={(e) => set("image", "apiKey", e.target.value)} placeholder="sk-…" />
        <label>模型名</label>
        <input value={s.image.model} onChange={(e) => set("image", "model", e.target.value)} placeholder="gpt-image-1" />
        <label>尺寸（宽x高）</label>
        <input value={s.image.size} onChange={(e) => set("image", "size", e.target.value)} placeholder="1536x1024" />

        <h2 style={{ marginTop: 24 }}>插画风格 DNA（小黑）</h2>
        <textarea rows={5} value={s.styleDna} onChange={(e) => setS({ ...s, styleDna: e.target.value })} />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="primary" onClick={save}>保存设置</button>
          {saved && <span className="tag">已保存</span>}
        </div>
      </div>
    </>
  );
}
