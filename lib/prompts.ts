import { Project, Settings, Shot } from "./store";
import { resolveIp, resolveStyleDna, resolveAspect } from "./presets";

export function buildShotListPrompt(project: Project, settings: Settings) {
  const ip = resolveIp(settings, project.ipId);
  const styleDna = resolveStyleDna(settings, project.styleId);
  return [
    {
      role: "system" as const,
      content:
        "你是一名给中文文章做插画配图策略的资深分镜师。你的工作是通读文章，找出值得配图的位置，输出结构化的 shot list。你必须遵守：1) 一篇 1000-1500 字的文章配 4-6 张图，不要平均铺，只打认知锚点；2) 跳过一句话转折段和纯情绪口号结尾——配图会掐断节奏；3) 结构类型限定：前后对比 / 概念隐喻 / 闭环循环 / 过程分解；4) 每张图只讲一个核心结构；5) 画面必须有一个明确的主角 IP 角色承担核心概念动作，不能只是装饰。输出必须是合法 JSON，不要输出任何解释文字。"
    },
    {
      role: "user" as const,
      content: `分析下面这篇文章，输出 shot list。

要求输出 JSON：
{"shots":[{"position":"放在哪一段之后，如：第1段后 / 论点三段后","theme":"这一张的主题，一句话","core_idea":"核心意思，一到两句口语化中文","structure_type":"前后对比|概念隐喻|闭环循环|过程分解","xiaohei_action":"画面主角（IP 角色「${ip.name}」：${ip.description}）在画面里执行的核心动作，写具体，必须是这个角色亲自做，不是别人做","labels":["建议印在图上的中文标注词，3-6个，每个不超过8字"],"elements":["建议出现的视觉元素，4-6个"]}]}

插画风格 DNA（生成画面时遵守）：${styleDna}

IP 角色：${ip.name} —— ${ip.description}

文章标题：${project.title}

文章正文：
${project.content}`
    }
  ];
}

export function buildImagePrompt(shot: Shot, settings: Settings, project?: Project) {
  const ip = resolveIp(settings, project?.ipId);
  const styleDna = resolveStyleDna(settings, project?.styleId);
  const aspect = resolveAspect(project?.aspectRatio);
  const labels = shot.labels.join(" / ");
  const elements = shot.elements.join(" / ");
  return `Generate one standalone Chinese article illustration with a ${aspect.composition}.

Visual style DNA:
${styleDna}

Recurring IP character required:
${ip.name} —— ${ip.description}
${ip.name} must perform the core conceptual action in person, not decorate the scene. Keep the character consistent and recognizable.

Theme:
${shot.theme}

Structure type:
${shot.structure_type}

Core idea:
${shot.core_idea}

Action ${ip.name} performs:
${shot.xiaohei_action}

Suggested elements:
${elements}

Chinese labels (use at most 5-8 of them, keep each very short):
${labels}

Constraints:
One image explains only one core structure. Keep the main subject around 40%-60% of the canvas. Keep a clean composition with generous negative space. Use short Chinese labels only, no long sentences. Do not write a title in the top-left corner. Do not write the structure type on the image. Do not make it a formal diagram, course slide, or dense explainer. It should be clear but not instructional, interesting but not childish. Follow the style DNA strictly for colors, linework and lettering.`;
}

export function buildVoiceoverPrompt(project: Project) {
  const shots = project.shots
    .map(
      (s, i) =>
        `镜头${i + 1}｜主题：${s.theme}｜画面：${s.xiaohei_action}｜标注：${s.labels.join("、")}`
    )
    .join("\n");
  return [
    {
      role: "system" as const,
      content:
        "你是短视频口播文案专家，人设是「行业内行的冷幽默老兵」：不喊不吵，梗藏在事实后面。每段口播都是「第一句陈述事实 + 第二句抖梗或反问」的结构，重音落在第二句。语言必须口语化，念出来不拗口，没有书面词。输出必须是合法 JSON，不要输出任何解释文字。"
    },
    {
      role: "user" as const,
      content: `为下面的视频镜头逐个写旁白。视频总长约 30-40 秒，每个镜头 6-8 秒（大约 35-55 个汉字），按画面内容写，观众是边看画面边听的。

输出 JSON：
{"lines":[{"shotId":"对应镜头的 id","text":"这个镜头的旁白，6-8秒口播量"}],"tips":"整体配音节奏提示，比如哪里断一拍、重音在哪，50字内"}

镜头列表（含各自 id）：
${shots}

文章标题：${project.title}

文章核心内容：
${project.content.slice(0, 1200)}`
    }
  ];
}

export function buildPublishPrompt(project: Project) {
  return [
    {
      role: "system" as const,
      content:
        "你是中文短视频平台的发布策划，擅长写勾子标题和发布文案。标题必须控制在 20 个汉字以内，走不同的钩子路线（反差、利益数字、悬念、对仗扎心、场景故事、痛点反常识）。正文少于 100 字。输出必须是合法 JSON，不要输出任何解释文字。"
    },
    {
      role: "user" as const,
      content: `为这个视频生成发布包。

输出 JSON：
{"titles":[{"text":"标题，20字内","route":"钩子路线，如：反差/利益数字/悬念/对仗扎心/场景故事/痛点反常识"}],"body":"发布正文，100字以内，结尾留一个互动钩子","tags":{"core":["核心标签3-4个"],"scene":["场景标签3-4个"],"mood":["情绪/话题标签3-4个"]},"comment":"发布后自己置顶的第一条评论，用来引导互动，50字内"}

视频主题：${project.title}

视频内容概要（五个镜头）：
${project.shots.map((s) => `${s.theme}：${s.core_idea}`).join("\n")}

旁白全文：
${project.voiceover.map((v) => v.text).join("\n")}`
    }
  ];
}
