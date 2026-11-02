/**
 * 书名的中文对照。
 *
 * 数据里存的是英文原名（Gutenberg 的书名、维基的条目标题），因为那是原文出处，
 * 也是搜索和去重的依据。界面上一律显示中文，英文名留在旁边做副标 ——
 * 学英语的人需要知道这本书原文叫什么，但他先要认得出这是哪本书。
 *
 * 加新书时不用改这里，没译名的会退回英文原名。
 */
export const BOOK_ZH: Record<string, string> = {
  // —— 长篇公版书 ——
  'The Aesop for Children': '伊索寓言',
  'The Wonderful Wizard of Oz': '绿野仙踪',
  "Alice's Adventures in Wonderland": '爱丽丝梦游仙境',
  'Peter Pan': '彼得·潘',
  'Treasure Island': '金银岛',
  'The Adventures of Sherlock Holmes': '福尔摩斯探案集',
  'Anne of Green Gables': '绿山墙的安妮',
  'The Picture of Dorian Gray': '道林·格雷的画像',
  'Pride and Prejudice': '傲慢与偏见',
  'A Tale of Two Cities': '双城记',
  'Moby Dick': '白鲸',
  'Frankenstein': '弗兰肯斯坦',
  'The Call of the Wild': '野性的呼唤',
  'A Christmas Carol': '圣诞颂歌',
  'Black Beauty': '黑骏马',
  'The Railway Children': '铁路边的孩子们',
  'The Story of Doctor Dolittle': '怪医杜立德',
  'The Thirty-Nine Steps': '三十九级台阶',
  'The Time Machine': '时间机器',
  'Little Women': '小妇人',

  // —— 维基条目 ——
  'Volcano': '火山',
  'Silk Road': '丝绸之路',
  'Coral reef': '珊瑚礁',
  'Amazon River': '亚马孙河',
  'Chess': '国际象棋',
  'Origami': '折纸',
  'Antarctica': '南极洲',
  'Steam engine': '蒸汽机',
  'Moon': '月球',
  'Sahara': '撒哈拉沙漠',
  'Jazz': '爵士乐',
  'The Castle (movie)': '城堡（电影）',
  'Slow Food': '慢食运动',
  'Patina': '包浆',
  'Monowi, Nebraska': '莫诺维（内布拉斯加州）',
  'Computer Misuse Act 1990': '1990 年《计算机滥用法》',
  'Late Bronze Age collapse': '青铜时代晚期崩溃',
  'Botanical Garden of Curitiba': '库里提巴植物园',
  'Honey bee': '蜜蜂',
  'Printing press': '印刷机',
  'Photosynthesis': '光合作用',
  'Great Wall of China': '长城',
  'Wheel': '轮子',
  'Solar System': '太阳系',
  'Leptodactylus podicipinus': '细趾蟾（学名）',
  'Snake River Plain': '斯内克河平原',
  'Parliament of Bangladesh': '孟加拉国议会',
  'Associate degree': '副学士学位',
  'Motion Picture Association': '美国电影协会',
  '2013 Australian federal election': '2013 年澳大利亚联邦大选',
  'Seed drill': '播种机',
  'Tea': '茶',
};

/** 中文名；没有译名就退回英文原名，不至于显示空白 */
export function bookZh(title: string): string {
  return BOOK_ZH[title] ?? title;
}

/** 中文名和原名不同才需要并列显示英文，否则会重复两遍一样的字 */
export function bookHasZh(title: string): boolean {
  const zh = BOOK_ZH[title];
  return !!zh && zh !== title;
}

/** 搜索时中英文都要能命中 */
export function bookMatches(title: string, q: string): boolean {
  if (!q) return true;
  const k = q.trim().toLowerCase();
  return title.toLowerCase().includes(k) || bookZh(title).toLowerCase().includes(k);
}
