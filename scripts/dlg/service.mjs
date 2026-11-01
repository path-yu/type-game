import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '服务',
  items: [
    {
      id: 'warranty', name: '保修期内换新', lv: 4, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(0, 'This kettle stopped working after five months.', '这个水壶用了五个月就坏了。'),
        L(1, 'Do you have the receipt?', '有小票吗？'),
        L(0, 'I have the order confirmation email.', '我有订单确认邮件。'),
        L(1, 'That is fine. It has a two-year warranty, so we can replace it today.', '可以。保修两年，今天就能换。'),
        L(0, 'Do I need the original box?', '需要原包装吗？'),
        L(1, 'Not for a replacement. Do you want the same model?', '换货不用。要同款吗？'),
        L(0, 'Is there something quieter? This one rattles.', '有安静点的吗？这个有异响。'),
        L(1, 'This one is ten more, and it is much quieter.', '这款贵十块，安静很多。', 'much quieter 这种程度副词，比 quiet 更能表达你的真实需求。'),
        L(0, 'I will pay the difference. Thanks.', '我补差价。谢谢。'),
      ],
      variants: [
        { tag: '水壶坏了', setting: '水壶用了五个月不通电，你带着邮件回店里。' },
        V('要退款', '你不想再要这个牌子了。', {
          4: ['Could I have a refund instead of a replacement?', '能退款而不是换货吗？'],
          5: ['Within six months, yes. It goes back to your card.', '六个月以内可以。退回原卡。'],
        }),
        V('超过保修', '东西用了三年，早过保了。', {
          0: ['It is three years old, so I expect no warranty. Can you still look at it?', '用了三年，我知道过保了。还能看看吗？'],
          1: ['We can send it for a quote, but there is a twenty fee.', '可以送去报价，但要二十检测费。'],
        }),
        V('网上买的', '你是在官网买的，来实体店问。', {
          2: ['I bought it online. Can I deal with it here?', '我在网上买的。能在店里处理吗？'],
          3: ['You can, as long as the order is in your name.', '可以，只要订单是你的名字。'],
        }),
        V('配件坏了', '只是电源线坏了。', {
          0: ['Only the cable is broken. Can I just get a new one?', '只是线坏了。能单买一根吗？'],
        }),
      ],
      branches: [
        B(4, 'offer', '店员给了一个替代方案，你要判断值不值',
          S('That model is out of stock. I can offer the next one up at the same price.', '那款没货了。可以同价给你升级款。'),
          [O(S('Same price for a better one? Yes, please.', '更好的同价？那要。'), S('I will process it as a warranty swap.', '我按保修换货处理。')),
           O(S('Is it the same size? It has to fit under the tap.', '尺寸一样吗？得塞进水龙头下面。'), S('Two centimetres taller, I am afraid.', '恐怕高两厘米。'))]),
      ],
      phrases: [
        P('It stopped working after five months.', '用了五个月就坏了。', '说时间点，保修期就有据可依。'),
        P('Do I need the original box?', '需要原包装吗？', '换货前问一句，省得白跑。'),
        P('I will pay the difference.', '我补差价。', '换更贵的型号时用。'),
      ],
    },

    {
      id: 'moving', name: '找搬家公司报价', lv: 4, cefr: 'B1',
      roles: ['你', '搬家客服'],
      lines: [
        L(0, 'I need a quote for a two-bedroom flat move.', '两居室搬家，想报个价。'),
        L(1, 'How far is the move?', '搬多远？'),
        L(0, 'About six miles, same city.', '大概六英里，同城。'),
        L(1, 'Any stairs or a lift?', '有楼梯还是电梯？'),
        L(0, 'Third floor, no lift at either end.', '三楼，两边都没电梯。'),
        L(1, 'That adds an hour. Roughly four hundred, including packing materials.', '那要多一小时。大概四百，含包装材料。'),
        L(0, 'Does that include dismantling the bed?', '包含拆床吗？'),
        L(1, 'It does. We can also reassemble it at the new place.', '包含。到新家也能装回去。'),
        L(0, 'Good. Are you insured if something breaks?', '好。东西摔坏了有保险吗？'),
      ],
      variants: [
        { tag: '两居室同城搬', setting: '你下个月搬家，两边都是没有电梯的老楼。' },
        V('只要人工', '你自己打包，只想要人搬。', {
          0: ['I will pack everything myself. What is the price for labour only?', '我自己打包。只要人工多少钱？'],
          1: ['Three hundred, and we still cover the stairs.', '三百，楼梯费也算在里面。'],
        }),
        V('长途搬家', '你要搬到另一个城市。', {
          0: ['I am moving to another city, about two hundred miles.', '我要搬到另一个城市，大概两百英里。'],
          1: ['Then it is by the mile and the day. I will email a quote.', '那要按里程和天数算。我邮件发报价。'],
        }),
        V('钢琴', '你有一架立式钢琴。', {
          4: ['There is an upright piano. Can you move it?', '有一架立式钢琴。你们能搬吗？'],
          5: ['We can, but it needs three people and a piano board.', '能，但要三个人和一块钢琴滑板。'],
        }),
        V('问保险', '你最担心损坏赔偿。', {
          8: ['What is covered if something breaks?', '东西坏了保到什么程度？'],
        }),
      ],
      branches: [
        B(6, 'cost', '报价比你预期高，你要砍价或减项',
          S('Four hundred is the weekday price. Saturdays are four eighty.', '四百是工作日价。周六四百八。'),
          [O(S('Then I will take a weekday and book time off.', '那我要工作日，请一天假。'), S('Tuesday is our quietest day.', '周二我们最闲。')),
           O(S('Can you drop the packing materials to bring it down?', '去掉包装材料能便宜点吗？'), S('Minus forty, but you supply the boxes.', '少四十，但纸箱你自己准备。'))]),
      ],
      phrases: [
        P('I need a quote for a move.', '搬家想报个价。', 'quote 是报价单。'),
        P('Any stairs or a lift?', '有楼梯还是电梯？', '搬家报价的第一变量。'),
        P('Are you insured?', '有保险吗？', '贵重物品搬家必问。'),
      ],
    },

    {
      
      branches: [
        B(4, 'probe', '对方说套餐有个隐藏限制，你要问清代价',
          S('The middle package is sixty, but it is shared at peak times.', '中间套餐六十，但高峰时段是共享带宽。'),
          [O(S('How slow does it get in the evening?', '晚上会慢到什么程度？'), S('Half the speed between seven and ten.', '七点到十点速度减半。')),
           O(S('What does the unshared one cost?', '独享的要多少钱？'), S('Eighty. It is worth it if you both work from home.', '八十。两个人在家办公的话值。'))]),
      ],
id: 'internet', name: '装宽带', lv: 4, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(0, 'I would like to set up broadband at my new flat.', '我想在新家装宽带。'),
        L(1, 'What is the postcode?', '邮编是多少？'),
        L(0, 'It is the flat above the shop on Mill Street.', '磨坊街商铺楼上那套。'),
        L(1, 'We can do fibre there. Which package suits you?', '那边能装光纤。您要哪个套餐？'),
        L(0, 'Two people, both working from home. Something reliable.', '两个人都在家办公。要稳定的。'),
        L(1, 'The middle package is sixty a month, and it is not shared.', '中间那个套餐每月六十，不是共享带宽。', 'not shared 是「独享带宽」，多人上网时不掉速。'),
        L(0, 'Is there a setup fee?', '有安装费吗？'),
        L(1, 'Normally thirty, but it is free on an eighteen-month contract.', '一般三十，签十八个月免费。'),
        L(0, 'What if I move before then?', '如果我在那之前搬家呢？'),
      ],
      variants: [
        { tag: '新家装光纤', setting: '你刚租下商铺楼上的房子，两个人在家办公。' },
        V('网速不够', '你已经在用，但视频会议总断。', {
          0: ['My video calls keep dropping. Is my line fast enough?', '视频会议老断。我的线路够快吗？'],
          1: ['Let me run a test on your line. It may be the router.', '我给线路做个测试。可能是路由器。'],
        }),
        V('要换运营商', '你想从别家转过来。', {
          0: ['I am with another provider. How does switching work?', '我在用别家。转网怎么操作？'],
          1: ['We handle the switch, and your number stays the same.', '我们处理转网，号码不变。'],
        }),
        V('搬家迁移', '你要把宽带迁到新地址。', {
          6: ['Can I move the service to a new address in June?', '六月能把服务迁到新地址吗？'],
          7: ['Yes, thirty days notice and a twenty fee.', '可以，提前三十天通知，收二十。'],
        }),
        V('取消', '你要回国，想提前解约。', {
          8: ['I am leaving the country. What is the early exit fee?', '我要回国。提前解约多少钱？'],
        }),
      ],
      phrases: [
        P('I would like to set up broadband.', '我想装宽带。', 'broadband 是宽带，fibre 是光纤。'),
        P('Is there a setup fee?', '有安装费吗？', 'setup fee 常被免掉，要问。'),
        P('What if I move before then?', '如果之前搬家呢？', '签长约前必问。'),
      ],
    },

    {
      id: 'utilities', name: '水电开户', lv: 4, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(0, 'I have just moved in and need to set up the electricity.', '我刚搬进来，要开通电。'),
        L(1, 'Is the supply already on?', '现在有电吗？'),
        L(0, 'It is, but the previous tenant closed the account.', '有，但前租客把账户销了。'),
        L(1, 'I need a meter reading from the day you moved in.', '需要您入住当天的电表读数。'),
        L(0, 'I took a photo on the first day. Will that do?', '我第一天拍了照。可以吗？'),
        L(1, 'Perfect. Are you on a fixed or variable rate?', '很好。您要固定价还是浮动价？'),
        L(0, 'Fixed, if the price is reasonable.', '价格合理的话要固定价。'),
        L(1, 'Fixed for twelve months is slightly higher, but it will not move.', '固定十二个月略贵，但不会变。'),
        L(0, 'I will take fixed. Can I set up a direct debit?', '那要固定价。能设自动扣款吗？'),
      ],
      variants: [
        { tag: '开通电力', setting: '你搬进新租的房子，前租客已经销户。' },
        V('水费', '你要开水费账户。', {
          0: ['I also need to set up the water account.', '我还想开水费账户。'],
          1: ['Water is with the council here, not with us.', '这边水费归市政，不归我们。'],
        }),
        V('账单太高', '上个月账单翻倍了。', {
          0: ['My last bill doubled. Is there a leak or a meter fault?', '上个月账单翻倍。是漏水还是表坏了？'],
          1: ['We can send an engineer to test the meter for free.', '我们可以免费派工程师测表。'],
        }),
        V('换供应商', '你想比价换一家。', {
          6: ['How much notice do I need to switch supplier?', '换供应商要提前多久？'],
          7: ['Twenty-eight days, and we do the paperwork.', '二十八天，手续我们来办。'],
        }),
        V('搬走销户', '你要搬走，想结算。', {
          8: ['I am moving out at the end of the month. How do I close it?', '我月底搬走。怎么销户？'],
        }),
      ],
      branches: [
        B(4, 'change', '对方要一个你没有的东西，你要找替代办法',
          S('We need the reading from the move-in date, not today.', '我们要入住当天的读数，不是今天的。'),
          [O(S('The landlord wrote it in the inventory. Can I send a photo?', '房东在交接单上写了。能发照片吗？'), S('A photo of the inventory is fine.', '交接单照片可以。')),
           O(S('Can the engineer read it and backdate the bill?', '能让工程师来抄表并按那天算吗？'), S('We can, but there is a fifteen charge.', '可以，但要收十五。'))]),
      ],
      phrases: [
        P('I need a meter reading.', '需要电表读数。', 'meter reading 是抄表数字。'),
        P('Fixed or variable rate?', '固定价还是浮动价？', '固定贵但可预期，浮动便宜但会涨。'),
        P('Can I set up a direct debit?', '能设自动扣款吗？', 'direct debit 是授权扣款，通常有折扣。'),
      ],
    },

    {
      
      branches: [
        B(6, 'cost', '第一次上门时间更长，你要确认价格会不会变',
          S('The first visit usually takes three hours. It may cost more.', '第一次一般要三小时，可能会贵一些。'),
          [O(S('How much more? I would rather know now.', '贵多少？我宁愿现在就知道。'), S('Twenty more, and we agree it before we start.', '多二十，开工前先跟您确认。')),
           O(S('Then I will do the kitchen myself first.', '那厨房我自己先收拾。'), S('That would keep it to two hours.', '那样两小时就够。'))]),
      ],
id: 'cleaning', name: '请保洁上门', lv: 3, cefr: 'B1',
      roles: ['你', '保洁公司'],
      lines: [
        L(0, 'I would like a cleaner for a two-bedroom flat, once a fortnight.', '我想请保洁，两居室，两周一次。'),
        L(1, 'Is it a deep clean or a regular one?', '是深度保洁还是常规保洁？'),
        L(0, 'Regular. The kitchen needs attention though.', '常规。不过厨房需要重点处理。'),
        L(1, 'That is fine. Two hours is usually enough.', '可以。一般两小时够。'),
        L(0, 'Do I need to be home?', '我需要在家吗？'),
        L(1, 'Most clients leave a key or a code. It is up to you.', '多数客户留钥匙或密码。看您方便。'),
        L(0, 'I would rather be here the first time.', '第一次我还是在家。'),
        L(1, 'Sensible. Two hours is fifty, and the products are included.', '这样稳妥。两小时五十，耗材包含在内。'),
      ],
      variants: [
        { tag: '两居室常规保洁', setting: '你工作忙，厨房和浴室已经顾不上两周了。' },
        V('退租大扫除', '你要退租，房东要求专业清洁。', {
          0: ['I need an end-of-tenancy clean before Friday.', '周五前要做退租清洁。'],
          1: ['That is a fixed price, a hundred and eighty for two bedrooms.', '那是固定价，两居室一百八。'],
        }),
        V('只打扫厨房', '你只想处理厨房。', {
          0: ['Just the kitchen and the bathroom, nothing else.', '只打扫厨房和浴室，别的不动。'],
          1: ['Ninety minutes, forty pounds.', '九十分钟，四十镑。'],
        }),
        V('不满意', '上次打扫漏了窗台。', {
          6: ['Last time the windowsills were missed. Could you note that?', '上次窗台没擦。能备注一下吗？'],
          7: ['I will add it to the checklist for this visit.', '我加到这次的服务清单里。'],
        }),
        V('改时间', '你要临时改期。', {
          8: ['Could we move it to next week? Something came up.', '能改到下周吗？有点事。'],
        }),
      ],
      phrases: [
        P('Once a fortnight.', '两周一次。', 'fortnight 是两周，英式常用。'),
        P('Do I need to be home?', '我需要在家吗？', '请人上门服务都会问。'),
        P('The products are included.', '耗材包含在内。', '问价时要确认是否含清洁剂。'),
      ],
    },

    {
      id: 'lockout', name: '被锁在门外', lv: 3, cefr: 'B1',
      roles: ['你', '开锁师傅'],
      lines: [
        L(0, 'I am locked out. The key turns but the door will not open.', '我被锁在外面了。钥匙能转，门打不开。'),
        L(1, 'Is there a chain on the inside?', '里面有门链吗？'),
        L(0, 'I do not think so. I left through this door an hour ago.', '应该没有。我一小时前从这个门出去的。'),
        L(1, 'I can be there in twenty minutes. It is eighty for a lockout.', '二十分钟能到。开锁八十。', 'lockout 是「被锁在门外」的服务名，报价时先问清。'),
        L(0, 'Do you need proof that I live here?', '需要证明我住这儿吗？'),
        L(1, 'A bill with your name and this address is enough.', '有您名字和这个地址的账单就行。'),
        L(0, 'I have one in my bag. Will you damage the lock?', '包里有一张。会弄坏锁吗？'),
        L(1, 'Not if it is a standard cylinder. I will pick it, not drill it.', '标准锁芯就不会。我技术开锁，不钻孔。'),
      ],
      variants: [
        { tag: '钥匙转不开', setting: '晚上十点，你被关在自己家门外。' },
        V('钥匙丢了', '钥匙彻底丢了。', {
          0: ['I lost my keys. Can you open it and change the lock?', '我钥匙丢了。能开锁并换锁吗？'],
          1: ['Open and change is a hundred and forty, with two new keys.', '开锁加换锁一百四，含两把新钥匙。'],
        }),
        V('钥匙断在锁里', '钥匙断在锁孔里。', {
          0: ['Half my key is stuck in the lock.', '我半截钥匙卡在锁里了。'],
          1: ['I will need to extract it first. That is ninety.', '得先取出来。九十。'],
        }),
        V('租的房子', '你是租客，房东不在。', {
          4: ['I rent the flat. The landlord is away. Is that a problem?', '我是租客。房东不在。有问题吗？'],
          5: ['As long as you can show the tenancy agreement, no.', '能出示租约就没问题。'],
        }),
        V('问价格', '你怕半夜被加价。', {
          6: ['Is there a callout surcharge at night?', '夜间有上门附加费吗？'],
        }),
      ],
      branches: [
        B(4, 'cost', '对方报的价比你预期高，你要决定',
          S('After ten it is a hundred and twenty, not eighty.', '十点之后是一百二，不是八十。'),
          [O(S('Fine, I have no choice tonight.', '行，今晚也没别的办法。'), S('I will be there in twenty.', '我二十分钟到。')),
           O(S('Could you come at eight tomorrow instead?', '能改成明天八点吗？'), S('Cheaper, but you need somewhere to sleep.', '便宜些，但你得有地方睡。'))]),
      ],
      phrases: [
        P('I am locked out.', '我被锁在门外了。', '打电话第一句。'),
        P('Will you damage the lock?', '会弄坏锁吗？', '开锁前必问。'),
        P('Is there a callout surcharge?', '有上门附加费吗？', '夜间、周末常加价。'),
      ],
    },

    {
      id: 'subscription', name: '取消订阅', lv: 4, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(0, 'I would like to cancel my subscription.', '我想取消订阅。'),
        L(1, 'Sorry to hear that. Can I ask why?', '很遗憾。能问下原因吗？'),
        L(0, 'I am not using it enough to justify the price.', '我用得不够多，不值这个价。'),
        L(1, 'We could offer three months at half price.', '可以给您三个月半价。'),
        L(0, 'That is kind, but I would still be paying for something I do not use.', '谢谢，但我还是在为不用的东西付钱。'),
        L(1, 'Understood. Your access runs to the end of the billing period.', '明白。使用权到本期结束。'),
        L(0, 'Will I be charged again after that?', '之后还会扣费吗？'),
        L(1, 'No. And you can export your data before it closes.', '不会。关停前您可以导出数据。'),
        L(0, 'Good. Please send me the confirmation in writing.', '好。请把确认发我一份。'),
      ],
      variants: [
        { tag: '用不上想退订', setting: '你订阅了一年的软件，实际只用了三次。' },
        V('免费试用要到期', '你怕免费试用自动转付费。', {
          0: ['I am on a free trial and I do not want it to turn into a charge.', '我在免费试用，不想被自动扣费。'],
          1: ['I can cancel it now. You keep access until the trial ends.', '现在就能取消。试用结束前还能用。'],
        }),
        V('涨价的套餐', '你的套餐突然涨了三成。', {
          0: ['My price went up thirty percent with no notice.', '我的价格没通知就涨了三成。'],
          1: ['There was an email in March. I can offer the old rate for six months.', '三月发过邮件。可以给您保留旧价六个月。'],
        }),
        V('被挽留', '客服一直劝你留下。', {
          4: ['I understand the offer, but my decision is made.', '我理解这个优惠，但我已经决定了。'],
        }),
        V('退款', '你刚续费就想退。', {
          6: ['I renewed two days ago by accident. Can I get a refund?', '我两天前误续费了。能退款吗？'],
        }),
      ],
      branches: [
        B(2, 'offer', '客服给了一个挽留方案，你要判断接不接受',
          S('What if we drop it to five a month for a year?', '一年内降到每月五块怎么样？'),
          [O(S('That changes things. Send me that in writing.', '那不一样了。把这条写进邮件发我。'), S('I will email the terms today.', '我今天把条款发邮件。')),
           O(S('I would still not use it. Please cancel.', '我还是不会用。请取消。'), S('Done. You will get a confirmation email.', '已取消。您会收到确认邮件。'))]),
      ],
      phrases: [
        P('I would like to cancel my subscription.', '我想取消订阅。', 'subscription 订阅，cancel 是取消。'),
        P('I am not using it enough to justify the price.', '用得不够多，不值这个价。', '给理由比说 too expensive 有说服力。'),
        P('Please send me the confirmation in writing.', '请把确认发我一份。', '口说无凭，一定要书面确认。'),
      ],
    },

    {
      
      branches: [
        B(4, 'probe', '裁缝提了一个工艺上的限制，你要决定接受还是改方案',
          S('I can hem them, but the original stitch is hard to copy exactly.', '裤脚能改，但原来的针脚很难完全一样。'),
          [O(S('Close enough is fine. Nobody will look that closely.', '差不多就行。没人会凑近看。'), S('Then I will match the thread colour as best I can.', '那我把线色尽量配准。')),
           O(S('Could you keep the original hem and just take up the waist?', '能只收腰，保留原来的裤脚吗？'), S('Then they will still be a little long.', '那还是会有点长。'))]),
      ],
id: 'tailor', name: '改衣店改尺寸', lv: 3, cefr: 'B1',
      roles: ['你', '裁缝'],
      lines: [
        L(0, 'Could you take in the waist on these trousers?', '这条裤子能把腰收一下吗？', 'take in 是「收窄」，let out 是「放款」—— 改衣店的核心动词。'),
        L(1, 'How much do you need taken in?', '要收多少？'),
        L(0, 'About two centimetres. They slip down when I walk.', '大概两厘米。走路会往下掉。'),
        L(1, 'I can do that. Anything else?', '可以。还有别的吗？'),
        L(0, 'The legs are a bit long too. Could you shorten them?', '裤腿也有点长。能改短吗？'),
        L(1, 'Yes. Hemming is twelve, taking in is fifteen.', '可以。改裤脚十二，收腰十五。'),
        L(0, 'When can I pick them up?', '什么时候能取？'),
        L(1, 'Thursday. I will pin them now so you can check the length.', '周四。我现在别一下，您看看长度。'),
      ],
      variants: [
        { tag: '裤子收腰', setting: '你买了一条版型很好的裤子，腰大了一点。' },
        V('改短大衣', '大衣袖子太长。', {
          0: ['Could you shorten the sleeves on this coat?', '这件大衣的袖子能改短吗？'],
          1: ['Taking up sleeves with a lining costs more, twenty-two.', '有里衬的袖子贵一些，二十二。'],
        }),
        V('换拉链', '外套拉链坏了，但衣服还很好。', {
          0: ['The zip is broken. Is it worth replacing?', '拉链坏了。值得换吗？'],
          1: ['For this jacket, yes. Twenty-five, and it takes a week.', '这件外套值得。二十五，一周。'],
        }),
        V('婚礼改衣', '你要在婚礼前改礼服。', {
          6: ['I need it before the wedding on the twelfth. Is that possible?', '十二号婚礼前要拿到。来得及吗？'],
          7: ['Tight, but I can do it if you come for a fitting on Monday.', '有点紧，但你周一能来试一次就行。'],
        }),
      ],
      phrases: [
        P('Could you take in the waist?', '能把腰收一下吗？', 'take in 收窄，let out 放款。'),
        P('Could you shorten the legs?', '裤腿能改短吗？', 'shorten 改短，hem 是改裤脚。'),
        P('Could you pin it so I can check?', '能别一下让我看看吗？', '试身时最有用的一句。'),
      ],
    },
  ],
};
