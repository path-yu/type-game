import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '出行',
  items: [
    {
      id: 'petrol-station', name: '加油站自助加油', lv: 2, cefr: 'A2',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Pump four? Card at the pump or pay here?', '四号枪？机器刷卡还是进来付？'),
        L(0, 'At the pump, thanks. Does it take foreign cards?', '机器刷，谢谢。能刷外国卡吗？'),
        L(1, 'It should, but the one on the left is often out of order.', '应该能，但左边那台经常坏。'),
        L(0, 'Then I will use the middle one. Is diesel the black nozzle?', '那用中间那台。柴油是黑色油枪吗？'),
        L(1, 'Black is diesel, green is unleaded. Do not mix them.', '黑的是柴油，绿的是汽油。别加错。', '柴油车加汽油会直接报废，加油前一定确认颜色。'),
        L(0, 'Understood. Do you have screen wash?', '明白。有玻璃水吗？'),
        L(1, 'Aisle two, next to the oil.', '二号通道，机油旁边。'),
        L(0, 'I will grab one. Back in a minute.', '我去拿一瓶。马上回来。'),
      ],
      variants: [
        { tag: '自助加柴油', setting: '你租了辆车，第一次在这边加油。' },
        V('加满', '你想加满再还车。', {
          0: ['A full tank of diesel, please. I return the car tonight.', '加满柴油。我今晚还车。'],
          1: ['Pump six, then. It is the only one that takes cards quickly.', '那用六号。那台刷卡最快。'],
        }),
        V('洗车', '你想用洗车机。', {
          5: ['Does the car wash work after eight?', '洗车机八点后还能用吗？'],
          6: ['It closes with the shop. Last entry is seven thirty.', '跟店一起关。最后进入七点半。'],
        }),
        V('充气', '你要给轮胎打气。', {
          7: ['Is the air machine free?', '打气机免费吗？'],
        }),
        V('发票', '你要报销。', {
          6: ['Could I get a VAT receipt?', '能开增值税发票吗？'],
        }),
        V('卡被拒', '机器拒卡。', {
          2: ['It declined my card twice. Should I pay inside?', '拒了我两次。要进去付吗？'],
          3: ['Come inside. The machine here is more reliable.', '进来付吧。这台更靠谱。'],
        }),
      ],
      branches: [
        B(5, 'probe', '店员提醒你一个容易犯的错，你要确认',
          S('You are not putting petrol in a diesel car, are you?', '你不是要往柴油车里加汽油吧？'),
          [O(S('It is diesel. I checked the filler cap.', '是柴油。我看过油箱盖了。'), S('Then you are fine.', '那就没问题。')),
           O(S('Actually, I am not sure. How do I tell?', '其实我不确定。怎么看？'), S('The cap says it, and so does the rental sheet.', '油箱盖上写着，租车单上也有。'))]),
      ],
      phrases: [
        P('Card at the pump?', '机器刷还是进店付？', '自助加油的第一步。'),
        P('Black is diesel, green is unleaded.', '黑色柴油，绿色汽油。', '颜色记错就是发动机报废。'),
        P('A full tank, please.', '加满。', '还车前最常见的说法。'),
      ],
    },

    {
      id: 'campsite', name: '露营地入住', lv: 3, cefr: 'B1',
      roles: ['你', '营地管理'],
      lines: [
        L(1, 'How many nights?', '住几晚？'),
        L(0, 'Three. One tent, two people, no electric hook-up.', '三晚。一个帐篷，两个人，不要电源。'),
        L(1, 'Pitch eleven is free, by the trees.', '十一号营位空着，靠树那边。'),
        L(0, 'Are fires allowed?', '能生火吗？'),
        L(1, 'Only in the raised braziers, and not after ten.', '只能用架高的火盆，十点后不行。'),
        L(0, 'What time is check-out?', '几点退营？'),
        L(1, 'Eleven, but you can leave the car until two.', '十一点，但车可以停到两点。'),
        L(0, 'Good. Is there drinking water on site?', '好。营地有饮用水吗？'),
      ],
      variants: [
        { tag: '三晚无电源', setting: '你第一次露营，帐篷是借的。' },
        V('要电源', '你带了电锅。', {
          0: ['Actually, we do need a hook-up. Do you have one?', '其实我们需要电源。有吗？'],
          1: ['Pitch three and four have it. Three is taken, four is free.', '三号四号有。三号有人了，四号空着。'],
        }),
        V('房车', '你开房车。', {
          1: ['It is a camper van, not a tent. Do you take those?', '是房车，不是帐篷。你们收吗？'],
        }),
        V('洗澡', '你想知道淋浴。', {
          3: ['Are the showers free, or do we need tokens?', '淋浴免费还是买币？'],
          4: ['Tokens are fifty pence, from the shop before six.', '五毛一个币，六点前在店里买。'],
        }),
        V('带狗', '你带狗。', {
          6: ['We have a dog. Is that allowed on the pitches?', '我们带了狗。营位能带吗？'],
        }),
        V('天气', '预报有大风。', {
          7: ['The forecast says strong wind. Which pitches are sheltered?', '预报有大风。哪些营位背风？'],
        }),
      ],
      branches: [
        B(5, 'probe', '管理员问你的装备，你要如实说',
          S('What tent are you using? Some are not built for this wind.', '你们用什么帐篷？有些扛不住这个风。'),
          [O(S('A four-person dome. It has done two winters.', '四人圆顶帐。过了两个冬天。'), S('Then you are fine on eleven.', '那十一号没问题。')),
           O(S('A cheap one from a supermarket. Should we move?', '超市买的便宜货。要换个位置吗？'), S('Take pitch nine. It is behind the hedge.', '去九号。树篱后面挡风。'))]),
      ],
      phrases: [
        P('No electric hook-up.', '不要电源。', 'hook-up 是营地电源接口。'),
        P('Are fires allowed?', '能生火吗？', '野外用火先问。'),
        P('What time is check-out?', '几点退营？', '营地退营时间常比酒店早。'),
      ],
    },

    {
      id: 'museum-tour', name: '博物馆导览', lv: 3, cefr: 'B1',
      roles: ['你', '讲解员'],
      lines: [
        L(1, 'The tour starts in five minutes at the main desk.', '导览五分钟后在主服务台开始。'),
        L(0, 'How long does it run?', '讲多久？'),
        L(1, 'Forty-five minutes, then you can stay as long as you like.', '四十五分钟，之后想待多久都行。'),
        L(0, 'Is it included in the ticket?', '含在门票里吗？'),
        L(1, 'It is, but we ask for a small donation.', '含。不过我们会募一点捐款。'),
        L(0, 'Will we be walking a lot?', '要走很多路吗？'),
        L(1, 'Mostly standing. There is one flight of stairs.', '主要是站着。有一段楼梯。'),
        L(0, 'Good. I will join.', '好。我参加。'),
      ],
      variants: [
        { tag: '四十五分钟导览', setting: '你在博物馆大厅，看到导览牌。' },
        V('需要无障碍', '你推着婴儿车。', {
          5: ['Is there a step-free route? I have a pram.', '有无障碍路线吗？我推婴儿车。'],
          6: ['We use the lift. I will show you at the stairs.', '我们坐电梯。到楼梯那儿我指给你。'],
        }),
        V('听不懂', '你的英文还在学。', {
          2: ['Would you speak a little slower? I am still learning.', '能说慢一点吗？我还在学。'],
        }),
        V('私人讲解', '你想要单独讲解。', {
          0: ['Do you do private tours for two people?', '有两人起的私人讲解吗？'],
        }),
        V('孩子', '你带孩子。', {
          4: ['Is it suitable for a seven-year-old?', '适合七岁孩子吗？'],
        }),
        V('拍照', '你想拍照。', {
          7: ['Can I take photos inside, without flash?', '里面能拍照吗？不用闪光灯。'],
        }),
      ],
      branches: [
        B(5, 'offer', '讲解员提了一个安排，你要判断',
          S('We could start with the Egyptian room, if you prefer.', '如果你们愿意，可以先从埃及厅开始。'),
          [O(S('The Egyptian room is why I came. Yes, please.', '我就是为埃及厅来的。好。'), S('Then we will start there and work back.', '那从那儿开始，再往回走。')),
           O(S('Whatever the group wants. I am easy.', '看大家。我随和。'), S('Then we keep the usual route.', '那就按常规路线。'))]),
      ],
      phrases: [
        P('Is it included in the ticket?', '含在门票里吗？', '导览、语音器都可能另收费。'),
        P('Is there a step-free route?', '有无障碍路线吗？', 'step-free 是英式说法。'),
        P('Without flash.', '不用闪光灯。', '博物馆拍照的常见限制。'),
      ],
    },

    {
      id: 'currency-exchange', name: '换外币', lv: 3, cefr: 'B1',
      roles: ['你', '柜员'],
      lines: [
        L(1, 'How much would you like to change?', '要换多少？'),
        L(0, 'Three hundred pounds into euros.', '三百镑换欧元。'),
        L(1, 'The rate is one point one four, and commission is three pounds.', '汇率一点一四，手续费三镑。'),
        L(0, 'Is there a better rate for larger amounts?', '金额大有更好的汇率吗？'),
        L(1, 'Over five hundred, commission is waived.', '超过五百免手续费。'),
        L(0, 'Can I pay the commission by card?', '手续费能刷卡吗？'),
        L(1, 'You can, but the exchange itself is cash only.', '可以，但换汇本身只收现金。'),
        L(0, 'Then I will draw cash first.', '那我先取现。'),
      ],
      variants: [
        { tag: '三百镑换欧元', setting: '你出发前一周来换现金。' },
        V('换回剩余', '你旅行回来剩了欧元。', {
          0: ['I have two hundred euros left. Can I change them back?', '我还剩两百欧。能换回来吗？'],
          1: ['We buy at a lower rate, so you lose a little both ways.', '我们买入价更低，来回都会有一点损耗。'],
        }),
        V('小面额', '你想要零钱。', {
          4: ['Could I have some of it in tens and twenties?', '能给一部分十块和二十块的吗？'],
          5: ['I will mix it. Small notes are hard to get here.', '我给您配一下。这边小面额不好拿。'],
        }),
        V('旅行支票', '你带了旧式旅行支票。', {
          3: ['Do you still take traveller cheques?', '你们还收旅行支票吗？'],
        }),
        V('汇率', '你觉得汇率差。', {
          6: ['The rate seems worse than the one online.', '汇率比网上差。'],
          7: ['Online rates are for large amounts. This is the counter rate.', '网上是给大额的。这是柜台价。'],
        }),
        V('证件', '柜员要看证件。', {
          2: ['Do you need ID for this amount?', '这个金额要证件吗？'],
        }),
      ],
      branches: [
        B(5, 'offer', '柜员推荐一个方案，你要算清楚',
          S('If you take five hundred, the commission is waived and the rate is better.', '换五百的话免手续费，汇率也更好。'),
          [O(S('Then I will take five hundred. I will spend it anyway.', '那换五百。反正也要花。'), S('That is the cheaper way to do it.', '这样确实更划算。')),
           O(S('I do not want to carry that much cash.', '我不想带那么多现金。'), S('Then keep it to three hundred and pay the three pounds.', '那就三百，付三镑手续费。'))]),
      ],
      phrases: [
        P('Commission is three pounds.', '手续费三镑。', '换汇要同时问 rate 和 commission。'),
        P('Over five hundred, it is waived.', '超过五百免收。', 'waive 是免除。'),
        P('The exchange itself is cash only.', '换汇本身只收现金。', '卡只用来付手续费。'),
      ],
    },

    {
      id: 'sim-card', name: '买本地电话卡', lv: 2, cefr: 'A2',
      roles: ['你', '店员'],
      lines: [
        L(1, 'What do you need the SIM for?', '这张卡主要用来做什么？'),
        L(0, 'Data mostly. Ten days, and I use maps a lot.', '主要用流量。十天，我常用地图。'),
        L(1, 'This one has twenty gigabytes and covers the whole country.', '这张有二十个 G，全国覆盖。'),
        L(0, 'Does it include calls to Europe?', '包含打欧洲的电话吗？'),
        L(1, 'It does, but not to Asia.', '包含，但不含亚洲。'),
        L(0, 'How do I activate it?', '怎么激活？'),
        L(1, 'Put it in and restart. It works within ten minutes.', '插卡重启。十分钟内生效。'),
        L(0, 'And I keep my own number for messages?', '我原来的号码还能收短信吗？'),
      ],
      variants: [
        { tag: '十天流量卡', setting: '你落地机场，手机没有网。' },
        V('要打电话回国', '你需要打国际长途。', {
          0: ['I need to call China a few times. Which one covers that?', '我要打几次中国。哪种含这个？'],
          1: ['This one has three hundred international minutes.', '这种含三百分国际通话。'],
        }),
        V('eSIM', '你的手机没有卡槽。', {
          1: ['My phone only takes eSIM. Do you support that?', '我手机只能用 eSIM。你们支持吗？'],
          2: ['We do. Scan this code and it installs in a minute.', '支持。扫这个码，一分钟装好。'],
        }),
        V('热点', '你要共享给电脑。', {
          4: ['Can I use it as a hotspot for my laptop?', '能开热点给笔记本用吗？'],
        }),
        V('充值', '你想知道怎么续。', {
          6: ['How do I top it up if I run out?', '用完了怎么充值？'],
        }),
        V('覆盖', '你要去偏远地区。', {
          7: ['Will it work in the mountains? I am hiking for three days.', '山里能用吗？我要徒步三天。'],
        }),
      ],
      branches: [
        B(5, 'probe', '店员问你手机型号，你要确认兼容',
          S('Is your phone unlocked? A locked one will not take our SIM.', '你的手机是解锁的吗？锁网的用不了我们的卡。'),
          [O(S('It is unlocked. I bought it outright.', '是解锁的。我全款买的。'), S('Then we are fine.', '那就没问题。')),
           O(S('I am not sure. How can I check?', '我不确定。怎么查？'), S('Dial star hash zero six hash and restart.', '拨星号井号零六井号，然后重启。'))]),
      ],
      phrases: [
        P('Data mostly.', '主要用流量。', 'data 是移动数据。'),
        P('Does it include calls to Europe?', '含打欧洲的电话吗？', '国际通话包最容易踩坑。'),
        P('Is your phone unlocked?', '手机是解锁的吗？', '锁网机换卡不能用。'),
      ],
    },
  ],
};
