# 词醒 · TypeWake

> 一座文字沉睡的城市，你是记述者。打字 = 唤醒。你敲下的每一个词，都会变成你真正拥有的词。

英文打字训练游戏。**1179 篇分级英文文本**、**7200 词词典**、点词即查即听、连击共鸣、幽灵竞速、夜巡复习。

---

## 快速开始

```bash
npm install
npm run dev            # 浏览器 http://localhost:5183
npm run tauri:dev      # 桌面端开发模式（自动起 vite）
npm run tauri:build    # 打包安装程序（nsis / msi）
```

> 想直接跑现成的可执行文件：`src-tauri/target/release/typewake.exe`
> （约 4.3 MB，已内嵌全部文本与词库，双击即可）。

桌面端首次启动会在 `%APPDATA%\com.typewake.app\` 生成 `ready.json`，
内容形如 `{"articles":1179,"words":7200}`。**如果这个文件没出现，说明资源加载通路有问题**，
可以直接据此排查白屏。

首次运行需要数据。仓库已包含构建产物（`public/data/`），如需重新生成：

```bash
npm run data         # 下载公版书 + 维基百科，重建 1179 篇文本与 7200 词词库（约 2 分钟）
npm run icons        # 从 design/icon.svg 重新生成全平台图标
npm run translate    # 补齐句子译文（已完成全量；改语料时才需要重跑）
npm run names        # 重新统计专名表 public/data/names.json（改语料后需重跑）
npm test             # 一键全量校验：结构 + 内容 + 界面 + 语音（改代码或数据后都跑这个）
npm run test:data    # 只跑数据层（结构 + 质检）
npm run test:daily   # 只跑每日卷轴（确定性 / 连续 / 预告）
npm run test:report  # 只跑体检报告（统计与诊断）
npm run test:cloze   # 只跑阅读填空（出题 / 判定 / 回写）
npm run audit:cloze  # 对 1179 篇全量生成填空，检查不变量
npm run verify       # 只校验译文与句数对齐、无空句
```

---

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Zustand |
| 打字引擎 | 自研纯 TS，逐键直改 DOM，不触发 React 重渲染 |
| 桌面端 | Tauri 2（Rust 1.77+），WebView2 |
| 数据 | 静态 JSON 分片，全量本地化，断网可玩 |
| 音效 | WebAudio 实时合成（无音频资源，包体 0 增长） |
| 语音 | Web Speech API，本地零延迟 |

---

## 目录

```
src/
  engine/TypingEngine.ts   打字引擎（纯逻辑，零 DOM 依赖）
  components/TextStage.tsx 文字舞台（ref 直改 DOM + 命令式光标同步）
  components/WordCard.tsx  查词卡片
  screens/                 地图 / 打字 / 结算 / 夜巡 / 藏书阁 / 阅读填空 / 体检报告
  lib/data.ts              词库索引、词形归一、i+1 推荐
  lib/store.ts             进度持久化、掌握度模型、SRS
  lib/native.ts            Tauri 桥（浏览器下自动降级）
  lib/split.js             切句规则（唯一实现，脚本侧也 import 这一份）
  lib/cloze.js             填空生成（选词 / 挖空 / 判定），脚本侧可直测
src-tauri/
  src/lib.rs               Rust 命令：进度读写 / 导出 / 运行记录
  icons/                   全平台图标（由 design/icon.svg 生成）
scripts/
  build-data.mjs           数据流水线（语料 / 词库 / 分级）
  build-icons.mjs          图标栅格化 + ico/icns 打包
  build-names.mjs          从语料统计专名表 public/data/names.json
  next-batch.mjs           导出待译批次到 data/tr-inbox/
  import-tr.mjs            校验并合入译文（句数不符整批拒收）
  realign-tr.mjs           切句规则变更后修复译文对齐
  verify-tr.mjs            校验译文与句数对齐（npm run verify）
  test-all.mjs             统一测试入口（npm test）：结构 → 内容 → 界面 → 语音
  qa-tr.mjs                译文质检：10 类规则扫全量，导出复核批次（npm run qa）
  qa-sample.mjs            分层抽样，用于人工判断文风（npm run qa:sample）
  qa-quotes.mjs            引号规范化（npm run qa:quotes）
  audit-cloze.mjs          填空生成的全量体检（挖空规则是否合规）
  test-cloze.mjs           阅读填空端到端 / test-report.mjs 体检报告端到端
  e2e.mjs                  端到端测试（49 项）
  test-speech.mjs          语音取消行为测试（7 项）
design/
  icon.svg                 图标矢量源
