# 数据来源与许可声明

本项目代码以 MIT 许可发布。内置文本与词典数据来自以下公开来源，遵循各自许可。

---

## 1. 英文文本

### Project Gutenberg（Public Domain）

本项目收录以下 12 部作品的片段（每段 55–190 词，按段落切分）：

| 作品 | 作者 | 编号 |
|---|---|---|
| The Aesop for Children | Aesop | 11339 |
| Alice's Adventures in Wonderland | Lewis Carroll | 11 |
| The Wonderful Wizard of Oz | L. Frank Baum | 55 |
| Peter Pan | J. M. Barrie | 16 |
| Anne of Green Gables | L. M. Montgomery | 45 |
| Treasure Island | Robert Louis Stevenson | 120 |
| The Adventures of Sherlock Holmes | Arthur Conan Doyle | 1661 |
| Frankenstein | Mary Shelley | 84 |
| Pride and Prejudice | Jane Austen | 1342 |
| A Tale of Two Cities | Charles Dickens | 98 |
| The Picture of Dorian Gray | Oscar Wilde | 174 |
| Moby Dick | Herman Melville | 2701 |

以上作品均已进入公有领域（Public Domain）。Project Gutenberg 商标的使用遵循其条款：
<https://www.gutenberg.org/policy/license.html>

每条文本的 `u` 字段记录来源编号，`lic` 字段记录许可。

### Simple English Wikipedia（CC BY-SA 3.0）

科普与知识类文本取自 Simple English Wikipedia，采用 CC BY-SA 3.0 许可。
<https://creativecommons.org/licenses/by-sa/3.0/>

每个条目取 1–3 段。条目按人工指定清单抓取（`scripts/wiki-refresh.mjs` 里的 `TITLES`），
不采用随机接口——早期用 `generator=random` 抓到过足球运动员小传、印度情景喜剧，
以及不适合出现在语言学习材料里的条目，已整批替换。

每条文本的 `u` 字段记录 `simple.wikipedia:<pageid>`。再分发时需保留署名并以相同方式共享。

---

## 2. 词典数据

### ECDICT（MIT License）

<https://github.com/skywind3000/ECDICT>

版权归 Lin Wei (skywind3000) 所有，MIT 许可。本项目使用其 `ecdict.csv` 与 `lemma.en.txt`，
从中筛选当代词频前 7200 词，并保留：音标、中英释义、柯林斯星级、考试标签、双词频排名、词形变化。

ECDICT 的释义数据综合自多个公开词典源，仅用于学习用途。

---

## 3. 字体

| 字体 | 许可 |
|---|---|
| JetBrains Mono | SIL Open Font License 1.1 |
| Lora | SIL Open Font License 1.1 |

字体文件位于 `public/fonts/`，通过 Fontsource 分发。

---

## 4. 图标

`design/icon.svg` 为本项目原创设计，随项目代码一同以 MIT 许可发布。

---

## 5. 内容处理说明

- 所有文本均经过去头尾（Gutenberg 元信息）、段落切分、长度筛选、非拉丁字符过滤。
- 未对原文做改写或删节以外的编辑；分级（lv 1–7）由词频覆盖率与平均句长计算得出，不代表原作者的意图。
- 维基条目额外做了四类清洗，只针对解析残留，不改语义：
  清掉 `== 小节标题 ==` 与 `''斜体''` 标记、丢弃罗列式段落、丢弃引文被切断的段落。
- 部分 19 世纪作品包含其时代背景下的表述，本项目未逐句审查，建议在教学场景中注意。
