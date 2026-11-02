import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '社交',
  items: [
    {
      id: 'wedding-invite', name: '婚礼出席与随礼', lv: 3, cefr: 'B1',
      roles: ['你', '新人'],
      lines: [
        L(1, 'Are you coming to the wedding?', '婚礼你来吗？'),
        L(0, 'We are. Is there a gift list anywhere?', '来。有礼物清单吗？'),
        L(1, 'There is, but honestly we have too much kitchen stuff.', '有，但说实话厨房东西太多了。'),
        L(0, 'Then we will contribute to the honeymoon fund.', '那我们出蜜月的份子。'),
        L(1, 'That is very kind. Are you staying for the evening?', '太客气了。晚上留到最后吗？'),
        L(0, 'We are, but we need to leave by ten for the last train.', '留，但十点前得走，赶末班车。'),
        L(1, 'The band starts at nine, so that works.', '乐队九点开始，来得及。'),
        L(0, 'Good. Should we book a taxi in advance?', '好。要提前订出租车吗？'),
      ],
      variants: [
        { tag: '收到请柬', setting: '同事结婚，请柬上写着 RSVP。' },
        V('不能去', '你那天出差。', {
          0: ['I am afraid we cannot make it. I am away that weekend.', '恐怕我们去不了。那个周末我出差。'],
          1: ['That is a shame. We will send you photos.', '真可惜。我们给你发照片。'],
        }),
        V('带不带孩子', '请柬上没写。', {
          4: ['Is it an adults-only evening? We have a six-year-old.', '晚上是只限成人吗？我们有个六岁的孩子。'],
          5: ['There is a children table until eight, then a sitter.', '八点前有儿童桌，之后有看护。'],
        }),
        V('穿什么', '你不确定着装要求。', {
          6: ['What is the dress code? The invitation only says smart.', '着装要求是什么？请柬只写了「正式」。'],
        }),
        V('随礼金额', '你不知道给多少合适。', {
          3: ['Is there a suggested amount for the fund? We do not want to be rude.', '蜜月基金有建议金额吗？我们不想失礼。'],
        }),
        V('帮忙', '你想问需不需要帮手。', {
          7: ['Do you need anyone to help on the day?', '当天需要人帮忙吗？'],
        }),
      ],
      branches: [
        B(5, 'offer', '新人提出一个安排，你要判断合不合适',
          S('We are putting a few people up at the hotel. Do you want a room?', '我们给几个人在酒店订了房。你要一间吗？'),
          [O(S('That would save us the last train. Yes, please.', '那就不用赶末班车了。要。'), S('I will add you to the booking.', '我把你加进预订。')),
           O(S('We would rather get home. But thank you.', '我们还是想回家。不过谢谢。'), S('Then let me book you a taxi at ten.', '那我给你订十点的车。'))]),
      ],
      phrases: [
        P('Is there a gift list?', '有礼物清单吗？', '婚礼随礼先问清单。'),
        P('Contribute to the honeymoon fund.', '出蜜月份子。', '常见替代实物礼物的方式。'),
        P('What is the dress code?', '着装要求是什么？', '请柬写 smart 并不等于随便。'),
      ],
    },

    {
      id: 'hallway-bike', name: '楼道堆放被投诉', lv: 3, cefr: 'B1',
      roles: ['你', '邻居'],
      lines: [
        L(1, 'Is this your bike in the hallway?', '楼道里这辆自行车是你的吗？'),
        L(0, 'It is. There is nowhere else to put it.', '是。没别的地方放。'),
        L(1, 'It blocks the fire exit. The management have complained.', '它挡了消防通道。物业投诉了。'),
        L(0, 'I did not know that. Where do others keep theirs?', '我不知道。别人的放哪儿？'),
        L(1, 'In the bike store at the back. It is free.', '后面有自行车库。免费的。'),
        L(0, 'I do not have a key. How do I get one?', '我没有钥匙。怎么拿？'),
        L(1, 'Ask the concierge. It takes a day.', '找前台。一天就好。'),
        L(0, 'I will move it tonight and get the key tomorrow.', '我今晚挪走，明天去拿钥匙。'),
      ],
      variants: [
        { tag: '自行车挡道', setting: '邻居来敲门，说楼道里的车挡了消防通道。' },
        V('婴儿车', '你放的是婴儿车。', {
          1: ['It is a pram, not a bike. I cannot carry it up four flights.', '是婴儿车，不是自行车。我抱不上四楼。'],
          2: ['I understand, but it still blocks the exit.', '我理解，但它还是挡着出口。'],
        }),
        V('鞋柜', '你在门口放了鞋柜。', {
          0: ['Is the shoe rack a problem too? It is only ten centimetres deep.', '鞋柜也有问题吗？只有十厘米厚。'],
        }),
        V('对方也堆', '邻居自己也放东西。', {
          2: ['Your boxes have been there since March. Should we both clear them?', '你的箱子从三月就在那儿。要不清一起清？'],
          3: ['Fair. I will take mine down this week.', '有道理。我这周把我的收走。'],
        }),
        V('被投诉到物业', '物业发了正式通知。', {
          5: ['I got a letter from the management. Is there a deadline?', '我收到物业的信。有截止日期吗？'],
        }),
        V('道歉', '你意识到是自己的问题。', {
          7: ['I am sorry. I should have asked before leaving it there.', '抱歉。我该先问一声再放。'],
        }),
      ],
      branches: [
        B(5, 'probe', '邻居追问你什么时候处理，你要给出时间表',
          S('When can you move it? The inspection is on Friday.', '什么时候能挪？周五检查。'),
          [O(S('Tonight. I will carry it down before dinner.', '今晚。晚饭前搬下去。'), S('Then we are fine. Thanks for being quick.', '那就没问题。谢谢你痛快。')),
           O(S('Friday morning at the latest.', '最晚周五早上。'), S('Make it Thursday, in case they come early.', '周四吧，万一他们早来。'))]),
      ],
      phrases: [
        P('It blocks the fire exit.', '它挡了消防通道。', '楼道纠纷最常见的原因。'),
        P('Where do others keep theirs?', '别人的放哪儿？', '先找替代方案，别急着争。'),
        P('I should have asked before leaving it there.', '我该先问一声。', '认错一句话，关系就保住了。'),
      ],
    },

    {
      id: 'group-plan', name: '群聊约周末', lv: 3, cefr: 'B1',
      roles: ['你', '朋友'],
      lines: [
        L(1, 'Are you free Saturday? A few of us are going climbing.', '周六有空吗？我们几个人去攀岩。'),
        L(0, 'I am, but I have never climbed outdoors.', '有空，但我没在户外爬过。'),
        L(1, 'You can come and watch, or try the easy routes.', '你可以来看，或者试试简单的线路。'),
        L(0, 'What gear do I need?', '需要什么装备？'),
        L(1, 'Shoes and a helmet. We have spares.', '鞋和头盔。我们有备用的。'),
        L(0, 'What time are you meeting?', '几点集合？'),
        L(1, 'Eight at the car park. It is an hour away.', '八点停车场。开过去一小时。'),
        L(0, 'Count me in. I will bring coffee.', '算我一个。我带咖啡。'),
      ],
      variants: [
        { tag: '被拉去攀岩', setting: '群里临时组局，你谁都不太熟。' },
        V('不想去但想社交', '你不想攀岩，但想认识人。', {
          2: ['I would rather not climb. Is there a walking route nearby?', '我不太想爬。附近有徒步路线吗？'],
          3: ['There is a loop around the lake. Two hours, flat.', '湖边有个环线。两小时，平路。'],
        }),
        V('改时间', '你周六上午有事。', {
          0: ['Could we do the afternoon instead? I have a viewing at ten.', '能改下午吗？我十点要看房。'],
        }),
        V('交通', '你没有车。', {
          5: ['I do not have a car. Can I get a lift?', '我没车。能搭个顺风车吗？'],
          6: ['Sam is driving and has two seats.', 'Sam 开车，还有两个位子。'],
        }),
        V('天气', '预报有雨。', {
          7: ['The forecast says rain. Are we still going?', '预报有雨。还去吗？'],
        }),
        V('带人', '你想带朋友。', {
          3: ['Can I bring someone who has never tried it?', '我能带个没试过的人吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方问你的体力情况，你要如实说',
          S('Can you do a two-hour walk with some uphill?', '两小时带点上坡的徒步你行吗？'),
          [O(S('I can, but slowly. I will not hold anyone up if I start early.', '行，但慢。我早点出发就不拖人。'), S('That is the right attitude.', '这态度就对。')),
           O(S('Honestly, I am not sure. Is there a shorter option?', '说实话不确定。有短一点的吗？'), S('You can turn back at the ridge. Nobody minds.', '到山脊可以折返。没人介意。'))]),
      ],
      phrases: [
        P('Count me in.', '算我一个。', '答应邀约最简的说法。'),
        P('Can I get a lift?', '能搭个车吗？', 'lift 是顺风车。'),
        P('Are we still going?', '还去吗？', '天气变时的确认句。'),
      ],
    },

    {
      
      branches: [
        B(3, 'probe', '对方继续劝，你要坚持又不失礼',
          S('It really is two minutes. We get paid by the form.', '真的只要两分钟。我们按份数拿钱。'),
          [O(S('I understand, but I am late. Try the queue at the bus stop.', '我理解，但我要迟到了。试试公交站排队的人。'), S('Fair enough. Thanks anyway.', '行。还是谢谢。')),
           O(S('I will do it on my way back if you are still here.', '回来的时候你还在，我就填。'), S('I will be here until six.', '我会待到六点。'))]),
      ],
id: 'street-survey', name: '街头被拦下', lv: 3, cefr: 'B1',
      roles: ['你', '调查员'],
      lines: [
        L(1, 'Excuse me, do you have a minute for a quick survey?', '打扰一下，有空做个简短问卷吗？'),
        L(0, 'Sorry, I am on my way to an appointment.', '抱歉，我赶着赴约。'),
        L(1, 'It is only two minutes. It is about local transport.', '只要两分钟。关于本地交通。'),
        L(0, 'I would rather not. I have been stopped three times today.', '还是不了。我今天已经被拦了三次。'),
        L(1, 'No problem. Have a good day.', '没问题。祝您今天顺利。'),
        L(0, 'Thanks. Good luck with the rest.', '谢谢。剩下的人也顺利。'),
      ],
      variants: [
        { tag: '赶时间被拦', setting: '你赶着去面试，路口被调查员拦住。' },
        V('愿意配合', '你正好有时间。', {
          3: ['Actually, I have five minutes. What do you need to know?', '其实我有五分钟。你想问什么？'],
          4: ['Just how often you use the bus, and what would make it better.', '就问您多久坐一次公交，什么能让它更好。'],
        }),
        V('募捐', '对方在募捐。', {
          1: ['Would you like to support the food bank?', '愿意支持一下食物银行吗？'],
          2: ['I already give monthly, but thank you.', '我已经每月捐了，不过谢谢。'],
        }),
        V('推销', '对方在推销宽带。', {
          0: ['I am not switching providers. Thanks anyway.', '我不打算换运营商。还是谢谢。'],
        }),
        V('问用途', '你想知道信息给谁。', {
          2: ['Who is this for, and will my name be on it?', '这是给谁的？会记我名字吗？'],
        }),
        V('被缠住', '对方不肯放你走。', {
          3: ['I have said no twice. Please let me pass.', '我已经说了两次不用。请让我过去。'],
        }),
      ],
      branches: [
        B(3, 'probe', '对方继续劝，你要坚持又不失礼',
          S('It really is two minutes. We get paid by the form.', '真的只要两分钟。我们按份数拿钱。'),
          [O(S('I understand, but I am late. Try the queue at the bus stop.', '我理解，但我要迟到了。试试公交站排队的人。'), S('Fair enough. Thanks anyway.', '行。还是谢谢。')),
           O(S('I will do it on my way back if you are still here.', '回来的时候你还在，我就填。'), S('I will be here until six.', '我会待到六点。'))]),
      ],
      phrases: [
        P('I am on my way to an appointment.', '我赶着赴约。', '脱身最礼貌的理由。'),
        P('I would rather not.', '还是不了。', '比 no 更缓和，也比 sorry 更明确。'),
        P('Who is this for?', '这是给谁的？', '填问卷前问清用途。'),
      ],
    },

    {
      id: 'book-club', name: '读书会聊书', lv: 4, cefr: 'B1',
      roles: ['你', '书友'],
      lines: [
        L(1, 'Did you finish the book?', '书看完了吗？'),
        L(0, 'I did, but I skimmed the last hundred pages.', '看完了，但最后一百页是跳着读的。'),
        L(1, 'Honestly, so did I. What did you make of the ending?', '说实话我也是。你觉得结尾怎么样？'),
        L(0, 'It felt rushed. The father was the interesting part.', '有点仓促。父亲那条线才有意思。'),
        L(1, 'That is what I thought. Will you say that on Thursday?', '我也这么觉得。周四你会说吗？'),
        L(0, 'I will, as long as nobody takes it personally.', '会说，只要没人往心里去。'),
        L(1, 'The chair does. Say it gently.', '主持人会。说得缓和点。'),
        L(0, 'I will say I wanted more of the father.', '我就说我希望父亲那条线多一点。'),
      ],
      variants: [
        { tag: '没读完', setting: '读书会前一天，你只读到一半。' },
        V('不喜欢这本书', '你觉得这本书被高估了。', {
          3: ['I did not enjoy it. The prose is beautiful, the plot is thin.', '我不太喜欢。文笔好，情节薄。'],
          4: ['That is a fair criticism. Say it with an example.', '这个批评站得住。举个例子说。'],
        }),
        V('第一次来', '你是新成员。', {
          1: ['It is my first time. How does the discussion usually run?', '我第一次来。讨论一般怎么进行？'],
          2: ['One person leads, then we go round. No pressure to speak.', '一个人主持，然后轮流。不想说也没关系。'],
        }),
        V('推荐下一本', '你想提一本。', {
          5: ['Could I suggest the next book? It is short and translated.', '下一本我能推荐吗？很短，是译本。'],
        }),
        V('线上参加', '你要远程加入。', {
          6: ['Can I join online? I am travelling that week.', '能线上参加吗？那周我在外地。'],
        }),
        V('观点冲突', '有人强烈反对你的看法。', {
          7: ['I see it differently, but I am not trying to change your mind.', '我看法不同，但没想说服你。'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方提醒你说话方式，你要接受',
          S('The chair loves this book. Be prepared for an argument.', '主持人很喜欢这本书。做好争论的准备。'),
          [O(S('I will keep it to one point and one example.', '我只说一点，举一个例子。'), S('That is the way to do it.', '就该这样。')),
           O(S('I am not there to win. I want to hear the other side.', '我不是去赢的。我想听另一面。'), S('Then you will enjoy it.', '那你会享受的。'))]),
      ],
      phrases: [
        P('I skimmed the last hundred pages.', '最后一百页我跳着读的。', 'skim 是略读。'),
        P('What did you make of it?', '你觉得怎么样？', '比 what do you think 更口语。'),
        P('Nobody takes it personally.', '没人往心里去。', '讨论前先给个缓冲。'),
      ],
    },

    {
      
      branches: [
        B(5, 'offer', '负责人问你有没有别的能力，你要如实回应',
          S('We are short of drivers this week. Do you have a car?', '这周缺司机。你有车吗？'),
          [O(S('I do, but not insured for deliveries.', '有，但没上配送险。'), S('Then we cannot use it. Thanks for saying.', '那就不能用。谢谢你如实说。')),
           O(S('No car, but I can do the early shift.', '没车，但我能上早班。'), S('That helps just as much.', '那也一样帮得上。'))]),
      ],
id: 'volunteer', name: '第一次做志愿者', lv: 2, cefr: 'A2',
      roles: ['你', '负责人'],
      lines: [
        L(1, 'First time here?', '第一次来？'),
        L(0, 'Yes. I signed up for the food bank.', '是。我报名了食物银行。'),
        L(1, 'Good. We sort donations, then pack bags.', '好。我们分拣捐赠，然后装袋。'),
        L(0, 'How long is a shift?', '一班多久？'),
        L(1, 'Two hours, but stay longer if you like.', '两小时，想多待也行。'),
        L(0, 'What should I wear?', '穿什么？'),
        L(1, 'Closed shoes. It gets cold in the back.', '包脚的鞋。后面挺冷。'),
        L(0, 'Understood. Where do I put my bag?', '明白。包放哪儿？'),
      ],
      variants: [
        { tag: '食物银行分拣', setting: '你第一次做志愿者，提前十分钟到。' },
        V('带东西来', '你想捐一些。', {
          0: ['I brought some tins. Where should they go?', '我带了几罐罐头。放哪儿？'],
          1: ['On the blue table. We check dates before sorting.', '蓝桌子上。分拣前我们会看日期。'],
        }),
        V('想固定来', '你想每周都来。', {
          4: ['Could I come every Tuesday? I have the mornings free.', '我能每周二来吗？上午有空。'],
        }),
        V('带孩子', '你想带孩子一起。', {
          5: ['Can I bring my son? He is twelve.', '我能带儿子来吗？他十二岁。'],
        }),
        V('想多做', '你想承担更多。', {
          6: ['Is there anything else I could help with, not just packing?', '除了装袋，还有别的我能帮的吗？'],
        }),
        V('问证明', '你需要志愿时长证明。', {
          7: ['Could you sign a form for my volunteering hours?', '能帮我签一份志愿时长证明吗？'],
        }),
      ],
      phrases: [
        P('I signed up for the food bank.', '我报名了食物银行。', 'sign up 是报名。'),
        P('How long is a shift?', '一班多久？', 'shift 是排班。'),
        P('Closed shoes.', '穿包脚的鞋。', '仓库做志愿者的基本要求。'),
      ],
    },

    {
      id: 'community-meeting', name: '社区听证会发言', lv: 5, cefr: 'B2',
      roles: ['你', '主持'],
      lines: [
        L(1, 'The council is proposing a new cycle lane.', '市政提议修一条新的自行车道。'),
        L(0, 'Where exactly?', '具体在哪儿？'),
        L(1, 'Along the high street, replacing some parking.', '沿大街走，替换掉一部分停车位。'),
        L(0, 'That will hurt the shops. Have they modelled delivery times?', '那会影响店铺。他们做过送货时间模拟吗？'),
        L(1, 'Not yet. That is what tonight is for.', '还没有。今晚就是为这个。'),
        L(0, 'Then I would like to speak. How long do I get?', '那我想发言。有几分钟？'),
        L(1, 'Three minutes, and you need to sign in first.', '三分钟，要先登记。'),
        L(0, 'I will sign in now.', '我现在去登记。'),
      ],
      variants: [
        { tag: '自行车道听证', setting: '社区中心，来了六十多人，气氛不轻松。' },
        V('支持方', '你支持这个提案。', {
          3: ['I support it. Two of my staff cycle and cannot use that road safely.', '我支持。我有两个员工骑车，那条路不安全。'],
        }),
        V('反对方', '你担心生意。', {
          3: ['Forty percent of my customers park on that side. Where do they go?', '我四成客人停在那一边。他们去哪儿停？'],
          4: ['That is the question the traffic study should answer.', '这正是交通研究该回答的。'],
        }),
        V('要求延期', '你觉得材料不足。', {
          5: ['Could the decision be deferred until the study is published?', '能等研究公布后再决定吗？'],
        }),
        V('代表他人', '你替邻居发言。', {
          0: ['I am speaking for six residents on my street who cannot attend.', '我代表我们街六位来不了的居民发言。'],
        }),
        V('时间不够', '三分钟不够讲。', {
          7: ['Three minutes is not enough for this. Can I submit it in writing?', '三分钟讲不完。能书面提交吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '主持人限制你的发言，你要在规则内争取',
          S('You have three minutes, and no questions to the panel.', '三分钟，不能向小组提问。'),
          [O(S('Then I will keep to two points and leave the rest in writing.', '那我讲两点，其余书面提交。'), S('That is noted. Please come to the microphone.', '记下了。请到麦克风前。')),
           O(S('Can I at least ask one factual question?', '至少能问一个事实性问题吗？'), S('One, at the end, if time allows.', '最后可以问一个，如果时间允许。'))]),
      ],
      phrases: [
        P('Have they modelled delivery times?', '他们做过送货时间模拟吗？', '质疑提案的专业问法。'),
        P('Could the decision be deferred?', '能延后决定吗？', 'defer 是推迟。'),
        P('I am speaking for six residents.', '我代表六位居民发言。', '代表他人发言要先说明。'),
      ],
    },
  ],
};
