# 测试报告

> 测试日期：2026-11-01 · 环境：Windows 11 · Node 22.22 · Rust 1.99.1 · Chrome 无头（puppeteer-core）

## 怎么跑

```bash
npm run build          # 构建前端
npx vite preview --port 4173    # 起预览服务
npm test               # 端到端测试（46 项断言）
npm run test:growth    # 连打 6 轮，验证词汇量增长曲线
```

---

## 一、端到端测试（46 项，全部通过）

脚本：`scripts/e2e.mjs`。真实浏览器、真实键盘事件、真实 DOM 断言，不是 mock。

| 分组 | 覆盖内容 | 结果 |
|---|---|---|
| 地图 / 数据加载 | 7 城区渲染、初始解锁状态、推荐卡片内容、生词数与目标 WPM | 5/5 |
| 打字判定 | 正确字符变暗、连击累加、**错字不推进**、连击掉层、改对清除错误、退格回退、光带触发 | 9/9 |
| 查词卡片 | 点词弹卡、音标、中文释义、发音按钮、收藏按钮、**计时暂停**、打字被拦截、Esc 关闭、计时恢复 | 9/9 |
| 结算 | 进入结算页、WPM 计算、准确率/一致性、星级、新词面板、可点击发音、城区进度、出口按钮 | 8/8 |
| 持久化 | localStorage 写入、掌握度记录（41 词）、条目计数、累计时长 | 4/4 |
| 幽灵竞速 | 击键时间轴落盘 | 1/1 |
| 夜巡复习 | 页面渲染、逐字回显、错字标红 | 3/3 |
| 藏书阁 | 卡片渲染、词汇量数字、筛选标签、Tier 分层条 | 4/4 |
| 刷新保持 | 刷新后进度不丢、顶栏统计更新 | 2/2 |

**运行时错误：0**（除一个 favicon 404，已修）。

## 二、学习曲线测试

脚本：`scripts/growth.mjs`，同一个新档案连打 6 条卷轴：

```
起始: 1000 词
第 1 轮: 8793 WPM · 3星 · 掌握 1008 词
第 2 轮: 7760 WPM · 3星 · 掌握 1014 词
第 3 轮: 8745 WPM · 3星 · 掌握 1016 词
第 4 轮: 10161 WPM · 3星 · 掌握 1020 词
第 5 轮: 7141 WPM · 3星 · 掌握 1026 词
第 6 轮: 7762 WPM · 3星 · 掌握 1030 词
```

（WPM 是机器输入速度，无参考价值；关键是**词汇量每轮都在涨**，且涨速由文本难度决定——A1.1 的文本里本来就没多少生词，符合"生词率 6%"的设计。）

---

## 三、测试中发现并修复的问题

这一轮测试抓到 11 个真实缺陷，其中 4 个是"功能看着对、其实废了"的隐性 bug：

| # | 问题 | 根因 | 修法 |
|---|---|---|---|
| 1 | **词汇量永远卡在 999，打了 10 篇也不动** | 掌握度只对"本局新词"累加，且新词初值从 0 起算，反而把 Tier1 词的先验值打低 | 改为对全文每个词累加，并以词频先验做初值 |
| 2 | 词汇量增长太慢，一篇只涨 2–3 词 | 首次 +12 / 之后 +4，Tier3 词要打 11 遍才"会" | 改为 +30 / +15 / +6 |
| 3 | 打对一次的词被排到 75 天后复习 | 稳定度用了掌握度推算 | 改为按"正确产出次数"算，一次→1 天 |
| 4 | 极短文本 WPM 显示 0 | `elapsed < 400ms` 直接返回 0 | 改成分母下限 500ms |
| 5 | 打错的词当晚进不了夜巡 | `due` 统一设为明天 | 错词 `due` 设为当天 |
| 6 | **桌面端本地存档从未生效** | 只探测 `__TAURI_INTERNALS__`，未开 `withGlobalTauri` | 双入口探测 + 开启 `withGlobalTauri` |
| 7 | 长按字母可以连续刷字 | 未拦截 `event.repeat` | 拦截 |
| 8 | 地图当前城区的光晕变成实心大圆 | CSS 关键帧的 `opacity` 覆盖了 SVG 的 `opacity` 属性 | 重写关键帧，透明度区间改为 0.05–0.14 |
| 9 | 词卡释义挤成一行 | ECDICT 里存的是**字面量 `\n`**（反斜杠+n），不是真换行 | 正则同时处理 `\n` 与 `\\n`，并过滤 `[计]` 术语行 |
| 10 | `tauri build` 在 schemars 处编译失败 | build-dependencies 与 dependencies 的特性分开解析，schemars 用的 indexmap 1.x 缺 `std` 特性 | 在 `[build-dependencies]` 显式开 std |
| 11 | tauri 与 tauri-runtime 版本错配 | 一次 `cargo update --precise` 连带降级了 tauri | `cargo update` 重新对齐 |

