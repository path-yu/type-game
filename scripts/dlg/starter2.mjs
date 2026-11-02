/**
 * 入门场景第二批（A1 / L1）：问时间、要点喝的、带走还是堂食、买票、寄信。
 *
 * 和 starter.mjs 同一套约束：一句 4–8 词、只用高频词、意外也用简单句。
 * 这五个场合的共同点是「一句话就能办完事」—— 第一次开口的人需要的正是这个。
 *
 * 骨架中段同样只放「换场合也成立」的通用句，变体只换首尾的问答。
 */
import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '出行',
  items: [
    /* ---------------- 问时间 ---------------- */
    {
      id: 'ask-time',
      name: '问时间和几点',
      lv: 1,
      cefr: 'A1',
      roles: ['路人', '你'],
      you: 1,
      variants: [
        { tag: '街上问时间', setting: '你没带手机，在街边想确认现在几点。' },
        V('问今天几号', '填表要写日期，你不确定今天几号。', {
          1: ['Sorry. What is the date today?', '抱歉。今天几号？'],
          2: ['It is the third.', '三号。'],
        }),
        V('问末班车', '天快黑了，你想知道最后一班车几点。', {
          1: ['Sorry. What time is the last bus?', '抱歉。末班车几点？'],
          2: ['At eleven. You still have time.', '十一点。你还有时间。'],
        }),
        V('问银行开门', '你周一要去银行，想知道它几点开门。', {
          1: ['Sorry. What time does the bank open?', '抱歉。银行几点开门？'],
          2: ['At nine, Monday to Friday.', '九点，周一到周五。'],
        }),
        V('问药房关门', '你下班赶去药房，怕它已经关了。', {
          1: ['Sorry. What time does the pharmacy close?', '抱歉。药房几点关？'],
          2: ['At seven. You have twenty minutes.', '七点。你还有二十分钟。'],
        }),
        V('问还要等多久', '你在站台等车，想知道下一班还有多久。', {
          1: ['Sorry. How long until the next train?', '抱歉。下一班车还有多久？'],
          2: ['About ten minutes.', '大概十分钟。'],
        }),
      ],
      lines: [
        L(0, 'Hello. Do you need help?', '你好。需要帮忙吗？'),
        L(1, 'Yes. What time is it?', '是的。现在几点？'),
        L(0, 'It is half past three.', '三点半。'),
        L(1, 'Thank you.', '谢谢。'),
        L(0, 'Anything else?', '还有别的吗？'),
        L(1, 'No, that is all.', '没有了。'),
        L(0, 'Okay. Have a good day.', '好。祝你今天顺利。'),
        L(1, 'You too. Thank you.', '你也是。谢谢。'),
      ],
      branches: [
        B(1, 'probe', '对方反问回来，你要说清楚只是问时间',
          S('Sorry, do you mean the time now?', '抱歉，你是问现在几点吗？'),
          [O(S('Yes. Just the time.', '对。就是现在几点。'), S('It is ten to four.', '差十分四点。')),
           O(S('Yes. And when the shop closes.', '对。还有商店几点关门。'), S('Six. It is on the door.', '六点。门上写着。'))]),
      ],
      phrases: [
        P('What time is it?', '现在几点？', '问时间最短的一句。'),
        P('When does it close?', '它几点关门？', '问营业时间用 does，问「你」什么时候用 do。'),
      ],
    },

    /* ---------------- 要点喝的 ---------------- */
    {
      id: 'water',
      name: '要点喝的',
      lv: 1,
      cefr: 'A1',
      roles: ['店员', '你'],
      you: 1,
      variants: [
        { tag: '只要一杯水', setting: '你不喝咖啡也不喝茶，只想喝口水。' },
        V('要两杯', '你和朋友一起，两杯都要水。', {
          1: ['Two waters, please.', '两杯水，谢谢。'],
          5: ['Two small ones, please.', '两个小杯的。'],
        }),
        V('只要热水', '天冷，你想喝热的。', {
          1: ['A hot water, please.', '一杯热水，谢谢。'],
          2: ['Just hot water? No tea?', '就要热水？不要茶？'],
          3: ['Yes. No ice, please.', '对。不要冰。'],
        }),
        V('要加柠檬', '你想要一杯加柠檬的水，但不知道要不要加钱。', {
          3: ['Still, with lemon. Is that extra?', '不带气的，加柠檬。要加钱吗？'],
          4: ['No, lemon is free. Large or small?', '不用，柠檬免费。大杯还是小杯？'],
          5: ['Small, please.', '小杯，谢谢。'],
        }),
        V('带走一杯冰水', '外面很热，你想带一杯冰水走。', {
          1: ['A cold water to go, please.', '一杯冰水带走。'],
          5: ['Large, please. It is hot today.', '大杯。今天太热了。'],
        }),
        V('再来一杯', '你喝完了，走过去想再要一杯。', {
          1: ['Another water, please.', '再来一杯水。'],
          5: ['Small again, please.', '再来一个小杯。'],
          6: ['That is another two pounds.', '那再加两镑。'],
        }),
      ],
      lines: [
        L(0, 'Hi. What can I get you?', '你好。要点什么？'),
        L(1, 'Just water, please.', '就要水，谢谢。'),
        L(0, 'Still or sparkling?', '不带气的还是带气的？'),
        L(1, 'Still, please.', '不带气的。', 'still water 是不带气的，不是「还」水。'),
        L(0, 'Large or small?', '大杯还是小杯？'),
        L(1, 'Small is fine.', '小杯就行。'),
        L(0, 'That is two pounds.', '两镑。'),
        L(1, 'Here you go. Thank you.', '给你。谢谢。'),
      ],
      branches: [
        B(1, 'cost', '对方说要收杯子钱，你要决定还要不要',
          S('A cup is one pound extra. Is that okay?', '杯子要加一镑。可以吗？'),
          [O(S('That is fine.', '可以。'), S('Thanks. Card or cash?', '谢谢。刷卡还是现金？')),
           O(S('Then no cup. I will drink here.', '那不要杯子。我在这儿喝。'), S('Good. Then it is free.', '好。那就不收费。'))]),
      ],
      phrases: [
        P('Just water, please.', '就要水，谢谢。', 'just 在这里是「只要」，点单时很常用。'),
        P('Is that extra?', '那个要另外加钱吗？', 'extra 指「额外收费」。'),
      ],
    },

    /* ---------------- 带走还是堂食 ---------------- */
    {
      id: 'takeout',
      name: '带走还是堂食',
      lv: 1,
      cefr: 'A1',
      roles: ['店员', '你'],
      you: 1,
      variants: [
        { tag: '带走', setting: '你赶时间，想拿了就走。' },
        V('堂食', '你有一天假，想坐下来吃。', {
          1: ['To eat in, please.', '在这儿吃。', 'eat in 是堂食，美式也说 for here。'],
          4: ['I will bring it to your table.', '我给您送到桌上。'],
          5: ['Thank you.', '谢谢。'],
        }),
        V('要个盒子打包', '你吃不完，想剩下的带走。', {
          5: ['Yes, please. And can I have a box?', '要袋子。另外能给我一个盒子吗？'],
          6: ['Sure. I will bring one.', '可以。我拿一个来。'],
        }),
        V('不要袋子', '你自己带了袋子，不想多拿一个。', {
          5: ['No bag, thanks. I have one.', '不要袋子，谢谢。我带了。'],
          6: ['Okay. Here is your food.', '好。这是您的东西。'],
        }),
        V('要餐具', '你带回酒店吃，需要一把叉子。', {
          5: ['Yes. And a fork, please.', '要袋子。另外给我一把叉子。'],
          6: ['Here you are. Anything else?', '给你。还有别的吗？'],
          7: ['No, thank you.', '没有了，谢谢。'],
        }),
        V('没听清', '店里有点吵，你没听清店员问什么。', {
          1: ['Sorry, what was that?', '抱歉，你说什么？'],
          2: ['Eat in or take away?', '在这儿吃还是带走？'],
          3: ['Take away, please.', '带走。'],
        }),
      ],
      lines: [
        L(0, 'Hi. Is that to eat in or take away?', '你好。在这儿吃还是带走？'),
        L(1, 'Take away, please.', '带走，谢谢。'),
        L(0, 'Okay. It will be five minutes.', '好。五分钟就好。'),
        L(1, 'That is fine. I will wait.', '没问题。我等。'),
        L(0, 'Do you want a bag?', '要袋子吗？'),
        L(1, 'Yes, please.', '要，谢谢。'),
        L(0, 'Here you are.', '给您。'),
        L(1, 'Thank you. Have a good day.', '谢谢。祝你今天顺利。'),
      ],
      branches: [
        B(3, 'change', '对方说你要的那个没有了，你要换一个',
          S('We are out of that one today.', '那个今天没有了。'),
          [O(S('Then the same thing, without sauce.', '那就要一样的，不加酱。'), S('Good. No sauce.', '好。不加酱。')),
           O(S('What else is quick?', '还有什么快的？'), S('The soup is ready now.', '汤现在就好。'))]),
      ],
      phrases: [
        P('Take away, please.', '带走，谢谢。', '英式说 take away，美式说 to go。'),
        P('How long will it take?', '要多久？', '问等待时间最通用的一句。'),
      ],
    },

    /* ---------------- 买票 ---------------- */
    {
      id: 'busticket',
      name: '买一张票',
      lv: 1,
      cefr: 'A1',
      roles: ['售票员', '你'],
      you: 1,
      variants: [
        { tag: '单程去车站', setting: '你在公交总站，想买单程票去火车站。' },
        V('往返票', '你要当天去当天回，往返更便宜。', {
          3: ['Return, please. I am coming back today.', '往返票。我今天就回来。'],
          4: ['Return is four pounds.', '往返四镑。'],
        }),
        V('去机场', '你要去机场，怕坐过站。', {
          1: ['To the airport, please.', '去机场。'],
          3: ['Single, please. Which stop is the airport?', '单程。哪一站是机场？'],
          4: ['The last stop. Two fifty.', '最后一站。两块五。'],
        }),
        V('学生票', '你有学生证，想问问有没有学生价。', {
          3: ['Single, please. Is there a student price?', '单程。有学生价吗？'],
          4: ['Yes, with a student card it is one fifty.', '有，凭学生证一块五。'],
        }),
        V('一日票', '你今天要坐好几趟，想买一日票。', {
          1: ['A day ticket, please.', '一张一日票。'],
          2: ['Just for today?', '就今天一天吗？'],
          3: ['Yes. Today only.', '对。就今天。'],
          4: ['A day ticket is six pounds.', '一日票六镑。'],
        }),
        V('问有几站', '你要去博物馆，还想知道坐几站。', {
          1: ['To the museum, please.', '去博物馆。'],
          3: ['Single, please. How many stops?', '单程。有几站？'],
          4: ['Three stops. Two fifty.', '三站。两块五。'],
          6: ['Yes. And I will tell you when to get off.', '可以。到站我叫您。'],
        }),
      ],
      lines: [
        L(0, 'Hello. Where to?', '你好。去哪儿？'),
        L(1, 'To the station, please.', '去车站，谢谢。'),
        L(0, 'Single or return?', '单程还是往返？'),
        L(1, 'Single, please.', '单程。'),
        L(0, 'That is two fifty.', '两块五。'),
        L(1, 'Can I pay by card?', '能刷卡吗？'),
        L(0, 'Yes, of course.', '当然可以。'),
        L(1, 'Here you go. Thank you.', '给你。谢谢。'),
      ],
      branches: [
        B(5, 'short', '刷卡机坏了，你要想办法付钱',
          S('Sorry, the card machine is down.', '抱歉，刷卡机坏了。'),
          [O(S('I have cash. Here you are.', '我有现金。给你。'), S('Thanks. Keep the ticket.', '谢谢。票收好。')),
           O(S('Is there a cash machine near here?', '附近有取款机吗？'), S('By the door, on the right.', '门口右手边。'))]),
      ],
      phrases: [
        P('Single or return?', '单程还是往返？', '买票一定会被问到的两个词。'),
        P('Can I pay by card?', '能刷卡吗？', 'by card 是刷卡，in cash 是付现金。'),
      ],
    },

    /* ---------------- 寄信 ---------------- */
    {
      id: 'parcel-basic',
      name: '寄信和寄包裹',
      lv: 1,
      cefr: 'A1',
      roles: ['邮局职员', '你'],
      you: 1,
      variants: [
        { tag: '寄一封信', setting: '你第一次进邮局，只想寄一封普通的信。' },
        V('寄小包裹', '你要把一件小东西寄给朋友。', {
          1: ['I want to send this parcel.', '我想寄这个包裹。'],
          3: ['To China. It is light, under one kilo.', '寄到中国。很轻，不到一公斤。'],
        }),
        V('挂号信', '信里有重要材料，你想要能查单号的那种。', {
          1: ['I want to send this letter. Registered, please.', '我想寄这封信。挂号。'],
          4: ['Registered is four pounds.', '挂号四镑。'],
        }),
        V('问要不要填单', '你怕填错单子，先问清楚。', {
          3: ['To China. Do I need a form?', '寄到中国。要填单子吗？'],
          4: ['Yes, this small one. And it is three pounds.', '要，这张小的。邮费三镑。'],
        }),
        V('要快的', '对方说两周太久，你想快一点。', {
          5: ['How long does it take?', '要多久？'],
          6: ['Two weeks. Express is five days.', '两周。快递五天。'],
          7: ['Then express, please.', '那寄快递。'],
        }),
        V('取包裹', '你不是来寄东西，是来取一个包裹。', {
          1: ['I am here to pick up a parcel.', '我来取包裹。', 'pick up 是取件，send 是寄件。'],
          2: ['What is your name?', '您叫什么？'],
          3: ['Wen. Here is the card.', 'Wen。这是取件单。'],
          4: ['Yes, I have it here. Please sign.', '有，在我这儿。请签个字。'],
          5: ['Thank you. Where do I sign?', '谢谢。在哪儿签？'],
          6: ['Right here.', '就在这儿。'],
          7: ['Okay. Thanks a lot.', '好。非常感谢。'],
        }),
      ],
      lines: [
        L(0, 'Next, please.', '下一位。'),
        L(1, 'I want to send this letter.', '我想寄这封信。'),
        L(0, 'Where to?', '寄到哪儿？'),
        L(1, 'To China.', '寄到中国。'),
        L(0, 'It will be three pounds.', '三镑。'),
        L(1, 'How long does it take?', '要多久？'),
        L(0, 'About two weeks.', '大概两周。'),
        L(1, 'That is fine. Thank you.', '可以。谢谢。'),
      ],
      branches: [
        B(3, 'cost', '对方说要加钱，你要问清楚为什么',
          S('To China it is four pounds, not three.', '寄到中国是四镑，不是三镑。'),
          [O(S('Four is fine. Here you are.', '四镑可以。给你。'), S('Thanks. Keep this receipt.', '谢谢。收好这张收据。')),
           O(S('Why is it more?', '为什么更贵？'), S('It is a different zone.', '这是另一个计费区。'))]),
      ],
      phrases: [
        P('I want to send this letter.', '我想寄这封信。', 'send 后面直接跟东西，不用介词。'),
        P('How long does it take?', '要多久？', '寄东西、修东西、等车都能用。'),
      ],
    },
  ],
};
