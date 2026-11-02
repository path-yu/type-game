import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '政务',
  items: [
    {
      id: 'police-report', name: '报警报失', lv: 4, cefr: 'B1',
      roles: ['你', '警察'],
      lines: [
        L(0, 'Excuse me, I need to report a theft.', '打扰一下，我要报案，东西被偷了。'),
        L(1, 'Where did it happen?', '在哪儿发生的？'),
        L(0, 'On the bus, about twenty minutes ago. My phone was taken.', '公交车上，大概二十分钟前。手机被偷了。'),
        L(1, 'Do you have the serial number?', '有序列号吗？'),
        L(0, 'It is in my email. I can find it.', '邮件里有。我能找出来。'),
        L(1, 'Good. We need it for the report.', '好。报案要用。'),
        L(0, 'Will I get a copy for my insurance?', '能给我一份副本走保险吗？'),
        L(1, 'Yes, with a case number. It takes about an hour.', '可以，带案件编号。大概一小时。'),
        L(0, 'Thank you. Should I block the phone first?', '谢谢。我要先停机吗？'),
        L(1, 'Do that now. Your provider can do it in minutes.', '现在就办。运营商几分钟就能停。'),
      ],
      variants: [
        { tag: '公交上丢手机', setting: '早高峰公交上被人挤了一下，下车发现手机没了。' },
        V('丢钱包', '你在车站到家的路上丢了钱包。', {
          2: ['I lost my wallet somewhere between the station and here.', '我在车站到这儿之间丢了钱包。'],
          3: ['Was there cash or cards in it?', '里面有现金或卡吗？'],
          4: ['Two cards and my ID. I have already frozen the cards.', '两张卡和身份证。卡已经冻结了。'],
        }),
        V('被抢', '你在街上被人抢了包。', {
          0: ['I was robbed. A man took my bag on the street.', '我被抢了。一个男的在街上抢了我的包。', 'rob 是抢（有暴力威胁），steal 是偷 —— 报案时这两个词不能混。'],
          1: ['Were you hurt? Do you need an ambulance?', '你受伤了吗？需要救护车吗？'],
          2: ['I am fine, just shaken. It happened ten minutes ago.', '我没事，就是有点受惊。十分钟前。'],
        }),
        V('自行车被偷', '你锁在楼下的自行车不见了。', {
          2: ['My bike was stolen from the rack outside.', '我的自行车在楼下架子上被偷了。'],
          3: ['Was it locked?', '锁了吗？'],
          4: ['Yes, with a U-lock. They cut through it.', '锁了，U 型锁。被剪断了。'],
        }),
        V('问后续', '你想知道报案后还有什么用。', {
          8: ['One more thing. Will this affect my visa application?', '还有一件。这会影响我的签证申请吗？'],
        }),
      ],
      branches: [
        B(4, 'probe', '警察要一个你没有的信息，你要当场想办法',
          S('Without the serial number we cannot put it on the stolen list.', '没有序列号就进不了失窃清单。'),
          [O(S('I can log into my account on your computer.', '我可以用你们的电脑登录账户查。'), S('Use this one. I will look away from the password.', '用这台。密码我不看。')),
           O(S('The box is at home. Can I come back with it?', '包装盒在家。我能拿来再报吗？'), S('Come back within twenty-four hours and we will backdate it.', '二十四小时内回来，报案时间往前算。'))]),
      ],
      phrases: [
        P('I need to report a theft.', '我要报案，东西被偷了。', 'theft 是盗窃，robbery 是抢劫。'),
        P('Do you have the serial number?', '有序列号吗？', '手机、电脑报案都要。'),
        P('Will I get a copy for my insurance?', '能给我一份副本走保险吗？', '报案主要是为保险和补办。'),
      ],
    },

    {
      id: 'accident', name: '轻微车祸处理', lv: 4, cefr: 'B1',
      roles: ['你', '对方司机'],
      lines: [
        L(1, 'Is anyone hurt?', '有人受伤吗？'),
        L(0, 'No, everyone is out of the cars. It was a rear-end shunt.', '没有，人都下车了。是追尾。'),
        L(1, 'Have you exchanged details yet?', '交换信息了吗？'),
        L(0, 'Not yet. I wanted to check with you first.', '还没有。我想先跟你确认一下。'),
        L(1, 'Name, insurer, policy number. And photos of both cars.', '姓名、保险公司、保单号。还有两辆车的照片。'),
        L(0, 'Should we move the cars off the lane?', '要把车挪开车道吗？'),
        L(1, 'Only if it is safe. Mark the positions first.', '安全的话可以。先标好位置。'),
        L(0, 'There is damage to both bumpers. Will insurance cover it?', '两个保险杠都坏了。保险能赔吗？'),
        L(1, 'That is for the insurers. Keep every photo you take.', '那是保险公司的事。照片都留着。'),
      ],
      variants: [
        { tag: '追尾', setting: '路口红灯，你停住了，后车没停住。' },
        V('撞了停着的车', '你倒车时蹭了旁边的车，车主不在。', {
          0: ['I hit a parked car. Nobody was in it.', '我撞了一辆停着的车。车里没人。'],
          1: ['Leave a note with your number. That is the law here.', '留张纸条写你的电话。这边法律这么要求。'],
        }),
        V('有人受伤', '对方说脖子疼。', {
          0: ['The other driver says his neck hurts.', '对方司机说他脖子疼。'],
          1: ['Then it is an injury accident. Call an ambulance and do not move him.', '那算伤人事故。叫救护车，别动他。'],
        }),
        V('停车场刮蹭', '你回车上发现车门被刮了，没人留条。', {
          0: ['Someone scraped my door in the car park and drove off.', '有人停车场刮了我的车门就跑了。'],
          1: ['Check for cameras. Without a witness it is hard.', '看看有没有摄像头。没有目击者很难办。'],
        }),
        V('问流程', '你想知道接下来要做什么。', {
          8: ['Do I need to tell my insurer today?', '我今天就要通知保险公司吗？'],
        }),
      ],
      branches: [
        B(7, 'probe', '对方开始争责任，你要把话说清又不认账',
          S('You braked suddenly. That makes it your fault.', '你突然刹车。这算你的责任。'),
          [O(S('I stopped for a red light. Let the insurers decide.', '我是红灯停的车。让保险公司判断。'), S('Fine. We will let them sort it out.', '行。让他们去分。')),
           O(S('I am not going to argue here. Shall we just exchange details?', '我不想在这儿争。先交换信息吧？'), S('Agreed. Name and policy number.', '同意。姓名和保单号。'))]),
      ],
      phrases: [
        P('Is anyone hurt?', '有人受伤吗？', '车祸第一句永远是这句。'),
        P('Have you exchanged details?', '交换信息了吗？', 'details 指姓名、保险、车牌。'),
        P('Let the insurers decide.', '让保险公司判断。', '现场争责任最容易吵起来。'),
      ],
    },

    {
      id: 'visa', name: '签证续签面谈', lv: 5, cefr: 'B2',
      roles: ['你', '签证官'],
      lines: [
        L(1, 'What is the purpose of your visit?', '您此行的目的是什么？'),
        L(0, 'I am here to study. I am renewing my student visa.', '我来读书。在续学生签。'),
        L(1, 'How long have you been in the country?', '您在这儿待了多久？'),
        L(0, 'Two years. My course runs until next June.', '两年。课程到明年六月。'),
        L(1, 'Do you have proof of funds?', '有资金证明吗？'),
        L(0, 'I have three months of bank statements.', '我有三个月的银行流水。', 'bank statement 是银行流水，签证材料里的固定说法。'),
        L(1, 'And where will you live?', '您住哪儿？'),
        L(0, 'Same flat. I have the tenancy agreement.', '还是那套房子。我有租约。'),
        L(1, 'Everything is in order. You will hear within two weeks.', '材料齐全。两周内会有结果。'),
      ],
      variants: [
        { tag: '续学生签', setting: '你的学生签下月到期，约了面谈。' },
        V('旅游签', '你只去十天。', {
          1: ['Tourism. Ten days, then I fly home.', '旅游。十天，然后回国。'],
          3: ['This is my second visit. The first was three years ago.', '这是我第二次来。上次是三年前。'],
        }),
        V('工作签', '公司给你办了工签。', {
          1: ['Work. My employer is sponsoring the visa.', '工作。公司给我做担保。'],
          4: ['Do you have the sponsorship certificate?', '有担保证书吗？'],
          5: ['Yes, the reference number is on this letter.', '有，编号在这封信上。'],
        }),
        V('家属团聚', '你去和丈夫团聚。', {
          1: ['I am joining my husband. He works here.', '我去和丈夫团聚。他在这边工作。'],
          4: ['Do you have his residence permit and a marriage certificate?', '有他的居留许可和结婚证吗？'],
        }),
        V('问结果', '你想知道能不能加急。', {
          8: ['Is there a priority service? I have a flight in ten days.', '有加急服务吗？我十天后有航班。'],
        }),
      ],
      branches: [
        B(5, 'probe', '签证官质疑你的资金，你要解释清楚',
          S('The balance drops below the threshold in the last month.', '最后一个月余额低于门槛。'),
          [O(S('I paid the tuition in that month. Here is the receipt.', '那个月我交了学费。这是收据。'), S('That explains it. I will note it on the file.', '这就说得通了。我在档案里注明。')),
           O(S('My parents transferred the rest later. The statement shows it.', '剩下的我父母后来转了。流水上有。'), S('I see the transfer. Thank you.', '我看到那笔转账了。谢谢。'))]),
      ],
      phrases: [
        P('What is the purpose of your visit?', '此行的目的是什么？', '所有入境面谈的第一句。'),
        P('Proof of funds', '资金证明', '签证材料核心项。'),
        P('Everything is in order.', '材料齐全。', '听到这句基本就过了。'),
      ],
    },

    {
      id: 'driving-licence', name: '换本地驾照', lv: 4, cefr: 'B1',
      roles: ['你', '窗口'],
      lines: [
        L(0, 'I would like to exchange my foreign licence.', '我想换本地驾照。'),
        L(1, 'Which country is it from?', '哪国的？'),
        L(0, 'China. I have the original and a certified translation.', '中国。原件和认证翻译都有。'),
        L(1, 'You will also need a residence permit and a photo.', '还需要居留许可和一张照片。'),
        L(0, 'I have both. Do I need to take a test?', '都有。要考试吗？'),
        L(1, 'Not for your country. Just an eye test today.', '你们国家不用。今天只测视力。'),
        L(0, 'How long will the new licence take?', '新驾照要多久？'),
        L(1, 'Two weeks by post. You can drive on the old one until then.', '邮寄两周。这之前可以用旧驾照开车。'),
      ],
      variants: [
        { tag: '换中国驾照', setting: '你搬来半年，国际驾照快到期了。' },
        V('要考试的国家', '你的驾照来自需要考试的国家。', {
          4: ['I was told some countries need a theory test. Does mine?', '听说有些国家要考理论。我这个要吗？'],
          5: ['Yours does. It is forty questions, and you can book online.', '要。四十道题，可以网上预约。'],
        }),
        V('国际驾照', '你只有国际驾照，想问能不能直接用。', {
          0: ['Can I drive on an international permit instead?', '我能直接用国际驾照吗？'],
          1: ['For twelve months from entry. After that you need ours.', '入境起十二个月。之后要用本地的。'],
        }),
        V('丢了驾照', '你的驾照丢了，想补办。', {
          0: ['My licence was lost. How do I replace it?', '我的驾照丢了。怎么补办？'],
          1: ['Report it first, then apply. The fee is the same.', '先报失，再申请。费用一样。'],
        }),
        V('地址变更', '你搬家了，要改地址。', {
          6: ['I have moved. Do I need a new licence with the new address?', '我搬家了。要换一张写新地址的驾照吗？'],
        }),
      ],
      branches: [
        B(4, 'change', '窗口说材料还差一份，你要解决',
          S('The translation needs a stamp from an approved translator.', '翻译件要有认证译员的章。'),
          [O(S('Where can I find one nearby?', '附近哪儿能找到？'), S('There is one on the high street, they do it while you wait.', '大街上有一家，当场就能做。')),
           O(S('Can I come back this afternoon with it?', '我下午带过来行吗？'), S('We close at four. Come before three.', '四点关门，三点前来。'))]),
      ],
      phrases: [
        P('I would like to exchange my foreign licence.', '我想换本地驾照。', 'exchange 是换发，不是兑换。'),
        P('Do I need to take a test?', '要考试吗？', '各国规定差别很大，先问。'),
        P('A certified translation.', '认证翻译件。', '自己翻译不算，要译员盖章。'),
      ],
    },

    {
      id: 'lost-card', name: '补办银行卡', lv: 3, cefr: 'B1',
      roles: ['你', '银行客服'],
      lines: [
        L(0, 'I need to report a lost bank card.', '我要挂失银行卡。'),
        L(1, 'When did you last use it?', '最后一次用是什么时候？'),
        L(0, 'This morning, at the station. I think I left it in the machine.', '今天早上，在车站。可能忘在机器里了。'),
        L(1, 'I will freeze it now. Do you want a replacement?', '我现在冻结。要补一张吗？'),
        L(0, 'Yes. Can it go to my home address?', '要。能寄到我家吗？'),
        L(1, 'It can, in five working days. There is a ten pound fee.', '可以，五个工作日。收十镑。'),
        L(0, 'That is fine. What about payments already taken?', '行。已经扣的款呢？'),
        L(1, 'Check them in the app. Anything you did not make, we refund.', '在 app 里核对。不是你刷的，我们退。'),
      ],
      variants: [
        { tag: '卡忘在取款机', setting: '你取完钱忘了拔卡，回头机器已经吞了。' },
        V('被偷', '你的包被偷，卡在里面。', {
          0: ['My bag was stolen with the card inside.', '我的包被偷了，卡在里面。'],
          1: ['Then we also need a police report number for the claim.', '那理赔还需要报案编号。'],
        }),
        V('国外丢卡', '你在旅行中丢了卡。', {
          0: ['I lost my card abroad. I still need money this week.', '我在国外丢卡了。这周还要用钱。'],
          1: ['We can send an emergency replacement to a branch near you.', '可以把应急卡寄到你附近的网点。'],
        }),
        V('改密码', '你怀疑密码泄露了。', {
          0: ['I think someone knows my PIN. Can I change it today?', '我觉得有人知道我的密码。今天能改吗？'],
          1: ['At any cash machine with the old PIN. Or come in with ID.', '在任意取款机用旧密码就能改。或者带证件来柜台。'],
        }),
        V('新卡没到', '补的卡一周了还没到。', {
          6: ['The replacement has not arrived after a week.', '补的卡一周了还没到。'],
        }),
      ],
      branches: [
        B(4, 'offer', '客服给了一个替代方案，你要判断合不合用',
          S('I can issue a digital card now and post the plastic one later.', '我可以先给您一张电子卡，实体卡之后寄。'),
          [O(S('Digital is fine. I mostly pay by phone anyway.', '电子卡行。我基本用手机付。'), S('I will send it to your app in a minute.', '一分钟内发到 app。')),
           O(S('I need cash withdrawals, so I will wait for the plastic.', '我要取现金，还是等实体卡。'), S('Then five working days, and I will text you.', '那五个工作日，我到时发短信。'))]),
      ],
      phrases: [
        P('I need to report a lost card.', '我要挂失卡。', 'report a lost card 是挂失的标准说法。'),
        P('Can it go to my home address?', '能寄到我家吗？', '补卡默认寄网点，可以要求寄家。'),
        P('What about payments already taken?', '已经扣的款呢？', '挂失前的盗刷可以申退。'),
      ],
    },

    {
      id: 'fire', name: '火警与疏散', lv: 4, cefr: 'B1',
      roles: ['你', '接线员'],
      lines: [
        L(1, 'Fire service. What is the emergency?', '消防。什么情况？'),
        L(0, 'The alarm is going off and there is smoke in the hall.', '警报响了，走廊里有烟。'),
        L(1, 'Is everyone out of the building?', '楼里的人都出来了吗？'),
        L(0, 'I think so. We are on the pavement outside.', '应该都出来了。我们在外面人行道上。'),
        L(1, 'Do not go back in. Is your flat door closed?', '别回去。你家门关了吗？'),
        L(0, 'It is closed. The smoke seems to come from the ground floor.', '关了。烟好像是从一楼来的。'),
        L(1, 'We are two minutes away. Keep the entrance clear.', '我们两分钟到。把入口让出来。'),
        L(0, 'Understood. Should I knock on doors?', '明白。我要去敲门吗？'),
        L(1, 'Only if it is safe. Do not go above the smoke.', '安全的话可以。别往烟里走。'),
      ],
      variants: [
        { tag: '楼道有烟', setting: '半夜警报响了，你穿拖鞋跑下楼。' },
        V('油锅起火', '厨房油锅烧起来了。', {
          0: ['A pan of oil caught fire in my kitchen.', '我厨房的油锅着火了。'],
          1: ['Do not use water. Cover it with a lid and turn off the heat.', '别用水。盖上锅盖，关火。'],
        }),
        V('误报', '警报一直响但没有烟。', {
          0: ['The alarm keeps going off but there is no smoke. Is it a fault?', '警报一直响但没烟。是故障吗？'],
          1: ['It may be a sensor. We still send someone to check.', '可能是传感器。我们还是会派人查。'],
        }),
        V('邻居家', '烟从隔壁冒出来。', {
          0: ['Smoke is coming from the flat next door. Nobody answers.', '烟从隔壁冒出来。没人应门。'],
          1: ['Do not force the door. We will break it in.', '别撞门。我们来破门。'],
        }),
        V('一氧化碳', '你的报警器在响但没着火。', {
          0: ['My carbon monoxide alarm is sounding. I feel dizzy.', '我的一氧化碳报警器在响。我头晕。'],
        }),
      ],
      branches: [
        B(5, 'probe', '接线员追问细节，你要给准确位置',
          S('Where exactly is the smoke coming from?', '烟到底从哪儿来？'),
          [O(S('Under the door of flat two, on the ground floor.', '一楼二号房的门缝下面。'), S('That helps. Stay outside.', '有用。待在外面。')),
           O(S('I cannot tell. It is filling the stairwell.', '看不出来。楼梯间都是烟。'), S('Then keep everyone out of the stairwell.', '那别让人进楼梯间。'))]),
      ],
      phrases: [
        P('The alarm is going off.', '警报在响。', 'go off 是警报响起。'),
        P('Do not go back in.', '别回去。', '消防员一定会说的一句。'),
        P('Keep the entrance clear.', '把入口让出来。', 'clear 在这里是「别挡道」。'),
      ],
    },

    {
      
      branches: [
        B(6, 'change', '查东西的方式有限制，你要换个途径',
          S('The online form only covers the last fourteen days.', '网上查询只覆盖最近十四天。'),
          [O(S('I lost it this morning, so online is fine.', '我今早丢的，网上就够。'), S('Then search by the train time, not the date.', '那按车次时间搜，别按日期。')),
           O(S('How do I check older items?', '更早的东西怎么查？'), S('Come to the office with ID and we will look in the back.', '带证件来办公室，我们查库房。'))]),
      ],
id: 'lost-found', name: '失物招领', lv: 3, cefr: 'B1',
      roles: ['你', '工作人员'],
      lines: [
        L(0, 'I left a bag on the train this morning.', '我今早在火车上落了一个包。'),
        L(1, 'Which line, and what time?', '哪条线，几点？'),
        L(0, 'The eight fifteen to Reading. A black rucksack.', '八点十五去雷丁那班。黑色双肩包。'),
        L(1, 'Anything inside that identifies you?', '里面有能证明是你的东西吗？'),
        L(0, 'A laptop with a sticker, and my passport.', '一台贴了贴纸的电脑，还有护照。'),
        L(1, 'It may be at the lost property office. Give it a day.', '可能送到失物招领处了。等一天。'),
        L(0, 'Can I check online?', '能在网上查吗？'),
        L(1, 'Yes, and you can collect it with ID.', '能，带证件就能取。'),
      ],
      variants: [
        { tag: '包落在火车上', setting: '你下车十分钟后才想起来包还在座位下。' },
        V('机场', '你在机场落下了行李。', {
          0: ['I think I left my bag at security this morning.', '我今早好像把包落在安检了。'],
          1: ['Security keeps items for thirty days. Call this number.', '安检处保留三十天。打这个电话。'],
        }),
        V('出租车', '你落在出租车后座。', {
          0: ['I left my phone in a taxi. I do not have the receipt.', '我把手机落出租车上了。没有小票。'],
          1: ['Do you remember the plate or the company colour?', '记得车牌或车身颜色吗？'],
        }),
        V('图书馆', '你把外套落在图书馆。', {
          0: ['I left a coat in the library on Tuesday. Is there a lost box?', '我周二把外套落在图书馆了。有失物箱吗？'],
        }),
        V('已被处理', '东西放太久了。', {
          6: ['It has been three months. Has it been thrown away?', '已经三个月了。被扔了吗？'],
        }),
      ],
      phrases: [
        P('I left a bag on the train.', '我把包落在火车上了。', 'leave 过去式 left，落东西的固定说法。'),
        P('Anything inside that identifies you?', '里面有能证明是你的东西吗？', '失物认领的关键。'),
        P('Collect it with ID.', '带证件来取。', 'collect 是领取。'),
      ],
    },

    {
      id: 'consulate', name: '领事馆补办旅行证', lv: 5, cefr: 'B2',
      roles: ['你', '领事'],
      lines: [
        L(1, 'How can I help?', '有什么可以帮您？'),
        L(0, 'I lost my passport. I need an emergency travel document.', '我护照丢了。需要办紧急旅行证。'),
        L(1, 'Do you have a police report?', '有报警记录吗？'),
        L(0, 'Yes, from this morning.', '有，今天早上的。'),
        L(1, 'And a photo, plus proof of travel?', '还有照片和行程证明？'),
        L(0, 'I have my ticket for Friday.', '我有周五的机票。'),
        L(1, 'We can issue it in two days. Bring the fee in cash.', '两天能出。费用带现金。'),
        L(0, 'Will it be accepted at the border?', '边境会认吗？'),
        L(1, 'It is a one-way document. Show it with the police report.', '这是单程证件。和报警记录一起出示。'),
      ],
      variants: [
        { tag: '护照丢失', setting: '你在国外旅行，护照和钱包一起丢了。' },
        V('护照被偷', '护照在酒店被偷。', {
          0: ['My passport was stolen from my hotel room.', '我的护照在酒店房间被偷了。'],
          1: ['Did the hotel file a report? We need one.', '酒店报案了吗？我们需要一份。'],
        }),
        V('签证过期', '你签证过期了，想回国。', {
          0: ['My visa has expired. I want to go home legally.', '我的签证过期了。我想合法回国。'],
          1: ['Then you also need an exit permit from immigration.', '那还需要移民局的出境许可。'],
        }),
        V('急事回国', '家里有丧事。', {
          0: ['There has been a death in my family. I need to fly tomorrow.', '家里有人去世。我明天要飞。'],
          1: ['We can do same-day in genuine emergencies. Bring the certificate.', '确实紧急可以当天办。带证明文件。'],
        }),
        V('公证', '你要办一份委托书公证。', {
          0: ['I need a power of attorney notarised.', '我要办一份委托书公证。'],
        }),
      ],
      branches: [
        B(5, 'probe', '领事要确认你的身份，材料不全',
          S('The ticket alone does not prove who you are.', '只有机票不能证明你是谁。'),
          [O(S('I have a photo of my passport on my phone.', '我手机里有护照照片。'), S('A photo helps, but we still need to verify with home.', '照片有帮助，但还是要跟国内核实。')),
           O(S('My employer can confirm my identity in writing.', '公司可以出书面证明。'), S('That would speed it up. Ask them to email us.', '那会快一些。让他们发邮件给我们。'))]),
      ],
      phrases: [
        P('I need an emergency travel document.', '我需要紧急旅行证。', '不是补护照，是「能上飞机的一张纸」。'),
        P('Proof of travel', '行程证明', '机票、订单都算。'),
        P('Will it be accepted at the border?', '边境会认吗？', '拿到证件也要确认能不能入境。'),
      ],
    },
  ],
};
