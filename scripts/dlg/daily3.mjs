import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '生活',
  items: [
    {
      id: 'buy-mattress', name: '买床垫', lv: 3, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'What size are you after?', '要什么尺寸？'),
        L(0, 'Double. The old one has a spring coming through.', '双人。旧的已经有一根弹簧顶出来了。'),
        L(1, 'Firm, medium or soft?', '硬、中、软？'),
        L(0, 'Medium. I sleep on my side.', '中等。我侧睡。'),
        L(1, 'This one is the best seller. Try it for a minute.', '这款最好卖。躺一分钟试试。'),
        L(0, 'It feels good. Do you take the old one away?', '挺舒服。旧床垫能带走吗？'),
        L(1, 'For twenty, on delivery.', '二十，送货时带走。'),
        L(0, 'And can I return it if I hate it after a week?', '如果一周后不喜欢能退吗？'),
      ],
      variants: [
        { tag: '旧床垫顶出弹簧', setting: '你睡了三年的床垫塌了一边。' },
        V('要试躺', '你想多试几款。', {
          4: ['Could I lie on three of them for a few minutes each?', '能每款躺几分钟试试吗？'],
          5: ['Take your time. The shop is quiet until five.', '慢慢来。五点前人不多。'],
        }),
        V('过敏', '你对乳胶过敏。', {
          1: ['Do you have anything without latex? I react to it.', '有不含乳胶的吗？我对它过敏。'],
          2: ['The pocket spring range is latex free.', '独立袋装弹簧那几款不含乳胶。'],
        }),
        V('送货上楼', '你住三楼。', {
          6: ['Can they carry it up to the third floor?', '能搬上三楼吗？'],
          7: ['Included, as long as the stairs are wide enough.', '含在内，只要楼梯够宽。'],
        }),
        V('预算', '你只有三百。', {
          0: ['What can I get for three hundred?', '三百能买什么？'],
        }),
        V('小孩床', '你给孩子买。', {
          3: ['It is for a six-year-old. Something wipeable.', '给六岁孩子。要能擦洗的。'],
        }),
      ],
      branches: [
        B(5, 'offer', '店员推荐延保，你要判断值不值',
          S('For thirty you get ten years against sagging.', '加三十保十年不下陷。'),
          [O(S('What does it actually cover?', '具体保什么？'), S('A dip of more than two centimetres.', '下陷超过两厘米。')),
           O(S('Ten years is longer than I will stay here.', '十年比我住这儿的时间还长。'), S('Then skip it. Fair.', '那就别买。合理。'))]),
      ],
      phrases: [
        P('A spring is coming through.', '有弹簧顶出来了。', '描述旧床垫问题。'),
        P('I sleep on my side.', '我侧睡。', '选硬度最关键的信息。'),
        P('Do you take the old one away?', '旧床垫能带走吗？', '换床垫必问。'),
      ],
    },

    {
      id: 'hire-van', name: '租货车搬家', lv: 4, cefr: 'B1',
      roles: ['你', '租车行'],
      lines: [
        L(1, 'How long do you need it?', '要租多久？'),
        L(0, 'Four hours. Just moving a sofa across town.', '四小时。就搬一张沙发过城。'),
        L(1, 'That is thirty-five, plus the deposit.', '三十五，另加押金。'),
        L(0, 'Do I need a special licence?', '需要特殊驾照吗？'),
        L(1, 'Not for this size. A standard licence is fine.', '这个尺寸不用。普通驾照就行。'),
        L(0, 'Is insurance included?', '含保险吗？'),
        L(1, 'Basic is. Excess is five hundred if you damage it.', '基本险含。损坏免赔五百。'),
        L(0, 'What about fuel?', '油呢？'),
      ],
      variants: [
        { tag: '租四小时搬沙发', setting: '你同城搬一张沙发，想自己租车。' },
        V('加驾驶员', '你和朋友轮流开。', {
          5: ['Can I add a second driver for the afternoon?', '能加一个下午的第二驾驶员吗？'],
          6: ['Ten pounds, and I need their licence here.', '十镑，要带他的驾照来。'],
        }),
        V('异地还车', '你想在别处还。', {
          0: ['Can I return it to the branch near my new flat?', '能还到新家附近那个点吗？'],
          1: ['One-way is an extra twenty, if they have space.', '异地还车加二十，前提是有位。'],
        }),
        V('超高', '你要运很高的柜子。', {
          3: ['The wardrobe is two metres tall. Will it fit?', '衣柜两米高。装得下吗？'],
          4: ['The luton is two point one inside. Measure twice.', '厢式车内高两点一米。量两次。'],
        }),
        V('油政策', '你想知道还车油量。', {
          7: ['Full to full, or do I buy a tank?', '满油还满油，还是买一箱？'],
        }),
        V('迟到还', '你晚了。', {
          6: ['If I am an hour late, what is the charge?', '晚一小时怎么收？'],
        }),
      ],
      branches: [
        B(5, 'cost', '对方报了免赔额，你要决定买不买补充险',
          S('The excess is five hundred. Our waiver brings it to fifty for twelve pounds.', '免赔五百。我们的补充险十二镑降到五十。'),
          [O(S('Take the waiver. Twelve is cheap for the peace of mind.', '加补充险。十二块买个安心。'), S('Sensible for a first drive in a big van.', '第一次开大车确实该买。')),
           O(S('I will risk it. I am only doing two miles.', '不买了。我只开两英里。'), S('Your call. Check the height barrier at the car park.', '随您。注意停车场的限高杆。'))]),
      ],
      phrases: [
        P('Do I need a special licence?', '需要特殊驾照吗？', '租货车先确认。'),
        P('Excess is five hundred.', '免赔额五百。', 'excess 是要自付的部分。'),
        P('Full to full?', '满油还满油？', '油政策影响还车成本。'),
      ],
    },

    {
      id: 'storage', name: '租自助仓储', lv: 3, cefr: 'B1',
      roles: ['你', '仓储公司'],
      lines: [
        L(1, 'What are you storing?', '存什么？'),
        L(0, 'About ten boxes and a bike. Three months.', '大概十个箱子加一辆车。三个月。'),
        L(1, 'A five square metre unit would do.', '五平米就够了。'),
        L(0, 'Is it heated? I have books.', '有暖气吗？我有书。'),
        L(1, 'Not that one. Heated units start at ten metres.', '那间没有。带暖气的最小十平米。'),
        L(0, 'What does that cost?', '多少钱？'),
        L(1, 'Eighty a month, with a discount for six months.', '一个月八十，签六个月有折扣。'),
        L(0, 'Can I get to it at any time?', '随时能进吗？'),
      ],
      variants: [
        { tag: '十个箱子加自行车', setting: '你换房有两周空档，东西没处放。' },
        V('要暖气', '你有书和相册。', {
          4: ['Books and photos will warp in the cold. Is there heating?', '书和相册受潮会变形。有暖气吗？'],
        }),
        V('短期', '你只要两周。', {
          5: ['Two weeks only. Is there a minimum?', '只存两周。有最短期限吗？'],
        }),
        V('保险', '你想知道东西丢了赔不赔。', {
          6: ['Is the contents insured while it is here?', '存放期间东西有保险吗？'],
        }),
        V('大件', '你要存钢琴。', {
          3: ['Can I store an upright piano?', '能存一架立式钢琴吗？'],
        }),
        V('进出时间', '你要晚上来。', {
          7: ['Is access twenty-four hours, or only office hours?', '是二十四小时开放，还是只在办公时间？'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方问你湿度敏感的物品，你要说清',
          S('Anything that reacts to damp, like paper or leather?', '有怕潮的东西吗，比如纸或皮革？'),
          [O(S('Books and a leather jacket.', '书和一件皮衣。'), S('Then take the heated unit, or add a dehumidifier.', '那要带暖气的，或者加个除湿机。')),
           O(S('Just furniture and a bike.', '只有家具和自行车。'), S('Then the cheap unit is fine.', '那便宜的就够。'))]),
      ],
      phrases: [
        P('A five square metre unit would do.', '五平米就够了。', 'would do 是足够。'),
        P('Is it heated?', '有暖气吗？', '书本、皮革、乐器都怕潮。'),
        P('Is access twenty-four hours?', '是二十四小时开放吗？', '搬东西常要晚上。'),
      ],
    },

    {
      id: 'gym-cancel', name: '退健身房会籍', lv: 4, cefr: 'B1',
      roles: ['你', '健身房'],
      lines: [
        L(1, 'How can I help?', '有什么可以帮您？'),
        L(0, 'I would like to cancel my membership.', '我想退会。'),
        L(1, 'Can I ask why?', '能问一下原因吗？'),
        L(0, 'I moved across town. It is an hour each way now.', '我搬到城的另一边。现在单程一小时。'),
        L(1, 'We have a branch near you. Would that help?', '你附近我们有分店。可以吗？'),
        L(0, 'I checked. It has no pool, and that is why I joined.', '我查过。那家没有泳池，我当初就是为泳池来的。'),
        L(1, 'Then I will process it. Notice is one month.', '那我给您办。通知期一个月。'),
        L(0, 'Will I be charged for next month?', '下个月还会扣钱吗？'),
      ],
      variants: [
        { tag: '搬家离太远', setting: '你搬到城另一头，单程一小时。' },
        V('受伤', '你受伤不能练。', {
          3: ['I tore a ligament. The doctor says six months off.', '我韧带撕裂。医生说六个月不能练。'],
          4: ['Send the medical note and we freeze it instead.', '把诊断证明发来，我们可以冻结。'],
        }),
        V('涨价', '会费涨了。', {
          0: ['My fee went up without notice. I want to cancel.', '会费没通知就涨了。我要退。'],
        }),
        V('冻结', '你只是想暂停。', {
          5: ['Could I freeze it for three months instead?', '能改成冻结三个月吗？'],
        }),
        V('设备', '器械老是坏。', {
          6: ['Half the machines have been broken for a month.', '一半器械坏了一个月。'],
        }),
        V('扣款', '退会后还在扣。', {
          7: ['I cancelled last month and you charged me again.', '我上月退了，你们又扣了一次。'],
        }),
      ],
      branches: [
        B(5, 'offer', '对方给了一个挽留方案，你要判断',
          S('I can move you to the off-peak rate, twenty a month.', '可以给您转非高峰价，一个月二十。'),
          [O(S('Would I still be able to swim at six in the morning?', '早上六点还能游吗？'), S('That is peak. You would need the full rate.', '那是高峰。得按全价。')),
           O(S('Twenty is fair. Let us do that.', '二十可以。就这个吧。'), S('I will switch it from next month.', '下月起给您转。'))]),
      ],
      phrases: [
        P('I would like to cancel my membership.', '我想退会。', 'membership 是会员资格。'),
        P('Notice is one month.', '通知期一个月。', '退会通常要提前一个月。'),
        P('Could I freeze it instead?', '能改成冻结吗？', 'freeze 是暂停会籍。'),
      ],
    },

    {
      id: 'mail-redirect', name: '办邮件转寄', lv: 3, cefr: 'B1',
      roles: ['你', '邮局'],
      lines: [
        L(1, 'How long would you like the redirect for?', '要转寄多久？'),
        L(0, 'Three months. I am not sure how much post still comes.', '三个月。不确定还有多少信。'),
        L(1, 'Three months is thirty-two pounds.', '三个月三十二镑。'),
        L(0, 'Does it cover parcels as well?', '包裹也转吗？'),
        L(1, 'Only letters. Parcels go back to the sender.', '只转信件。包裹退回寄件人。'),
        L(0, 'Can I add the old tenant names?', '能加上前租客的名字吗？'),
        L(1, 'You can, for a fee. It avoids confusion.', '可以，收一点费用。能避免混乱。'),
        L(0, 'Let us add them.', '那就加上。'),
      ],
      variants: [
        { tag: '搬家转寄三个月', setting: '你搬走了，怕重要信件寄到旧地址。' },
        V('改地址', '你想彻底改地址。', {
          3: ['Can I just tell everyone my new address instead?', '我能不能直接通知各方改地址？'],
          4: ['Slower, but free. Banks and the council first.', '慢但免费。先通知银行和市政。'],
        }),
        V('国际转寄', '你要转到国外。', {
          1: ['I am moving abroad. Can you redirect there?', '我要搬到国外。能转寄过去吗？'],
        }),
        V('期限', '你想知道最长能转多久。', {
          2: ['What is the longest redirect you offer?', '最长能转多久？'],
        }),
        V('取消', '你提前搬回来了。', {
          5: ['I moved back early. Can I cancel and get a refund?', '我提前搬回来了。能取消退款吗？'],
        }),
        V('丢信', '有信没转到。', {
          6: ['Two letters never arrived. Is there a claim process?', '有两封信没到。有申诉流程吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '柜台问你有没有前租客的信，你要决定',
          S('Do you want their names on the redirect too? It costs six more.', '要把他们的名字也加上吗？多六镑。'),
          [O(S('Yes. Their bank letters keep coming.', '加。他们的银行信一直来。'), S('That will stop most of it.', '这样能挡掉大半。')),
           O(S('No. I will return anything that is not mine.', '不用。不是我的我退回。'), S('Write return to sender on them.', '在上面写「退回寄件人」。'))]),
      ],
      phrases: [
        P('How long would you like the redirect?', '要转寄多久？', 'redirect 是转寄服务。'),
        P('Parcels go back to the sender.', '包裹退回寄件人。', '转寄只含信件。'),
        P('Return to sender.', '退回寄件人。', '写错收件人的标准处理。'),
      ],
    },

    {
      id: 'water-bill', name: '水费翻倍', lv: 4, cefr: 'B1',
      roles: ['你', '水务公司'],
      lines: [
        L(1, 'What is the problem?', '什么问题？'),
        L(0, 'My bill doubled and I live alone.', '我的水费翻倍，而我一个人住。'),
        L(1, 'Let me check the readings. Did you send one?', '我看下读数。您报过吗？'),
        L(0, 'No. It says estimated on the bill.', '没有。账单上写的是估算。'),
        L(1, 'Then we have been guessing. Read the meter and send it.', '那是我们在估。抄一下表报过来。'),
        L(0, 'Where is the meter?', '表在哪儿？'),
        L(1, 'Under the kitchen sink, or outside in a box.', '厨房水槽下，或者外面箱子里。'),
        L(0, 'If the reading is lower, will you refund?', '如果读数更低，会退钱吗？'),
      ],
      variants: [
        { tag: '独居水费翻倍', setting: '你收到账单，用水量是上季度的两倍。' },
        V('漏水', '你怀疑地下漏水。', {
          3: ['Could it be a leak? Nothing changed in the flat.', '会不会是漏水？家里没变。'],
          4: ['We can test the supply overnight. If the meter moves, it leaks.', '可以夜间测管道。表还在走就是漏。'],
        }),
        V('换表', '你怀疑表坏了。', {
          5: ['The meter may be faulty. Can you test it?', '表可能有问题。能检测吗？'],
        }),
        V('新住户', '你刚搬进来。', {
          1: ['I only moved in six weeks ago. Is the bill for the old tenant?', '我六周前才搬来。这账单是前租客的吗？'],
        }),
        V('付款计划', '你付不起一次。', {
          6: ['Can I spread this over three months?', '能分三个月付吗？'],
        }),
        V('污水费', '你不明白其中一项。', {
          7: ['What is the surface water charge?', '地表水费是什么？'],
        }),
      ],
      branches: [
        B(5, 'probe', '客服问你住处情况，你要说清',
          S('Is the property metered, or is it a fixed charge?', '这套房是装表计量，还是固定收费？'),
          [O(S('Metered. I can read it now if you wait.', '装表。你等我一下，我现在能读。'), S('I will hold. Read the black numbers only.', '我等着。只读黑色数字。')),
           O(S('I do not know. The bill says cubic metres.', '我不知道。账单上写的是立方米。'), S('Then it is metered. The meter is usually outside.', '那是装表的。表一般在外面。'))]),
      ],
      phrases: [
        P('It says estimated on the bill.', '账单上写的是估算。', 'estimated 是估算读数。'),
        P('Read the meter and send it.', '抄表报过来。', '自己报读数能避免多收。'),
        P('Can I spread this over three months?', '能分三个月付吗？', 'spread 是分摊。'),
      ],
    },

    {
      
      branches: [
        B(5, 'probe', '热线要确认位置，你要说准',
          S('Is the lamp on the road side or the pavement side?', '灯在车道那边还是人行道那边？'),
          [O(S('Pavement side, right above the crossing.', '人行道那边，就在人行横道上方。'), S('That one has been reported twice today.', '那盏今天已经报过两次了。')),
           O(S('I am not sure. It is the one that flickers.', '我不确定。就是那盏一直闪的。'), S('Then I know the one. Thank you.', '那我知道是哪盏了。谢谢。'))]),
      ],
id: 'street-light', name: '报修路灯', lv: 2, cefr: 'A2',
      roles: ['你', '市政热线'],
      lines: [
        L(1, 'Which street is the lamp on?', '灯在哪条街？'),
        L(0, 'Elm Road, outside number fourteen. Dark for a week.', '榆树路，十四号外面。黑了一周。'),
        L(1, 'We can send an engineer within five working days.', '五个工作日内派工程师。'),
        L(0, 'The pavement is very dark. Anything sooner?', '人行道很黑。能快点吗？'),
        L(1, 'I can mark it urgent. That is two days.', '我可以标为紧急。两天。'),
        L(0, 'Please do. There is a school on that corner.', '麻烦标一下。那个拐角有学校。'),
        L(1, 'Noted. It goes to the top of the list.', '记下了。会排到最前。'),
        L(0, 'Will I get a reference number?', '会给我一个受理号吗？'),
      ],
      variants: [
        { tag: '路灯坏了一周', setting: '你每天走夜路，拐角那盏灯不亮了。' },
        V('井盖', '路面井盖响。', {
          0: ['A manhole cover rattles every time a car goes over it.', '每次过车，井盖就响。'],
          1: ['That is a safety issue. I will log it as urgent.', '那是安全问题。我标紧急。'],
        }),
        V('路面坑', '有个大坑。', {
          3: ['There is a pothole that keeps filling with water.', '有个坑一直积水。'],
        }),
        V('垃圾', '有人乱倒垃圾。', {
          4: ['Someone dumped a mattress on the pavement.', '有人把床垫扔在人行道上。'],
        }),
        V('树', '树枝挡路。', {
          5: ['A branch is hanging low over the path. Tall people duck.', '一根树枝垂得很低。高个子得低头。'],
        }),
        V('跟进', '一周没动静。', {
          6: ['It has been a week and nothing happened. Can you check?', '一周了没动静。能查一下吗？'],
        }),
      ],
      phrases: [
        P('Dark for a week.', '黑了一周。', '说时长，工单会升级。'),
        P('Anything sooner?', '能快点吗？', '比 complain 有效。'),
        P('Will I get a reference number?', '有受理号吗？', '跟进全靠这个号。'),
      ],
    },

    {
      
      branches: [
        B(5, 'probe', '店员问你的预算，你要说范围',
          S('Do you want the full list now, or start with the essentials?', '现在买全套，还是先买必需的？'),
          [O(S('Essentials first. The rest after the first week.', '先买必需的。其余开学一周后再补。'), S('Then two shirts and one blazer today.', '那今天两件衬衫加一件外套。')),
           O(S('The full list. I would rather not come back.', '全套吧。我不想再来一趟。'), S('I will tick everything off as we go.', '我们一条条勾掉。'))]),
      ],
id: 'school-uniform', name: '买校服', lv: 3, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Is this for September?', '是九月开学用吗？'),
        L(0, 'Yes. He starts year seven.', '是。他上初一。'),
        L(1, 'You will need two blazers, three shirts and the tie.', '需要两件西装外套、三件衬衫和领带。'),
        L(0, 'Do the blazers come with the badge?', '外套带校徽吗？'),
        L(1, 'They do, but the sports kit is separate.', '带。运动服另买。'),
        L(0, 'How much is the whole lot?', '一整套多少钱？'),
        L(1, 'About a hundred and forty, and it lasts two years.', '大概一百四，能穿两年。'),
        L(0, 'Are there second-hand ones?', '有二手的吗？'),
      ],
      variants: [
        { tag: '初一新生校服', setting: '开学前两周，店里全是家长。' },
        V('二手', '你想省钱。', {
          7: ['Does the school run a second-hand sale?', '学校有二手义卖吗？'],
          6: ['They do, in July. Blazers are half price there.', '有，七月。外套半价。'],
        }),
        V('尺码', '孩子长得快。', {
          3: ['He grows two sizes a year. Should I buy bigger?', '他一年长两个码。要买大吗？'],
          4: ['One size up in the blazer, not the trousers.', '外套大一码，裤子不用。'],
        }),
        V('换货', '你想知道能不能换。', {
          5: ['Can I exchange if the size is wrong?', '尺码不对能换吗？'],
        }),
        V('体育服', '你问运动服。', {
          2: ['What is in the sports kit?', '运动服包括什么？'],
        }),
        V('刺绣', '名字要绣上。', {
          0: ['Do I need to put his name inside everything?', '每件都要写名字吗？'],
        }),
      ],
      phrases: [
        P('He starts year seven.', '他上初一。', 'year seven 是英国初一。'),
        P('Does it come with the badge?', '带校徽吗？', '有的学校校徽另收费。'),
        P('Are there second-hand ones?', '有二手的吗？', '校服二手市场很成熟。'),
      ],
    },
  ],
};
