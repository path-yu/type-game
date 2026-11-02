import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '租房',
  items: [
    {
      id: 'viewing', name: '看房问条件', lv: 3, cefr: 'B1',
      roles: ['你', '房东'],
      lines: [
        L(1, 'The flat is on the second floor, no lift.', '房子在二楼，没有电梯。'),
        L(0, 'That is fine. Is the rent negotiable?', '可以。房租能谈吗？'),
        L(1, 'It is fixed at nine hundred, bills not included.', '定死九百，不含水电。'),
        L(0, 'What do the bills come to on average?', '水电平均多少？'),
        L(1, 'About a hundred and twenty in winter.', '冬天大概一百二。'),
        L(0, 'How long is the minimum tenancy?', '最短租多久？'),
        L(1, 'Twelve months, with a six-month break clause.', '十二个月，六个月后有解约条款。', 'break clause 是提前解约条款，签长约前一定要问。'),
        L(0, 'Could I see the bedroom again? The window faces the road.', '能再看一眼卧室吗？窗户朝马路。'),
        L(1, 'It does, but the glazing is new.', '是朝马路，但玻璃是新换的。'),
      ],
      variants: [
        { tag: '二楼没电梯', setting: '你看的第三套房，价格合适但临街。' },
        V('带家具', '你想知道家具留不留。', {
          0: ['Is it furnished? I have no bed yet.', '带家具吗？我还没买床。'],
          1: ['The bed and the wardrobe stay. The rest goes.', '床和衣柜留下。其余搬走。'],
        }),
        V('养猫', '你有一只猫。', {
          4: ['I have a cat. Is that allowed?', '我有一只猫。可以吗？'],
          5: ['With a bigger deposit, yes. Two hundred more.', '押金多两百就可以。'],
        }),
        V('停车', '你需要一个车位。', {
          6: ['Is there parking? I drive to work.', '有停车位吗？我开车上班。'],
          7: ['One space at the back, included in the rent.', '后面有一个位子，含在房租里。'],
        }),
        V('当天决定', '你看完就想定下来。', {
          8: ['I like it. Can I pay a holding deposit today?', '我挺喜欢。今天能交定金吗？', 'holding deposit 是诚意金，用来把房子留几天。'],
        }),
      ],
      branches: [
        B(5, 'probe', '房东反问你，你要把条件说清楚',
          S('How long are you planning to stay?', '你打算住多久？'),
          [O(S('At least two years, if the flat holds up.', '至少两年，只要房子没问题。'), S('Then I can do eleven months at the same rent.', '那我可以同价签十一个月。')),
           O(S('One year to start. I have just moved here.', '先一年。我刚搬来。'), S('Fair. We can review it after.', '合理。到期再谈。'))]),
      ],
      phrases: [
        P('Is the rent negotiable?', '房租能谈吗？', '看房必问，但要有理由才好谈。'),
        P('Are the bills included?', '含水电吗？', 'bills 指水、电、气、网。'),
        P('With a six-month break clause.', '六个月后有解约条款。', '没有这条，提前走得赔满租期。'),
      ],
    },

    {
      id: 'lease', name: '签租约', lv: 4, cefr: 'B1',
      roles: ['你', '中介'],
      lines: [
        L(1, 'Here is the tenancy agreement. Read it before you sign.', '这是租约。签之前先读。'),
        L(0, 'Thanks. Is my deposit protected in a scheme?', '谢谢。押金会进监管账户吗？', 'deposit protection scheme 是押金保护机制，英国法定要求。'),
        L(1, 'It is, and you will get the certificate within thirty days.', '会，三十天内给您证书。'),
        L(0, 'What does the break clause say?', '解约条款怎么写的？'),
        L(1, 'Six months, with two months notice.', '六个月后，提前两个月通知。'),
        L(0, 'Can I put up shelves?', '我能装隔板吗？'),
        L(1, 'Only with written permission.', '要书面许可。'),
        L(0, 'And who pays for repairs?', '维修谁出钱？'),
        L(1, 'The landlord covers the structure. You cover what you break.', '结构问题房东负责。你弄坏的你负责。'),
      ],
      variants: [
        { tag: '首次签约', setting: '你第一次在这边租房，合同有十二页。' },
        V('要加条款', '你想加一条关于宠物的。', {
          4: ['Could we add a clause about the cat?', '能加一条关于猫的条款吗？'],
          5: ['I can write it in. It usually means a higher deposit.', '可以写进去。通常意味着押金更高。'],
        }),
        V('家具清单', '合同附了家具清单，你想核对。', {
          6: ['The inventory lists a desk. It is not in the flat.', '清单上有一张书桌。房里没有。'],
          7: ['Note it before you sign and we will correct it.', '签之前标出来，我们来改。'],
        }),
        V('合租签约', '你和另一个人一起签。', {
          0: ['We are signing jointly. Does that make us both liable for the whole rent?', '我们共同签。是不是两个人都要对全部房租负责？'],
          1: ['It does. That is joint and several liability.', '是的。这叫连带责任。'],
        }),
        V('问退租', '你想知道提前走的代价。', {
          8: ['If I leave at month eight, what do I owe?', '如果我第八个月走，要付多少？'],
        }),
      ],
      branches: [
        B(7, 'probe', '你问维修责任，中介的回答含糊',
          S('Normal wear and tear is yours, everything else is the landlord.', '正常磨损算你的，其余房东负责。'),
          [O(S('Can you define normal wear and tear in writing?', '能把「正常磨损」写进合同吗？'), S('I will add a line listing examples.', '我加一行举例说明。')),
           O(S('What about the boiler and the roof?', '锅炉和屋顶呢？'), S('Both are the landlord, by law.', '法律上都是房东的。'))]),
      ],
      phrases: [
        P('Is my deposit protected?', '押金会受保护吗？', '不进监管账户的押金最难要回。'),
        P('What does the break clause say?', '解约条款怎么写的？', '决定你能不能提前走。'),
        P('Who pays for repairs?', '维修谁出钱？', '签之前必须问清。'),
      ],
    },

    {
      id: 'deposit', name: '退押金被扣', lv: 4, cefr: 'B1',
      roles: ['你', '房东'],
      lines: [
        L(1, 'We have done the check-out. There are deductions.', '退房检查完了。有几项要扣钱。'),
        L(0, 'What are they for?', '扣的是什么？'),
        L(1, 'Cleaning, a broken blind, and a mark on the wall.', '清洁、一个坏掉的百叶窗，还有墙上一块印子。'),
        L(0, 'The blind was already broken when I moved in.', '百叶窗我搬进来时就是坏的。'),
        L(1, 'Do you have that on the inventory?', '清单上有记录吗？'),
        L(0, 'Yes. I photographed everything on the first day.', '有。我第一天全拍了照。'),
        L(1, 'Then we will take that item off.', '那这一项去掉。'),
        L(0, 'And the cleaning? I paid for a professional clean.', '清洁呢？我请了专业保洁。'),
        L(1, 'Send the receipt and we will refund that too.', '把收据发来，这项也退给您。'),
      ],
      variants: [
        { tag: '押金被扣三项', setting: '你退房两周，押金只退回一半。' },
        V('墙上有钉眼', '房东说钉眼要补墙。', {
          3: ['The picture hooks are normal use. Everyone hangs pictures.', '挂画钉眼算正常使用。谁不挂画。'],
        }),
        V('押金一直不退', '房东托了一个月。', {
          0: ['It has been five weeks and I still have no deposit back.', '五周了，押金还没退。'],
          1: ['The scheme holds it. We have thirty days from the check-out.', '押金在监管机构。退房后我们有三十天。'],
        }),
        V('要走仲裁', '谈不下来，你想走押金仲裁。', {
          6: ['If we cannot agree, I will take it to the deposit scheme.', '谈不拢的话，我提交押金仲裁。'],
          7: ['That is your right. They will ask for both sets of evidence.', '那是你的权利。他们会要双方证据。'],
        }),
        V('清洁费', '房东扣了两百清洁费。', {
          8: ['Two hundred for cleaning is more than the flat cost to clean.', '两百清洁费比实际清洁还贵。'],
        }),
      ],
      branches: [
        B(3, 'probe', '房东质疑你的证据，你要拿得出东西',
          S('A photo without a date proves nothing.', '没有日期的照片证明不了什么。'),
          [O(S('The photos carry timestamps and location data.', '照片带时间戳和位置信息。'), S('Send me the file details and I will check.', '把文件信息发我，我核对。')),
           O(S('The inventory you signed on day one lists it as broken.', '你第一天签的清单上就写着它坏了。'), S('Let me look at my copy.', '我看看我这份。'))]),
      ],
      phrases: [
        P('What are the deductions for?', '扣的是什么？', 'deduction 是扣款项目。'),
        P('It was already broken when I moved in.', '我搬进来时就是坏的。', '举证靠清单和照片。'),
        P('I will take it to the deposit scheme.', '我提交押金仲裁。', '英国押金纠纷的正规渠道。'),
      ],
    },

    {
      id: 'repair-duty', name: '催房东修东西', lv: 4, cefr: 'B1',
      roles: ['你', '房东'],
      lines: [
        L(0, 'The boiler has stopped working. No hot water for two days.', '锅炉坏了。两天没热水。'),
        L(1, 'Have you reported it in writing?', '书面报修了吗？'),
        L(0, 'I emailed on Monday and got no reply.', '周一发了邮件，没人回。'),
        L(1, 'I will call the engineer today.', '我今天联系工程师。'),
        L(0, 'If it is not fixed by Friday, can I arrange it myself?', '周五还修不好，我能自己找人吗？'),
        L(1, 'Give me until Friday. After that, yes.', '给我到周五。之后可以。'),
        L(0, 'And can I deduct the cost from the rent?', '费用能从房租里扣吗？'),
        L(1, 'Keep the receipt. Deducting is allowed after notice.', '留好收据。通知之后可以扣。', 'deduct from rent 是「从房租里扣」，要走完通知流程才合法。'),
      ],
      variants: [
        { tag: '没热水两天', setting: '冬天，锅炉停了，房东电话不接。' },
        V('漏水', '天花板在滴水。', {
          0: ['Water is coming through the ceiling from upstairs.', '楼上往我家天花板渗水。'],
          1: ['I will call the building manager. Do not touch the electrics.', '我联系物业。别碰电路。'],
        }),
        V('霉斑', '墙角长霉了。', {
          0: ['There is mould in the corner of the bedroom.', '卧室墙角长霉了。'],
          1: ['That is usually ventilation. I will send someone to treat it.', '一般是通风问题。我派人来处理。'],
        }),
        V('家电坏了', '冰箱不制冷了。', {
          0: ['The fridge stopped cooling. The food has spoiled.', '冰箱不制冷了。食物都坏了。'],
          1: ['It is under two years old, so it is still covered.', '不到两年，还在保修期。'],
        }),
        V('要书面记录', '你想留证据。', {
          6: ['Can you confirm all of this by email?', '能把这些用邮件确认一下吗？'],
        }),
      ],
      branches: [
        B(4, 'change', '房东给了一个时间，你觉得太晚',
          S('Friday is the earliest I can get someone.', '周五是最早能约到人的。'),
          [O(S('Then I will book my own engineer and send you the bill.', '那我自己约人，账单发你。'), S('Fair. Keep it under a hundred and fifty.', '行。控制在一百五以内。')),
           O(S('Could you authorise an emergency call-out?', '能批一次紧急上门吗？'), S('For no hot water in winter, yes.', '冬天没热水，可以。'))]),
      ],
      phrases: [
        P('I reported it in writing.', '我书面报修了。', '口头报修不算，邮件才是证据。'),
        P('Can I deduct it from the rent?', '能从房租里扣吗？', '要先通知再扣，否则算欠租。'),
        P('The boiler has stopped working.', '锅炉坏了。', 'boiler 是供暖与热水的锅炉，英式租房核心设备。'),
      ],
    },

    {
      id: 'rent-increase', name: '房东要涨租', lv: 5, cefr: 'B2',
      roles: ['你', '房东'],
      lines: [
        L(1, 'We are proposing a rent increase from July.', '我们想从七月起涨租。'),
        L(0, 'By how much?', '涨多少？'),
        L(1, 'Eight percent, which is in line with the market.', '百分之八，符合市场水平。'),
        L(0, 'That is above inflation. What is the justification?', '这高于通胀。依据是什么？'),
        L(1, 'The area has moved up. Comparable flats are higher.', '这一片涨了。同类房子都更贵。'),
        L(0, 'Can we agree on five percent for two years?', '能不能定五年、两年不涨？'),
        L(1, 'I would need to ask the owner.', '我得问业主。'),
        L(0, 'Please do. I would rather stay than move.', '请去问。我更想留下，不想搬。'),
        L(1, 'I will come back to you by Friday.', '周五前回复你。'),
      ],
      variants: [
        { tag: '涨百分之八', setting: '你住了两年，房东第一次提涨租。' },
        V('市场价反驳', '你查过同小区的价格。', {
          5: ['Two flats in this building are advertised lower.', '这栋楼有两套挂牌价更低。'],
          6: ['Those have smaller kitchens. Let me send you the details.', '那两套厨房更小。我把详情发你。'],
        }),
        V('要书面通知', '你想知道程序合不合法。', {
          4: ['Is this a formal notice? What notice period applies?', '这是正式通知吗？要提前多久？'],
        }),
        V('接受但换条件', '你愿意多付，但要换装修。', {
          5: ['I can accept six percent if the windows are replaced.', '换窗户的话我能接受百分之六。'],
        }),
        V('准备搬走', '涨幅太高，你决定走。', {
          7: ['At eight percent I will have to give notice.', '涨百分之八的话我只能退租。'],
        }),
      ],
      branches: [
        B(5, 'probe', '房东用市场价压你，你要拿出反证',
          S('Everyone in this street is asking more than you pay.', '这条街上都比你付得高。'),
          [O(S('Let us compare the same size and condition.', '那比同面积同状况的。'), S('Send me three examples and I will look.', '给我三个例子，我看。')),
           O(S('I have been here two years with no gaps in payment.', '我住了两年，从没拖欠。'), S('That counts for something. I will say so to the owner.', '这确实有价值。我会跟业主说。'))]),
      ],
      phrases: [
        P('By how much?', '涨多少？', '先问数字，再谈理由。'),
        P('That is above inflation.', '这高于通胀。', '涨租谈判的常用依据。'),
        P('I would rather stay than move.', '我更想留下。', '表明你不想走，但也不怕走。'),
      ],
    },

    {
      id: 'moving-out', name: '退租检查', lv: 4, cefr: 'B1',
      roles: ['你', '中介'],
      lines: [
        L(1, 'The check-out is on Friday at ten.', '退房检查周五十点。'),
        L(0, 'Do I need to be there?', '我需要在场吗？'),
        L(1, 'It helps. We go through the inventory together.', '在场更好。我们一起过清单。'),
        L(0, 'What should I do before then?', '在那之前要做什么？'),
        L(1, 'Clean it, take your rubbish, and leave the manuals.', '打扫干净、清走垃圾、留下说明书。'),
        L(0, 'Will the deposit come back the same day?', '押金当天能退吗？'),
        L(1, 'Within ten days of the check-out.', '退房后十天内。'),
        L(0, 'Could you email me the report after the visit?', '检查完能把报告发我邮箱吗？'),
        L(1, 'Of course. Sign it only if you agree with it.', '当然。同意才签。'),
      ],
      variants: [
        { tag: '退房前一周', setting: '你下周搬走，押金一千八还在房东手里。' },
        V('来不及打扫', '你赶飞机，没时间打扫。', {
          3: ['I fly out on Thursday. Can I pay for a cleaner instead?', '我周四飞走。能出钱请保洁代替吗？'],
          4: ['That is fine. Use ours and we will not deduct.', '可以。用我们的，就不扣你钱。'],
        }),
        V('东西留下', '你有家具不想搬。', {
          0: ['I am leaving a desk and a chair. Is that helpful?', '我要留下一张桌子和一把椅子。你们要吗？'],
          1: ['Only if the next tenant wants them. Otherwise it is rubbish.', '下一位租客要才行。不然算垃圾。'],
        }),
        V('提前退租', '你合同还有四个月。', {
          4: ['I need to leave four months early. What does that cost?', '我要提前四个月走。代价是什么？'],
        }),
        V('钥匙', '你少了一把钥匙。', {
          6: ['I lost one set of keys. Will that come out of the deposit?', '我丢了一套钥匙。会从押金里扣吗？'],
        }),
      ],
      branches: [
        B(3, 'probe', '中介提出一项你没准备的义务',
          S('The oven has to be cleaned professionally, or we deduct eighty.', '烤箱要专业清洁，否则扣八十。'),
          [O(S('I will book a cleaner and send you the receipt.', '我约保洁，把收据发你。'), S('That is the cheaper route.', '这样更省钱。')),
           O(S('Eighty seems high for one oven.', '一个烤箱八十有点贵。'), S('It is our standard rate. You can use your own.', '这是标准价。你也可以自己找人。'))]),
      ],
      phrases: [
        P('Do I need to be there?', '我需要在场吗？', '退房检查在场能当场争辩。'),
        P('Within ten days of the check-out.', '退房后十天内。', '押金退还的法定期限。'),
        P('Sign it only if you agree.', '同意才签。', '报告一签就很难翻案。'),
      ],
    },

    {
      id: 'flatmate', name: '看合租房', lv: 3, cefr: 'B1',
      roles: ['你', '现有租客'],
      lines: [
        L(0, 'Hi, I saw your ad for the room.', '你好，我看到你发的房间广告。'),
        L(1, 'Are you working or studying?', '你工作还是上学？'),
        L(0, 'Working, full time, in an office three days a week.', '工作，全职，一周三天在办公室。'),
        L(1, 'The room is seven hundred, bills included.', '房间七百，含水电。'),
        L(0, 'When could I move in?', '什么时候能搬进来？'),
        L(1, 'The first of next month. Can you view this week?', '下个月一号。这周能来看吗？'),
        L(0, 'Thursday evening works. Who else lives here?', '周四晚上可以。还有谁住这儿？'),
        L(1, 'Two of us, both quiet. We keep the kitchen clean.', '我们两个人，都挺安静。厨房大家保持干净。'),
      ],
      variants: [
        { tag: '看合租单间', setting: '你换城市工作，先合租半年过渡。' },
        V('作息冲突', '你上夜班。', {
          6: ['I work nights twice a week. Would that be a problem?', '我一周上两次夜班。会有问题吗？'],
          7: ['As long as you are quiet coming in. The walls are thin.', '回来时安静就行。墙很薄。'],
        }),
        V('带家具', '房间里有没有床。', {
          4: ['Does the room come with a bed and a desk?', '房间有床和桌子吗？'],
        }),
        V('问合同', '你想知道怎么签。', {
          5: ['Do I sign with the landlord or with you?', '我跟房东签还是跟你们签？'],
        }),
        V('问室友习惯', '你在意卫生和访客。', {
          7: ['How do you handle guests and cleaning?', '客人和打扫怎么安排？'],
        }),
      ],
      branches: [
        B(6, 'change', '对方提了一个合同安排，你要判断接不接受',
          S('Just so you know, we do a trial month before the contract.', '先说一下，签合同前有一个试用月。'),
          [O(S('A trial month sounds sensible. Same rent?', '试用月挺合理。房租一样吗？'), S('Same rent, and you can leave after four weeks.', '一样，四周后你可以走。')),
           O(S('Is anything signed during the trial?', '试用期要签什么吗？'), S('Only the house rules. No contract yet.', '只签居住公约。还不签合同。'))]),
      ],
      phrases: [
        P('Bills included?', '含水电吗？', '合租房最常见的差异项。'),
        P('When could I move in?', '什么时候能搬进来？', '比问 rent 更实际。'),
        P('How do you handle guests?', '客人怎么算？', '合租前必须谈清。'),
      ],
    },

    {
      id: 'agent-fee', name: '中介费与审核', lv: 5, cefr: 'B2',
      roles: ['你', '中介'],
      lines: [
        L(1, 'The referencing fee is two hundred.', '审核费两百。'),
        L(0, 'I thought agency fees were banned.', '我以为中介费已经禁了。'),
        L(1, 'Agency fees are. This is a referencing fee, which is allowed.', '中介费禁了。这是审核费，允许收。'),
        L(0, 'What does the referencing cover?', '审核包括什么？'),
        L(1, 'Credit check, employer letter, previous landlord.', '信用查询、雇主证明、前房东评价。'),
        L(0, 'And if I fail the check?', '如果我没通过呢？'),
        L(1, 'You lose the fee but nothing else.', '费用不退，其余没有损失。'),
        L(0, 'Could I provide a guarantor instead?', '我能提供担保人代替吗？'),
        L(1, 'You can. It usually removes the credit requirement.', '可以。通常就不用信用查询了。'),
      ],
      variants: [
        { tag: '被收审核费', setting: '你在网上看到一套房，中介要先收两百审核费。' },
        V('问合同期限', '你想知道要签多久。', {
          4: ['How long is the contract, and is there a renewal fee?', '合同多久？续约有费用吗？'],
          5: ['Twelve months, and renewal is free.', '十二个月，续约免费。'],
        }),
        V('压价', '你觉得房子不值这个价。', {
          0: ['The flat has been listed for six weeks. Would the landlord take less?', '这房子挂了六周。房东能降点吗？'],
          1: ['I can put it to them. How much less?', '我可以问。降多少？'],
        }),
        V('要书面报价', '你想把费用列清楚。', {
          2: ['Could you send me a full breakdown in writing?', '能把所有费用书面列一下吗？'],
        }),
        V('跳过中介', '你想直接联系房东。', {
          6: ['Is the landlord open to dealing directly?', '房东愿意直接对接吗？'],
        }),
      ],
      branches: [
        B(7, 'probe', '中介给你的替代方案有硬条件，你要确认能不能满足',
          S('A guarantor has to own property here and sign for the whole rent.', '担保人得在本地有房产，并为全部房租担保。'),
          [O(S('My uncle owns a flat here. Would that work?', '我叔叔在这儿有套房。可以吗？'), S('It would. We need his ID and a mortgage statement.', '可以。需要他的证件和房贷对账单。')),
           O(S('Then I will take the credit check instead.', '那我还是走信用查询吧。'), S('Simpler, if your record is clean.', '记录干净的话更省事。'))]),
      ],
      phrases: [
        P('Is that fee legal?', '这笔费用合法吗？', '各地规定不同，敢问才不会被多收。'),
        P('What does the referencing cover?', '审核包括什么？', '问清才值这个钱。'),
        P('Could I provide a guarantor?', '我能提供担保人吗？', '没本地信用记录时的解法。'),
      ],
    },
  ],
};
