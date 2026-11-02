import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '购物',
  items: [
    {
      id: 'appliance-shop', name: '买小冰箱', lv: 3, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Are you looking for anything in particular?', '想找点什么？'),
        L(0, 'A small fridge, for a studio flat.', '一台小冰箱，单间用。'),
        L(1, 'Under the counter, or full height?', '台下式还是全高？'),
        L(0, 'Under the counter. It has to fit a sixty centimetre gap.', '台下式。得塞进六十厘米的空。'),
        L(1, 'This one is fifty-five wide, and it draws very little power.', '这台宽五十五，很省电。'),
        L(0, 'Is delivery included?', '含送货吗？'),
        L(1, 'Free over two hundred, and they take the packaging away.', '满两百免费，包装也带走。'),
        L(0, 'Good. What is the warranty?', '好。保修多久？'),
      ],
      variants: [
        { tag: '单间小冰箱', setting: '你刚租下单间，厨房只有六十厘米的空。' },
        V('要冷冻格', '你需要冷冻。', {
          1: ['Does it have a freezer box? I need ice.', '有冷冻格吗？我需要冰块。'],
          2: ['A small one at the top. It holds two ice trays.', '上面有一个小的。能放两个冰格。'],
        }),
        V('噪音', '你睡觉轻。', {
          4: ['How loud is it? The flat is one room.', '噪音大吗？房子就一间。'],
          5: ['Thirty-nine decibels. You will hear it at night, honestly.', '三十九分贝。说实话晚上能听见。'],
        }),
        V('以旧换新', '你有旧机。', {
          6: ['Do you take the old one away as well?', '旧机也能带走吗？'],
          7: ['For twenty, on the same delivery.', '二十块，同一次送货。'],
        }),
        V('分期', '你想分期。', {
          0: ['Can I pay monthly?', '能按月付吗？'],
        }),
        V('安装', '你想知道要不要自己装。', {
          3: ['Do I need to install it, or does the driver?', '要自己装还是司机装？'],
        }),
      ],
      branches: [
        B(5, 'change', '送货条件有变，你要重新安排',
          S('Free delivery is next week. Tomorrow costs fifteen.', '免费送货是下周。明天要十五。'),
          [O(S('Next week is fine. I can wait.', '下周可以。我能等。'), S('I will book the first slot on Monday.', '我订周一第一个时段。')),
           O(S('Fifteen is worth it. Book tomorrow.', '这十五值。订明天。'), S('Before noon, then. Do you have a lift?', '那就中午前。有电梯吗？'))]),
      ],
      phrases: [
        P('It has to fit a sixty centimetre gap.', '得塞进六十厘米的空。', '买电器先说尺寸。'),
        P('Is delivery included?', '含送货吗？', '大件必问。'),
        P('What is the warranty?', '保修多久？', '两年是英国常见标准。'),
      ],
    },

    {
      
      branches: [
        B(5, 'change', '送货时间有变，你要调整',
          S('Afternoon delivery is full. I can do tomorrow morning.', '下午的配送满了。只能明天上午。'),
          [O(S('Tomorrow morning is too late. I will collect.', '明天上午太晚了。我自己来拿。'), S('I will have them ready by two.', '我两点前给您包好。')),
           O(S('Morning is fine. Send them before nine.', '上午可以。九点前送到。'), S('Message me the address and the card text.', '把地址和卡片内容发我。'))]),
      ],
id: 'florist', name: '花店订花', lv: 2, cefr: 'A2',
      roles: ['你', '花店'],
      lines: [
        L(1, 'What is the occasion?', '什么场合？'),
        L(0, 'An apology. I would rather not say more.', '道歉用的。我不太想多说。'),
        L(1, 'Then something simple. Tulips, or a mixed bunch?', '那就简单些。郁金香还是混合花束？'),
        L(0, 'Tulips. Do they last?', '郁金香。能放多久？'),
        L(1, 'A week, if you change the water.', '一周，如果换水的话。'),
        L(0, 'Could you deliver this afternoon?', '今天下午能送吗？'),
        L(1, 'Before five, yes. What should the card say?', '五点前可以。卡片写什么？'),
        L(0, 'Just my name. Nothing else.', '就写我的名字。别的不用。'),
      ],
      variants: [
        { tag: '道歉送花', setting: '你和伴侣吵架，想送花但不想写太多。' },
        V('生日', '你要送生日花。', {
          1: ['It is a birthday. Something brighter.', '是生日。要亮一点的。'],
          2: ['Then sunflowers, with a ribbon.', '那就向日葵，加条丝带。'],
        }),
        V('探望病人', '你要送医院。', {
          3: ['They are in hospital. Is there anything without a strong scent?', '对方在住院。有不那么香的吗？'],
        }),
        V('预算', '你只有二十。', {
          5: ['What can I get for twenty?', '二十块能买什么？'],
          6: ['A small bunch of tulips, wrapped.', '一小束郁金香，包好。'],
        }),
        V('告别', '同事离职。', {
          7: ['It is for a colleague who is leaving. Can you add a note?', '送离职同事。能加张便条吗？'],
        }),
        V('自取', '你想自己拿。', {
          0: ['I will collect them instead. What time do you close?', '我自己来拿。几点关门？'],
        }),
      ],
      phrases: [
        P('What is the occasion?', '什么场合？', '花店第一问。'),
        P('Do they last?', '能放多久？', 'last 是维持。'),
        P('What should the card say?', '卡片写什么？', '送花必被问。'),
      ],
    },

    {
      id: 'hardware', name: '五金店买配件', lv: 3, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'What are you fixing?', '修什么？'),
        L(0, 'A shelf that pulled out of the wall. The plaster is crumbly.', '一个书架从墙上拔出来了。墙皮很松。'),
        L(1, 'Then you need longer screws and plugs for hollow walls.', '那要长螺丝和空心墙膨胀管。'),
        L(0, 'How many do I need for a one-metre shelf?', '一米长的架子要几个？'),
        L(1, 'Four, with two brackets. Have you got the brackets?', '四个，配两个托架。托架有吗？'),
        L(0, 'No. Which ones hold twenty kilos?', '没有。哪种能承二十公斤？'),
        L(1, 'These, with the wide base. Take two.', '这种，底座宽。拿两个。'),
        L(0, 'And a drill bit the same size?', '再来一个同样尺寸的钻头？'),
      ],
      variants: [
        { tag: '书架从墙上掉下来', setting: '你租的房子墙很薄，书架连灰带钉掉了下来。' },
        V('挂画', '你只想挂一幅画。', {
          1: ['Just a picture frame, about three kilos.', '就一个相框，三公斤左右。'],
          2: ['A single hook will do. No drill needed.', '一个挂钩就行。不用钻。'],
        }),
        V('修门锁', '门锁松了。', {
          0: ['The lock is loose and the door does not close properly.', '锁松了，门关不严。'],
        }),
        V('补墙', '你要补墙洞。', {
          5: ['What do I use to fill the holes afterwards?', '之后用什么补洞？'],
          6: ['This filler, and a scraper. Sand it when dry.', '这个腻子，加一把刮刀。干了打磨。'],
        }),
        V('工具租借', '你不想买电钻。', {
          7: ['Do you hire drills? I will use it once.', '你们租电钻吗？我只会用一次。'],
        }),
        V('问尺寸', '你不知道螺丝多长。', {
          3: ['How long should the screws be?', '螺丝要多长？'],
        }),
      ],
      branches: [
        B(5, 'probe', '店员问你墙体情况，你要说清',
          S('Is it plasterboard or solid brick behind the plaster?', '墙皮后面是石膏板还是实心砖？'),
          [O(S('It sounds hollow when I knock.', '敲起来是空的。'), S('Then it is plasterboard. Use these plugs.', '那是石膏板。用这种膨胀管。')),
           O(S('I do not know. Does it change what I buy?', '我不知道。会影响买什么吗？'), S('Completely. One holds, the other pulls out.', '完全会。一个能挂住，一个会拔出来。'))]),
      ],
      phrases: [
        P('It pulled out of the wall.', '从墙上拔出来了。', 'pull out 是拔出。'),
        P('For hollow walls.', '用于空心墙。', '空心墙要用专用胀管。'),
        P('Which ones hold twenty kilos?', '哪种能承二十公斤？', '承重直接问数字。'),
      ],
    },

    {
      id: 'secondhand', name: '买二手自行车', lv: 3, cefr: 'B1',
      roles: ['你', '卖家'],
      lines: [
        L(1, 'Is the bike still available?', '车还在吗？'),
        L(0, 'It is. Two people are coming to see it tomorrow.', '在。明天有两个人来看。'),
        L(1, 'Could I come tonight? I can pay cash.', '今晚能来吗？我付现金。'),
        L(0, 'Tonight works. It is as described, apart from a scratch.', '今晚可以。跟描述一样，就是有道划痕。'),
        L(1, 'Would you take four hundred?', '四百行吗？'),
        L(0, 'Five is already low. I can do four eighty.', '五百已经很低了。四百八可以。'),
        L(1, 'Four fifty, and I collect it now.', '四百五，我现在就来取。'),
        L(0, 'Deal. Bring a lock, the one on it stays with me.', '成交。带把锁来，车上那把我要留着。'),
      ],
      variants: [
        { tag: '二手公路车', setting: '你在二手平台看到一辆车，标价五百。' },
        V('问历史', '你想知道车况。', {
          2: ['How many miles has it done, and has it been crashed?', '跑了多少公里？摔过吗？'],
          3: ['About two thousand. One slow fall, new bar tape after.', '大概两千。摔过一次慢的，之后换了把带。'],
        }),
        V('试骑', '你想试。', {
          1: ['Can I take it round the block before deciding?', '决定前能骑一圈吗？'],
        }),
        V('看车架号', '你担心是赃车。', {
          4: ['Do you have the frame number and the original receipt?', '有车架号和原始收据吗？'],
        }),
        V('卖家涨价', '到了对方要加钱。', {
          5: ['We agreed four fifty on the phone. Why is it five now?', '电话里说好四百五。怎么现在五百了？'],
        }),
        V('不买了', '你看了不满意。', {
          7: ['It is not what I expected. I will leave it, thanks.', '跟我想的不一样。算了，谢谢。'],
        }),
      ],
      branches: [
        B(3, 'probe', '卖家强调瑕疵，你要判断能不能接受',
          S('There is a dent in the top tube. It is cosmetic, not structural.', '上管有个凹。是外观，不影响结构。'),
          [O(S('Can I have a shop check it before I pay?', '付钱前能让车店看一下吗？'), S('You can, but I have others coming tomorrow.', '可以，但明天还有人来。')),
           O(S('A dent is a dent. I will offer three eighty.', '凹就是凹。我出三百八。'), S('Four twenty and it is yours tonight.', '四百二，今晚归你。'))]),
      ],
      phrases: [
        P('Is it still available?', '还在吗？', '二手交易第一句。'),
        P('As described, apart from a scratch.', '跟描述一样，只是有划痕。', '诚实描述能省掉来回。'),
        P('Would you take four hundred?', '四百行吗？', '砍价的标准句式。'),
      ],
    },

    {
      id: 'return-policy', name: '过了退货期', lv: 4, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Do you have the receipt?', '有小票吗？'),
        L(0, 'I do, but it was bought eleven months ago.', '有，但是十一个月前买的。'),
        L(1, 'Our policy is thirty days for a refund.', '我们的退款政策是三十天。'),
        L(0, 'It is faulty, not unwanted. The motor has seized.', '是质量问题，不是不喜欢。马达卡死了。'),
        L(1, 'Then it falls under the warranty, not the returns policy.', '那属于保修，不是退货政策。'),
        L(0, 'So what can you do?', '那你们能怎么处理？'),
        L(1, 'Repair or replace, your choice. We send it off for assessment.', '修或者换，你选。我们送去做检测。'),
        L(0, 'I would rather have a replacement.', '我更想换一台。'),
      ],
      variants: [
        { tag: '十一个月马达坏了', setting: '你买的家用电器过了退货期，但明显是质量问题。' },
        V('没有小票', '你丢了小票。', {
          0: ['I lost the receipt, but it is on my card statement.', '小票丢了，但信用卡账单上有。'],
          1: ['A statement is enough. Bring it in.', '账单可以。带来就行。'],
        }),
        V('想退款', '你不想要同款了。', {
          6: ['After two repairs, can I ask for a refund instead?', '修了两次之后，能要求退款吗？'],
          7: ['After the second failure, yes. Keep both repair notes.', '第二次故障后可以。两次维修单都留着。'],
        }),
        V('态度强硬', '店员不愿意处理。', {
          3: ['I am not asking for a favour. This is consumer law.', '我不是在讨人情。这是消费者法。'],
        }),
        V('网购', '你在网上下单。', {
          1: ['It was bought online. Do I deal with you or them?', '是网购的。找你们还是找他们？'],
        }),
        V('延误', '检测要三周。', {
          5: ['Three weeks without it is a long time. Is there a loan unit?', '三周没得用太久了。有备用机吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '店员只给修不给换，你要争取',
          S('The assessment decides. If it is repairable, we repair.', '检测决定。能修就修。'),
          [O(S('A seized motor is not repairable. Can we agree on that now?', '卡死的马达修不了。现在能定下来吗？'), S('It usually means a new motor, which is a repair.', '通常换马达，算维修。')),
           O(S('If it is repaired twice, I want a replacement in writing.', '修两次就换新，这条能写下来吗？'), S('I can note it on your file.', '我可以在档案里备注。'))]),
      ],
      phrases: [
        P('It is faulty, not unwanted.', '是质量问题，不是不喜欢。', 'faulty 走保修，unwanted 走退货。'),
        P('It falls under the warranty.', '属于保修范围。', 'fall under 是归属于。'),
        P('This is consumer law.', '这是消费者法。', '态度强硬但仍讲规则。'),
      ],
    },

    {
      
      branches: [
        B(5, 'probe', '店员问一个你需要确认的问题',
          S('Is this for a party? We limit how much one person can buy.', '是办派对吗？一人购买量有限制。'),
          [O(S('It is, for about fifteen people.', '是，大概十五个人。'), S('Then two bottles is fine. More needs a manager.', '那两瓶没问题。再多要经理批。')),
           O(S('Just a quiet dinner at home.', '只是家里吃个饭。'), S('Then you are well within the limit.', '那完全在限额内。'))]),
      ],
id: 'off-licence', name: '买酒被查证件', lv: 2, cefr: 'A2',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Can I see some ID? You look under twenty-five.', '能看一下证件吗？你看着不到二十五。'),
        L(0, 'Here is my passport. I am thirty-four.', '这是我的护照。我三十四。'),
        L(1, 'Sorry, we ask everyone who looks young.', '抱歉，看着年轻我们都会问。'),
        L(0, 'No problem. Do you have the red wine from the window?', '没事。橱窗那款红酒有吗？'),
        L(1, 'The one at fourteen ninety? Two bottles left.', '十四块九那款？还剩两瓶。'),
        L(0, 'I will take both. Do you have a bag?', '两瓶都要。有袋子吗？'),
        L(1, 'Ten pence, or a box for free.', '袋子一毛，纸箱免费。'),
        L(0, 'The box, then. That is easier to carry.', '那要纸箱。好拿。'),
      ],
      variants: [
        { tag: '买两瓶红酒', setting: '你给朋友带酒，结账时被要求出示证件。' },
        V('没带证件', '你身上只有手机。', {
          0: ['I left my ID at home. Can I come back?', '证件落家里了。能回来再买吗？'],
          1: ['I can hold the bottles until six.', '我可以把酒留到六点。'],
        }),
        V('帮别人买', '你替朋友买。', {
          3: ['It is for a friend. Does that matter?', '是帮朋友买。有影响吗？'],
        }),
        V('啤酒', '你想买一箱啤酒。', {
          4: ['Do you have a case of the local beer?', '有本地啤酒的整箱吗？'],
        }),
        V('问产地', '你想知道这酒的来历。', {
          6: ['Is this wine from the region on the label?', '这酒是标签上那个产区的吗？'],
        }),
        V('打折', '你想问有没有优惠。', {
          7: ['Is there a discount if I buy six?', '买六瓶有折扣吗？'],
        }),
      ],
      phrases: [
        P('Can I see some ID?', '能看一下证件吗？', '买酒必被问。'),
        P('We ask everyone who looks young.', '看着年轻我们都会问。', '店员的标准解释。'),
        P('A box for free.', '纸箱免费。', '比袋子结实。'),
      ],
    },

    {
      id: 'bookshop-order', name: '书店订绝版书', lv: 4, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Are you looking for a specific title?', '在找某本书吗？'),
        L(0, 'Yes, a history of this city. It is out of print.', '是，一本本市历史的书。已经绝版了。'),
        L(1, 'We can order it secondhand. About ten days.', '我们可以订二手。大概十天。'),
        L(0, 'What condition are they usually in?', '一般品相怎么样？'),
        L(1, 'Good, sometimes with a name inside. We check before calling.', '不错，有时里面写着名字。我们到货会先看。'),
        L(0, 'Please order it. Do I pay now?', '那就订吧。现在付吗？'),
        L(1, 'A deposit of five, the rest on collection.', '五块定金，其余取书时付。'),
        L(0, 'Fine. Could you text me rather than call?', '行。能发短信别打电话吗？'),
      ],
      variants: [
        { tag: '找绝版城市史', setting: '你在写一篇本地历史的文章，需要一本绝版书。' },
        V('新书预订', '书还没出。', {
          1: ['It is published in March. Can I pre-order?', '三月出版。能预订吗？'],
          2: ['We take pre-orders, and you get it on the day.', '可以预订，出版当天就能拿。'],
        }),
        V('只想要初版', '你在意版本。', {
          3: ['I only want a first edition. Is that possible?', '我只想要初版。可以吗？'],
        }),
        V('价格', '二手书很贵。', {
          4: ['The online prices are double. Can you do better?', '网上价格翻倍。你们能便宜点吗？'],
        }),
        V('图书馆', '你问有没有馆藏。', {
          5: ['Could the library order it instead? It is for research.', '图书馆能采购吗？这是做研究用。'],
        }),
        V('退订', '你找到了别处的书。', {
          7: ['I found a copy. Can I cancel the order?', '我在别处找到了。能取消订单吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '店员问你用途，你要说清需求',
          S('Is it for reading or for the notes? Some copies are heavily annotated.', '是读还是看注释？有些抄本批注很多。'),
          [O(S('For the notes. A previous owner notes would be useful.', '看注释。前一位读者的批注反而有用。'), S('Then I will look for one with writing.', '那我找带批注的。')),
           O(S('Clean copy, please. I want my own notes.', '干净的，谢谢。我想自己写批注。'), S('Understood. No writing inside.', '明白。内页无字。'))]),
      ],
      phrases: [
        P('It is out of print.', '已经绝版了。', 'out of print 是绝版。'),
        P('What condition is it in?', '品相怎么样？', '二手书必问。'),
        P('The rest on collection.', '其余取货时付。', 'collection 是到店取。'),
      ],
    },

    {
      id: 'optician-collect', name: '取眼镜不合适', lv: 3, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Collecting an order?', '来取眼镜？'),
        L(0, 'Yes. They were meant to be ready on Tuesday.', '是。本来周二就该好的。'),
        L(1, 'They came in this morning. Let me get them.', '今早到的。我去拿。'),
        L(0, 'Could you check the lenses are the right ones?', '能确认镜片是对的？'),
        L(1, 'Reading on the left, distance on the right. As ordered.', '左眼近用，右眼远用。跟订单一致。'),
        L(0, 'They feel tight behind the ears.', '耳朵后面有点夹。'),
        L(1, 'I will adjust the arms now. It takes a minute.', '我现在调一下镜腿。一分钟。'),
        L(0, 'Better. Can I come back if they still hurt?', '好多了。如果还夹能再来吗？'),
      ],
      variants: [
        { tag: '迟到两天取镜', setting: '你订的眼镜晚了，戴上又夹耳朵。' },
        V('度数不对', '你戴上头晕。', {
          3: ['I feel dizzy when I walk. Are these the right strength?', '走路会晕。度数对吗？'],
          4: ['Let me recheck the order against the prescription.', '我核对一下订单和处方。'],
        }),
        V('镜片装反', '左右眼弄反了。', {
          5: ['The near lens is on my right eye, not the left.', '近用镜片在右眼，不是左眼。'],
        }),
        V('新框', '你想要换个框。', {
          0: ['I do not like the frame after all. Can I swap it?', '我还是不喜欢这个框。能换吗？'],
        }),
        V('报销', '你要收据。', {
          6: ['Could I have an itemised receipt for my insurance?', '能给一张分项收据走保险吗？'],
        }),
        V('调整', '你想知道以后能不能免费调。', {
          7: ['Are adjustments free after this?', '之后调整免费吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '店员问你不舒服在哪，你要说具体',
          S('Where exactly does it press?', '具体哪里压？'),
          [O(S('Behind the ears, and a little on the nose.', '耳朵后面，鼻梁也有一点。'), S('I will open the arms and adjust the pads.', '我把镜腿张开，调一下鼻托。')),
           O(S('The right side more than the left.', '右边比左边明显。'), S('That usually means the frame is twisted.', '那通常是镜框歪了。'))]),
      ],
      phrases: [
        P('They were meant to be ready on Tuesday.', '本来周二就该好。', 'be meant to 是应该。'),
        P('As ordered.', '跟订单一致。', '取货时的确认语。'),
        P('They feel tight behind the ears.', '耳朵后面有点夹。', '描述不适的位置。'),
      ],
    },
  ],
};
