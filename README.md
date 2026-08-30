# InkLine

> 文章进，短视频素材出——粘贴一篇文章，取回做一条短视频所需的全部素材：分镜脚本 → IP 插画 → 旁白文案 → 标题/正文/标签/置顶评论。
>
> Article in, short-video assets out: paste an article, get back a full asset pack — shot list → IP illustrations → voiceover script → publish package.

本地运行的 Web 应用（Next.js 14 + TypeScript），零外部数据库，数据全部落在本机 `data/` 目录。

名字由来：**墨线**——手绘**墨**线稿、流水**线**、分镜的**线**；英文名 InkLine = ink + line + pipeline。

## 它解决什么问题

做知识类短视频的常见流程是：看到一篇好文章 → 提炼观点 → 画配图（关键环节）→ 写旁白 → 写标题文案 → 录视频 → 发布。中间的素材生产环节高度重复，单篇耗时 2–4 小时。

InkLine 把这条流水线固化下来：**文章粘贴进来，五步走完，产出全部素材**。录音、剪辑、发布仍由你用顺手的第三方工具完成（剪映等）——那几步的判断质量高于自动化价值。远期会把字幕、音频、视频生成与合并逐步纳入流水线（见路线图）。

## 核心特性

- **文章输入**：粘贴文章标题 + 正文（URL 自动抓取导入在路线图中）
- **分镜（Shot List）**：AI 通读文章、提炼观点，找出值得配图的认知锚点，输出结构化分镜——落点、主题、核心意思、结构类型（前后对比 / 概念隐喻 / 闭环循环 / 过程分解）、主角动作、建议标注词。每个字段都可手工修订
- **配图（关键环节）**：按分镜逐张或批量生成插画，默认「小黑」IP 风格 DNA（纯白背景、手绘线稿、红橙蓝三色标注分工），风格可在设置页自定义；自定义 IP 角色与风格预设（科普风 / 商务风 / 电影风等）在路线图中
- **旁白**：按镜头生成 6–8 秒口播稿（兼作后期字幕文案），人设固化为「第一句陈述事实 + 第二句抖梗或反问」的冷幽默老兵，可直接改文案
- **发布包**：20 字内标题（六种钩子路线：反差 / 利益数字 / 悬念 / 对仗扎心 / 场景故事 / 痛点反常识）+ 百字正文 + 三层标签（核心 / 场景 / 情绪）+ 置顶评论引导，点击即复制
- **人工确认点**：每一步生成后停下来等你检查修订，不是黑箱一键流
- **OpenAI 兼容**：默认适配 OpenAI（`gpt-4o-mini` + `gpt-image-1`），改 Base URL 即可接入任何 OpenAI 兼容服务商（如硅基流动、DeepSeek 等，图像模型需支持 `/images/generations`）

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动（开发模式）
npm run dev
# 或 生产模式
npm run build && npm run start

# 3. 打开 http://localhost:3000
```

**首次使用**：打开「设置」页，填入 LLM 与图像模型的 API Key（默认 OpenAI，也可换成任意 OpenAI 兼容服务商的 Base URL + Key + 模型名）。

## 使用流程

```
新建项目（粘贴文章标题+正文）
   └─> ① 提炼观点，生成分镜 → 人工修订 → 保存
          └─> ② 逐张/批量生成插画（默认小黑 IP，风格可自定义）
                 └─> ③ 逐镜头生成旁白 = 后期字幕文案（可改写）
                        └─> ④ 生成发布包（标题/正文/标签/置顶评论，一键复制）
                               └─> 导入剪映等工具录音、合成、发布
```

## 项目结构

```
inkline/
├── app/
│   ├── page.tsx                  # 首页：项目列表 / 新建项目
│   ├── projects/[id]/page.tsx    # 项目工作台（五步流程）
│   ├── settings/page.tsx         # 设置：API 配置 + 风格 DNA
│   └── api/
│       ├── projects/             # 项目 CRUD
│       │   └── [id]/
│       │       ├── shots/        # 生成分镜
│       │       ├── images/       # 生成配图（含 [shotId] 文件服务）
│       │       ├── voiceover/    # 生成旁白
│       │       └── publish/      # 生成发布包
│       └── settings/             # 设置读写
├── lib/
│   ├── store.ts                  # JSON 数据层（projects / settings / images）
│   ├── llm.ts                    # OpenAI 兼容 LLM 调用 + JSON 容错解析
│   ├── images.ts                 # 图像生成（b64_json / url 双兼容）
│   └── prompts.ts                # 提示词模板库（分镜/配图/旁白/发布包）
├── data/                          # 运行时数据（不入库，含 API Key，勿提交）
│   ├── projects.json
│   ├── settings.json
│   └── images/<projectId>/<shotId>.png
└── PRD.md                         # 产品需求文档
```

## 技术栈

- **Next.js 14**（App Router）+ **React 18** + **TypeScript**
- **零外部依赖的数据层**：`data/` 目录下 JSON 文件 + PNG，无需数据库
- 无 UI 组件库，原生 CSS

## 路线图

- [x] **v0.1（MVP）**：文章输入 → 分镜 → 配图（默认小黑 IP）→ 旁白 → 发布包
- [ ] **v0.2 素材升级**：URL 导入文章；自定义 IP 角色（小黑只是默认，用户可创建自己的 IP）；风格预设（科普风 / 商务风 / 电影风等）
- [ ] **v0.3 成片环节**：旁白导出 SRT 字幕轨；TTS 配音选项；桥接本地视频合成工具（如 [WhiteBoard](https://github.com/gnipbao/whiteboard-video-engine)）实现图转片段与片段合并
- [ ] **v0.4 发布增强**：发布包多平台变体（抖音 / 视频号 / 小红书 / B 站差异化文案）

## 安全提示

- API Key 明文存储在 `data/settings.json`，该目录已被 `.gitignore` 排除——**请勿提交 `data/` 目录**，公开仓库前请确认
- 应用仅监听本机 localhost 使用，请勿暴露到公网（接口未做鉴权）

## 许可证

[MIT](./LICENSE)
