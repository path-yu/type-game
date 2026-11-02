import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '家庭',
  items: [
    {
      id: 'inlaws', name: '见对方父母', lv: 3, cefr: 'B1',
      roles: ['你', '对方家长'],
      lines: [
        L(1, 'So, how did you two meet?', '你们俩怎么认识的？'),
        L(0, 'At a wedding, three years ago. We were at the same table.', '三年前一个婚礼上。我们坐同一桌。'),
        L(1, 'And you work in computers, is that right?', '你是做计算机的，对吧？'),
        L(0, 'Software, yes. I build the parts people do not see.', '软件。我做的是用户看不见的那部分。'),
        L(1, 'That sounds complicated.', '听着挺复杂。'),
        L(0, 'It is mostly patience, honestly.', '说实话，主要是耐心。'),
        L(1, 'Do you cook? She does not, I am afraid.', '你会做饭吗？她不太会。'),
        L(0, 'I do. She is better at baking than me.', '会。她烘焙比我强。'),
      ],
      variants: [
        { tag: '第一次见家长', setting: '你第一次去对方父母家吃饭，桌上四个人。' },
        V('被问收入', '对方家长问得很直接。', {
          4: ['Is the job stable? These companies come and go.', '这工作稳定吗？这类公司来来去去。'],
          5: ['It is stable enough. I have been there four years.', '还算稳定。我在那儿四年了。'],
        }),
        V('被问买房', '他们关心你们住哪儿。', {
          6: ['Where will you live after the wedding?', '结婚后你们住哪儿？'],
          7: ['We rent for now, and save for a deposit.', '先租房，攒首付。'],
        }),
        V('语言不通', '对方家长英文一般。', {
          2: ['Sorry, could you say that again more slowly?', '抱歉，能再慢一点说一遍吗？'],
          3: ['I asked whether you like the city.', '我问你喜不喜欢这个城市。'],
        }),
        V('带孩子来', '你带着前一段婚姻的孩子。', {
          0: ['This is my daughter. She is six.', '这是我女儿。她六岁。'],
        }),
        V('饭后帮忙', '你想帮忙收拾。', {
          7: ['Can I help with the dishes?', '我帮忙洗碗吧？'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方问了一个不好答的问题，你要稳住',
          S('What does your family think about all this?', '你家里怎么看这件事？'),
          [O(S('They are happy for us. They will meet her in the summer.', '他们为我们高兴。夏天会见面。'), S('Good. That matters more than people admit.', '好。这比大家承认的更重要。')),
           O(S('They are cautious, like any parents. I am not.', '他们跟所有父母一样谨慎。我不是。'), S('I can respect that answer.', '这个回答我尊重。'))]),
      ],
      phrases: [
        P('How did you two meet?', '你们怎么认识的？', '见家长的第一问。'),
        P('I build the parts people do not see.', '我做用户看不见的那部分。', '解释专业工作时最省力的说法。'),
        P('Can I help with the dishes?', '我帮忙洗碗吧？', '做客加分的固定动作。'),
      ],
    },

    {
      id: 'baby-visit', name: '看望新生儿', lv: 3, cefr: 'B1',
      roles: ['你', '新手父母'],
      lines: [
        L(1, 'Come in, quietly. He just went down.', '进来轻点。他刚睡着。'),
        L(0, 'Congratulations. How are you holding up?', '恭喜。你还好吗？'),
        L(1, 'Running on three hours of sleep. But we are fine.', '睡三小时撑着。但还行。'),
        L(0, 'Can I hold him when he wakes?', '他醒了能让我抱抱吗？'),
        L(1, 'Please. Wash your hands first.', '当然。先洗手。'),
        L(0, 'Of course. Do you need anything from the shop?', '当然。要我从超市带点什么吗？'),
        L(1, 'Bread and milk, if you are going.', '如果去的话，面包和牛奶。'),
        L(0, 'I will go now, before he wakes.', '我现在就去，趁他还没醒。'),
      ],
      variants: [
        { tag: '第一次探望', setting: '朋友生了孩子两周，你带着汤上门。' },
        V('带吃的', '你带了一锅汤。', {
          0: ['I brought soup. It freezes well, so no rush.', '我带了汤。能冻起来，不急着吃。'],
          1: ['You are the first person to bring something we can eat one-handed.', '你是第一个带「单手能吃的东西」的人。'],
        }),
        V('别待太久', '你怕打扰他们休息。', {
          4: ['I will stay twenty minutes, then let you sleep.', '我待二十分钟就走，让你们睡。'],
        }),
        V('问生产', '你想问顺产还是剖腹。', {
          2: ['Was it a long labour?', '生得久吗？'],
        }),
        V('双胞胎', '他们生了双胞胎。', {
          0: ['Two at once. How are you managing nights?', '一次两个。晚上怎么应付？'],
        }),
        V('拍照', '你想拍照但先问。', {
          6: ['May I take a photo of the three of you?', '能给你们三个拍张照吗？'],
        }),
      ],
      branches: [
        B(3, 'probe', '对方说了句真心话，你要接得合适',
          S('Honestly, some days I regret how much this changed everything.', '说实话，有些天我后悔这一切改变得太多了。'),
          [O(S('That sounds normal, and nobody says it out loud.', '这很正常，只是没人说出口。'), S('Thank you for not saying it gets easier.', '谢谢你没说「会好起来的」。')),
           O(S('Do you want to talk about it, or would you rather not?', '你想聊，还是不想聊？'), S('Not today. Ask me in a month.', '今天不聊。一个月后再问。'))]),
      ],
      phrases: [
        P('How are you holding up?', '你还好吗？', '问新手父母比问宝宝更贴心。'),
        P('He just went down.', '他刚睡着。', 'go down 指婴儿入睡。'),
        P('Can I hold him when he wakes?', '他醒了能让我抱吗？', '先问，不要直接伸手。'),
      ],
    },

    {
      id: 'school-pickup', name: '接孩子被老师留下', lv: 3, cefr: 'B1',
      roles: ['你', '老师'],
      lines: [
        L(1, 'Are you picking up Mia today?', '今天你来接 Mia？'),
        L(0, 'Yes. Her mother is stuck at work.', '是。她妈妈被工作绊住了。'),
        L(1, 'She is in the art room. We had a small incident.', '她在美术教室。出了点小事。'),
        L(0, 'Is she all right?', '她没事吧？'),
        L(1, 'She is. Another child pushed her, and she pushed back.', '没事。另一个孩子推了她，她也推了回去。'),
        L(0, 'What happens now?', '现在怎么处理？'),
        L(1, 'We spoke to both of them. No punishment, just a talk.', '我们跟两个孩子都谈了。不处罚，只是谈话。'),
        L(0, 'Thank you. I will talk to her at home too.', '谢谢。我在家也会跟她谈。'),
      ],
      variants: [
        { tag: '孩子推了人', setting: '你到校门口，老师把你叫到一边。' },
        V('孩子被推', '孩子是受害一方。', {
          4: ['She was pushed and the other child was not spoken to?', '她是被推的，另一个孩子没被谈？'],
          5: ['Both were. I should have said that more clearly.', '两个都谈了。我该说得更清楚。'],
        }),
        V('作业没交', '老师提到作业。', {
          2: ['She has not handed in the last two worksheets.', '她最近两次练习都没交。'],
          3: ['I did not know. We will do them tonight.', '我不知道。今晚补。'],
        }),
        V('迟到接', '你迟到二十分钟。', {
          0: ['I am sorry I am late. The traffic was terrible.', '抱歉我迟到了。路上太堵。'],
        }),
        V('想问表现', '你想了解整体情况。', {
          6: ['How is she doing overall, not just today?', '她整体怎么样，不只是今天？'],
        }),
        V('约面谈', '你想正式聊一次。', {
          7: ['Could we book fifteen minutes next week?', '下周能约十五分钟吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '老师问你的处理方式，你要表态',
          S('How do you usually handle this at home?', '你们在家一般怎么处理这种情况？'),
          [O(S('We talk about what he could have done instead.', '我们聊他本可以怎么做。'), S('That is consistent with what we do here.', '跟我们这边的做法一致。')),
           O(S('I am not sure. This is new for us.', '我不太确定。这对我们是新情况。'), S('Then let us agree on one line to use with her.', '那我们统一一句对她说的话。'))]),
      ],
      phrases: [
        P('We had a small incident.', '出了点小事。', '老师的委婉说法，通常不是小事。'),
        P('No punishment, just a talk.', '不处罚，只是谈话。', '学校处理冲突的常见方式。'),
        P('How is she doing overall?', '她整体怎么样？', '把话题从单次事件拉远。'),
      ],
    },

    {
      id: 'wedding-plan', name: '婚礼筹备分歧', lv: 4, cefr: 'B1',
      roles: ['你', '未婚伴侣'],
      lines: [
        L(1, 'Have you decided on the guest list?', '宾客名单定了吗？'),
        L(0, 'We have a draft, but both families keep adding names.', '有草稿，但两边家里一直在加人。'),
        L(1, 'How many are we at?', '现在多少人了？'),
        L(0, 'A hundred and forty, and the room holds a hundred and twenty.', '一百四，场地只能坐一百二。'),
        L(1, 'Then somebody has to make a decision.', '那得有人做决定。'),
        L(0, 'We will cut to family and close friends only.', '我们砍到只留家人和至交。'),
        L(1, 'That is going to upset a few people.', '这会得罪几个人。'),
        L(0, 'I know. Better now than at the wedding.', '我知道。现在说比婚礼当天说好。'),
      ],
      variants: [
        { tag: '场地坐不下', setting: '婚礼还有两个月，名单超了二十人。' },
        V('预算', '你们超预算了。', {
          0: ['We are four thousand over budget. Something has to go.', '我们超预算四千。得砍点什么。'],
          1: ['The band, or the flowers. Not the food.', '乐队或者花。不能砍餐。'],
        }),
        V('双方家长意见', '两边家长都要请同事。', {
          0: ['My mother wants to invite her whole office.', '我妈想请她整个办公室。'],
          1: ['Then give each family ten seats and no more.', '那给每家十个名额，不能再多。'],
        }),
        V('要不要办', '你们考虑改成小型仪式。', {
          4: ['What if we did a small ceremony and a party later?', '要不要先小型仪式，之后再办派对？'],
        }),
        V('分工', '筹备任务没人认领。', {
          6: ['Nobody has booked the photographer. Can you take that?', '摄影没人订。你能负责吗？'],
        }),
        V('压力', '你觉得筹备快压垮你了。', {
          7: ['I am not enjoying any of this. Can we slow down?', '我一点都不享受。能慢下来吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方把决定推给你，你要给出可执行的规则',
          S('Then somebody has to make a decision. Who?', '那得有人做决定。谁做？'),
          [O(S('Us, together, tonight, with a list and a pen.', '我们俩，今晚，一张名单一支笔。'), S('Fine. No phones, no parents.', '行。不带手机，不叫父母。')),
           O(S('We each cut our own side and do not negotiate.', '各砍各家的，不互相谈判。'), S('That is the only way it stays fair.', '这是唯一公平的办法。'))]),
      ],
      phrases: [
        P('We are at a hundred and forty.', '现在一百四十人。', 'be at 某数字 = 目前是。'),
        P('Something has to go.', '得砍点什么。', '预算超支时的标准说法。'),
        P('Better now than at the wedding.', '现在说比当天说好。', '处理人情压力的理由。'),
      ],
    },

    {
      id: 'family-argument', name: '调解家里争执', lv: 4, cefr: 'B1',
      roles: ['你', '家人'],
      lines: [
        L(1, 'You always take his side.', '你总是向着他。'),
        L(0, 'I am not taking sides. I am asking what happened.', '我没站边。我在问发生了什么。'),
        L(1, 'He borrowed the car and brought it back empty.', '他借了车，还回来是空油箱。'),
        L(0, 'That is worth saying to him, not to me.', '这话该跟他说，不是跟我说。'),
        L(1, 'You know how he reacts.', '你知道他会怎么反应。'),
        L(0, 'Then say it in a message, calmly, and copy me.', '那就发消息，平静地说，抄送我。'),
        L(1, 'Fine. But I am not apologising for being angry.', '行。但我不会为生气道歉。'),
        L(0, 'Nobody asked you to. Just say the thing that is true.', '没人让你道歉。就说事实。'),
      ],
      variants: [
        { tag: '兄弟借车不加油', setting: '家里三个人，你在中间。' },
        V('婆媳', '你伴侣和你母亲有摩擦。', {
          0: ['She feels criticised every time your mother visits.', '你妈每次来，她都觉得被挑剔。'],
          1: ['I will talk to my mother. And I will not repeat what she said.', '我去跟我妈谈。也不会重复她的话。'],
        }),
        V('钱', '家里为谁出钱吵。', {
          3: ['Before we argue about money, can we agree on the total?', '先别争钱，能不能先定总数？'],
        }),
        V('孩子教育', '你和伴侣对管教方式不同。', {
          5: ['We cannot both threaten different punishments.', '我们不能各说一套惩罚。'],
        }),
        V('老话题', '每次聚会都翻旧账。', {
          7: ['Can we agree not to bring up last year tonight?', '今晚能不能不提去年的事？'],
        }),
        V('冷战', '对方不理你了。', {
          0: ['You have not spoken to me since Sunday. What is going on?', '你从周日就没跟我说话。怎么回事？'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方在气头上，你要把话降温',
          S('So you think I am overreacting.', '所以你觉得我反应过度。'),
          [O(S('I think you are angry, and the fuel is not the real reason.', '我觉得你在气，油不是真正的原因。'), S('Maybe not.', '也许不是。')),
           O(S('I did not say that. I asked what happened.', '我没这么说。我问的是发生了什么。'), S('Fine. He also did not thank me.', '行。他也没谢我。'))]),
      ],
      phrases: [
        P('I am not taking sides.', '我没站边。', '调解第一句。'),
        P('That is worth saying to him.', '这话该跟他说。', '把抱怨转成行动。'),
        P('Just say the thing that is true.', '就说事实。', '降温的关键。'),
      ],
    },

    {
      id: 'elder-care', name: '咨询养老院', lv: 5, cefr: 'B2',
      roles: ['你', '顾问'],
      lines: [
        L(0, 'We are looking at care homes for my mother.', '我们在给我妈找养老院。'),
        L(1, 'How much support does she need day to day?', '她日常需要多少照护？'),
        L(0, 'She can dress herself, but she forgets her medication.', '她能自己穿衣，但会忘记吃药。'),
        L(1, 'Then assisted living may be enough, not a nursing home.', '那辅助生活就够了，不用护理院。'),
        L(0, 'What is the difference in cost?', '费用差多少？'),
        L(1, 'About a third less, and she keeps her own flat.', '便宜大概三分之一，而且她有自己的房间。'),
        L(0, 'Can we visit before deciding?', '决定前能来看看吗？'),
        L(1, 'Any time. Come for lunch, see how it feels.', '随时。来吃顿午饭，感受一下。'),
      ],
      variants: [
        { tag: '轻度失智', setting: '母亲独居，最近两次忘关煤气。' },
        V('需要护理', '老人卧床。', {
          0: ['She needs help with washing and dressing now.', '她现在洗澡穿衣都要人帮。'],
          1: ['Then it is a nursing home, and we should talk about funding.', '那是护理院，得谈谈费用来源。'],
        }),
        V('在家照护', '你们想请人上门。', {
          4: ['Is home care an option before moving her?', '搬之前能先上门照护吗？'],
          5: ['Four visits a day is about the same cost as a room here.', '一天四次上门，费用跟这儿一个房间差不多。'],
        }),
        V('费用', '你担心长期负担。', {
          6: ['What happens when the savings run out?', '积蓄花完了怎么办？'],
        }),
        V('情绪', '老人不愿意去。', {
          0: ['She refuses to leave the house. How do families handle that?', '她不肯离开家。别的家庭怎么处理？'],
        }),
        V('试住', '你想先短期试住。', {
          7: ['Could she stay for two weeks as a trial?', '能让她先试住两周吗？'],
        }),
      ],
      branches: [
        B(4, 'probe', '顾问给了一个费用口径，你要问到底',
          S('The fee covers the room, meals and care, but not nursing.', '费用含房间、餐和日常照护，不含护理。'),
          [O(S('What does nursing cost when it is needed?', '需要护理的时候怎么收？'), S('About forty a day, only when it is used.', '一天四十左右，用的时候才收。')),
           O(S('So the headline fee is not the real cost?', '所以标价不是真实费用？'), S('Not for everyone. It depends on the assessment.', '不是对所有人都一样。看评估结果。'))]),
      ],
      phrases: [
        P('How much support does she need?', '她需要多少照护？', '评估养老方案的第一问。'),
        P('Assisted living, not a nursing home.', '辅助生活，不是护理院。', '两者差别很大。'),
        P('Come for lunch, see how it feels.', '来吃顿午饭感受一下。', '实地体验比看手册有用。'),
      ],
    },
  ],
};
