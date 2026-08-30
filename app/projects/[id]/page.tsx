"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Project, Shot } from "@/lib/store";

const TABS = ["原文", "分镜", "配图", "旁白", "发布包"] as const;
const STEP_INDEX: Record<string, number> = {
  draft: 0,
  shots: 1,
  images: 2,
  voiceover: 3,
  package: 4
};

export default function Workbench() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Project | null>(null);
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setP(p);
        const done = STEP_INDEX[p.status] ?? 0;
        setTab(Math.min(done + (p.status === "package" ? 0 : 1), 4));
      });
  }, [id]);

  if (!p) return <p className="muted">加载中…</p>;

  async function api(path: string, method: string, body?: unknown) {
    setBusy(path);
    setError("");
    const res = await fetch(`/api/projects/${id}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json();
    setBusy("");
    if (!res.ok) {
      setError(json.error || "请求失败");
      return null;
    }
    setP(json);
    return json;
  }

  function updateShot(idx: number, patch: Partial<Shot>) {
    const shots = p!.shots.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setP({ ...p!, shots });
  }

  async function generateAllImages() {
    for (let i = 0; i < p!.shots.length; i++) {
      const shot = p!.shots[i];
      const res = await api("/images", "POST", { shotId: shot.id });
      if (!res) break;
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  const shotIdx = (shotId: string) => p!.shots.findIndex((s) => s.id === shotId);

  return (
    <>
      <h1>{p.title}</h1>
      <div className="steps">
        {TABS.map((t, i) => (
          <button key={t} className={`stepchip ${tab === i ? "on" : ""} ${i <= STEP_INDEX[p.status] && tab !== i ? "done" : ""}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>
      {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}

      {tab === 0 && (
        <div className="card">
          <h2>文章原文</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{p.content}</p>
        </div>
      )}

      {tab === 1 && (
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            <button className="primary" onClick={() => api("/shots", "POST")} disabled={!!busy}>
              {busy === "/shots" ? "分析中…" : p.shots.length ? "重新生成 Shot List" : "生成 Shot List"}
            </button>
            {p.shots.length > 0 && (
              <button onClick={() => api("/shots", "PUT", { shots: p.shots })} disabled={!!busy}>
                {busy === "/shots" ? "" : "保存修订"}
              </button>
            )}
            {p.shots.length > 0 && <span className="muted">修订完点「保存修订」再去生成配图</span>}
          </div>
          {p.shots.map((s, i) => (
            <div className="shot" key={s.id}>
              <div className="no">镜头 {i + 1} <span className="tag blue">{s.structure_type}</span></div>
              <label>落点</label>
              <input value={s.position} onChange={(e) => updateShot(i, { position: e.target.value })} />
              <label>主题</label>
              <input value={s.theme} onChange={(e) => updateShot(i, { theme: e.target.value })} />
              <label>核心意思</label>
              <textarea rows={2} value={s.core_idea} onChange={(e) => updateShot(i, { core_idea: e.target.value })} />
              <label>小黑的动作</label>
              <textarea rows={2} value={s.xiaohei_action} onChange={(e) => updateShot(i, { xiaohei_action: e.target.value })} />
              <label>标注词（逗号分隔）</label>
              <input value={s.labels.join("，")} onChange={(e) => updateShot(i, { labels: e.target.value.split(/[，,]/).filter(Boolean) })} />
              <label>视觉元素（逗号分隔）</label>
              <input value={s.elements.join("，")} onChange={(e) => updateShot(i, { elements: e.target.value.split(/[，,]/).filter(Boolean) })} />
            </div>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            <button className="primary" onClick={generateAllImages} disabled={!!busy || !p.shots.length}>
              {busy === "/images" ? "生成中，请稍候…" : "逐张生成全部配图"}
            </button>
            <span className="muted">每张约 20-60 秒，生成完自动显示；不满意的单独点「重生成」</span>
          </div>
          {p.shots.map((s, i) => (
            <div className="shot" key={s.id}>
              <div className="no">
                镜头 {i + 1} · {s.theme}
                <button className="small" style={{ marginLeft: 10 }} onClick={() => api("/images", "POST", { shotId: s.id })} disabled={!!busy}>
                  {s.imageStatus === "generating" ? "生成中…" : s.imagePath ? "重生成" : "生成"}
                </button>
              </div>
              <div className="muted">{s.xiaohei_action}</div>
              {s.imageStatus === "error" && <div className="err">{s.error}</div>}
              {s.imagePath && (
                <div className="imgs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/projects/${id}/images/${s.id}`} alt={`镜头${i + 1}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            <button className="primary" onClick={() => api("/voiceover", "POST")} disabled={!!busy}>
              {busy === "/voiceover" ? "撰写中…" : p.voiceover.length ? "重新生成旁白" : "生成旁白"}
            </button>
            {p.voiceover.length > 0 && (
              <button onClick={() => api("/voiceover", "PUT", { voiceover: p.voiceover })} disabled={!!busy}>保存修改</button>
            )}
          </div>
          {p.voiceover.map((v, i) => (
            <div className="voline" key={i}>
              <div className="idx">{i + 1}</div>
              <div style={{ flex: 1 }}>
                <textarea
                  rows={2}
                  value={v.text}
                  onChange={(e) => {
                    const voiceover = p!.voiceover.map((x, j) => (j === i ? { ...x, text: e.target.value } : x));
                    setP({ ...p!, voiceover });
                  }}
                />
                <div className="muted" style={{ marginTop: 2 }}>
                  {p.shots[shotIdx(v.shotId)] ? `配镜头 ${shotIdx(v.shotId) + 1} · ${p.shots[shotIdx(v.shotId)].theme}` : ""}
                </div>
              </div>
            </div>
          ))}
          {p.voiceoverTips && (
            <div className="copybox">
              <span className="tag blue">配音提示</span>
              {p.voiceoverTips}
            </div>
          )}
        </div>
      )}

      {tab === 4 && (
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            <button className="primary" onClick={() => api("/publish", "POST")} disabled={!!busy}>
              {busy === "/publish" ? "策划中…" : p.publish ? "重新生成发布包" : "生成发布包"}
            </button>
            <span className="muted">标题勾子 + 正文 + 标签 + 置顶评论</span>
          </div>
          {p.publish && (
            <>
              <h2>标题（勾子）</h2>
              {p.publish.titles.map((t, i) => (
                <div className="copybox" key={i} style={{ cursor: "pointer" }} onClick={() => copy(t.text, `标题${i + 1}`)}>
                  <span className="tag">{t.route}</span>
                  {t.text}
                  {copied === `标题${i + 1}` && <span className="tag blue" style={{ marginLeft: 8 }}>已复制</span>}
                </div>
              ))}
              <h2>正文</h2>
              <div className="copybox" style={{ cursor: "pointer" }} onClick={() => copy(p.publish!.body, "正文")}>
                {p.publish.body}
                {copied === "正文" && <span className="tag blue" style={{ marginLeft: 8 }}>已复制</span>}
              </div>
              <h2>标签</h2>
              <div className="copybox" style={{ cursor: "pointer" }} onClick={() => copy([...p.publish!.tags.core, ...p.publish!.tags.scene, ...p.publish!.tags.mood].map((t) => `#${t}`).join(" "), "标签")}>
                <span className="tag">核心</span>{p.publish.tags.core.join(" ")}<br />
                <span className="tag blue">场景</span>{p.publish.tags.scene.join(" ")}<br />
                <span className="tag red">情绪</span>{p.publish.tags.mood.join(" ")}
                {copied === "标签" && <span className="tag blue" style={{ marginLeft: 8 }}>已复制</span>}
              </div>
              <h2>置顶评论</h2>
              <div className="copybox" style={{ cursor: "pointer" }} onClick={() => copy(p.publish!.comment, "评论")}>
                {p.publish.comment}
                {copied === "评论" && <span className="tag blue" style={{ marginLeft: 8 }}>已复制</span>}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
