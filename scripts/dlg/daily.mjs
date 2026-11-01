import { L, V, S, O, B, P } from './_dsl.mjs';
import { LEGACY } from './_legacy.mjs';

const old = id => LEGACY.find(s => s.id === id);

export default {
  cat: '日常',
  items: [
    /* ---------------- 电梯里的寒暄 ---------------- */
    {
      ...old('smalltalk'),
      variants: [
        { tag: '搬来一个月', setting: '你搬进新公寓一个月，今天在电梯里撞见了邻居。' },
        V('电梯坏了', '电梯坏到第三周，你每天爬六楼。', {
          5: ['So far so good, except the lift has been dead for three weeks.', '住得还行，就是电梯坏了三周。'],
          6: ['Tell me about it. I am on the sixth floor.', '可不是嘛。我住六楼。'],
          7: ['You must be very fit by now. Ha!', '你现在体力一定很好。哈！'],
        }),
        V('想借工具', '你买了书架要装，家里一把螺丝刀都没有。', {
          5: ['So far so good. Do you happen to have a drill?', '住得还行。你正好有电钻吗？'],
          6: ['I do. What are you putting up?', '有。你要装什么？'],
          7: ['A shelf. I will bring it back tonight.', '一个书架。我今晚就还。'],
        }),
        V('对方的狗', '邻居牵着一只很兴奋的小狗。', {
          5: ['So far so good. Is that your dog?', '住得还行。这是你的狗吗？'],
          6: ['He is. Sorry if he barks when I leave.', '是。我出门时它叫的话抱歉。'],
          7: ['He is quiet. He just wants to say hello.', '它很安静。它只是想打个招呼。'],
        }),
        V('垃圾分类', '你搬来后一直搞不清哪天收什么垃圾。', {
          5: ['So far so good. Which day is the recycling?', '住得还行。哪天收可回收垃圾？'],
          6: ['Tuesday for paper, Friday for the rest.', '周二收纸，周五收其它。'],
          7: ['And the bins go out the night before?', '前一晚拿出去就行吗？'],
        }),
      ],
      branches: [
        ...(old('smalltalk').branches ?? []),
        {
          at: 5, kind: 'offer',
          task: '对方邀请你参加一个活动，你要回应',
          prompt: S('A few of us are having a drink on Friday. You should come.', '周五我们几个人要喝一杯。你也来吧。'),
          options: [
            O(S('I would like that. What time?', '好啊。几点？'), S('Eight, in the garden. Bring nothing.', '八点，在花园。什么都不用带。')),
            O(S('I cannot this Friday, but next time?', '这周五不行，下次？'), S('I will knock on your door next time.', '下次我来敲你门。')),
          ],
        },
      ],
    },

    /* ---------------- 理发 ---------------- */
    {
      
      branches: [
        B(3, 'change', '工具出了问题，你要接受一个替代方案',
          S('The clippers just died. Scissors only, if that is all right.', '推子坏了。只能用剪刀，行吗？'),
          [O(S('Scissors are fine, just keep it short.', '剪刀也行，剪短就好。'), S('Then I will go slow and even.', '那我慢慢剪，剪匀。')),
           O(S('How much longer will it take?', '要多花多久？'), S('Fifteen minutes more, no extra charge.', '多十五分钟，不加钱。'))]),
      ],
id: 'barber', name: '理发店剪头', lv: 2, cefr: 'A2',
      roles: ['你', '理发师'],
      lines: [
        L(1, 'What are we doing today?', '今天怎么剪？'),
        L(0, 'Just a trim. Short on the sides, a bit off the top.', '就想修一下。两侧短一点，上面稍微剪短。', 'trim 是「修剪」，不是「剪很多」；说 just a trim 理发师就不会下手太重。'),
        L(1, 'How short on the sides?', '两侧要多短？'),
        L(0, 'A number two, but not down to the skin.', '二号，但别推到露头皮。', 'number two 是推剪的限位梳号数，数字越小越短。'),
        L(1, 'Got it. Shall I leave the front longer?', '明白。前面留长一点吗？'),
        L(0, 'Yes, just tidy it up.', '对，就修整齐。'),
        L(1, 'Do you want a wash as well?', '要洗一下吗？'),
        L(0, 'No, thanks. Just the cut.', '不用，就剪。'),
        L(1, 'That will be twenty-two.', '一共二十二。'),
      ],
      variants: [
        { tag: '修剪一下', setting: '你头发长了两个月，只想修整齐，不想换发型。' },
        V('想换发型', '你想换个样子，但说不清要什么样。', {
          1: ['I want a change. Something shorter but still soft.', '我想换个样子。短一点，但别太硬。'],
          2: ['How about shorter on the sides and textured on top?', '两侧短、上面做点层次怎么样？'],
        }),
        V('带孩子剪', '你带六岁的儿子来剪头，他怕推子。', {
          0: ['Just a trim for him, and please use scissors.', '给他修一下就行，麻烦用剪刀。', '推子 = clippers，孩子怕的时候直接说用 scissors。'],
          1: ['No problem. He can hold the mirror.', '没问题。他可以拿着镜子。'],
        }),
        V('剃胡子', '你想顺便把胡子修一修。', {
          6: ['Could you tidy the beard as well?', '能把胡子也修一下吗？'],
          7: ['Sure, that is five more. Short or just the edges?', '可以，加五块。剪短还是只修边？'],
        }),
        V('不满意', '剪完发现两边不一样长。', {
          8: ['The left side looks longer than the right. Could you even it out?', '左边看着比右边长。能修齐吗？'],
        }),
      ],
      phrases: [
        P('Just a trim, please.', '就修一下。', '不想大改发型时最安全的一句。'),
        P('Short on the sides, a bit off the top.', '两侧短一点，上面稍微剪短。', '理发店的通用句式。'),
        P('Could you even it out?', '能修齐吗？', '剪歪了直接说，不用忍。'),
      ],
    },

    /* ---------------- 洗衣店 ---------------- */
    {
      id: 'laundry', name: '洗衣店送洗', lv: 2, cefr: 'A2',
      roles: ['你', '店员'],
      lines: [
        L(0, 'Hi, how much for a wash and fold?', '你好，洗加叠多少钱？', 'wash and fold 是洗衣店最便宜的服务：洗完叠好，不管熨。'),
        L(1, 'Twelve a load, ready tomorrow.', '一桶十二，明天取。'),
        L(0, 'Can I get it by tonight?', '今晚能取吗？'),
        L(1, 'Same day is eighteen, before six.', '当天取十八，六点前来拿。'),
        L(0, 'Do that. And this shirt needs dry cleaning.', '就当天。这件衬衫要干洗。'),
        L(1, 'That is six more. Any stains?', '再加六块。有污渍吗？'),
        L(0, 'One on the collar. I tried soap and it did not help.', '领子上有一块。我用肥皂试过，没用。'),
        L(1, 'We will have a go. It may not come out fully.', '我们试试。可能去不干净。'),
      ],
      variants: [
        { tag: '洗加叠', setting: '你攒了两周的衣服，想一次性解决。' },
        V('自助洗衣', '你想自己洗，只需要换零钱。', {
          0: ['Do you have a machine I can use myself?', '有能自己用的洗衣机吗？'],
          1: ['Back room, four a wash. The dryer is two.', '后屋，洗四块，烘干两块。'],
        }),
        V('洗羽绒服', '你的羽绒服不知道怎么洗。', {
          0: ['Can you clean a down jacket?', '你们能洗羽绒服吗？'],
          1: ['We can. It takes three days because it has to dry flat.', '能。要三天，得平摊晾干。'],
        }),
        V('染色事故', '你送来时是白衬衫，取的时候发灰。', {
          7: ['This shirt came in white and now it is grey.', '这件衬衫送来是白的，现在发灰。'],
        }),
        V('取件', '你忘了取件单。', {
          2: ['I lost my ticket. Can I still pick up?', '我把取件单丢了。还能取吗？'],
        }),
      ],
      branches: [
        {
          at: 6, kind: 'short',
          task: '对方说洗不掉，你要决定接受还是换方案',
          prompt: S('Honestly, that stain looks set in. We probably cannot lift it.', '说实话，这污渍像是定住了。我们大概洗不掉。'),
          options: [
            O(S('Try anyway. I have nothing to lose.', '还是试试吧，反正也不亏。'), S('We will. If it fades, we will call you first.', '好。要是洗淡了我们先打给您。')),
            O(S('Then just clean the rest of it.', '那就把其它地方洗干净。'), S('Understood. Same price, I am afraid.', '明白。价格还是一样。')),
          ],
        },
      ],
      phrases: [
        P('How much for a wash and fold?', '洗加叠多少钱？', '洗衣店最常用的问价句。'),
        P('This shirt needs dry cleaning.', '这件衬衫要干洗。', 'dry cleaning 干洗，不是「干着洗」。'),
        P('Any stains?', '有污渍吗？', '店员必问，主动说清楚能救回衣服。'),
      ],
    },

    /* ---------------- 邮局 ---------------- */
    {
      id: 'post-office', name: '邮局寄国际件', lv: 3, cefr: 'B1',
      roles: ['你', '柜员'],
      lines: [
        L(0, 'I need to send this to China.', '我要把这个寄到中国。'),
        L(1, 'By air or surface?', '空运还是海运？'),
        L(0, 'Air, please. How long does it take?', '空运。要多久？'),
        L(1, 'Seven to ten days. Do you want tracking?', '七到十天。要追踪吗？'),
        L(0, 'Yes, the signed one.', '要，签收的那种。', 'signed for 是要求签收的服务，丢件索赔时最有用。'),
        L(1, 'That is eighteen fifty. Fill in this form.', '十八块五。填这张表。'),
        L(0, 'Do I write the address in Chinese?', '地址写中文吗？'),
        L(1, 'Both languages, if you can. It helps at the other end.', '能写双语最好。对方那边好处理。'),
      ],
      variants: [
        { tag: '寄包裹回国', setting: '你给家里寄一箱东西，第一次用这边的邮局。' },
        V('寄文件', '你要寄一份合同，必须能查签收。', {
          0: ['I need to send these documents to China, signed for.', '这些文件要寄到中国，要签收。'],
          1: ['Special delivery, then. Nine pounds, two days.', '那用特快专递。九镑，两天到。'],
        }),
        V('买邮票', '你只买邮票，寄明信片。', {
          0: ['Two stamps for postcards to Europe, please.', '两张寄欧洲明信片的邮票。'],
          1: ['That is three twenty. Put them in the box outside.', '三块二。投外面的邮筒。'],
        }),
        V('取包裹', '你有张取件单，但包裹很大。', {
          0: ['I have a card for a parcel. Is it here?', '我有一张包裹通知单。东西在这儿吗？'],
          1: ['It is, but bring the card and some ID.', '在，但要带通知单和证件。'],
        }),
        V('退件', '你的包裹被退回来了。', {
          1: ['This came back to us. The address was incomplete.', '这个退回来了。地址不完整。'],
        }),
      ],
      branches: [
        {
          at: 4, kind: 'cost',
          task: '邮费比你预期贵，你要决定怎么寄',
          prompt: S('Signed for is eighteen fifty. Ordinary air mail is nine.', '签收十八块五。普通航空九块。'),
          options: [
            O(S('I will pay for signed for. It matters.', '我付签收的。这个重要。'), S('Good call. Fill in the form, please.', '明智。请填表。')),
            O(S('Ordinary is fine, it is not valuable.', '普通的就行，不值钱。'), S('Then just the customs label.', '那就只填报关单。')),
          ],
        },
      ],
      phrases: [
        P('By air or surface?', '空运还是海运？', 'surface 是陆运/海运，慢而便宜。'),
        P('Do you want tracking?', '要追踪吗？', 'tracking 是物流追踪号。'),
        P('Both languages, if you can.', '能写双语最好。', '国际件写双语，投递成功率高很多。'),
      ],
    },

    /* ---------------- 银行开户 ---------------- */
    {
      
      branches: [
        B(4, 'change', '你的材料不合格，你要换一个方案',
          S('This bill is four months old. We need something from the last three.', '这张账单是四个月前的。我们要三个月内的。'),
          [O(S('I have a tenancy agreement from last month.', '我有上个月的租约。'), S('That works. Do you have it with you?', '可以。您带了吗？')),
           O(S('Can the bank post me a statement?', '银行能给我寄对账单吗？'), S('We can, but it takes five days.', '可以，但要五天。'))]),
      ],
id: 'bank', name: '银行开户', lv: 4, cefr: 'B1',
      roles: ['你', '柜员'],
      lines: [
        L(0, 'I would like to open an account.', '我想开个账户。'),
        L(1, 'Are you a resident here?', '您是本地居民吗？'),
        L(0, 'Yes, I moved here last month.', '是，我上个月搬来的。'),
        L(1, 'I need your ID and proof of address.', '需要您的证件和地址证明。'),
        L(0, 'I have a utility bill. Is that enough?', '我有水电费账单。够吗？'),
        L(1, 'It is, as long as it is less than three months old.', '够，只要是三个月内的。'),
        L(0, 'Good. And can I set up online banking today?', '好。今天能开通网银吗？'),
        L(1, 'You can. The card comes in five working days.', '可以。卡五个工作日内寄到。'),
      ],
      variants: [
        { tag: '新移民开户', setting: '你刚搬来一个月，房东提醒你尽快开本地账户。' },
        V('换汇', '你要把一笔钱换成当地货币。', {
          0: ['I need to change some money. What is the rate today?', '我想换点钱。今天汇率多少？'],
          1: ['One point one six. Commission is three pounds.', '一点一六。手续费三镑。'],
        }),
        V('卡丢了', '你的银行卡不见了，想先冻结。', {
          0: ['My card is missing. Can you freeze it?', '我的卡找不到了。能冻结吗？'],
          1: ['I can. Was it lost or stolen?', '可以。是丢了还是被偷了？'],
        }),
        V('提高转账限额', '你要付房租，限额不够。', {
          6: ['My transfer limit is too low for the rent. Can it be raised?', '我的转账限额不够付房租。能提高吗？'],
          7: ['We can raise it to five thousand after a security check.', '做完安全验证可以提到五千。'],
        }),
        V('关户', '你要搬走了，想关掉账户。', {
          0: ['I am moving abroad. How do I close the account?', '我要搬到国外。账户怎么关？'],
        }),
      ],
      phrases: [
        P('I would like to open an account.', '我想开个账户。', '开户第一句。'),
        P('Proof of address', '地址证明', '水电单、租约、银行信都算，通常要三个月内。'),
        P('Can you freeze it?', '能冻结吗？', '丢卡第一时间说这句。'),
      ],
    },

    /* ---------------- 药店 ---------------- */
    {
      
      branches: [
        B(4, 'offer', '对方推荐替代品，你要判断能不能用',
          S('Those are out of stock. There is a generic, same ingredient, half the price.', '那种没货了。有个仿制药，成分一样，半价。'),
          [O(S('Same strength?', '剂量一样吗？'), S('Same. Just a different box.', '一样。只是包装不同。')),
           O(S('Will it work as fast?', '起效一样快吗？'), S('Identical, by law.', '按法规完全一样。'))]),
      ],
id: 'pharmacy', name: '药店买药', lv: 3, cefr: 'B1',
      roles: ['你', '药剂师'],
      lines: [
        L(0, 'Do you have anything for a sore throat?', '有治喉咙痛的吗？'),
        L(1, 'Is it dry, or with a cough?', '是干痛，还是带咳嗽？'),
        L(0, 'Dry, and it hurts when I swallow.', '干痛，咽东西就疼。'),
        L(1, 'These lozenges help. One every four hours.', '这种含片有用。四小时一片。'),
        L(0, 'Can I take them with ibuprofen?', '能和布洛芬一起吃吗？'),
        L(1, 'You can, but leave two hours between them.', '可以，但两种药隔两小时。', 'leave two hours between 是「错开两小时」，用药安全的关键句。'),
        L(0, 'Got it. Do I need a prescription?', '明白。需要处方吗？'),
        L(1, 'Not for these. If it lasts more than a week, see a doctor.', '这些不用。要是超过一周，去看医生。'),
      ],
      variants: [
        { tag: '喉咙痛', setting: '你喉咙痛了三天，不想为这点事去诊所排队。' },
        V('处方药', '你要的药必须有处方。', {
          6: ['This one says prescription only. Can you help?', '这个写着只凭处方。能想想办法吗？'],
          7: ['Not without one. A walk-in clinic can issue it today.', '没处方不行。急诊诊所今天就能开。'],
        }),
        V('给孩子', '你要给四岁的孩子买退烧药。', {
          0: ['Something for a fever, for a four-year-old.', '退烧药，给四岁孩子。'],
          1: ['This one is dosed by weight. How heavy is she?', '这种按体重给药。她多重？'],
        }),
        V('过敏', '你吃药总是过敏，想先确认成分。', {
          4: ['I am allergic to penicillin. Is this related?', '我对青霉素过敏。这个跟它有关吗？'],
        }),
        V('买创可贴', '你只是要一些简单的东西。', {
          0: ['Just plasters and something for a small burn.', '就要创可贴和治小烫伤的药。'],
          1: ['Aisle two, on the right. Call me if you need help.', '二号通道右手边。需要帮忙叫我。'],
        }),
      ],
      phrases: [
        P('Do you have anything for a sore throat?', '有治喉咙痛的吗？', '换掉症状就能问任何药。'),
        P('Can I take them with ibuprofen?', '能和布洛芬一起吃吗？', '同时吃多种药必问。'),
        P('Do I need a prescription?', '需要处方吗？', 'prescription 处方药，over the counter 是非处方。'),
      ],
    },

    /* ---------------- 邻居噪音 ---------------- */
    {
      id: 'neighbor-noise', name: '找邻居说噪音', lv: 4, cefr: 'B1',
      roles: ['你', '邻居'],
      lines: [
        L(0, 'Hi, sorry to bother you. The music is quite loud.', '你好，不好意思打扰。音乐有点大声。', '先说 sorry to bother you，再提问题 —— 直接说太吵容易开战。'),
        L(1, 'Oh, I did not realise. Is it coming through the wall?', '哦，我没意识到。是隔着墙传过去的吗？'),
        L(0, 'A bit. I work early, so I am in bed by ten.', '有一点。我上班早，十点就睡。'),
        L(1, 'Sorry about that. I will turn it down.', '抱歉。我调小。'),
        L(0, 'Thanks. And one more thing, the bin bags in the hall.', '谢谢。还有件事，走廊里的垃圾袋。'),
        L(1, 'Are they in the way?', '挡路了吗？'),
        L(0, 'They have been there since Monday. The whole floor smells.', '周一就在那儿了。整层都有味道。'),
        L(1, 'Fair enough. I will take them down tonight.', '说得对。我今晚拿下去。'),
      ],
      variants: [
        { tag: '音乐太大声', setting: '楼上十一点还在放低音很重的音乐，你第二天六点要起。' },
        V('装修', '隔壁连续一周早上七点开始钻墙。', {
          0: ['Hi, the drilling starts at seven. Could it be later?', '你好，七点就开始钻。能晚一点吗？'],
          1: ['The builders set their own hours. I will ask them to start at nine.', '工人的时间是自己的。我让他们九点开始。'],
        }),
        V('狗叫', '邻居的狗每天下午叫两个小时。', {
          0: ['Hi, your dog barks most afternoons. Is he alone then?', '你好，你的狗下午经常叫。那时候它一个人在家吗？'],
          1: ['He is. I only found out last week.', '是的。我上周才知道。'],
        }),
        V('漏水', '你家天花板渗水，怀疑是楼上。', {
          0: ['Water is coming through my ceiling. I think it is from your bathroom.', '我家天花板在渗水。我觉得是从你浴室来的。'],
          1: ['Let me look. I will call a plumber today.', '我看看。我今天叫水管工。'],
        }),
        V('停车位', '有人一直停你的车位。', {
          0: ['Someone keeps parking in my space. Is it your car?', '有人一直停我的车位。是你的车吗？'],
        }),
      ],
      branches: [
        {
          at: 2, kind: 'probe',
          task: '对方反问，你要把话说清楚又不激化',
          prompt: S('It is only ten. Is it really that loud?', '才十点。真有那么吵吗？'),
          options: [
            O(S('The bass carries. I can hear it in my bedroom.', '低音传得远。我卧室里都能听见。'), S('Fair. I will move the speaker off the wall.', '有道理。我把音箱从墙边挪开。')),
            O(S('It is not the volume, it is the hour. I am up at six.', '不是音量，是时间。我六点起。'), S('Understood. Weeknights I will keep it low.', '明白。工作日我开小。')),
          ],
        },
      ],
      phrases: [
        P('Sorry to bother you.', '不好意思打扰。', '开口先软一句，后面说什么都好谈。'),
        P('I work early, so I am in bed by ten.', '我上班早，十点就睡。', '给出理由比只说太吵有效。'),
        P('Fair enough.', '说得对。', '对方认错时的自然回应。'),
      ],
    },

    /* ---------------- 收快递 ---------------- */
    {
      
      branches: [
        B(3, 'change', '对方的时间对不上，你要重新安排',
          S('I finish at five, so it would be tomorrow morning.', '我五点下班，那得明天早上。'),
          [O(S('Tomorrow morning works. Ring twice.', '明天早上可以。按两次门铃。'), S('Will do. I will leave it with you in person.', '好。我当面交给您。')),
           O(S('Can you leave it somewhere hidden?', '能放在不容易看见的地方吗？'), S('Behind the bin, if it does not rain.', '不下雨就放垃圾桶后面。'))]),
      ],

      branches: [
        B(5, 'short', '邻居也不在家，你要另想办法',
          S('Number 304 is away this week. Nobody is answering.', '304 这周不在家。没人应门。'),
          [O(S('Could you leave it at the pickup point?', '能放自提点吗？'), S('I can drop it there on my way back.', '我回去路上放过去。')),
           O(S('I will ask the office to take it.', '我让物业代收。'), S('They close at five, same as me.', '他们五点关，跟我一样。'))]),
      ],
id: 'parcel', name: '快递送上门', lv: 2, cefr: 'A2',
      roles: ['你', '快递员'],
      lines: [
        L(1, 'Delivery. I have a parcel for 302.', '快递。302 有个包裹。'),
        L(0, 'That is me. Could you leave it by the door?', '是我。能放门口吗？'),
        L(1, 'I need a signature. Are you home now?', '要签收。你现在在家吗？'),
        L(0, 'I am at work. Can you come back after six?', '我在上班。六点后能再来吗？'),
        L(1, 'My shift ends at five. It would be tomorrow.', '我五点下班。那得明天了。'),
        L(0, 'Then could you leave it with a neighbour?', '那能放在邻居那儿吗？'),
        L(1, 'Number 304 took one for you last time. Shall I try there?', '304 上次帮您收过。我去那儿试试？'),
        L(0, 'Perfect. Thanks a lot.', '太好了。多谢。'),
      ],
      variants: [
        { tag: '上班不在家', setting: '你在开会，手机静音，快递员打了两次没通。' },
        V('改地址', '你临时搬到朋友家住。', {
          2: ['I am staying somewhere else this week. Can you redirect it?', '我本周住别处。能改地址吗？'],
          3: ['Not from the van. Call the depot and they will reroute it.', '车上改不了。打站点电话，他们能改。'],
        }),
        V('自提点', '你不想麻烦邻居，想去自提点拿。', {
          5: ['Could you drop it at the pickup point instead?', '能放自提点吗？'],
          6: ['The one on the corner? I can do that before six.', '街角那个？六点前我可以放。'],
        }),
        V('大件上楼', '你买的是桌子，需要搬上楼。', {
          1: ['It is a desk. Can you bring it up to the third floor?', '是一张桌子。能搬上三楼吗？'],
        }),
        V('件丢了', '物流显示已签收，但你没收到。', {
          0: ['The tracking says delivered, but nothing arrived.', '物流显示已签收，但我没收到。'],
          1: ['Sometimes it is left with a neighbour. Let me ask around.', '有时会放邻居那儿。我问问。'],
        }),
      ],
      phrases: [
        P('Could you leave it by the door?', '能放门口吗？', '最省事的收件方案。'),
        P('Could you leave it with a neighbour?', '能放邻居那儿吗？', '不在家时的备选。'),
        P('Can you bring it up to the third floor?', '能搬上三楼吗？', '大件必问，不然只送到楼下。'),
      ],
    },

    /* ---------------- 报修 ---------------- */
    {
      id: 'repair', name: '报修洗衣机', lv: 3, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(0, 'My washing machine is leaking.', '我的洗衣机在漏水。'),
        L(1, 'How old is it?', '用了多久？'),
        L(0, 'Two years. It is still under warranty.', '两年。还在保修期内。'),
        L(1, 'We can send someone Thursday, between nine and twelve.', '我们周四可以派人，九点到十二点之间。'),
        L(0, 'Do I need to be home?', '我需要在家吗？'),
        L(1, 'Someone over eighteen has to let him in.', '得有个十八岁以上的人开门。'),
        L(0, 'Thursday morning works. Is there a call-out fee?', '周四上午可以。有上门费吗？'),
        L(1, 'Not under warranty. Parts are covered too.', '保修期内没有。零件也含。'),
      ],
      variants: [
        { tag: '洗衣机漏水', setting: '洗衣机下面一滩水，地板已经泡了。' },
        V('空调不制冷', '空调开着但吹的是热风。', {
          0: ['The air conditioning runs but blows warm air.', '空调在转，但吹的是热风。'],
          1: ['Could be the filter or the gas. We will check both.', '可能是滤网或冷媒。我们两样都查。'],
        }),
        V('水管爆了', '厨房水管在喷水，你要人马上来。', {
          0: ['A pipe burst under the sink. I need someone today.', '水槽下面的管子爆了。今天就要人来。'],
          1: ['Turn off the mains first. I will send the emergency team.', '先关总阀。我派应急队。', 'mains 是总水管/总电闸，应急第一件事。'],
        }),
        V('门锁坏了', '你被锁在门外。', {
          0: ['I am locked out. The key turns but the door will not open.', '我被锁在外面了。钥匙能转，门打不开。'],
        }),
        V('问报价', '修之前你想知道大概多少钱。', {
          6: ['What would a repair like this cost without warranty?', '这种情况不在保修内要多少钱？'],
          7: ['About ninety for the visit, plus parts.', '上门大概九十，零件另算。'],
        }),
      ],
      branches: [
        {
          at: 6, kind: 'change',
          task: '上门时间被占了，你要换到一个能配合的时间',
          prompt: S('Thursday morning just went. The earliest now is Monday.', '周四上午刚被订走。现在最早是周一。'),
          options: [
            O(S('Monday morning, then. I will work from home.', '那就周一上午。我在家办公。'), S('Booked. You will get a text when he sets off.', '订好了。他出发时会发短信。')),
            O(S('Can you put me on the cancellation list?', '能把我放取消候补吗？'), S('I can. People often cancel the night before.', '可以。很多人前一晚取消。')),
          ],
        },
      ],
      phrases: [
        P('It is still under warranty.', '还在保修期内。', 'warranty 是保修，和 insurance 不是一回事。'),
        P('Turn off the mains.', '关掉总阀。', '漏水漏电第一句。'),
        P('Is there a call-out fee?', '有上门费吗？', 'call-out fee 是上门服务费。'),
      ],
    },
  ],
};
