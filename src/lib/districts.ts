export interface District {
  lv: number;
  name: string;
  cefr: string;
  desc: string;
}

export const DISTRICTS: District[] = [
  { lv: 1, name: '石阶巷', cefr: 'A1.1', desc: '寓言与日常短句' },
  { lv: 2, name: '灯火市集', cefr: 'A1.2', desc: '简单叙事' },
  { lv: 3, name: '钟楼区', cefr: 'A2', desc: '儿童文学与科普短篇' },
  { lv: 4, name: '雾港', cefr: 'B1', desc: '游记与新闻' },
  { lv: 5, name: '档案馆', cefr: 'B1+', desc: '传记与说明文' },
  { lv: 6, name: '星图台', cefr: 'B2', desc: '评论与社科' },
  { lv: 7, name: '无名塔', cefr: 'C1', desc: '文学与随笔' },
];

export const THEME: Record<string, string> = {
  fable: '寓言', novel: '小说', mystery: '推理',
  history: '历史', geo: '地理', science: '科普', culture: '文化',
};
