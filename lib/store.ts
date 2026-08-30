import fs from "fs";
import path from "path";

export type Shot = {
  id: string;
  position: string;
  theme: string;
  core_idea: string;
  structure_type: string;
  xiaohei_action: string;
  labels: string[];
  elements: string[];
  imageStatus: "idle" | "generating" | "done" | "error";
  imagePath?: string;
  error?: string;
};

export type VoiceoverLine = { shotId: string; text: string };

export type PublishPack = {
  titles: { text: string; route: string }[];
  body: string;
  tags: { core: string[]; scene: string[]; mood: string[] };
  comment: string;
};

export type Project = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  status: "draft" | "shots" | "images" | "voiceover" | "package";
  shots: Shot[];
  voiceover: VoiceoverLine[];
  voiceoverTips?: string;
  publish?: PublishPack;
};

export type Settings = {
  llm: { baseUrl: string; apiKey: string; model: string };
  image: { baseUrl: string; apiKey: string; model: string; size: string };
  styleDna: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
export const IMAGES_DIR = path.join(DATA_DIR, "images");

const DEFAULT_SETTINGS: Settings = {
  llm: {
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o-mini"
  },
  image: {
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-image-1",
    size: "1536x1024"
  },
  styleDna:
    "纯白背景，极简黑色手绘线稿，略微抖动的笔触，大量留白；主角是小黑：一只实心黑色的小怪东西，白点眼睛，细腿，面无表情，负责执行画面里的核心概念动作；点缀少量红/橙/蓝手写中文标注（红=问题与警告，橙=主路径与强调，蓝=补充说明）；怪诞但清爽，不是可爱吉祥物，也不是商业矢量图。"
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function listProjects(): Project[] {
  return readJson<Project[]>(PROJECTS_FILE, []);
}

export function getProject(id: string): Project | undefined {
  return listProjects().find((p) => p.id === id);
}

export function saveProject(project: Project) {
  const all = listProjects();
  const idx = all.findIndex((p) => p.id === project.id);
  if (idx >= 0) all[idx] = project;
  else all.push(project);
  writeJson(PROJECTS_FILE, all);
}

export function deleteProject(id: string) {
  writeJson(
    PROJECTS_FILE,
    listProjects().filter((p) => p.id !== id)
  );
  const dir = path.join(IMAGES_DIR, id);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
}

export function getSettings(): Settings {
  const saved = readJson<Partial<Settings>>(SETTINGS_FILE, {});
  return {
    llm: { ...DEFAULT_SETTINGS.llm, ...saved.llm },
    image: { ...DEFAULT_SETTINGS.image, ...saved.image },
    styleDna: saved.styleDna ?? DEFAULT_SETTINGS.styleDna
  };
}

export function saveSettings(settings: Settings) {
  writeJson(SETTINGS_FILE, settings);
}

export function saveImage(projectId: string, shotId: string, base64: string): string {
  const dir = path.join(IMAGES_DIR, projectId);
  ensureDir(dir);
  const file = path.join(dir, `${shotId}.png`);
  fs.writeFileSync(file, Buffer.from(base64, "base64"));
  return `/api/projects/${projectId}/images/${shotId}`;
}

export function readImageFile(projectId: string, shotId: string): Buffer | null {
  const file = path.join(IMAGES_DIR, projectId, `${shotId}.png`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file);
}
