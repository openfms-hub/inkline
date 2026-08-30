"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Project, Settings, Shot } from "@/lib/store";
import { STYLE_PRESETS, CUSTOM_STYLE_ID, ASPECT_OPTIONS, shotContentKey } from "@/lib/presets";

export default function Workbench() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Project | null>(null);
  const [busy, setBusy] = useState("");
  const [genShot, setGenShot] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [openShot, setOpenShot] = useState("");
  const [editSrc, setEditSrc] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setP(p);
        if (p.shots?.length) setOpenShot(p.shots[0].id);
      });
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
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

  function updateVoiceover(shotId: string, text: string) {
    const has = p!.voiceover.some((v) => v.shotId === shotId);
    const voiceover = has
      ? p!.voiceover.map((v) => (v.shotId === shotId ? { ...v, text } : v))
      : [...p!.voiceover, { shotId, text }];
    setP({ ...p!, voiceover });
  }

  async function generateAllImages() {
    const ids = p!.shots.map((s) => s.id);
    for (const sid of ids) {
      setGenShot(sid);
      const res = await api("/images", "POST", { shotId: sid });
      if (!res) break;
    }
    setGenShot("");
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  function imageStale(s: Shot) {
    return !!s.imagePath && s.imageSnapshot !== undefined && s.imageSnapshot !== shotContentKey(s);
  }
  function voiceStale(s: Shot) {
    const line = p!.voiceover.find((v) => v.shotId === s.id);
    return !!line && s.voiceoverSnapshot !== undefined && s.voiceoverSnapshot !== shotContentKey(s);
  }
  function hasVoice(s: Shot) {
    return p!.voiceover.some((v) => v.shotId === s.id && v.text);
  }

  const ipList = settings?.ips?.length ? settings.ips : [{ id: "xiaohei", name: "小黑", description: "" }];
  const ipName = ipList.find((i) => i.id === (p.ipId ?? settings?.activeIpId))?.name || "小黑";
  const projectStyleId = p.styleId ?? settings?.styleId ?? "xiaohei";

  async function setProjectMeta(patch: { styleId?: string; ipId?: string; aspectRatio?: string }) {
    setP({ ...p!, ...patch });
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
  }

  function startEditSrc() {
    setDraftTitle(p!.title);
    setDraftContent(p!.content);
    setEditSrc(true);
  }

  async function saveSource() {
    setBusy("/source");
    setError("");
    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draftTitle, content: draftContent })
    });
    const json = await res.json();
    setBusy("");
    if (!res.ok) {
      setError(json.error || "保存失败");
      return;
    }
    setP(json);
    setEditSrc(false);
  }

  return (
    <>
      <h1>{p.title}</h1>
      <div className="row" style={{ marginBottom: 14, gap: 8 }}>
        <span className="muted" style={{ flex: "none" }}>配图风格</span>
        <select
          value={projectStyleId}
          onChange={(e) => setProjectMeta({ styleId: e.target.value })}
          style={{ width: 180 }}
        >
          {STYLE_PRESETS.map((sp) => (
            <option key={sp.id} value={sp.id}>{sp.name}</option>
          ))}
          {projectStyleId === CUSTOM_STYLE_ID && <option value={CUSTOM_STYLE_ID}>自定义</option>}
        </select>
        <span className="muted" style={{ flex: "none" }}>画幅</span>
        <select
          value={p.aspectRatio ?? "16:9"}
          onChange={(e) => setProjectMeta({ aspectRatio: e.target.value })}
          style={{ width: 220 }}
        >
          {ASPECT_OPTIONS.map((a) => (
            <option key={a.id} value={a.id}>{a.name} · {a.scene}</option>
          ))}
        </select>
        <span className="muted" style={{ flex: "none" }}>IP 角色</span>
        <select
          value={p.ipId ?? settings?.activeIpId ?? "xiaohei"}
          onChange={(e) => setProjectMeta({ ipId: e.target.value })}
          style={{ width: 160 }}
        >
          {ipList.map((ip) => (
            <option key={ip.id} value={ip.id}>{ip.name || "未命名 IP"}</option>
          ))}
        </select>
      </div>
      {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>文章原文</h2>
          <div className="row">
            {editSrc ? (
              <>
                <button className="primary small" onClick={saveSource} disabled={busy === "/source"}>
                  {busy === "/source" ? "保存中…" : "保存"}
                </button>
                <button className="small" onClick={() => setEditSrc(false)}>取消</button>
              </>
            ) : (
              <button className="small" onClick={startEditSrc}>编辑</button>
            )}
          </div>
        </div>
        {editSrc ? (
          <div style={{ marginTop: 12 }}>
            <label>标题</label>
            <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
            <label>正文</label>
            <textarea rows={10} value={draftContent} onChange={(e) => setDraftContent(e.target.value)} />
          </div>
        ) : (
          <p style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{p.content}</p>
        )}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ margin: 0 }}>分镜</h2>
          <div className="row">
            <button
              className="primary"
              onClick={() => api("/shots", "POST")}
              disabled={busy === "/shots"}
            >
              {busy === "/shots" ? "分析中…" : p.shots.length ? "重新生成 Shot List" : "生成 Shot List"}
            </button>
            {p.shots.length > 0 && (
              <button onClick={() => api("/shots", "PUT", { shots: p.shots })} disabled={busy === "/shots" || !!genShot}>
                保存修订
              </button>
            )}
            {p.shots.length > 0 && (
              <button onClick={generateAllImages} disabled={!!genShot}>
                {genShot
                  ? `生成中 ${p.shots.findIndex((s) => s.id === genShot) + 1}/${p.shots.length}…`
                  : "逐张生成全部配图"}
              </button>
            )}
          </div>
        </div>
        <p className="muted" style={{ marginBottom: 14 }}>
          修订分镜后点「保存修订」；配图或旁白与当前分镜内容不符时，对应镜头会标「已过期」
        </p>
        {p.shots.map((s, i) => {
          const vline = p.voiceover.find((v) => v.shotId === s.id);
          const open = openShot === s.id;
          const generating = genShot === s.id || s.imageStatus === "generating";
          return (
            <div className="shot" key={s.id}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row" style={{ gap: 8 }}>
                  <strong>镜头 {i + 1}</strong>
                  <span className="tag blue">{s.structure_type}</span>
                  {generating ? (
                    <span className="tag">配图生成中…</span>
                  ) : s.imageStatus === "error" ? (
                    <span className="tag red">配图失败</span>
                  ) : imageStale(s) ? (
                    <span className="tag red">配图已过期</span>
                  ) : s.imagePath ? (
                    <span className="tag green">配图就绪</span>
                  ) : (
                    <span className="muted">未生成配图</span>
                  )}
                  {voiceStale(s) ? (
                    <span className="tag red">旁白已过期</span>
                  ) : hasVoice(s) ? (
                    <span className="tag green">旁白就绪</span>
                  ) : (
                    <span className="muted">未写旁白</span>
                  )}
                </div>
                <button className="small" onClick={() => setOpenShot(open ? "" : s.id)}>
                  {open ? "收起" : "展开编辑"}
                </button>
              </div>
              <div className="row" style={{ marginTop: 10, alignItems: "flex-start" }}>
                {s.imagePath ? (
                  <a href={`/api/projects/${id}/images/${s.id}`} target="_blank" rel="noreferrer" style={{ flex: "none", width: 190 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/projects/${id}/images/${s.id}`} alt={`镜头${i + 1}`} style={{ display: "block" }} />
                  </a>
                ) : (
                  <div className="imgph" style={{ flex: "none", width: 190 }}>未生成配图</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{s.theme || "（未填主题）"}</div>
                  <div className="muted" style={{ marginTop: 4 }}>{s.xiaohei_action}</div>
                  {vline && vline.text && (
                    <div className="copybox" style={{ marginTop: 10, marginBottom: 0 }}>{vline.text}</div>
                  )}
                </div>
              </div>

              {open && (
                <div className="shotgrid" style={{ marginTop: 14 }}>
                  <div>
                    <label>配图</label>
                    {s.imagePath ? (
                      <a href={`/api/projects/${id}/images/${s.id}`} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/projects/${id}/images/${s.id}`} alt={`镜头${i + 1}`} />
                      </a>
                    ) : (
                      <div className="imgph">点下方按钮生成</div>
                    )}
                    <div className="row" style={{ marginTop: 10 }}>
                      <button
                        className="small"
                        onClick={() => api("/images", "POST", { shotId: s.id })}
                        disabled={!!genShot}
                      >
                        {generating ? "生成中…" : s.imagePath ? "重生成配图" : "生成配图"}
                      </button>
                      {imageStale(s) && <span className="muted">分镜已改动，建议重生成</span>}
                    </div>
                    {s.imageStatus === "error" && <div className="err">{s.error}</div>}
                    <label>旁白（对着图改，改完全局点「保存修改」）</label>
                    <textarea
                      rows={3}
                      value={vline?.text ?? ""}
                      onChange={(e) => updateVoiceover(s.id, e.target.value)}
                      placeholder={hasVoice(s) ? "" : "尚未生成旁白，可在上方「旁白」区统一生成"}
                    />
                    {voiceStale(s) && <div className="tag red" style={{ marginTop: 6 }}>这条旁白基于旧分镜，建议重新生成</div>}
                  </div>
                  <div>
                    <label>落点</label>
                    <input value={s.position} onChange={(e) => updateShot(i, { position: e.target.value })} />
                    <label>主题</label>
                    <input value={s.theme} onChange={(e) => updateShot(i, { theme: e.target.value })} />
                    <label>核心意思</label>
                    <textarea rows={2} value={s.core_idea} onChange={(e) => updateShot(i, { core_idea: e.target.value })} />
                    <label>{ipName}的动作</label>
                    <textarea rows={2} value={s.xiaohei_action} onChange={(e) => updateShot(i, { xiaohei_action: e.target.value })} />
                    <label>标注词（逗号分隔）</label>
                    <input value={s.labels.join("，")} onChange={(e) => updateShot(i, { labels: e.target.value.split(/[，,]/).filter(Boolean) })} />
                    <label>视觉元素（逗号分隔）</label>
                    <input value={s.elements.join("，")} onChange={(e) => updateShot(i, { elements: e.target.value.split(/[，,]/).filter(Boolean) })} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ margin: 0 }}>旁白</h2>
          <div className="row">
            <button
              className="primary"
              onClick={() => api("/voiceover", "POST")}
              disabled={busy === "/voiceover" || !p.shots.length}
            >
              {busy === "/voiceover" ? "撰写中…" : p.voiceover.length ? "重新生成旁白" : "生成旁白"}
            </button>
            {p.voiceover.length > 0 && (
              <button onClick={() => api("/voiceover", "PUT", { voiceover: p.voiceover })} disabled={busy === "/voiceover"}>
                保存修改
              </button>
            )}
          </div>
        </div>
        <p className="muted">逐条旁白在上方镜头卡片里展开编辑（旁边就是配图）；生成会覆盖全部旁白</p>
        {p.voiceoverTips && (
          <div className="copybox">
            <span className="tag blue">配音提示</span>
            {p.voiceoverTips}
          </div>
        )}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ margin: 0 }}>发布包</h2>
          <button className="primary" onClick={() => api("/publish", "POST")} disabled={busy === "/publish"}>
            {busy === "/publish" ? "策划中…" : p.publish ? "重新生成发布包" : "生成发布包"}
          </button>
        </div>
        <p className="muted">标题勾子 + 正文 + 标签 + 置顶评论</p>
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
    </>
  );
}
