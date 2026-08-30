"use client";

import { useEffect, useState } from "react";
import { Settings } from "@/lib/store";
import { STYLE_PRESETS, CUSTOM_STYLE_ID, IpProfile } from "@/lib/presets";

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

  function chooseStyle(id: string) {
    const preset = STYLE_PRESETS.find((p) => p.id === id);
    setS((prev) =>
      prev
        ? {
            ...prev,
            styleId: id,
            // 选内置预设时自动填充 DNA；选「自定义」保留当前内容供手改
            styleDna: preset ? preset.dna : prev.styleDna
          }
        : prev
    );
  }

  function updateIp(idx: number, patch: Partial<IpProfile>) {
    setS((prev) =>
      prev
        ? { ...prev, ips: prev.ips.map((ip, i) => (i === idx ? { ...ip, ...patch } : ip)) }
        : prev
    );
  }

  function addIp() {
    const id = `ip-${Date.now().toString(36)}`;
    setS((prev) =>
      prev ? { ...prev, ips: [...prev.ips, { id, name: "", description: "" }] } : prev
    );
  }

  function removeIp(idx: number) {
    if (!s) return;
    const ip = s.ips[idx];
    if (!ip.name && !ip.description && s.ips.length > 1) {
      setS((prev) => (prev ? { ...prev, ips: prev.ips.filter((_, i) => i !== idx) } : prev));
      return;
    }
    if (!confirm(`删除 IP「${ip.name || "未命名"}」？已有项目引用它时会自动回落到小黑。`)) return;
    if (s.ips.length <= 1) {
      alert("至少保留一个 IP");
      return;
    }
    const activeIpId = s.activeIpId === ip.id ? s.ips.filter((_, i) => i !== idx)[0].id : s.activeIpId;
    setS((prev) => (prev ? { ...prev, ips: prev.ips.filter((_, i) => i !== idx), activeIpId } : prev));
  }

  async function save() {
    if (!s) return;
    const cleaned: Settings = {
      ...s,
      ips: s.ips.filter((ip) => ip.name.trim())
    };
    if (!cleaned.ips.find((ip) => ip.id === cleaned.activeIpId)) {
      cleaned.activeIpId = cleaned.ips[0]?.id || "xiaohei";
    }
    setS(cleaned);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleaned)
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

        <h2 style={{ marginTop: 24 }}>插画风格预设</h2>
        <label>选择风格（新项目的缺省风格，每个项目里也可以单独改）</label>
        <select value={s.styleId} onChange={(e) => chooseStyle(e.target.value)}>
          {STYLE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          <option value={CUSTOM_STYLE_ID}>自定义…</option>
        </select>
        <label>风格 DNA{s.styleId === CUSTOM_STYLE_ID ? "（自定义，直接编辑）" : "（选预设后自动填充，可微调后保存为当前 DNA）"}</label>
        <textarea rows={5} value={s.styleDna} onChange={(e) => setS((prev) => (prev ? { ...prev, styleDna: e.target.value } : prev))} />

        <h2 style={{ marginTop: 24 }}>IP 角色管理</h2>
        <p className="muted" style={{ marginBottom: 8 }}>
          IP 是每张配图里执行核心动作的主角。小黑是缺省 IP，你可以创建自己的 IP（写清楚外形、性格、气质）。
          生成配图时，提示词会把 IP 描述注入画面。
        </p>
        {s.ips.map((ip, idx) => (
          <div className="shot" key={ip.id}>
            <div className="no" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="activeIp"
                  checked={s.activeIpId === ip.id}
                  onChange={() => setS((prev) => (prev ? { ...prev, activeIpId: ip.id } : prev))}
                  style={{ width: "auto" }}
                />
                缺省 IP
              </label>
              <span style={{ flex: 1 }} />
              <button className="small" onClick={() => removeIp(idx)}>删除</button>
            </div>
            <label>IP 名称</label>
            <input value={ip.name} onChange={(e) => updateIp(idx, { name: e.target.value })} placeholder="如：小黑、白兔博士" />
            <label>形象描述（会注入配图提示词，写越具体越稳定）</label>
            <textarea
              rows={3}
              value={ip.description}
              onChange={(e) => updateIp(idx, { description: e.target.value })}
              placeholder="外形、颜色、五官、体型、气质、动作偏好……"
            />
          </div>
        ))}
        <button className="small" onClick={addIp} style={{ marginTop: 4 }}>+ 新建 IP</button>

        <div className="row" style={{ marginTop: 16 }}>
          <button className="primary" onClick={save}>保存设置</button>
          {saved && <span className="tag">已保存</span>}
        </div>
      </div>
    </>
  );
}
