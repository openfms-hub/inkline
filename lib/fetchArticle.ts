/** 抓取网页并抽取正文：用于「粘贴网址导入文章」 */

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ", "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"',
  "&#39;": "'", "&apos;": "'", "&ldquo;": "\u201c", "&rdquo;": "\u201d",
  "&hellip;": "…", "&mdash;": "\u2014", "&middot;": "·", "&bull;": "\u2022"
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

function stripToText(html: string): string {
  return decodeEntities(
    html
      // 段落级标签转换行
      .replace(/<(script|style|noscript|svg|iframe|form|nav|footer|header|aside)[\s\S]*?<\/\1>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<\/(p|div|section|article|h[1-6]|li|blockquote|tr)>/gi, "\n")
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r/g, "")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join("\n");
}

function extractMeta(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  return m ? decodeEntities(m[1]).trim() : null;
}

export type FetchedArticle = { title: string; content: string };

export async function fetchArticle(url: string): Promise<FetchedArticle> {
  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      }
    });
    clearTimeout(timer);
  } catch {
    throw new Error("抓取失败：网址无法访问（检查网址是否正确、是否需要登录/付费墙）");
  }
  if (!res.ok) throw new Error(`抓取失败：目标站点返回 HTTP ${res.status}`);

  const html = await res.text();

  // 标题优先级：og:title > twitter:title > <title> > <h1>
  const title =
    extractMeta(html, "og:title") ||
    extractMeta(html, "twitter:title") ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ||
    "未命名文章";

  // 正文优先级：<article> > main > body
  const articleHtml =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ||
    html;

  let content = stripToText(articleHtml);
  if (content.length < 200) {
    // 主体太短，可能正文在别处，退化到全文
    content = stripToText(html);
  }
  content = content.slice(0, 20000);

  if (content.length < 100) {
    throw new Error("抓取到的正文太短：该页面可能是纯脚本渲染，建议改为直接粘贴文章内容");
  }
  return { title: title.slice(0, 200), content };
}