---

## 四、未覆盖 / 已知限制

- **语音**：走系统 Web Speech API，无头浏览器无法验证实际发声，只能验证按钮与调用路径。生产环境应改为预烘焙音频。
- **音效**：WebAudio 实时合成，测试环境静音，未做听感验证。
- **幽灵光标的视觉同步**：已验证时间轴落盘与索引计算，未做逐帧视觉比对。
- **移动端布局**：未测。
- **多档压力**：未做 1000 篇全量切换的性能测试。
- **Tauri 桌面端**：已通过 `cargo build`（debug）启动验证；release 构建正在修复依赖问题，见下方状态。

## 五、桌面端状态（已打通）

| 项 | 状态 |
|---|---|
| `cargo check` | ✅ 通过 |
| `tauri build --debug --no-bundle` | ✅ 通过，产出 `src-tauri/target/debug/typewake.exe` |
| 进程启动 | ✅ 启动后持续存活，WebView2 子进程正常创建 |
| **前端加载** | ✅ 通过：前端在数据加载完成后回写 `ready.json` |
| **数据读取** | ✅ `{"articles":1151,"words":7200}` —— 1151 篇文本、7200 词词典全部加载成功 |
| **Rust IPC** | ✅ `load_progress` / `report_ready` 两个命令均正常返回 |

`ready.json` 落在 `%APPDATA%\com.typewake.app\`。这个文件是前端在 `loadCorpus()` 成功之后
通过 `invoke('report_ready', ...)` 写下的，所以它同时证明了四件事：
内嵌资源可加载、JS 正常执行、Tauri 自定义协议下 `fetch('./data/*.json')` 可用、IPC 通道畅通。

### 排障过程（三轮）

1. **Rust 工具链损坏** —— sysroot 里 `libcore-*.rmeta` 丢失，连 hello world 都编不过。
   由于清单仍标记为"已安装"，`rustup toolchain install --force` 不生效。
   通过补一个占位文件绕过清单校验 → `component remove rust-std` → `component add rust-std` 重装解决。

2. **`schemars` 编译失败** —— `tauri-build` 的传递依赖 `schemars 0.8` 用 `indexmap 1.x` 且关掉了
   default features，导致 `IndexMap<K, V, S = RandomState>` 的默认泛型消失。
   关键点：**build-dependencies 与 dependencies 的 feature 是分开解析的**，
   必须加在 `[build-dependencies]` 里才生效。

3. **调试版窗口全白** —— `cargo build` 产出的是指向 `devUrl` 的调试壳，不会内嵌前端资源，
   所以窗口空白、dev server 一个请求都收不到。改用 `tauri build`（会内嵌 `dist/`）后正常。

### 运行方式

```bash
npm run tauri:dev      # 开发模式（自动起 vite）
npm run tauri:build    # 打包安装程序（nsis / msi）
```

### 已知限制

- 无头环境无法截取原生窗口画面，因此桌面端验证依赖 `ready.json` 这类"信号性产物"而非截图。
- WebView2 的 `--remote-debugging-port` 在本机被忽略，无法用 CDP 直接操作桌面窗口内的 DOM。
