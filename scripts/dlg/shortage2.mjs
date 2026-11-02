import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '服务',
  items: [
    {
      id: 'size-gone', name: '断码只剩样品', cat: '购物', lv: 3, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'The medium is the last one on the shelf.', '中号是货架上最后一件。'),
        L(0, 'That one has a mark on the sleeve.', '那件袖子上有块印子。'),
        L(1, 'It does. Would you take it at a discount?', '确实。打折给您要吗？'),
        L(0, 'How much of a discount?', '打多少？'),
        L(1, 'Twenty percent, so thirty-two instead of forty.', '两成，三十二而不是四十。'),
        L(0, 'Is there a medium in another colour?', '别的颜色有中号吗？'),
        L(1, 'Navy, but only in large.', '藏青有，但只有大号。'),
        L(0, 'Then I will take the marked one at thirty-two.', '那就要这件有印子的，三十二。'),
      ],
      variants: [
        { tag: '中号只剩一件', setting: '你看中一件外套，中号只剩货架上那件样品。' },
        V('要调货', '你想等新的。', {
          5: ['Could you order a clean medium from another store?', '能从别的店调一件干净的中号吗？'],
          6: ['Two days, and I can hold it for you.', '两天，我可以给您留。'],
        }),
        V('样品价', '你想要更低。', {
          4: ['For a marked sample, could you do thirty?', '有印子的样品，三十行吗？'],
        }),
        V('洗得掉吗', '你想知道能不能处理。', {
          7: ['Will that mark come out, do you think?', '你觉得那块印子洗得掉吗？'],
        }),
        V('线上比价', '网上更便宜。', {
          3: ['It is thirty-two online, and that one is new.', '网上新的也是三十二。'],
        }),
        V('换尺码', '你决定换大号。', {
          1: ['Is the large much bigger? I am between sizes.', '大号会大很多吗？我在两个码之间。'],
        }),
      ],
      branches: [
        B(5, 'short', '你要的尺码或颜色没有了，得决定取舍',
          S('Medium is gone in every colour except the marked one.', '除了那件有印子的，所有颜色的中号都没了。'),
          [O(S('I will take the marked one. The discount covers it.', '就要那件有印子的。折扣抵得上。'),
            S('I will note the mark on the receipt, in case.', '我在收据上注明，以防万一。')),
           O(S('Then I will wait for the order. Two days is fine.', '那我等调货。两天可以。'),
            S('I will text you when it lands.', '到货我发短信。'))]),
      ],
      phrases: [
        P('The medium is the last one.', '中号是最后一件。', 'clearance 场景的开场。'),
        P('Would you take it at a discount?', '打折要吗？', '样品通常能谈两成。'),
        P('I am between sizes.', '我在两个码之间。', '试衣间的常用说法。'),
      ],
    },

    {
      id: 'ticket-scanned', name: '票被误扫', cat: '生活', lv: 4, cefr: 'B1',
      roles: ['你', '检票'],
      lines: [
        L(1, 'I cannot find your booking.', '我查不到您的预订。'),
        L(0, 'I have the confirmation email and the reference.', '我有确认邮件和订单号。'),
        L(1, 'The reference is right, but the tickets were already scanned.', '订单号是对的，但票已经被扫过了。'),
        L(0, 'Scanned? Nobody has gone in yet. The doors open at seven.', '扫过了？还没人进场。七点才开门。'),
        L(1, 'The system says two entries at six forty.', '系统显示六点四十进了两个人。'),
        L(0, 'Then someone used my reference. What do we do?', '那有人用了我的订单号。怎么办？'),
        L(1, 'I can reissue, but you pay again and claim it back.', '我可以重出票，但要先付，之后再申诉。'),
        L(0, 'That is not acceptable. Could you call the manager?', '这不行。能叫经理吗？'),
      ],
      variants: [
        { tag: '票在系统里已被扫', setting: '你提前二十分钟到，检票口说票已经用过了。' },
        V('二维码泄露', '你把票发过群。', {
          4: ['I sent the ticket to a group chat. Could someone have used it?', '我把票发到群里了。会不会有人用了？'],
          5: ['That is likely. It happens every week.', '很可能。每周都有这种事。'],
        }),
        V('转赠', '你的票是别人转的。', {
          3: ['A friend transferred it to me. Is that allowed?', '朋友转给我的。允许吗？'],
        }),
        V('要求入场', '你只想进去。', {
          6: ['I am not paying twice. Let me in and sort it after.', '我不会付两次。先让我进，之后再处理。'],
        }),
        V('退款', '你不想看了。', {
          7: ['Then refund me. I am not standing here for an hour.', '那就退钱。我不在这儿站一小时。'],
        }),
        V('证据', '你有购买记录。', {
          1: ['Here is the card statement and the email. Same time stamp.', '这是信用卡账单和邮件，时间戳一样。'],
        }),
      ],
      branches: [
        B(5, 'short', '你要的东西被占了，必须争一个能进场的方案',
          S('The seats are showing as used. I cannot let you through.', '座位显示已使用。我不能放您进。'),
          [O(S('Then let me speak to whoever can override it.', '那让我找能特批的人。'),
            S('The duty manager is at the desk. I will get her.', '值班经理在服务台。我去叫。')),
           O(S('Give me two standing places and refund the rest.', '给我两个站票，其余退款。'),
            S('I can do standing, but the refund takes five days.', '站票可以，退款要五天。'))]),
      ],
      phrases: [
        P('The tickets were already scanned.', '票已经被扫过了。', '重复入场的标准说法。'),
        P('Someone used my reference.', '有人用了我的订单号。', 'reference 是订单号。'),
        P('Could you call the manager?', '能叫经理吗？', '一线解决不了时的升级动作。'),
      ],
    },

    {
      id: 'hold-expired', name: '预约的书被上架', cat: '学习', lv: 3, cefr: 'B1',
      roles: ['你', '馆员'],
      lines: [
        L(1, 'The book you reserved has gone back to the shelf.', '您预约的书已经放回书架了。'),
        L(0, 'I reserved it on Monday and got an email saying it was held.', '我周一预约的，还收到邮件说已留书。'),
        L(1, 'Holds last three days. It is now day five.', '留书保留三天。今天第五天。'),
        L(0, 'The email said seven days.', '邮件上写的是七天。'),
        L(1, 'It changed last month. The email was not updated.', '上个月改的。邮件模板没更新。'),
        L(0, 'So the book is gone, and the message was wrong.', '所以书没了，通知还是错的。'),
        L(1, 'I can order it from another branch, two days.', '我可以从别的馆调，两天。'),
        L(0, 'Please do, and fix the email before it happens again.', '那就调吧，顺便把邮件改了，别再发生。'),
      ],
      variants: [
        { tag: '留书过期', setting: '你收到取书邮件，第四天来取，书已经上架了。' },
        V('别人刚借走', '书被借走了。', {
          3: ['Can you see who has it, and when it is due back?', '能看到谁借了吗？什么时候到期？'],
          4: ['Due back in two weeks. I can reserve it again.', '两周后到期。我可以再给您预约。'],
        }),
        V('电子版', '你想立刻看。', {
          5: ['Is there an electronic copy I could read today?', '有电子版今天就能看吗？'],
        }),
        V('投诉', '你想正式提。', {
          6: ['I want to log a complaint about the email, not the book.', '我要正式投诉那封邮件，不是书。'],
        }),
        V('多家分馆', '你想知道哪家有。', {
          7: ['Which branch has it on the shelf right now?', '现在哪个馆架上有？'],
        }),
        V('自己买', '你决定不等。', {
          0: ['I will buy a copy. Can you cancel the reservation?', '我去买一本。能取消预约吗？'],
        }),
      ],
      branches: [
        B(5, 'short', '你要的书没了，而通知给错了信息',
          S('The email was wrong. I can only offer the transfer.', '邮件确实错了。我只能给您调馆。'),
          [O(S('Two days is acceptable. Please reserve it properly this time.', '两天可以。这次请把预约做对。'),
            S('I will put a note on your account.', '我在您账户上做备注。')),
           O(S('I would rather have a written apology for the email.', '我更想要一封关于邮件的书面道歉。'),
            S('I will pass that to the manager today.', '我今天转给馆长。'))]),
      ],
      phrases: [
        P('Holds last three days.', '留书保留三天。', 'hold 是预约留书。'),
        P('The email was not updated.', '邮件没更新。', '系统与政策不同步。'),
        P('Fix the email before it happens again.', '把邮件改了，别再发生。', '要求修根因，不只是补一次。'),
      ],
    },

    {
      id: 'restricted-view', name: '座位视线受阻', cat: '生活', lv: 3, cefr: 'B1',
      roles: ['你', '售票处'],
      lines: [
        L(1, 'Those two seats have a restricted view.', '那两个座位视线受阻。'),
        L(0, 'Restricted how? The price was the same as the others.', '怎么受阻？价格和别的一样。'),
        L(1, 'A pillar cuts the left side of the stage.', '有根柱子挡住舞台左侧。'),
        L(0, 'At the same price, that is not right.', '同样的价格，这不合理。'),
        L(1, 'We can move you to the back row, or refund.', '可以换到后排，或者退款。'),
        L(0, 'What is in the back row?', '后排有什么位子？'),
        L(1, 'Two seats together, full view, slightly further.', '两个挨着的，视线完整，稍远一点。'),
        L(0, 'Then move us there.', '那就换到那儿。'),
      ],
      variants: [
        { tag: '买完才知道挡视线', setting: '你到剧场才发现座位被柱子挡了一半。' },
        V('要求差价', '你不想换位。', {
          3: ['If I keep these, I want the difference back.', '如果保留这两个位子，我要退差价。'],
          4: ['Restricted view seats are normally twenty percent less.', '受阻座位通常便宜两成。'],
        }),
        V('已经开演', '演出开始了。', {
          0: ['The show has started. Can we still be moved?', '演出开始了。还能换吗？'],
        }),
        V('带老人', '你带父母。', {
          5: ['The back row is far. Is there anything closer?', '后排太远。有近一点的吗？'],
        }),
        V('轮椅', '你需要无障碍位。', {
          6: ['Do you have a wheelchair space with a clear view?', '有无障碍且视线好的位子吗？'],
        }),
        V('退款', '你决定不看。', {
          7: ['Then refund both and I will come another night.', '那就退两张，我改天再来。'],
        }),
      ],
      branches: [
        B(5, 'short', '好位子没有了，你只能在不完美的选项里挑',
          S('The back row is the only pair left. Everything else is single seats.', '只剩后排那一对。其余都是单座。'),
          [O(S('Take the pair. Better far than split.', '要那一对。远一点好过分开。'),
            S('I will move you and reprint the tickets.', '我给您换位并重打票。')),
           O(S('How restricted are the singles?', '单座的视线差到什么程度？'),
            S('One is behind the pillar, the other is fine.', '一个在柱子后，另一个没问题。'))]),
      ],
      phrases: [
        P('A restricted view.', '视线受阻。', '票务术语。'),
        P('At the same price, that is not right.', '同样的价格不合理。', '先讲道理再提要求。'),
        P('Two seats together, full view.', '两个挨着，视线完整。', '换位时的具体要求。'),
      ],
    },

    {
      id: 'baggage-weight', name: '随身行李超重', cat: '出行', lv: 3, cefr: 'B1',
      roles: ['你', '地勤'],
      lines: [
        L(1, 'That bag is over the cabin limit.', '这件行李超过客舱限额。'),
        L(0, 'It fits the frame. I checked it at home.', '它塞得进那个框。我在家试过。'),
        L(1, 'It fits the frame but not the weight. Seven kilos, limit is five.', '塞得进框，但超重。七公斤，限额五公斤。'),
        L(0, 'How much to put it in the hold?', '托运多少钱？'),
        L(1, 'Forty-five, and it goes to the same destination.', '四十五，到同一个目的地。'),
        L(0, 'Forty-five for two kilos seems steep.', '两公斤收四十五有点贵。'),
        L(1, 'It is the standard fee. You can also wear a layer.', '这是标准价。您也可以多穿一件。'),
        L(0, 'I will wear the jacket and keep the bag.', '那我把外套穿上，包随身带。'),
      ],
      variants: [
        { tag: '随身超两公斤', setting: '登机口称重，你的包超了两公斤。' },
        V('免税店的东西', '你在机场买了东西。', {
          3: ['I bought this at duty free ten minutes ago. Does it count?', '这是十分钟前免税店买的。算吗？'],
          4: ['Duty free goes in a sealed bag. It does not count.', '免税品有封口袋。不算。'],
        }),
        V('乐器', '你带小提琴。', {
          0: ['It is a violin. Can it go in the cabin over the weight?', '这是小提琴。超重能带进客舱吗？'],
        }),
        V('拒付', '你不打算付。', {
          5: ['I will not pay forty-five. What is the alternative?', '我不付四十五。有什么别的办法？'],
        }),
        V('转机', '你还有一段。', {
          6: ['Does this fee cover the connecting flight too?', '这笔费包含转机那段吗？'],
        }),
        V('会员', '你有常旅客卡。', {
          7: ['Does my card include a baggage allowance?', '我的卡含行李额吗？'],
        }),
      ],
      branches: [
        B(5, 'cost', '对方按规矩收费，你要判断付钱还是改方案',
          S('Two kilos over, that is forty-five, or you can move items to a coat pocket.', '超两公斤，四十五，或者把东西塞进外套口袋。'),
          [O(S('I will move the heavy things into my pockets.', '我把重的东西塞口袋。'),
            S('Step aside and come back when you are under.', '您到旁边整理，好了再过来。')),
           O(S('Charge the forty-five. I am not unpacking here.', '收四十五吧。我不想在这儿翻包。'),
            S('It goes in the hold and you collect it at the belt.', '托运，到转盘取。'))]),
      ],
      phrases: [
        P('It fits the frame, not the weight.', '塞得进框，但超重。', '两个限制是分开的。'),
        P('Forty-five for two kilos seems steep.', '两公斤四十五有点贵。', '质疑价格但不骂人。'),
        P('I will wear a layer.', '我多穿一件。', '超重时的经典解法。'),
      ],
    },

    {
      id: 'deposit-raised', name: '押金从四周涨到六周', cat: '租房', lv: 5, cefr: 'B2',
      roles: ['你', '中介'],
      lines: [
        L(1, 'The deposit is now six weeks rent, not four.', '押金现在是六周房租，不是四周。'),
        L(0, 'We agreed four in the offer letter.', '意向书里说好是四周。'),
        L(1, 'The referencing came back with a thin credit file.', '背景调查回来信用记录很少。'),
        L(0, 'Thin means no history, not bad history.', '记录少意味着没有历史，不是坏历史。'),
        L(1, 'The insurer sets the deposit, not us.', '押金是保险公司定的，不是我们。'),
        L(0, 'Then I want that policy in writing.', '那我要那份保单的书面版本。'),
        L(1, 'I will send it. If it allows four, we revert.', '我发您。如果允许四周，就按四周。'),
        L(0, 'Good. I am not paying six on a guess.', '好。我不会凭猜测付六周。'),
      ],
      variants: [
        { tag: '押金涨了两周', setting: '签合同前两天，中介说押金要加。' },
        V('刚工作', '你刚入职没有信用记录。', {
          3: ['I arrived two months ago. Nobody has a file yet.', '我两个月前才来。谁都没有记录。'],
          4: ['Then a guarantor would keep it at four weeks.', '那找个担保人就能维持四周。'],
        }),
        V('有担保人', '你能提供担保人。', {
          0: ['I have a guarantor. Does that change the deposit?', '我有担保人。押金会变吗？'],
        }),
        V('拒签', '你考虑放弃这套。', {
          6: ['If it is six weeks, I will look elsewhere.', '如果是六周，我去看别处。'],
        }),
        V('拆解费用', '你想知道押金怎么算。', {
          5: ['How is six weeks calculated? Rent times six, or a fixed sum?', '六周怎么算？房租乘六，还是固定金额？'],
        }),
        V('法规', '你想引用规定。', {
          7: ['Is there a cap on deposits where I am renting?', '这边押金有上限吗？'],
        }),
      ],
      branches: [
        B(5, 'cost', '多出来的押金要有个说法，你要追到依据',
          S('Without the policy document, I can only tell you it is six weeks.', '没有保单文件，我只能告诉你是六周。'),
          [O(S('Then hold the flat until Friday and send it today.', '那保留房子到周五，今天把文件发我。'),
            S('I will hold it, but only until Friday noon.', '我给您留到周五中午。')),
           O(S('I will pay six weeks under protest, noted in writing.', '我可以按六周付，但要书面写明我保留异议。'),
            S('I will add the note to the contract.', '我在合同里加这条备注。'))]),
      ],
      phrases: [
        P('Thin credit file.', '信用记录很少。', '不是坏记录，是没记录。'),
        P('I want that policy in writing.', '我要保单的书面版本。', '口头依据不算。'),
        P('I am not paying six on a guess.', '我不会凭猜测付六周。', '一句话表明底线。'),
      ],
    },

    {
      id: 'service-charge', name: '账单里的服务费', cat: '餐饮', lv: 3, cefr: 'B1',
      roles: ['你', '服务生'],
      lines: [
        L(1, 'There is a twelve and a half percent service charge.', '有一笔一成二五的服务费。'),
        L(0, 'Is that optional?', '这笔是可选的？'),
        L(1, 'It is discretionary, but we add it by default.', '是自愿的，但默认加上。'),
        L(0, 'The service was slow, and one dish came out cold.', '上菜很慢，还有一道是凉的。'),
        L(1, 'You can ask for it to be removed.', '您可以要求去掉。'),
        L(0, 'I will take it off, and leave something in cash.', '那我要求去掉，现金另给一点。'),
        L(1, 'That is fair. I will adjust the bill.', '合理。我改一下账单。'),
        L(0, 'Thank you.', '谢谢。'),
      ],
      variants: [
        { tag: '服务费一成二五', setting: '账单上多了一笔服务费，你那桌服务并不好。' },
        V('服务很好', '你想多给。', {
          3: ['The service was good. Can I add more than the default?', '服务很好。能多加吗？'],
        }),
        V('大桌', '你们八个人。', {
          2: ['Is it compulsory for tables of eight?', '八人桌是强制收的吗？'],
          3: ['For eight or more, yes. It is on the menu.', '八人以上是。菜单上写了。'],
        }),
        V('已经给现金', '你付了现金小费。', {
          4: ['I already left cash. Can the charge come off?', '我已经留了现金。这笔能去掉吗？'],
        }),
        V('外卖', '你打包带走。', {
          5: ['Is there a service charge on takeaway?', '外卖也收服务费吗？'],
        }),
        V('发票', '你要报销。', {
          6: ['Could the service charge be shown separately on the receipt?', '收据上能单列服务费吗？'],
        }),
      ],
      branches: [
        B(3, 'cost', '账单上多了一笔，你要判断该不该付',
          S('I can take it off, but the kitchen will ask why.', '我可以去掉，但厨房会问原因。'),
          [O(S('Tell them the second dish came out cold, and nobody checked back.', '告诉他们第二道菜是凉的，也没人来问。'),
            S('That is a fair reason. I will remove it.', '这个理由站得住。我去掉。')),
           O(S('Leave half of it. The first two courses were fine.', '留一半吧。前两道不错。'),
            S('I will adjust it to six percent.', '我调到百分之六。'))]),
      ],
      phrases: [
        P('Is that optional?', '这笔可选吗？', 'service charge 通常自愿。'),
        P('It is discretionary.', '是自愿的。', '菜单上的标准措辞。'),
        P('One dish came out cold.', '有一道是凉的。', '具体事实比「服务差」有力。'),
      ],
    },

    {
      id: 'late-payment-fee', name: '滞纳金争议', cat: '财务', lv: 4, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(1, 'There is a late payment charge of fifteen.', '有一笔十五的滞纳金。'),
        L(0, 'I paid on the twenty-eighth. The due date was the twenty-eighth.', '我二十八号付的。到期日也是二十八号。'),
        L(1, 'The payment cleared on the twenty-ninth.', '款项二十九号才入账。'),
        L(0, 'That is one day, and it was a weekend.', '就一天，而且是周末。'),
        L(1, 'The system does not check weekends.', '系统不查周末。'),
        L(0, 'Then the system should. Can you waive the fifteen?', '那系统应该查。这十五能免吗？'),
        L(1, 'I can waive it as a first-time gesture.', '作为首次可以免。'),
        L(0, 'Please do, and log the weekend issue.', '那就免，并把周末的问题记下来。'),
      ],
      variants: [
        { tag: '按时付了还被收滞纳金', setting: '你账单上出现十五的滞纳金。' },
        V('银行延迟', '是银行转账慢。', {
          2: ['My bank shows the transfer on the twenty-eighth.', '我银行显示二十八号就转了。'],
          3: ['Send me the screenshot and I will remove it.', '把截图发我，我去掉。'],
        }),
        V('没收到账单', '账单没寄到。', {
          1: ['I never received the bill. It was paperless and the email bounced.', '我没收到账单。是电子账单，邮件退回了。'],
        }),
        V('第二次', '这不是第一次。', {
          5: ['This is the second time this year. I want the rule changed, not waived.', '今年第二次了。我要改规则，不是免一次。'],
        }),
        V('信用影响', '你担心信用记录。', {
          6: ['Will this appear on my credit file?', '这会进我的信用记录吗？'],
        }),
        V('取消', '你想取消服务。', {
          7: ['If this keeps happening, I will move to another provider.', '再这样我就换一家。'],
        }),
      ],
      branches: [
        B(5, 'cost', '对方按系统规则收费，你要争的是规则本身',
          S('I can waive fifteen, but the charge will come back next month.', '我可以免这十五，但下个月还会收。'),
          [O(S('Then fix the weekend rule, not just my bill.', '那改周末规则，不只是我的账单。'),
            S('I will raise it with the billing team.', '我提交给计费团队。')),
           O(S('Waive it and send me confirmation in writing.', '免掉，并给我书面确认。'),
            S('Email is on its way.', '邮件已发出。'))]),
      ],
      phrases: [
        P('The payment cleared on the twenty-ninth.', '款项二十九号入账。', 'clear 是到账。'),
        P('The system does not check weekends.', '系统不查周末。', '技术限制的常见解释。'),
        P('Fix the rule, not just my bill.', '改规则，不只是我的账单。', '要求根因修复。'),
      ],
    },
  ],
};
