import { Settings } from "./store";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function callLLM(
  settings: Settings,
  messages: Msg[]
): Promise<string> {
  const { baseUrl, apiKey, model } = settings.llm;
  if (!apiKey) throw new Error("请先在「设置」页填写 LLM API Key");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages, temperature: 0.8 })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM 调用失败 ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM 返回内容为空");
  return content as string;
}

export function parseJsonBlock<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.search(/[[{]/);
  if (start > 0) text = text.slice(start);
  try {
    return JSON.parse(text) as T;
  } catch {
    const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (lastBrace > 0) {
      return JSON.parse(text.slice(0, lastBrace + 1)) as T;
    }
    throw new Error("无法解析模型返回的 JSON：" + raw.slice(0, 200));
  }
}
