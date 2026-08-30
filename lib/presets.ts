import { Settings, Shot } from "./store";

export type StylePreset = { id: string; name: string; dna: string };
export type IpProfile = { id: string; name: string; description: string };

export type AspectOption = {
  id: string;
  name: string;
  /** 画幅面向的投放场景 */
  scene: string;
  /** 图像接口实际请求的像素尺寸（模型仅支持 3:2 / 1:1 档位，按画幅就近映射） */
  size: string;
  /** 注入提示词的构图描述 */
  composition: string;
};

export const ASPECT_OPTIONS: AspectOption[] = [
  {
    id: "16:9",
    name: "16:9 横版",
    scene: "B站 / YouTube",
    size: "1536x1024",
    composition: "wide horizontal landscape composition (widescreen)"
  },
  {
    id: "9:16",
    name: "9:16 竖版",
    scene: "抖音 / 视频号 / 小红书",
    size: "1024x1536",
    composition: "tall vertical portrait composition (phone screen)"
  },
  {
    id: "1:1",
    name: "1:1 方形",
    scene: "图文 / 公众号",
    size: "1024x1024",
    composition: "square composition"
  }
];

/** 解析项目实际生效的画幅：项目没指定时缺省 16:9 */
export function resolveAspect(projectAspectRatio?: string): AspectOption {
  return ASPECT_OPTIONS.find((a) => a.id === projectAspectRatio) ?? ASPECT_OPTIONS[0];
}

/** 镜头内容指纹：生成配图/旁白成功时快照，之后分镜字段再改动即视为「过期」 */
export function shotContentKey(shot: Shot): string {
  return JSON.stringify([
    shot.theme,
    shot.core_idea,
    shot.structure_type,
    shot.xiaohei_action,
    shot.labels,
    shot.elements
  ]);
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "xiaohei",
    name: "小黑手绘风（默认）",
    dna: "纯白背景，极简黑色手绘线稿，略微抖动的笔触，大量留白；点缀少量红/橙/蓝手写中文标注（红=问题与警告，橙=主路径与强调，蓝=补充说明）；怪诞但清爽，不是可爱吉祥物，也不是商业矢量图。"
  },
  {
    id: "kexue",
    name: "科普风",
    dna: "扁平矢量科普图解风：干净的大色块、圆润几何造型、清晰的信息层级；配色限定蓝/橙/绿三色系，背景纯白或浅色；中文标注用规整的无衬线小字，像教科书里的图解；信息准确优先，不带手绘笔触，不画卡通风。"
  },
  {
    id: "shangwu",
    name: "商务风",
    dna: "专业商务咨询插画风：类似顶级咨询公司图表与财经杂志插画的气质；克制的蓝灰主色加一个强调色；几何构成、等距视角元素、粗细线条搭配；角色姿态专业、简化为剪影感；中文标注用利落的无衬线体；克制、理性、留白多，不用卡通元素。"
  },
  {
    id: "dianying",
    name: "电影风",
    dna: "电影感叙事插画：宽银幕式构图、戏剧性光影（单侧强光、剪影、逆光）；低饱和电影调色（青橙对比或黑白加单强调色）；主角以剪影或半剪影出现在场景里执行核心动作，像剧照的一帧；中文标注少而克制，像字幕一样排在画面下方或角落；氛围优先，细节让位于情绪。"
  },
  {
    id: "jianyi",
    name: "极简线稿风",
    dna: "极简单色线稿：只用黑色细线，无色块无灰阶；构图大量留白，线条自信、干净；只允许一个强调色（红色）出现在最关键的元素上；中文标注手写小字，数量极少；像一张克制到极致的底稿。"
  }
];

export const CUSTOM_STYLE_ID = "custom";

export const DEFAULT_IP: IpProfile = {
  id: "xiaohei",
  name: "小黑",
  description:
    "一只实心黑色的小怪东西：白点眼睛、细腿、面无表情、轮廓略歪的手绘体型；气质是严肃的死面瘫，怪诞但不卖萌，负责执行画面里的核心概念动作。"
};

export function getStylePreset(id?: string): StylePreset | undefined {
  return STYLE_PRESETS.find((s) => s.id === id);
}

export function styleName(id?: string): string {
  if (id === CUSTOM_STYLE_ID) return "自定义";
  return getStylePreset(id)?.name ?? "小黑手绘风（默认）";
}

/** 解析项目实际生效的风格 DNA：项目没指定时回落到全局设置 */
export function resolveStyleDna(settings: Settings, projectStyleId?: string): string {
  const id = projectStyleId ?? settings.styleId ?? DEFAULT_IP.id;
  const preset = getStylePreset(id);
  if (preset) return preset.dna;
  // 自定义 / 未匹配：优先用已保存的 styleDna
  return settings.styleDna || STYLE_PRESETS[0].dna;
}

/** 解析项目实际生效的 IP：项目没指定时回落到全局设置 */
export function resolveIp(settings: Settings, projectIpId?: string): IpProfile {
  const ips = settings.ips?.length ? settings.ips : [DEFAULT_IP];
  return (
    ips.find((i) => i.id === (projectIpId ?? settings.activeIpId)) ||
    ips.find((i) => i.id === DEFAULT_IP.id) ||
    ips[0]
  );
}
