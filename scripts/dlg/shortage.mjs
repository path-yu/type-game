import { L, V, S, O, B, P } from './_dsl.mjs';

/**
 * 「东西没了」和「要加钱」这两类意外。
 *
 * 体检发现原有一千场里 56% 的岔路都是「对方追问」（probe），
 * 而真实生活里最常见的两种意外其实是：你要的那东西没有了、价格比你以为的高。
 * 这两类样本太少，实战报告里「你最容易卡在哪种情况」就等于只有一维。
 *
 * 所以这个文件只写这两类，每场 8 句、一条岔路，六种变体都在同一种意外上。
 */
export default {
  cat: '服务',
  items: [
    {
      id: 'hotel-overbooked', name: '到店没房了', cat: '住宿', lv: 4, cefr: 'B1',
      roles: ['你', '前台'],
      lines: [
        L(1, 'I am sorry, we do not have your room tonight.', '抱歉，今晚没有您的房间了。'),
        L(0, 'I booked three weeks ago and paid a deposit.', '我三周前就订了，还付了定金。'),
        L(1, 'The previous guest extended and we are now full.', '前一位客人续住了，我们满了。'),
        L(0, 'That is not something I can fix for you. What are my options?', '这不是我能替你解决的。我有什么选择？'),
        L(1, 'We can move you to our sister hotel, ten minutes away.', '可以安排您去姊妹酒店，十分钟车程。'),
        L(0, 'Same standard, and the same price?', '同档次、同价格吗？'),
        L(1, 'Same price, and we pay for the taxi.', '同价，打车我们出。'),
        L(0, 'And my luggage is already in your storage.', '我的行李已经存在你们这儿了。'),
      ],
      variants: [
        { tag: '深夜到店没房', setting: '晚上十一点半到店，前台说超售了。' },
        V('蜜月', '你们刚办完婚礼。', {
          1: ['We booked the suite for our wedding night.', '我们订的是婚礼当天的套房。'],
          2: ['I can see that. I am genuinely sorry.', '我看到了。真的很抱歉。'],
          3: ['Sorry does not give us a bed. What are you offering?', '道歉不给我们一张床。你们打算怎么安排？'],
        }),
        V('带孩子', '你带着两个睡着的孩子。', {
          3: ['I have two sleeping children in the taxi. I am not moving again.', '出租车里有两个睡着的孩子。我不再挪了。'],
          4: ['Then I will find you a room here. Give me ten minutes.', '那我在这儿给您腾一间。给我十分钟。'],
        }),
        V('会议', '你明天早上有会。', {
          7: ['I have a meeting at eight. How far is the other hotel?', '我八点有会。另一家酒店多远？'],
        }),
        V('会籍', '你是常客。', {
          0: ['I stay here every month. This is a poor way to treat a regular.', '我每月都住这儿。这样对待常客不太好。'],
        }),
        V('要求补偿', '你想要补偿。', {
          6: ['You pay the taxi and the first night. Is that possible?', '打车费和第一晚你们出。可以吗？'],
        }),
      ],
      branches: [
        B(5, 'short', '你要的东西没有了，得争一个能接受的替代方案',
          S('To be honest, the sister hotel is a lower grade. Same price, but three stars.', '说实话，姊妹酒店档次低一些。同价，但是三星。'),
          [O(S('Then I want the difference back, not the same price.', '那我要退差价，不是同价。'),
            S('I can do one night free. That covers the gap.', '我可以免一晚。差额就抵了。')),
           O(S('I will take it, on condition I can cancel tomorrow without charge.', '可以，前提是明天能免费取消。'),
            S('No cancellation fee. I will note it now.', '不收取消费。我现在备注。'))]),
      ],
      phrases: [
        P('We do not have your room tonight.', '今晚没有您的房间了。', '超售的标准说法。'),
        P('What are my options?', '我有什么选择？', '把难题推回去，但要方案。'),
        P('Same standard, and the same price?', '同档次同价吗？', '换酒店必须先确认这两条。'),
      ],
    },

    {
      id: 'seat-reservation', name: '票价不含座位', cat: '出行', lv: 3, cefr: 'B1',
      roles: ['你', '售票员'],
      lines: [
        L(1, 'That fare does not include a seat reservation.', '这个票价不含订座。'),
        L(0, 'So I can buy the ticket but not sit down?', '所以我能买票，但没座位？'),
        L(1, 'You can board, but you may stand. A seat is four pounds.', '可以上车，但可能站着。订座四镑。'),
        L(0, 'Is that per journey or per leg?', '是按行程还是按每一段？'),
        L(1, 'Per leg. Your trip has two changes, so twelve.', '按段。你这趟换两次车，所以十二。'),
        L(0, 'That is more than the ticket itself.', '这比票本身还贵。'),
        L(1, 'It is. Most people book earlier, when it is included.', '确实。多数人早点订，那时是含的。'),
        L(0, 'Fine. Reserve both legs.', '行。两段都订。'),
      ],
      variants: [
        { tag: '便宜票不含座', setting: '你贪便宜买了最便宜的票，结账时才发现不含座位。' },
        V('长途', '你要坐五个小时。', {
          0: ['Five hours standing is not realistic. Reserve it.', '站五小时不现实。订吧。'],
          1: ['Done. Window or aisle?', '好了。靠窗还是靠走廊？'],
        }),
        V('带孩子', '你带着孩子。', {
          3: ['I have a seven-year-old. Do children need a reservation?', '我带了个七岁的孩子。小孩要订座吗？'],
          4: ['Under five they do not, but they do not get a seat.', '五岁以下不用，但也没有座位。'],
        }),
        V('问退款', '你不想付。', {
          5: ['If I do not reserve, can I get a refund on the standing ticket?', '如果不订座，站票能退吗？'],
        }),
        V('换票种', '你想换含座的票。', {
          6: ['Is there a fare that includes the seat, even if it costs more?', '有含座的票价吗？贵点也行。'],
        }),
        V('团体', '你们五个人。', {
          2: ['There are five of us. Is there a group rate with seats?', '我们五个人。有含座的团体价吗？'],
        }),
      ],
      branches: [
        B(5, 'cost', '对方报了一个你没算到的价，你要判断值不值',
          S('Twelve pounds on top, and the seats are in the quiet coach.', '加十二镑，座位在静音车厢。'),
          [O(S('Quiet coach is worth twelve. Do it.', '静音车厢值这十二块。订吧。'),
            S('You will have a table too.', '还有一张桌子。')),
           O(S('Twelve is too much. Which leg is busiest?', '十二太贵。哪一段最挤？'),
            S('The middle one. Reserve that and stand on the short one.', '中间那段。订那段，短的那段站着。'))]),
      ],
      phrases: [
        P('It does not include a seat reservation.', '不含订座。', '便宜票的常见限制。'),
        P('Per leg, not per journey.', '按段算，不是按整趟。', 'leg 是行程的一段。'),
        P('Reserve both legs.', '两段都订。', '转车时容易漏掉一段。'),
      ],
    },

    {
      id: 'special-sold-out', name: '招牌菜卖完了', cat: '餐饮', lv: 3, cefr: 'B1',
      roles: ['你', '服务生'],
      lines: [
        L(1, 'The lamb is finished, I am afraid.', '羊排卖完了。'),
        L(0, 'It is seven o clock. You have been open an hour.', '现在七点。你们才开门一小时。'),
        L(1, 'It was a small delivery, and the early tables took it.', '到的量少，早来的几桌拿走了。'),
        L(0, 'What is left that is not fried?', '还有什么不是油炸的？'),
        L(1, 'The fish, and the mushroom risotto.', '有鱼，还有蘑菇烩饭。'),
        L(0, 'Is the fish fresh today?', '鱼是今天的吗？'),
        L(1, 'It came in this morning. I can show you the box.', '今早到的。可以给您看包装箱。'),
        L(0, 'Then the fish. And the risotto for my friend.', '那要鱼。我朋友要烩饭。'),
      ],
      variants: [
        { tag: '七点就没了', setting: '你专程为一道菜来的，六点半就订了位。' },
        V('预订了菜', '你订位时说了要这道。', {
          1: ['I asked for the lamb when I booked. It was the reason we came.', '订位时我说了要羊排。我们就是为它来的。'],
          2: ['Nobody wrote it down. That is our mistake.', '没人记下来。是我们的问题。'],
        }),
        V('素食', '你们吃素。', {
          3: ['We are both vegetarian. Is the risotto the only option?', '我们俩都吃素。只有烩饭吗？'],
        }),
        V('要求补偿', '你有点生气。', {
          4: ['Do you offer anything for the wasted trip?', '白跑一趟，有补偿吗？'],
        }),
        V('换餐厅', '你想走。', {
          5: ['We will go somewhere else. Sorry.', '我们去别家。抱歉。'],
        }),
        V('等下一批', '你想问还会不会有。', {
          6: ['Is there another delivery tonight?', '今晚还会到货吗？'],
        }),
      ],
      branches: [
        B(5, 'short', '你想点的东西没了，要在剩下的里做选择',
          S('The fish is the last one. After that it is risotto or nothing.', '鱼只剩一份。之后就只有烩饭。'),
          [O(S('Then we will share the fish and take two risottos.', '那我们分那份鱼，再来两份烩饭。'),
            S('I will split it in the kitchen for you.', '我在厨房帮你们分好。')),
           O(S('Bring the risotto, and the bill for the drinks.', '上烩饭吧，饮料的钱我付。'),
            S('Drinks are on the house tonight.', '今晚饮料我们请。'))]),
      ],
      phrases: [
        P('The lamb is finished.', '羊排卖完了。', 'finished 比 no more 客气。'),
        P('What is left that is not fried?', '还有什么不是油炸的？', '带条件的提问，比「还有什么」有效。'),
        P('It was the reason we came.', '我们就是为它来的。', '表达失望又不骂人。'),
      ],
    },

    {
      id: 'asbestos-quote', name: '装修报价涨了', cat: '服务', lv: 5, cefr: 'B2',
      roles: ['你', '工头'],
      lines: [
        L(1, 'The quote has gone up by eight hundred.', '报价涨了八百。'),
        L(0, 'We agreed a fixed price in March.', '三月说好的是固定价。'),
        L(1, 'We found asbestos board behind the plaster.', '墙皮后面发现了石棉板。'),
        L(0, 'Was that not covered in the survey you did?', '你们做的勘察没查到吗？'),
        L(1, 'No. It was hidden. Removal needs a licensed team.', '没有。藏起来的。清理要持证团队。'),
        L(0, 'Can I see the test certificate?', '能看一下检测报告吗？'),
        L(1, 'Here it is. The lab confirms it.', '在这儿。实验室确认了。'),
        L(0, 'Then it is not your fault, but I need that cost broken down.', '那不是你的错，但我要这笔费用的明细。'),
      ],
      variants: [
        { tag: '发现石棉', setting: '开工第二周，工头打电话来说要加钱。' },
        V('怀疑虚报', '你不信。', {
          3: ['How do I know the board was not there when you quoted?', '我怎么知道报价时那块板不在？'],
          4: ['The survey photos show plaster, not board. That is all I can show you.', '勘察照片里是墙皮，不是板。我只能给你看这个。'],
        }),
        V('仲裁', '你想找第三方。', {
          5: ['I want a second opinion before any work continues.', '继续施工前我要第三方意见。'],
          6: ['Fair. Nothing happens until you say so.', '合理。你同意前我们不动。'],
        }),
        V('换方案', '你想绕开它。', {
          0: ['Can we box it in instead of removing it?', '能不能包起来而不是拆掉？'],
          1: ['Not legally in a room you sleep in.', '卧室里法律上不行。'],
        }),
        V('工期', '你担心拖期。', {
          7: ['How long does removal add, and who pays for the delay?', '拆除要多多久？延期谁负责？'],
        }),
        V('接受', '你接受加价但要写进合同。', {
          2: ['Send me a revised contract with the removal itemised.', '发我一份修订合同，把拆除单独列项。'],
        }),
      ],
      branches: [
        B(5, 'cost', '多出来的钱要有依据，你要判断这笔该不该付',
          S('Removal is eight hundred, done by a licensed contractor with a certificate.', '拆除八百，由持证公司做，出证书。'),
          [O(S('Send the contractor quote and I will pay it directly.', '把承包商的报价发我，我直接付给他们。'),
            S('That keeps it clean. I will forward it today.', '这样清楚。我今天转发。')),
           O(S('Eight hundred for one wall seems high. Get a second quote.', '一面墙八百偏高。再找一家报价。'),
            S('I can, but it adds a week.', '可以，但要多一周。'))]),
      ],
      phrases: [
        P('We agreed a fixed price.', '说好的是固定价。', '先立住原合同。'),
        P('I need that cost broken down.', '我要这笔费用的明细。', '不拒绝加钱，但要依据。'),
        P('Was that not covered in the survey?', '勘察没查到吗？', '追问责任边界。'),
      ],
    },

    {
      id: 'courier-surcharge', name: '快递加收偏远费', cat: '服务', lv: 4, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(1, 'There is a surcharge on this delivery.', '这单要加收费用。'),
        L(0, 'I paid the price shown on the website.', '我付的是网站上显示的价格。'),
        L(1, 'The address is outside the standard zone, so it is eight more.', '地址在标准区外，要加八块。'),
        L(0, 'The website took my postcode and quoted a total.', '网站收了我的邮编，给了总价。'),
        L(1, 'The system checks the postcode but not the district.', '系统只查邮编，不查区划。'),
        L(0, 'That is your bug, not my address. Who can waive it?', '那是你们的 bug，不是我的地址问题。谁能免掉？'),
        L(1, 'I can waive it once as a goodwill credit.', '我可以作为善意补偿免一次。'),
        L(0, 'Please do, and report the postcode fault.', '那就免掉，并把邮编的 bug 报上去。'),
      ],
      variants: [
        { tag: '结账时加八块', setting: '东西已经装车，客服打电话来要加钱。' },
        V('拒付', '你不打算付。', {
          0: ['I am not paying more than the confirmed total.', '我不会付超过确认总价的金额。'],
          1: ['Then the driver will return it to the depot.', '那司机把货送回站点。'],
        }),
        V('大件', '你买的是家具。', {
          2: ['Is the surcharge the same for a two-metre box?', '两米的箱子也是这个加价吗？'],
        }),
        V('改地址', '你愿意改到公司。', {
          3: ['Would my office address avoid it? It is in the centre.', '寄到我公司能不能免？在市中心。'],
        }),
        V('要书面', '你要确认不再加。', {
          6: ['Could you confirm in writing that no further charges apply?', '能书面确认之后不再收费吗？'],
        }),
        V('投诉', '你要走投诉。', {
          7: ['If it is charged again, I will dispute it with my card.', '如果再扣，我会走信用卡争议。'],
        }),
      ],
      branches: [
        B(5, 'cost', '对方多要一笔钱，你要判断这是不是你的责任',
          S('The driver is already on the road. If you refuse, it comes back tomorrow.', '司机已经在路上。你拒绝的话明天退回。'),
          [O(S('Bring it back. I will rebook with the right price.', '退回来。我按正确价格重订。'),
            S('That is your right. I will cancel the fee now.', '这是您的权利。我现在取消这笔费用。')),
           O(S('Deliver it and waive the eight. I need it today.', '送货并免掉这八块。我今天就要。'),
            S('I can do the waiver, but not the delivery promise.', '免单可以，但送达时间保证不了。'))]),
      ],
      phrases: [
        P('I paid the price shown on the website.', '我付的是网站上的价。', '先锚定已确认的价格。'),
        P('That is your bug, not my address.', '那是你们的 bug。', '分清责任。'),
        P('Who can waive it?', '谁能免掉？', '不争论，直接找有权限的人。'),
      ],
    },

    {
      id: 'show-sold-out', name: '演出票售罄', cat: '生活', lv: 3, cefr: 'B1',
      roles: ['你', '售票处'],
      lines: [
        L(1, 'The eight o clock is sold out.', '八点那场卖完了。'),
        L(0, 'Your website said twelve seats left an hour ago.', '一小时前你们网站还剩十二个位子。'),
        L(1, 'They went in the last hour. The late show has two.', '最后一小时卖掉了。晚场还有两个。'),
        L(0, 'The late show ends at midnight. Is it the same cast?', '晚场到午夜结束。是同一批演员吗？'),
        L(1, 'Same cast. It finishes later, that is all.', '同一批。就是结束得晚。'),
        L(0, 'Do I get the same price?', '价格一样吗？'),
        L(1, 'The late show is two pounds cheaper.', '晚场便宜两镑。'),
        L(0, 'Then two for the late show.', '那要两张晚场。'),
      ],
      variants: [
        { tag: '网站显示有票', setting: '你按网站余票显示来买票，到窗口说没了。' },
        V('赶末班车', '你不能待到午夜。', {
          3: ['I have a train at eleven. Is there anything earlier tomorrow?', '我十一点有火车。明天早一点的有吗？'],
          4: ['Tomorrow at six has six seats left.', '明天六点还有六个位子。'],
        }),
        V('带老人', '你带父母来。', {
          5: ['Is there step-free access for the late show?', '晚场有无障碍通道吗？'],
        }),
        V('要退票', '你已经买了别场。', {
          6: ['I bought tickets for tonight online. Can I swap them?', '我在网上买了今晚的票。能换吗？'],
        }),
        V('转售', '你想买转售票。', {
          0: ['Do you have a returns queue for sold-out shows?', '售罄的场次有退票候补吗？'],
        }),
        V('怀疑超卖', '你觉得票放超了。', {
          2: ['How can twelve seats disappear in an hour?', '一小时怎么卖掉十二个位子？'],
        }),
      ],
      branches: [
        B(5, 'short', '你想看的场次没了，要在替代方案里挑',
          S('Two seats left for the late show, but they are not together.', '晚场还剩两个位子，但不挨着。'),
          [O(S('Take them. We can sit apart for two hours.', '要了。分开坐两小时没什么。'),
            S('I will put you in the same row.', '我给您安排在同一排。')),
           O(S('We will come back tomorrow instead.', '那我们明天再来。'),
            S('I will hold two for tomorrow at six.', '我给您留两张明天六点的。'))]),
      ],
      phrases: [
        P('The eight o clock is sold out.', '八点那场卖完了。', 'sold out 是售罄。'),
        P('Is it the same cast?', '是同一批演员吗？', '换场次前必问。'),
        P('They are not together.', '位子不挨着。', '售票处的常用说明。'),
      ],
    },

    {
      id: 'rental-fees', name: '租车多出五十', cat: '出行', lv: 4, cefr: 'B1',
      roles: ['你', '租车行'],
      lines: [
        L(1, 'The total is two hundred and forty, not one ninety.', '总共二百四，不是一百九。'),
        L(0, 'What is the extra fifty?', '多的五十是什么？'),
        L(1, 'Young driver fee, and the airport surcharge.', '年轻驾驶员费，加机场附加费。'),
        L(0, 'I am thirty-four. Why a young driver fee?', '我三十四岁。为什么有年轻驾驶员费？'),
        L(1, 'The system counted the booking date, not the pickup.', '系统算的是下单日，不是取车日。'),
        L(0, 'Then remove it. My licence is on the counter.', '那去掉。我的驾照就在柜台上。'),
        L(1, 'I will take it off. That leaves the airport fee.', '我给您去掉。剩下的就是机场费。'),
        L(0, 'Which was in the price I agreed online.', '那笔钱在我网上确认的价格里。'),
      ],
      variants: [
        { tag: '多出年轻驾驶员费', setting: '你在机场柜台取车，账单比预订价高五十。' },
        V('加驾驶员', '你加了第二驾驶员。', {
          0: ['I added a second driver. Is that the other charge?', '我加了个驾驶员。是那笔吗？'],
          1: ['It is. Ten a day, and it was in the small print.', '是。一天十镑，写在细则里。'],
        }),
        V('油费', '还车时被收油费。', {
          4: ['You filled it, but we charge for the service anyway.', '你加满了，但我们仍收加油服务费。'],
        }),
        V('过路费', '有笔过路费。', {
          5: ['There is a toll charge on the bill. I paid at the barrier.', '账单上有过路费。我在闸口付过了。'],
        }),
        V('要明细', '你想要逐项。', {
          6: ['Could you print the breakdown before I pay?', '付钱前能打一份明细吗？'],
        }),
        V('拒付', '你不打算付。', {
          7: ['I will pay one ninety as agreed, and dispute the rest.', '我按约定付一百九，其余争议。'],
        }),
      ],
      branches: [
        B(5, 'cost', '账单多出一笔，你要判断是不是你该付的',
          S('The airport fee is in the rate, but it is charged on arrival here.', '机场费含在费率里，但到店才收。'),
          [O(S('Then it should not appear twice. Show me the rate sheet.', '那不该收两次。把费率表给我看。'),
            S('You are right. The rate already includes it.', '您说得对。费率已含。')),
           O(S('Fine, I will pay it, but note my objection.', '行，我付，但把我的异议记下来。'),
            S('I will add a note to the contract.', '我在合同上加备注。'))]),
      ],
      phrases: [
        P('What is the extra fifty?', '多的五十是什么？', '逐项问，别整体争。'),
        P('It was in the price I agreed.', '那在我确认的价格里。', '锚定线上确认价。'),
        P('Print the breakdown before I pay.', '付钱前打一份明细。', '先看清单再付。'),
      ],
    },

    {
      id: 'flight-change-fee', name: '改签被收费', cat: '出行', lv: 4, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(1, 'Moving the flight costs sixty.', '改签收六十。'),
        L(0, 'The fare difference, or a fee?', '是差价还是手续费？'),
        L(1, 'A fee. The fare is the same on the new date.', '手续费。新日期票价一样。'),
        L(0, 'The airline cancelled my first booking. Do I still pay?', '航空公司取消了我原来的航班。还要收吗？'),
        L(1, 'If we cancelled, the change is free. Let me check.', '如果是我们取消的，改签免费。我查一下。'),
        L(0, 'It was cancelled in March, flight 218.', '三月取消的，218 航班。'),
        L(1, 'You are right. No fee, and I will rebook it now.', '你说得对。不收费，我现在给您改。'),
        L(0, 'Thank you. Same dates, one day later.', '谢谢。日期不变，延后一天。'),
      ],
      variants: [
        { tag: '被收改签费', setting: '你想把机票推后一天，客服报价六十。' },
        V('自己改主意', '确实是你想改。', {
          3: ['I am changing it myself. Is sixty the lowest fee?', '是我自己要改。六十是最低的吗？'],
          2: ['There is a same-day change for thirty, if you decide today.', '今天定的话有当天改签，三十。'],
        }),
        V('航班取消', '航司取消了。', {
          0: ['The airline cancelled the flight. Why am I paying to move?', '航司取消了航班。为什么我要付改签费？'],
        }),
        V('医疗原因', '你有医生证明。', {
          1: ['I have a medical certificate. Does that waive the fee?', '我有医生证明。能免手续费吗？'],
        }),
        V('退款', '你想退而不是改。', {
          5: ['Could I have a refund instead of a change?', '能退票而不是改签吗？'],
        }),
        V('转机', '改签影响转机。', {
          6: ['The change breaks my connection. Can you fix both?', '改签后转机接不上了。能一起改吗？'],
        }),
      ],
      branches: [
        B(5, 'cost', '对方要收一笔钱，你要判断该不该你出',
          S('The system charges a change fee because the booking is non-refundable.', '系统收改签费，因为这票不可退。'),
          [O(S('Non-refundable does not mean non-changeable. Read the fare rules.', '不可退不等于不可改。看运价规则。'),
            S('The rules say forty, not sixty.', '规则上写四十，不是六十。')),
           O(S('I will pay forty, not sixty, and I want the rule quoted.', '我付四十，不是六十，并把条款引用给我。'),
            S('I will send the fare rule with the receipt.', '我把运价规则和收据一起发您。'))]),
      ],
      phrases: [
        P('The fare difference, or a fee?', '是差价还是手续费？', '两个概念，价格差很多。'),
        P('If we cancelled, the change is free.', '我们取消的话，改签免费。', '关键规则。'),
        P('Non-refundable does not mean non-changeable.', '不可退不等于不可改。', '一句话拆掉常见话术。'),
      ],
    },
  ],
};