docs/
  01-game-design.md        游戏设计文档
  02-ui-design.md          UI / UX 设计文档
  03-test-report.md        测试报告
  04-long-task-pipeline.md 长任务流水线（可复用到其它批量内容生成）
  05-translation-qa.md     译文质检报告（5446 句的检查方法与结论）
  mockup.html              高保真原型
```

---

## 玩法

1. **打字** —— 逐字符判定，错字原地变红但不位移，必须改对才能继续。
2. **连击** —— 每 30 连击触发一次"共鸣"：音高递进、左侧光带升高。打错只掉一层，不清零。
3. **查词** —— 点任意词出卡片，计时暂停；发音 <50ms。查过的词掌握度会被打回 25（承认不认识）。
4. **幽灵** —— 每条卷轴保存你最好一次的击键时间轴，下次一个光点按旧轨迹跑。
5. **推进** —— 文本按你的生词率推荐（目标 6%），7 个城区 A1.1 → C1，连续 8 条解锁下一区。
6. **夜巡** —— 到期词用打字作答：看中文打英文 / 听音写词 / 看英文释义打词。
7. **每日卷轴** —— 每天固定一篇（按日期确定性抽取，当天不变），完成后记录今日最好成绩、
   累积独立的「每日连续」天数，并预告明天那一篇的标题。
8. **阅读填空** —— 从文章里挖空（优先半熟词、避开专名、控制间距），在上下文里补全；
   提示三档（无 / 首字母 / 首字母+释义），完整提示档带焦点随动的整句中文译文；
   填错的词当晚自动进夜巡。
9. **体检报告** —— 一句话诊断（准确率 / 节奏 / 手速哪个是瓶颈）+ WPM 趋势 + 易错键对 + 反复打错的词 + 练习建议。
10. **文库** —— 1179 篇全部摊开，按来源分组、书内按原文顺序，标段号与已读星级；
    支持搜书名、按城区筛选。城市页只推荐一篇，文库才看得到全库。
11. **预习卡** —— 进正文前把本篇生词先考一遍：只给中文释义和首字母，要你回忆出英文，
    答错立刻亮答案。先测后学（pretesting effect），即使答错也能提高后续的记忆强度。
12. **记忆调度（FSRS）** —— 每个词有自己的难度与稳定度，间隔按遗忘曲线算，不再共用一张固定阶梯。
    词卡里能看到「记忆：3 周后复习 · 难度 5/10」。
13. **场景对话** —— 10 个真实场合（点单 / 值机 / 问路 / 看医生 / 面试 / 客服…），96 句手写口语。
    四种练法：**通读**（气泡 + 连播）→ **跟打**（照打你的台词）→ **背打**（只看中文回忆英文）
    → **跟读**（对着麦克风说，逐词判对）。判分不计较标点大小写，但错一个字母就算错；
    打错的词当晚进夜巡。跟读用浏览器自带的语音识别，桌面端不支持时自动降级为跟打。

---

## 数据来源与许可

| 来源 | 用途 | 许可 |
|---|---|---|
| [Project Gutenberg](https://www.gutenberg.org/)（12 部公版书） | 1112 段叙事文本 | Public Domain |
| [Simple English Wikipedia](https://simple.wikipedia.org/) | 67 段科普文本 | CC BY-SA 3.0 |
| [ECDICT](https://github.com/skywind3000/ECDICT) | 音标 / 中英释义 / 柯林斯星级 / BNC+当代词频 / 考试标签 / 词形变化 | MIT |

文本内容版权归原作者；Gutenberg 与维基百科内容遵循其各自许可，详见 `LICENSE-NOTICE.md`。

---

## 已知边界

- 移动端仅保证复习与浏览体验，打字为主桌面端设计。
- 语音走系统 TTS，音色取决于操作系统；生产环境应预烘焙单词音频（见设计文档 §5.4）。
- **句子译文已全量覆盖**：**1179 / 1179 篇（100%）**，七个城区，共 **5446 句**（`tr.json` 0.55 MB）。
  若改动语料需要重译：`scripts/next-batch.mjs` 导出批次 → 逐句翻译 →
  `scripts/import-tr.mjs <批次文件>` 合并（**会比对句数，不符直接拒收**）。
- **专名表**：`scripts/build-names.mjs` 从语料统计人名地名（192 个，1.7 KB），
  句子解析里跳过，避免把 `Matthew` 注成「马太福音」。改语料后需 `npm run names` 重跑。
- **每日卷轴**已实现，但只做了「本地确定性」这一半：按本地日期 + 当前城区抽一篇，当天固定。
  设计文档里写的「全球同一条 + 3 次机会 + 日榜」需要服务端才能成立，暂缓（无后端时限制次数
  只会让人扫兴，而拿不到任何可比性收益）。
- 排行榜在设计文档中，尚未实现（需要服务端）。
