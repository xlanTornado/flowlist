# FlowList

轻量、离线、高颜值的 Windows 待办清单桌面应用。

## 特性

- **三栏布局** — 清单列表 / 任务列表 / 详情编辑，一目了然
- **多清单** — 支持创建多个清单，不同颜色区分
- **优先级** — P1 紧急 / P2 重要 / P3 普通 / P4 低优先
- **截止日期 & 提醒** — 到期高亮警示，Windows 原生 Toast 通知
- **重复任务** — 每天 / 每周 / 每月 / 工作日 / 每年
- **子任务** — 支持两级嵌套，逐步拆解
- **标签系统** — 自定义标签，灵活筛选
- **拖拽排序** — 自由调整任务顺序
- **今日视图** — 聚合当天到期任务
- **全文搜索** — 快速定位任务
- **深色模式** — 一键切换，跟随系统
- **统计面板** — 完成率趋势、周热力图、清单分布
- **本地存储** — SQLite，纯离线，数据完全在本地
- **数据导出** — JSON 格式导入 / 导出
- **系统托盘** — 关闭窗口即最小化到托盘
- **全局快捷键** — `Ctrl+Shift+N` 快速新建，`Ctrl+Shift+T` 今日视图

## 技术栈

| 层面 | 技术 |
|------|------|
| 桌面框架 | Tauri v2 |
| 前端 | React 19 + TypeScript + Tailwind CSS v4 |
| 状态管理 | Zustand |
| 本地存储 | SQLite (tauri-plugin-sql) |
| 打包 | MSI 安装包 / 便携版 exe |

## 开发

```bash
# 安装依赖
bun install

# 启动前端开发服务器
bun run dev

# 启动完整 Tauri 开发环境
bun run tauri dev

# 构建
bun run tauri build
```

## 构建要求

- [Rust](https://rustup.rs/)
- [Bun](https://bun.sh/) 或 Node.js / pnpm
- Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/zh-hans/downloads/) (C++ 桌面开发)
- Linux: `webkit2gtk-4.1`、`gtk3`、`openssl`

## 项目结构

```
src/                 # React 前端
├── components/      # UI 组件
├── stores/          # Zustand 状态
├── lib/             # SQLite 数据层
├── hooks/           # 自定义 Hooks
├── types/           # TypeScript 类型
└── styles/          # 全局样式
src-tauri/           # Tauri/Rust 后端
├── src/
│   ├── lib.rs       # 插件注册、系统托盘、数据库迁移
│   └── main.rs      # 入口
├── capabilities/    # 权限配置
└── icons/           # 应用图标
```

## License

MIT
