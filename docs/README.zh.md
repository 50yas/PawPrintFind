<div align="center">

[← English](../README.md)

<img width="1400" alt="PawPrintFind Banner" src="../assets/banner.png" />

# PawPrintFind

**AI 驱动的宠物寻找与社区救援平台**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pawprint--50.web.app-teal?style=for-the-badge&logo=firebase)](https://pawprint-50.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*借助 AI 与社区的力量，让走失的宠物回到家人身边。*

</div>

---

## PawPrintFind 是什么？

PawPrintFind 是一个由社区驱动的实时平台，利用人工智能帮助寻找走失宠物并协助其与家人团聚。用户可以发布宠物走失信息、记录附有 GPS 坐标的目击情况、获取 AI 自动匹配结果，并协调救援行动——所有功能集于一处。

**访问地址：** [https://pawprint-50.web.app](https://pawprint-50.web.app)

**官方网站：** [https://pawprintfind.com](https://pawprintfind.com)

---

## 功能特性

### 面向宠物主人
- **发布走失宠物信息**，附照片、描述及最后已知位置
- **AI 智能匹配** — 自动将目击记录与走失宠物报告进行关联
- **实时目击提醒** — 有人发现您的宠物时即时推送通知
- **互动地图** — 展示目击点聚类与热力图
- **多语言支持** — 8 种语言（EN、IT、ES、FR、DE、ZH、AR、RO）

### 面向社区
- **骑手任务中心** — 志愿骑手参与宠物救援可获得业力积分
- **巡逻模式** — 为志愿救援人员提供 GPS 追踪巡逻
- **排行榜** — 社区业力排名，附徽章与等级系统
- **25 枚成就徽章** — 游戏化社区救援参与体验

### 面向兽医
- **认证兽医仪表板** — 专为已认证诊所提供的专属界面
- **VetPro 订阅** — 通过 Stripe 结账获取高级工具
- **诊所注册** — 含管理员审核流程

### 面向收容所和救援机构
- **领养中心** — 展示可供领养的宠物
- **收容所管理仪表板** — 动物入住与状态追踪

### 平台能力
- **PWA（渐进式网页应用）** — 可安装，支持离线使用
- **Firestore 实时同步** — 所有连接客户端同步接收实时更新
- **管理员仪表板** — 企业级 7 标签页控制面板，涵盖数据分析、用户管理、财务、社区工具、AI 设置与审计日志
- **优惠券系统** — 订阅与徽章促销码
- **捐款追踪** — 支持 Stripe Webhook 及加密货币钱包

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 样式 | Tailwind CSS + Framer Motion + 玻璃拟态 |
| 后端 | Firebase（Firestore、Auth、Storage、Hosting） |
| 云函数 | Node.js 22 + TypeScript |
| AI | Google Gemini + OpenRouter（通过 aiBridgeService 抽象） |
| 支付 | Stripe（自定义云函数 + Extension 回退） |
| i18n | i18next + react-i18next（8 种语言） |
| PWA | Vite PWA Plugin + Workbox |
| 测试 | Vitest + @testing-library/react |
| 数据校验 | Zod schema，覆盖所有 Firestore 文档类型 |

---

## 架构

```
src/
├── components/         # UI 组件
│   ├── admin/          # 管理员仪表板标签页
│   ├── routers/        # 基于角色的视图路由
│   └── ui/             # 共享设计系统组件
├── hooks/              # 自定义 React Hooks
├── services/           # 服务层（Firebase Facade 模式）
│   ├── firebase.ts     # dbService Facade — 主 API 入口
│   ├── authService.ts  # 多提供商身份认证
│   ├── petService.ts   # 宠物 CRUD 及目击记录
│   ├── vetService.ts   # 兽医诊所与认证
│   ├── adminService.ts # 管理员操作与审计日志
│   ├── searchService.ts# AI 驱动宠物匹配
│   └── karmaService.ts # 游戏化与业力积分
├── contexts/           # React Context（语言、主题、Snackbar）
├── translations/       # TypeScript 翻译对象（8 种语言）
└── types.ts            # 中央类型定义（~50+ 接口）

public/locales/         # JSON 翻译文件（HttpBackend）
functions/src/          # Firebase 云函数（Node.js 22）
```

**路由：** 自定义视图路由系统（非 React Router）。`App.tsx` 通过 state 管理当前视图，并为 `owner`、`vet`、`shelter`、`volunteer`、`super_admin` 提供基于角色的路由。

---

## 快速开始

### 前置条件

- Node.js >= 22
- Firebase CLI：`npm install -g firebase-tools`
- 一个 Firebase 项目（[立即创建](https://console.firebase.google.com/)）

### 安装配置

```bash
# 1. 克隆仓库
git clone https://github.com/50yas/PawPrintFind.git
cd PawPrintFind

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入您的 API 密钥（所有必填变量见 .env.example）

# 4. 启动开发服务器
npm run dev
# 应用运行于 http://localhost:3000
```

### 环境变量

将 `.env.example` 复制为 `.env.local` 并填入您的凭据：

| 变量 | 说明 |
|------|------|
| `GEMINI_API_KEY` | Google Gemini API 密钥，用于 AI 功能 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe 公钥（测试或正式环境） |
| `VITE_FIREBASE_API_KEY` | Firebase 项目 API 密钥 |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase 认证域名 |
| `VITE_FIREBASE_PROJECT_ID` | Firebase 项目 ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase 存储桶 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase 消息发送者 ID |
| `VITE_FIREBASE_APP_ID` | Firebase 应用 ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics 测量 ID |

---

## 开发命令

```bash
npm run dev        # 启动开发服务器（端口 3000）
npm run build      # TypeScript 检查 + Vite 生产构建 → dist/
npm run lint       # 仅类型检查（tsc --noEmit）
npm run test       # 一次性运行所有测试（vitest run）
npx vitest --watch # 监听模式测试
```

---

## 部署

```bash
# 全量部署至 Firebase
npm run deploy

# 仅部署前端
firebase deploy --only hosting

# 仅部署云函数
firebase deploy --only functions

# 部署 Firestore 安全规则
firebase deploy --only firestore:rules

# 部署 Firestore 索引
firebase deploy --only firestore:indexes
```

---

## 支持 PawPrintFind

PawPrintFind 是一个开源社区项目。维持本平台每月大约需要 **€165** 的基础设施与 AI 推理费用。如果 PawPrintFind 对您有所帮助，或您认同我们的使命，请考虑为我们提供支持。

### 每月平台成本

| 资源 | 月费 |
|------|------|
| AI 推理（Gemini + OpenRouter） | €120.00 |
| 云基础设施（Firebase + GCP） | €45.00 |
| **合计** | **€165.00 / 月** |

---

### 银行卡捐款（Stripe）

通过 [Stripe](https://stripe.com) 进行安全的银行卡支付。在 [pawprint-50.web.app](https://pawprint-50.web.app) 点击爱心/捐款按钮，选择档位或自定义金额：

| 档位 | 金额 | 权益 |
|------|------|------|
| ☕ 咖啡 | €5 | 永久感谢 + 社区支持者徽章 |
| 🌟 支持者 | €25 | 含咖啡档所有权益 + 特别捐助者状态 + 新功能抢先体验 |
| 🦁 英雄 | €100 | 含支持者档所有权益 + 社区英雄徽章 + 功能直接提案权 + 个人致谢 |
| 自定义 | 任意金额（最低 €1） | 自由选择 |

所有银行卡捐款均通过安全的 Stripe 结账处理，您将收到电子邮件收据。

---

### 加密货币捐款

直接发送到我们的钱包地址——无中间商，即时到账：

**Bitcoin (BTC)**
```
bc1qwyyjx9xcf23h04rwd34ptepqurn2c6h4zqme55
```

**Ethereum (ETH)**
```
0x8e712F2AC423C432e860AB41c20aA13fe5b4DD04
```

**Solana (SOL)**
```
4Gt3VPbwWXsRWjMJxGgjuX8sVd7b2LX3nzzbbH7Hp7Uy
```

**BNB Chain (BNB)**
```
0x8e712F2AC423C432e860AB41c20aA13fe5b4DD04
```

您也可以在应用内的捐款弹窗中直接扫描二维码。

> 每一笔捐款——无论金额大小——都有助于维持平台运营，并支持新功能的开发，让更多宠物与家人重聚。

---

## 参与贡献

欢迎贡献代码！以下是参与方式：

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/我的功能`
3. 完成修改并编写测试
4. 运行测试套件：`npm test`
5. 提交 Pull Request

### 代码风格

- 启用 TypeScript strict 模式——非必要不使用 `any`
- 所有用户可见文本必须翻译（向全部 8 个语言文件添加对应 key）
- 遵循 service facade 模式——新的后端逻辑放入 service 文件，通过 `dbService` 暴露
- 所有新 Firestore 文档类型必须配置 Zod schema

### 添加新功能

详细的架构指导、路由约定和翻译系统文档，请参阅 `CLAUDE.md`。

---

## 许可证

MIT 许可证 — 详情见 [LICENSE](LICENSE)。

---

<div align="center">

为每一只值得回家的宠物，用心而作。

**[Live Demo](https://pawprint-50.web.app)** · **[提交 Bug](https://github.com/50yas/PawPrintFind/issues)** · **[功能建议](https://github.com/50yas/PawPrintFind/issues)**

</div>
