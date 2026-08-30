import { Settings } from "./store";

export async function generateImage(
  settings: Settings,
  prompt: string
): Promise<string> {
  const { baseUrl, apiKey, model, size } = settings.image;
  if (!apiKey) throw new Error("请先在「设置」页填写图像 API Key");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, prompt, size, n: 1 })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`图像生成失败 ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const item = json?.data?.[0];
  if (item?.b64_json) return item.b64_json as string;
  if (item?.url) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) throw new Error("下载生成图片失败");
    const buf = Buffer.from(await imgRes.arrayBuffer());
    return buf.toString("base64");
  }
  throw new Error("图像接口未返回 b64_json 或 url");
}
