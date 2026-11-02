import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '政务',
  items: [
    {
      id: 'council-tax', name: '市政税过户', lv: 4, cefr: 'B1',
      roles: ['你', '市政厅'],
      lines: [
        L(1, 'How can I help?', '有什么可以帮您？'),
        L(0, 'I moved in last month and the bill still has the old name.', '我上个月搬进来，账单还是前房主的名字。'),
        L(1, 'When did the previous owner move out?', '前房主什么时候搬走的？'),
        L(0, 'The same day. The keys were handed over on the third.', '同一天。三号交的钥匙。'),
        L(1, 'Then you are liable from the third. I will reissue it.', '那您从三号起承担。我重新出单。'),
        L(0, 'Is there a single person discount?', '有单身折扣吗？'),
        L(1, 'There is, twenty-five percent. I will add the form.', '有，减免两成五。我把表格附上。'),
        L(0, 'And can I pay over ten months instead of twelve?', '能分十个月付而不是十二个月吗？'),
      ],
      variants: [
        { tag: '账单还是旧名字', setting: '你搬进来一个月，市政税单还是前房主。' },
        V('学生免缴', '你是全日制学生。', {
          2: ['I am a full-time student. Is the flat exempt?', '我是全日制学生。这套房免缴吗？'],
          3: ['With a certificate, yes. Send it and we backdate it.', '有在读证明就免。发来我们从入住日算。'],
        }),
        V('空置', '房子空着几个月。', {
          0: ['The flat was empty for four months before I bought it.', '我买之前房子空了四个月。'],
        }),
        V('折扣取消', '你伴侣搬进来了。', {
          5: ['My partner moved in, so the single discount should stop.', '我伴侣搬进来了，单身折扣应该取消。'],
          6: ['Thank you for telling us. It changes from next month.', '谢谢告知。从下月调整。'],
        }),
        V('争议估值', '你觉得税档太高。', {
          7: ['Can I challenge the band? The flat is smaller than next door.', '能申请复核税档吗？这套比隔壁小。'],
        }),
        V('付款', '你想改付款日。', {
          4: ['Could the payment date move to the fifteenth?', '付款日能改到十五号吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方要核实居住情况，你要给得出',
          S('Do you have the completion statement or the tenancy agreement?', '有成交单或租约吗？'),
          [O(S('The tenancy agreement, dated the third.', '租约，日期是三号。'), S('That is all I need. I will backdate it.', '这就够了。我按那天算。')),
           O(S('It is in a box somewhere. Can I email it later?', '在箱子里。能之后邮件发吗？'), S('Then the bill stays in the old name until it arrives.', '那在收到之前账单还是旧名字。'))]),
      ],
      phrases: [
        P('You are liable from the third.', '您从三号起承担。', 'liable 是负有责任。'),
        P('Single person discount.', '单身折扣。', '通常减免 25%。'),
        P('Can I challenge the band?', '能复核税档吗？', 'band 是房屋税档。'),
      ],
    },

    {
      
      branches: [
        B(4, 'probe', '对方把规则说得很细，你要确认边界',
          S('If it is more than half full of food, it goes in the general waste.', '食物超过一半的话，扔一般垃圾。'),
          [O(S('So a greasy box is general waste?', '所以沾油的盒子算一般垃圾？'), S('Exactly. Rinse the clean ones and they can be recycled.', '对。干净的冲一下可以回收。')),
           O(S('That seems wasteful. Is there another option?', '这有点浪费。有别的办法吗？'), S('Home compost, if you have one.', '有堆肥桶的话可以堆肥。'))]),
      ],
id: 'recycling', name: '垃圾分类咨询', lv: 2, cefr: 'A2',
      roles: ['你', '社区服务'],
      lines: [
        L(0, 'I am not sure which bin takes what.', '我不确定哪个桶放什么。'),
        L(1, 'Green is garden waste, blue is mixed recycling.', '绿的是园林垃圾，蓝的是混合回收。'),
        L(0, 'What about pizza boxes with grease on them?', '沾了油的披萨盒呢？'),
        L(1, 'Not in the blue bin. Grease ruins the load.', '不能放蓝桶。油会毁掉整批。'),
        L(0, 'And broken glass?', '碎玻璃呢？'),
        L(1, 'Wrapped, in the grey bin. Never loose.', '包好放灰桶。绝不能散着放。'),
        L(0, 'Do you collect on bank holidays?', '公共假日收吗？'),
        L(1, 'A day later that week. The calendar is on the lid.', '那周晚一天。日历贴在桶盖上。'),
      ],
      variants: [
        { tag: '不确定怎么分', setting: '你搬来第一周，三个桶摆在厨房门口。' },
        V('电池', '你有旧电池。', {
          4: ['Where do old batteries go? I have a bag of them.', '旧电池放哪儿？我有一袋。'],
          5: ['Never in the bin. The shop takes them, or the library.', '绝不能进垃圾桶。商店或图书馆收。'],
        }),
        V('大件家具', '你要扔沙发。', {
          0: ['How do I get rid of a sofa?', '沙发怎么处理？'],
          1: ['Book a bulky waste collection. It is twenty.', '预约大件回收。二十块。'],
        }),
        V('厨余', '你有厨余桶。', {
          6: ['Is the food waste collected weekly?', '厨余每周收吗？'],
        }),
        V('商业垃圾', '你开小店。', {
          7: ['I run a shop. Can I use the home bins?', '我开小店。能用家用桶吗？'],
        }),
        V('投诉', '没人来收。', {
          3: ['Nobody has collected ours for two weeks.', '我们这儿两周没人收了。'],
        }),
      ],
      phrases: [
        P('Which bin takes what?', '哪个桶放什么？', '搬家第一周必问。'),
        P('Grease ruins the load.', '油会毁掉整批。', '解释了为什么不能放。'),
        P('Book a bulky waste collection.', '预约大件回收。', 'bulky waste 是大件垃圾。'),
      ],
    },

    {
      id: 'parking-permit', name: '办居民停车证', lv: 4, cefr: 'B1',
      roles: ['你', '市政厅'],
      lines: [
        L(0, 'I would like a residents parking permit.', '我想办居民停车证。'),
        L(1, 'Which zone is the flat in?', '房子在哪个区？'),
        L(0, 'Zone C, but the car is registered at my old address.', 'C 区，但车还登记在旧地址。'),
        L(1, 'Then bring the lease and the V5. We change the address first.', '那带租约和车辆登记证。先改地址。'),
        L(0, 'How long does the permit take?', '证要多久？'),
        L(1, 'Five working days. Visitor permits meanwhile.', '五个工作日。期间可以用访客券。'),
        L(0, 'How many visitors can I have?', '访客券有多少？'),
        L(1, 'Ten a month, a pound each.', '每月十张，一张一镑。'),
      ],
      variants: [
        { tag: '车登记在旧地址', setting: '你刚搬家，车还挂在旧地址。' },
        V('两辆车', '你们有两辆。', {
          0: ['We have two cars. Can we get two permits?', '我们有两辆车。能办两张吗？'],
          1: ['One per household, unless you have a garage.', '一户一张，除非有车库。'],
        }),
        V('公司车', '车是公司的。', {
          2: ['It is a company car. Does that matter?', '是公司车。有影响吗？'],
          3: ['You need a letter from the company confirming you keep it.', '需要公司出具证明，说明车由你保管。'],
        }),
        V('续期', '你要续。', {
          4: ['My permit expires on Friday. Can I renew online?', '我的证周五到期。能网上续吗？'],
        }),
        V('被拒', '申请被拒。', {
          6: ['The application was refused. It says insufficient evidence.', '申请被拒。理由写证据不足。'],
        }),
        V('访客', '你家人要来住一周。', {
          7: ['My parents are staying a week. Is there a weekly pass?', '我父母来住一周。有周票吗？'],
        }),
      ],
      branches: [
        B(5, 'change', '办证流程有前置条件，你要安排',
          S('The V5 address has to change before we can issue anything.', '先改车辆登记证地址，我们才能办。'),
          [O(S('How long does the V5 change take?', '改地址要多久？'), S('Five days online. Then come back with the new one.', '网上五天。然后带新的来。')),
           O(S('Can I park while I wait?', '等的时候能停吗？'), S('Use the visitor permits. They are valid in zone C.', '用访客券。C 区有效。'))]),
      ],
      phrases: [
        P('Which zone is the flat in?', '房子在哪个区？', '停车证按区划分。'),
        P('The V5', '车辆登记证', '英国车辆登记文件。'),
        P('One per household.', '一户一张。', '常见限制。'),
      ],
    },

    {
      id: 'allotment', name: '租一块菜地', lv: 3, cefr: 'B1',
      roles: ['你', '协会'],
      lines: [
        L(0, 'Is there a waiting list for an allotment?', '租菜地要排队吗？'),
        L(1, 'About eighteen months. Do you want to go on it?', '大概十八个月。要登记吗？'),
        L(0, 'Yes. What size are the plots?', '要。地块多大？'),
        L(1, 'Five rods, which is plenty for one person.', '五个杆，一个人够用。', 'rod 是英国丈量单位，一块标准菜地约 250 平方米。'),
        L(0, 'What is the rent?', '租金多少？'),
        L(1, 'Sixty a year, and you must keep it cultivated.', '一年六十，必须保持耕种。'),
        L(0, 'What happens if I let it go wild?', '如果我荒着会怎样？'),
        L(1, 'We give a warning, then take it back.', '先警告，然后收回。'),
      ],
      variants: [
        { tag: '排队租菜地', setting: '你想种菜，协会说名单要等一年半。' },
        V('半块地', '你只要小的。', {
          2: ['Do you have half plots? I cannot manage five rods.', '有半块的吗？五个杆我弄不过来。'],
          3: ['We do, and the wait is shorter. About six months.', '有，排队也短。大概六个月。'],
        }),
        V('水', '你问浇水。', {
          4: ['Is there water on site?', '地里有水吗？'],
        }),
        V('工具', '你没有工具。', {
          5: ['Is there a shared shed with tools?', '有共用的工具房吗？'],
        }),
        V('养鸡', '你想养鸡。', {
          6: ['Are chickens allowed?', '能养鸡吗？'],
        }),
        V('退租', '你种不动了。', {
          7: ['If I give it up, do I get part of the rent back?', '如果退租，租金能退一部分吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '协会问你的打算，你要说得具体',
          S('What would you grow in the first year?', '第一年打算种什么？'),
          [O(S('Potatoes and beans, to break up the ground.', '土豆和豆子，先把土翻松。'), S('That is the right answer. The plot is rough.', '这答案对。这块地很粗。')),
           O(S('I have not decided. Is that a problem?', '还没想好。有问题吗？'), S('Not for us, but people who plan keep them longer.', '对我们没问题，但有计划的人留得久。'))]),
      ],
      phrases: [
        P('Is there a waiting list?', '要排队吗？', 'waiting list 是等候名单。'),
        P('Keep it cultivated.', '保持耕种。', 'cultivate 是耕作。'),
        P('Do you have half plots?', '有半块地吗？', '新手常问。'),
      ],
    },

    {
      id: 'gutter', name: '清屋檐排水槽', lv: 3, cefr: 'B1',
      roles: ['你', '维修工'],
      lines: [
        L(0, 'The gutter is overflowing and water runs down the wall.', '排水槽满了，水顺着墙往下流。'),
        L(1, 'How high is the house?', '房子多高？'),
        L(0, 'Two floors. I think the downpipe is blocked.', '两层。我觉得下水管堵了。'),
        L(1, 'We can clear it from a ladder for ninety.', '搭梯子清理，九十。'),
        L(0, 'Is that including the downpipe?', '包含下水管吗？'),
        L(1, 'It is. If the pipe is broken, we quote before replacing.', '包含。如果管子破了，换之前先报价。'),
        L(0, 'When could you come?', '什么时候能来？'),
        L(1, 'Thursday morning, if the rain holds off.', '周四上午，如果不下雨。'),
      ],
      variants: [
        { tag: '排水槽溢出', setting: '下了一周雨，墙上出现水痕。' },
        V('屋檐瓦片', '瓦片掉了。', {
          0: ['Two tiles came off in the storm. Can you replace them?', '暴风雨掉了两片瓦。能补吗？'],
          1: ['If they are standard, yes. If not, I match them first.', '标准的可以。不标准我先去找一样的。'],
        }),
        V('租的房子', '房东负责。', {
          3: ['I rent. Should the landlord pay for this?', '我是租客。这个该房东出吗？'],
        }),
        V('报价', '你觉得贵。', {
          4: ['Ninety seems high for twenty minutes of work.', '干二十分钟要九十有点贵。'],
          5: ['It is the ladder and the insurance, not the time.', '贵在梯子和保险，不是时间。'],
        }),
        V('室内渗水', '水渗进屋里了。', {
          6: ['Water is coming inside above the window. Is that urgent?', '窗户上方往里渗水。急吗？'],
        }),
        V('保养', '你想定期清。', {
          7: ['How often should these be cleared?', '多久该清一次？'],
        }),
      ],
      branches: [
        B(5, 'probe', '维修工要判断破损程度，你要给信息',
          S('Is the water running over the edge, or leaking at a joint?', '水是漫过边沿，还是接头漏？'),
          [O(S('Over the edge, at the corner above the door.', '漫过边沿，在门上方那个角。'), S('That is a blockage, not a break. Good.', '那是堵塞，不是断裂。好。')),
           O(S('It drips down the wall in the middle.', '在中间顺墙往下滴。'), S('Then a joint has gone. I will bring a spare section.', '那是接口坏了。我带一段备件。'))]),
      ],
      phrases: [
        P('The gutter is overflowing.', '排水槽溢出来了。', 'gutter 是屋檐水槽。'),
        P('Quote before replacing.', '换之前先报价。', '免得到时候被动。'),
        P('If the rain holds off.', '如果不下雨。', 'hold off 是暂缓。'),
      ],
    },

    {
      
      branches: [
        B(5, 'probe', '客服问你的观看方式，你要说准',
          S('Do you watch anything as it is broadcast, on any device?', '您在任何设备上看直播吗？'),
          [O(S('The news, sometimes, on my phone.', '新闻，偶尔，在手机上看。'), S('Then a licence is required, phones included.', '那需要执照，手机也算。')),
           O(S('Only recorded programmes.', '只看录播。'), S('Then you may not need one. Fill in the declaration.', '那可能不需要。填一份声明。'))]),
      ],
id: 'tv-licence', name: '电视执照问题', lv: 3, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(1, 'Do you watch live television or only streaming?', '您看直播电视还是只看流媒体？'),
        L(0, 'Mostly streaming, but I watch the news live.', '主要看流媒体，但新闻我看直播。'),
        L(1, 'Then you need a licence. It covers the whole household.', '那需要执照。一张覆盖整户。'),
        L(0, 'How much is it?', '多少钱？'),
        L(1, 'About a hundred and seventy a year, monthly by direct debit.', '一年一百七左右，可以按月扣。'),
        L(0, 'What if I only watch on my phone?', '如果只在手机上看呢？'),
        L(1, 'The same rule applies anywhere you watch.', '在哪儿看都一样。'),
        L(0, 'And what is the fine for not having one?', '没有的话罚多少？'),
      ],
      variants: [
        { tag: '看直播新闻', setting: '你收到一封「没有执照」的通知信。' },
        V('只看流媒体', '你不看直播。', {
          1: ['I only use Netflix and YouTube. Do I need one?', '我只看 Netflix 和 YouTube。需要吗？'],
          2: ['Not for those, unless you use BBC iPlayer.', '那些不用，除非用 BBC iPlayer。'],
        }),
        V('学生宿舍', '你住宿舍。', {
          3: ['I am in halls. Is it covered by the university?', '我住学生宿舍。学校包了吗？'],
        }),
        V('退款', '你多付了。', {
          4: ['I paid for a year but moved out after three months.', '我付了一年，但三个月就搬走了。'],
        }),
        V('罚款', '你收到罚单。', {
          6: ['I got a fine for a flat I had already left.', '我收到一张罚单，但那套房我已经搬走了。'],
        }),
        V('取消', '你想停掉。', {
          7: ['How do I cancel the direct debit?', '怎么取消自动扣款？'],
        }),
      ],
      phrases: [
        P('It covers the whole household.', '一张覆盖整户。', '按地址不按人。'),
        P('Monthly by direct debit.', '按月自动扣款。', 'direct debit 是授权扣款。'),
        P('The same rule applies.', '规则一样。', '设备不影响规定。'),
      ],
    },

    {
      id: 'dog-register', name: '给狗办登记', lv: 3, cefr: 'B1',
      roles: ['你', '社区服务'],
      lines: [
        L(0, 'I have just rehomed a dog. Do I need to register him?', '我刚领养了一只狗。要登记吗？'),
        L(1, 'Microchipping is the legal part. Is the chip in your name?', '法律要求是芯片。芯片在你名下吗？'),
        L(0, 'Not yet. The rescue kept it in theirs.', '还不在。救助站还挂在名下。'),
        L(1, 'Then transfer it online. It costs fifteen.', '那网上过户。十五块。'),
        L(0, 'Do I need a licence as well?', '还需要许可证吗？'),
        L(1, 'Not here, but some councils still ask. Check the website.', '这边不用，但有些地方还要。看网站。'),
        L(0, 'And the park rules?', '公园的规定呢？'),
        L(1, 'Lead on the roads, off lead only in the marked field.', '路上要牵绳，只有标记的场地能放开。'),
      ],
      variants: [
        { tag: '领养狗要登记', setting: '你从救助站领养了一只三岁的狗。' },
        V('芯片', '狗还没芯片。', {
          1: ['He is not chipped yet. Where do I get it done?', '他还没芯片。去哪儿做？'],
          2: ['Any vet, about twenty. It is a legal requirement.', '任何兽医，二十左右。这是法律要求。'],
        }),
        V('多只狗', '你有两只。', {
          3: ['We have two dogs. Does the second cost the same?', '我们有两只狗。第二只也一样价吗？'],
        }),
        V('噪音投诉', '邻居投诉狗叫。', {
          4: ['A neighbour complained about barking. What happens now?', '邻居投诉狗叫。接下来怎么办？'],
        }),
        V('攻击', '你的狗咬了人。', {
          5: ['He snapped at a child. Do I have to report it?', '他对一个孩子龇牙了。要上报吗？'],
        }),
        V('旅行', '你要带狗出国。', {
          6: ['What do I need to take him to France?', '带他去法国需要什么？'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方问狗的情况，你要说清',
          S('Has he been assessed around children and other dogs?', '评估过跟孩子和其他狗的相处吗？'),
          [O(S('The rescue tested him with both. Calm, a bit shy.', '救助站都测过。温和，有点怕生。'), S('Then register him and keep the assessment letter.', '那登记吧，评估信留着。')),
           O(S('Not that I know of.', '据我所知没有。'), S('Then walk him on a lead until you are sure.', '那在确定之前都牵绳。'))]),
      ],
      phrases: [
        P('Microchipping is the legal part.', '法律要求是芯片。', '英国 2016 年起强制。'),
        P('Transfer it online.', '网上过户。', '芯片信息可以转移。'),
        P('Lead on the roads.', '路上要牵绳。', 'lead 在这里是牵引绳。'),
      ],
    },
  ],
};
