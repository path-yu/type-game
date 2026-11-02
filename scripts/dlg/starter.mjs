/**
 * 入门场景（A1 / L1）：第一次用英语开口时会遇到的最小单元。
 *
 * 为什么单独一个文件：1097 场里 L1 只有 25 场，A1 学习者不到一天就练完了，
 * 之后只能往上跳到 L3，中间是断的。这一批补的就是这个断层。
 *
 * 写这一批的三条约束：
 *   1. 一句 4–8 个词，最多一个从句。
 *   2. 只用最常用的词。开口的前三十秒不该被生词占住。
 *   3. 仍然有岔路 —— 简单不等于没有意外，只是意外本身也简单
 *      （东西没了 / 要加钱 / 只收现金），选项也是短句。
 *
 * 骨架的写法有个讲究：**中间几句必须是「换个场合也成立」的通用流程**。
 * 第一版把「楼梯旁边」「Is it free?」写进了骨架，结果换目标物之后全断：
 * 问公交站，对方回答「就在楼梯旁」。所以现在骨架只留通用句，
 * 变体只换「问什么」和「答什么」，后面接得上。
 */
import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '日常',
  items: [
    /* ---------------- 打招呼：认识一个人 ---------------- */
    {
      id: 'greet',
      name: '和人打招呼',
      lv: 1,
      cefr: 'A1',
      roles: ['对方', '你'],
      you: 1,
      variants: [
        { tag: '新邻居', setting: '你刚搬来一周。在楼道里遇到隔壁的人，他先开口了。' },
        V('新同事', '入职第一天，你在茶水间遇到同组的人。', {
          0: ['Hi. You must be the new one.', '你好。你就是新来的吧。'],
          1: ['Yes. I started today.', '是的。我今天入职。'],
        }),
        V('房东', '房东来送钥匙，你们第一次见面。', {
          0: ['Hello. Are you the new tenant?', '你好。你是新租客吗？'],
          1: ['Yes. I moved in on Monday.', '是的。我周一搬进来的。'],
        }),
        V('同班同学', '第一节课后，旁边的同学转过身来。', {
          0: ['Hi. Is this your first class here?', '你好。你是第一次上这课吗？'],
          1: ['Yes. It is my first day.', '是的。这是我第一天。'],
        }),
        V('健身房', '你第一次来这家健身房，前台的人跟你打招呼。', {
          0: ['Hi. First time here?', '你好。第一次来吗？'],
          1: ['Yes. I just joined.', '是的。我刚办卡。'],
        }),
        V('遛狗', '你在公园遛狗，另一个遛狗的人停下来。', {
          0: ['Hi. Is your dog friendly?', '你好。你的狗温和吗？'],
          1: ['Yes. He is very friendly.', '是的。他很温和。'],
        }),
      ],
      lines: [
        L(0, 'Hi. Are you new here?', '你好。你是新来的吗？'),
        L(1, 'Yes. I moved in last week.', '是的。我上周搬来的。', 'moved in 是「搬进来」，比 I came here 准确。'),
        L(0, 'I am Anna. What is your name?', '我叫 Anna。你怎么称呼？'),
        L(1, 'I am Wen. Nice to meet you.', '我叫 Wen。很高兴认识你。'),
        L(0, 'Do you need anything?', '你需要什么吗？'),
        L(1, 'No, I am fine. Thank you.', '不用，我挺好的。谢谢。'),
        L(0, 'Okay. See you around.', '好。回头见。'),
        L(1, 'See you. Have a good day.', '回头见。祝你今天顺利。'),
      ],
      branches: [
        B(3, 'probe', '对方没听清你的名字，你要再说一遍',
          S('Sorry, what was your name?', '抱歉，你叫什么名字？'),
          [O(S('Wen. It is spelled W-E-N.', 'Wen。拼写是 W-E-N。'), S('Got it. Wen.', '记住了。Wen。')),
           O(S('It is Wen. W-E-N.', '我叫 Wen。W-E-N。'), S('Thanks. I will remember.', '谢谢。我会记住。'))]),
      ],
      phrases: [
        P('Nice to meet you.', '很高兴认识你。', '第一次见面的标准句。'),
        P('I am fine, thank you.', '我很好，谢谢。', '被问 How are you 时最稳的回答。'),
      ],
    },

    /* ---------------- 道谢：不只说 thank you ---------------- */
    {
      id: 'thanks',
      name: '道谢和回应',
      lv: 1,
      cefr: 'A1',
      roles: ['对方', '你'],
      you: 1,
      variants: [
        { tag: '有人替你挡门', setting: '你两手都是购物袋，前面的人替你顶住了门。' },
        V('邻居帮你收快递', '你不在家，邻居替你收了包裹，你上门去取。', {
          0: ['Here is your parcel. It came this morning.', '这是你的包裹。今早送来的。'],
          1: ['Thank you. That is very kind.', '谢谢。你太好了。'],
          3: ['You saved me a trip to the depot.', '你替我跑了一趟取件点。'],
        }),
        V('同事替你顶班', '你临时有事，同事替你值了半小时。', {
          0: ['I covered your desk. Nothing happened.', '我替你看了工位。没出什么事。'],
          1: ['Thank you. I owe you one.', '谢谢。我欠你一次。'],
          3: ['Next coffee is on me.', '下杯咖啡我请。'],
        }),
        V('老师多讲了一遍', '你没听懂，老师课后又给你讲了一遍。', {
          0: ['Did that help?', '这样讲清楚了吗？'],
          1: ['Yes. Thank you for your time.', '清楚了。谢谢您花时间。'],
          3: ['I understand it now.', '我现在懂了。'],
        }),
        V('陌生人带路', '你在街上问路，对方带你走了一段。', {
          0: ['It is just here. See the blue door?', '就在这儿。看到那扇蓝门了吗？'],
          1: ['Yes. Thank you for walking me here.', '看到了。谢谢你带我过来。'],
          3: ['You did not have to do that.', '你其实不用特意带路的。'],
        }),
        V('收到礼物', '朋友送你一件小礼物，你觉得太客气了。', {
          0: ['It is only small. I hope you like it.', '东西不大。希望你喜欢。'],
          1: ['Thank you. You did not have to.', '谢谢。你太客气了。'],
          3: ['I will use it every day.', '我每天都会用。'],
        }),
      ],
      lines: [
        L(0, 'Here you go. Let me hold the door.', '给你。我帮你挡着门。', 'hold the door 是「扶着门让人过」，不是「关门」。'),
        L(1, 'Thank you. That is very kind.', '谢谢。你真好。'),
        L(0, 'No problem at all.', '完全没事。'),
        L(1, 'No, that is all. Thanks again.', '没有了。再说一次谢谢。'),
        L(0, 'Okay. Have a nice day.', '好。祝你今天愉快。'),
        L(1, 'You too. Thanks a lot.', '你也是。非常感谢。'),
      ],
      branches: [
        B(3, 'offer', '对方要再帮你一次，你要决定接受还是拒绝',
          S('I can carry one up for you.', '我可以帮你拿一个上去。'),
          [O(S('That would be great. Thank you.', '那太好了。谢谢。'), S('Which floor?', '几楼？')),
           O(S('I am okay, but thank you.', '我可以的，不过谢谢你。'), S('All right. Take care.', '好。慢走。'))]),
      ],
      phrases: [
        P('You did not have to do that.', '你其实不用这样的。', '收到帮助或礼物时，比 thank you 更客气。'),
        P('I owe you one.', '我欠你一次。', '同事、朋友之间道谢的口语。'),
      ],
    },

    /* ---------------- 道歉：短句也要说清楚 ---------------- */
    {
      id: 'sorry',
      name: '道歉',
      lv: 1,
      cefr: 'A1',
      roles: ['对方', '你'],
      you: 1,
      variants: [
        { tag: '上课迟到', setting: '你迟到了十分钟，教室里已经安静下来。' },
        V('开会迟到', '组会已经开始，你推门进去。', {
          0: ['You are late. We started five minutes ago.', '你迟到了。我们五分钟前开始。'],
          1: ['I am sorry. The bus was slow.', '对不起。公交车很慢。'],
        }),
        V('忘带材料', '你把要交的材料忘在家里了。', {
          0: ['Do you have the form?', '表格带了吗？'],
          1: ['I am sorry. I left it at home.', '抱歉。我忘在家里了。'],
          3: ['Can I bring it tomorrow?', '我明天带来可以吗？'],
          4: ['Yes, tomorrow is fine.', '可以，明天行。'],
          5: ['Thank you for understanding.', '谢谢你理解。'],
        }),
        V('记错时间', '你把见面时间记错了一小时，到的时候对方已经等了很久。', {
          0: ['You are an hour late.', '你晚了一小时。'],
          1: ['I am sorry. I wrote down the wrong time.', '抱歉。我把时间记错了。'],
        }),
        V('交晚了', '作业没按时交，你想多要一天。', {
          0: ['Do you have the essay?', '文章带了吗？'],
          1: ['I am sorry. I need one more day.', '抱歉。我还需要一天。'],
          3: ['It will be done tomorrow.', '明天一定写完。'],
          5: ['Thank you for understanding.', '谢谢你理解。'],
        }),
        V('说话太冲', '你刚才回话有点冲，现在想收回。', {
          0: ['That was a bit sharp.', '刚才那话有点冲。'],
          1: ['I am sorry. I was not thinking.', '对不起。我没过脑子。'],
          3: ['It was not about you.', '不是针对你。'],
          5: ['Thank you for saying that.', '谢谢你这么说。'],
        }),
      ],
      lines: [
        L(0, 'You are late.', '你迟到了。'),
        L(1, 'I am sorry. The bus was slow.', '对不起。公交车很慢。'),
        L(0, 'It is okay. These things happen.', '没关系。这种事难免。'),
        L(1, 'It will not happen again.', '不会再这样了。'),
        L(0, 'Do not worry about it.', '别放在心上。'),
        L(1, 'Thank you for waiting.', '谢谢你等我。'),
        L(0, 'All right. Let us start.', '好。我们开始吧。'),
        L(1, 'Okay. I am ready.', '好。我准备好了。'),
      ],
      branches: [
        B(3, 'probe', '对方问原因，你要说清楚而不是找借口',
          S('Why were you late?', '你为什么迟到？'),
          [O(S('The bus did not come. I should have left earlier.', '公交车没来。我应该早点出门。'), S('It happens. Try to be on time.', '会有的。尽量准时就行。')),
           O(S('I woke up late. I am sorry.', '我起晚了。对不起。'), S('Thanks for being honest.', '谢谢你实话实说。'))]),
      ],
      phrases: [
        P('It will not happen again.', '不会再这样了。', '道歉时给出「不会再犯」比反复说 sorry 有用。'),
        P('I should have left earlier.', '我应该早点出门的。', 'should have + 过去分词 = 后悔没做某事。'),
      ],
    },

    /* ---------------- 问价：买东西的第一句 ---------------- */
    {
      id: 'howmuch',
      name: '问价格',
      lv: 1,
      cefr: 'A1',
      roles: ['店员', '你'],
      you: 1,
      variants: [
        { tag: '看中一件', setting: '你在小店看中一件东西，但标签掉了，不知道多少钱。' },
        V('想买小一号', '衣服好看，但挂着的那件太大。', {
          3: ['Do you have a smaller size?', '有小一号的吗？'],
          4: ['This is the smallest we have.', '这是我们最小的了。'],
        }),
        V('只有现金', '你只带了现金，怕店里不收。', {
          5: ['I will take it. Do you take cash?', '我要了。你们收现金吗？'],
          6: ['Cash is fine. Any change?', '现金可以。有零钱吗？'],
        }),
        V('问能不能退', '你想买，但不确定不合适能不能退。', {
          5: ['I will take it. Can I return it?', '我要了。可以退吗？'],
          6: ['Yes, with the receipt, in two weeks.', '可以，带收据，两周内。'],
        }),
        V('两个都要', '你犹豫的两件都想要，问问有没有优惠。', {
          3: ['I like both. Is there a discount for two?', '两件我都喜欢。买两件有优惠吗？'],
          4: ['I can do twenty for both.', '两件二十。'],
          5: ['I will take both. Can I pay by card?', '两件都要。能刷卡吗？'],
        }),
        V('帮朋友带', '你替朋友买，她比你高，你要问尺码。', {
          3: ['Okay. It is for a friend. She is taller than me.', '好。这是帮朋友买的。她比我高。'],
          4: ['Then try this one. It is the same price.', '那试试这件。价格一样。'],
        }),
      ],
      lines: [
        L(0, 'Hi. Can I help you?', '你好。需要帮忙吗？'),
        L(1, 'Yes. How much is this?', '是的。这个多少钱？'),
        L(0, 'It is twelve.', '十二。'),
        L(1, 'Okay. Do you have a smaller one?', '好。有小一点的吗？'),
        L(0, 'Let me see. Yes, this one.', '我看看。有，这个。'),
        L(1, 'I will take it. Can I pay by card?', '我要这个。能刷卡吗？'),
        L(0, 'Yes, of course.', '当然可以。'),
        L(1, 'Great. Thank you.', '好。谢谢。'),
      ],
      branches: [
        B(5, 'cost', '价格和你想的不一样，你要决定买不买',
          S('That is fifteen, not twelve. The small one costs more.', '这是十五，不是十二。小号的更贵。'),
          [O(S('Fifteen is fine. I will take it.', '十五也行。我要了。'), S('Great. Card or cash?', '好。刷卡还是现金？')),
           O(S('Then I will take the big one.', '那我要大的那个。'), S('Good choice. It is twelve.', '好选择。那个十二。'))]),
      ],
      phrases: [
        P('How much is this?', '这个多少钱？', '问价最短的一句。'),
        P('Do you have a smaller one?', '有小一点的吗？', 'one 代替前面说过的名词，不用重复。'),
      ],
    },

    /* ---------------- 问路：只要方向 ---------------- */
    {
      id: 'wheretoilet',
      name: '问路（最简单的）',
      lv: 1,
      cefr: 'A1',
      roles: ['店员', '你'],
      you: 1,
      variants: [
        { tag: '找厕所', setting: '你在商场里，想找洗手间，看到一个店员。' },
        V('找出口', '你在车站里绕晕了，想找出口。', {
          1: ['Excuse me. Where is the exit?', '打扰一下。出口在哪儿？'],
        }),
        V('找电梯', '你推着行李箱，想找电梯而不是扶梯。', {
          1: ['Excuse me. Where is the lift?', '打扰一下。电梯在哪儿？', 'lift 是英式，美式说 elevator。'],
        }),
        V('找收银台', '你买完东西找不到在哪儿付钱。', {
          1: ['Excuse me. Where do I pay?', '打扰一下。在哪儿付款？'],
        }),
        V('找公交站', '你出了地铁站，不知道公交站在哪个方向。', {
          1: ['Excuse me. Where is the bus stop?', '打扰一下。公交站在哪儿？'],
        }),
        V('找失物招领', '你把伞落在店里，想问在哪儿取。', {
          1: ['Excuse me. Where is lost and found?', '打扰一下。失物招领在哪儿？'],
        }),
      ],
      lines: [
        L(0, 'Hi. Can I help you?', '你好。需要帮忙吗？'),
        L(1, 'Excuse me. Where is the toilet?', '打扰一下。洗手间在哪儿？', 'Excuse me 开头是打断陌生人的标准说法。'),
        L(0, 'Go straight, then turn left.', '直走，然后左转。'),
        L(1, 'Straight, then left. Got it.', '直走，然后左转。记住了。'),
        L(0, 'Yes. You will see it.', '对。你会看到的。'),
        L(1, 'Thank you.', '谢谢。'),
        L(0, 'No problem.', '不客气。'),
        L(1, 'Have a good day.', '祝你今天顺利。'),
      ],
      branches: [
        B(3, 'short', '对方说的那条路走不通，你要换个问法',
          S('The left one is closed. Use the one upstairs.', '左边那个关了。用楼上的。'),
          [O(S('How do I get upstairs?', '怎么上楼？'), S('Take the stairs behind you.', '走你后面的楼梯。')),
           O(S('Is there another one on this floor?', '这层还有别的吗？'), S('Only the one at the back.', '只有后面那一个。'))]),
      ],
      phrases: [
        P('Excuse me. Where is the toilet?', '打扰一下，洗手间在哪儿？', 'Excuse me 开头是打断陌生人的标准说法。'),
        P('Go straight, then turn left.', '直走，然后左转。', '指路最常用的两句连在一起。'),
      ],
    },
  ],
};
