import { L, V, S, O, B, P } from './_dsl.mjs';
import { LEGACY } from './_legacy.mjs';

const old = id => LEGACY.find(s => s.id === id);

export default {
  cat: '购物',
  items: [
    /* ---------------- 退换货 ---------------- */
    {
      ...old('shopping'),
      variants: [
        { tag: '拉链坏了', setting: '上周买的外套拉链坏了，你带着电子收据回到店里。' },
        V('尺码买小了', '外套买小了一号，标签还没剪，你想换大一号。', {
          1: ['I bought this jacket last week, but it is too tight. Could I size up?', '我上周买的这件外套，太紧了。能换大一号吗？'],
          5: ['An exchange. Do you have it in a large?', '换货。有大号吗？'],
          6: ['We do, in black and navy. Want to try the large on?', '有，黑色和藏青。要试大号吗？'],
        }),
        V('只退款', '你不想再要同款了，只想把钱退回来。', {
          5: ['A refund, please. I do not need another one.', '退款吧。我不想再要一件了。'],
          6: ['No problem. It goes back to the card you paid with.', '没问题。会退到您付款的卡上。'],
          7: ['That works. How long does it take?', '可以。多久到账？', 'refund 到账时间一定要问，不同店从三天到两周都有。'],
          8: ['Three to five business days. You will get an email.', '三到五个工作日。会给您发邮件。'],
        }),
        V('过了退货期', '外套买了两个月，拉链才坏，你不确定还能不能退。', {
          1: ['I bought this two months ago and the zip just broke. Can I still return it?', '两个月前买的，拉链刚坏。还能退吗？'],
          2: ['Our window is thirty days, but a broken zip is a fault. Let me get the manager.', '我们的期限是三十天，但拉链坏了算质量问题。我去叫经理。', 'return window 是退货期限，过了期限谈「质量问题」才有余地。'],
          3: ['Thank you. I have the paper receipt here.', '谢谢。我带了纸质收据。'],
        }),
        V('想换个颜色', '尺码合适，但你想换成灰色。', {
          5: ['Could I swap it for the grey one instead?', '能换成灰色那件吗？'],
          6: ['The grey is only left in large. Is that all right?', '灰色只剩大号了，可以吗？'],
          7: ['Let me try the large. Where is the fitting room?', '那我试试大号。试衣间在哪？'],
        }),
        V('礼物没有收据', '这是别人送你的礼物，只有一张礼品小票。', {
          1: ['This was a gift, so I do not have the normal receipt. The zip is broken.', '这是别人送的，我没有普通收据。拉链坏了。'],
          2: ['Do you have the gift receipt, or the card it was bought with?', '有礼品小票吗？或者付款用的那张卡？'],
          3: ['I have the gift receipt here.', '礼品小票在这儿。'],
        }),
      ],
      branches: [
        ...(old('shopping').branches ?? []),
        {
          at: 5, kind: 'short',
          task: '你要的尺码没有，得换一个方案',
          prompt: S('Medium is sold out online and in every store nearby.', '中号线上和附近门店都卖完了。'),
          options: [
            O(S('Could you order it and post it to me?', '能订一件寄给我吗？'), S('We can. Delivery is free over fifty.', '可以。满五十免运费。')),
            O(S('Then I will take the large and wash it hot.', '那我要大号，回去热水洗一下。'), S('That may work. Would you like to try it first?', '也许行。要先试试吗？')),
          ],
        },
      ],
    },

    /* ---------------- 超市 ---------------- */
    {
      id: 'grocery', name: '超市买东西', lv: 1, cefr: 'A1',
      roles: ['你', '店员'],
      lines: [
        L(0, 'Excuse me, where is the milk?', '打扰一下，牛奶在哪儿？'),
        L(1, 'Aisle four, on the left.', '四号通道，左手边。', 'aisle 是货架之间的通道，超市里问路全靠这个词。'),
        L(0, 'Thanks. And do you have eggs?', '谢谢。有鸡蛋吗？'),
        L(1, 'Yes, right next to the milk.', '有，就在牛奶旁边。'),
        L(0, 'Great, I will grab both.', '好，我两样都拿。'),
        L(1, 'Do you need a bag?', '要袋子吗？'),
        L(0, 'Yes, one please.', '要一个，谢谢。'),
        L(1, 'That comes to twelve forty.', '一共十二块四。'),
        L(0, 'Card, please. Can I get cash back?', '刷卡。能顺便取点现金吗？', 'cash back 是刷卡时多刷一笔拿现金，超市收银台常见。'),
        L(1, 'Sure. How much would you like?', '可以。您要多少？'),
      ],
      variants: [
        { tag: '搬新家补货', setting: '你刚搬进新公寓，冰箱是空的，来楼下超市补货。' },
        V('找特定品牌', '你要找某个牌子的燕麦奶，货架上全是别的牌子。', {
          0: ['Excuse me, do you stock Oatly?', '打扰一下，你们有 Oatly 吗？', 'stock 当动词是「进货、有货」，比 do you have 更专业一点。'],
          1: ['We do, but it is on the top shelf. I will get the ladder.', '有，但在最上层。我去拿梯子。'],
        }),
        V('自助结账', '人工通道排长队，你想用自助收银机但不会用。', {
          6: ['No bag, thanks. Should I use the self-checkout?', '不要袋子，谢谢。我该用自助结账吗？'],
          7: ['If you are paying by card, yes.', '刷卡的话可以。'],
          8: ['Card. Where is the machine?', '刷卡。机器在哪儿？'],
          9: ['Far end, by the window.', '最里面，窗边。'],
        }),
        V('问会员价', '货架上标着会员价，你没有会员卡。', {
          8: ['That is more than the shelf said. Is there a member price?', '比货架上标的贵。有会员价吗？'],
          9: ['There is. Sign up here, it takes a minute.', '有。在这儿办卡，一分钟就好。'],
        }),
        V('只要半个', '你一个人住，整颗卷心菜吃不完。', {
          2: ['Do you sell half a cabbage?', '你们卖半颗卷心菜吗？'],
          3: ['We do not, but the small ones are on the bottom shelf.', '不卖，不过小颗的在最下层。'],
          4: ['Then I will take a small one.', '那我要一颗小的。'],
        }),
      ],
      branches: [
        {
          at: 8, kind: 'change',
          task: '现金返还的方式有限制，你要决定还用不用',
          prompt: S('Cash back is debit cards only, sorry.', '不好意思，只有借记卡才能取现金。'),
          options: [
            O(S('I will use my debit card then.', '那我用借记卡。'), S('Great. How much would you like?', '好的。您要取多少？')),
            O(S('Never mind, just the shopping.', '算了，就结账吧。'), S('No problem. Twelve forty, done.', '没问题。十二块四，好了。')),
          ],
        },
        {
          at: 6, kind: 'cost',
          task: '对方要多收一笔钱，你判断值不值',
          prompt: S('Bags are ten cents each now.', '现在袋子一个一毛。'),
          options: [
            O(S('That is fine, I will still take one.', '行，那还是要一个。'), S('Sure. That comes to twelve fifty.', '好的。一共十二块五。')),
            O(S('Then I will carry it. I have a backpack.', '那我不买了，我有背包。'), S('No problem. Twelve forty then.', '没问题。那就是十二块四。')),
          ],
        },
      ],
      phrases: [
        P('Where is the milk?', '牛奶在哪儿？', '换掉名词就能在超市问任何东西。'),
        P('Do you stock Oatly?', '你们有 Oatly 吗？', '问有没有某个牌子，比 Do you have 更地道。'),
        P('Can I get cash back?', '能顺便取现金吗？', '刷卡时多刷一笔，超市收银台专用。'),
      ],
    },

    /* ---------------- 试衣间 ---------------- */
    {
      id: 'fitting-room', name: '试衣间换尺码', lv: 2, cefr: 'A2',
      roles: ['你', '店员'],
      lines: [
        L(1, 'How many items?', '几件？'),
        L(0, 'Three, thanks.', '三件，谢谢。'),
        L(1, 'The limit is four. The last room on the right is free.', '最多四件。最右边那间空着。'),
        L(0, 'Thanks. Do you have this in a smaller size?', '谢谢。这件有小一号的吗？'),
        L(1, 'What size are you after?', '您要什么码？'),
        L(0, 'A small, or maybe a medium.', '小号，或者中号。'),
        L(1, 'I will bring both.', '我两件都拿来。'),
        L(0, 'Great. And how long can I keep the room?', '好。这间我能用多久？'),
        L(1, 'As long as you need. We close at nine.', '您想用多久都行。我们九点关门。'),
      ],
      variants: [
        { tag: '第一件就卡住', setting: '你拿着三件衣服进了试衣间，第一件就卡在肩膀上。' },
        V('肩膀太窄', '衣服肩线卡住，你知道是版型问题，不是尺码问题。', {
          3: ['This one is tight across the shoulders. Do you have a looser cut?', '这件肩太窄。有版型宽松一点的吗？', 'cut 指版型，比 style 更具体 —— 想要宽松版型就说 a looser cut。'],
          4: ['Try this one. It is the same size but a relaxed fit.', '试试这件，同码但版型宽松。'],
          5: ['A small. The relaxed fit, if you have it.', '小号。有宽松版型的话要那个。'],
          6: ['I will bring the small in both fits.', '我把小号的两种版型都拿来。'],
        }),
        V('裤子太长', '裤子腰合适，但裤脚拖地。', {
          5: ['The waist is fine, but the legs are too long. Do you do alterations?', '腰合适，裤腿太长。你们能改吗？', 'alterations 是改衣服务，成衣店常见。'],
          6: ['We do, for eight dollars, ready in two days.', '能改，八块，两天取。'],
          7: ['Two days is fine. And how long can I keep the room?', '两天可以。这间我能用多久？'],
        }),
        V('颜色不一样', '你想要的白色在店里看着偏黄，想问有没有别的颜色。', {
          3: ['Do you have this in white?', '这件有白色的吗？'],
          4: ['Only in cream and grey. White sold out last week.', '只有米白和灰色。白色上周卖完了。'],
          5: ['Cream is fine. Can I see it under the light?', '米白也行。能拿到灯下看看吗？'],
          6: ['I will bring the cream one. There is a mirror by the window.', '我去拿米白的。窗边有镜子。'],
        }),
        V('带朋友来参谋', '你和朋友一起来的，她在外面等你的意见。', {
          7: ['Can I show my friend first?', '我能先给我朋友看看吗？'],
          8: ['Of course. Just bring the items back to the desk.', '当然。衣服还回前台就行。'],
        }),
      ],
      branches: [
        {
          at: 5, kind: 'short',
          task: '你要的码没有了，得决定换什么',
          prompt: S('Small is gone in that colour. Only medium is left.', '那个颜色小号没了，只剩中号。'),
          options: [
            O(S('I will try the medium then.', '那我试试中号。'), S('Here you go. The room next door is free too.', '给您。隔壁那间也空着。')),
            O(S('Does the other colour have a small?', '另一个颜色有小号吗？'), S('It does. I will bring it.', '有。我去拿。')),
          ],
        },
      ],
      phrases: [
        P('Do you have this in a smaller size?', '这件有小一号的吗？', '换掉 smaller 就能问大号、长款、短款。'),
        P('Do you do alterations?', '你们能改衣服吗？', '裤长、袖长不合身时最有用的一句。'),
        P('How long can I keep the room?', '这间我能用多久？', '试衣间限时的地方不少，先问清楚。'),
      ],
    },

    /* ---------------- 手机店 ---------------- */
    {
      id: 'phone-store', name: '手机店修电池', lv: 3, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Hi, are you looking for a new phone?', '你好，想买新手机吗？'),
        L(0, 'Just looking. My battery dies by noon.', '先看看。我电池到中午就没电了。', 'dies 用在电池上是「没电了」，不是「死掉」。'),
        L(1, 'That sounds like a worn battery. We can replace it for forty.', '那像是电池老化了。换一块四十。'),
        L(0, 'Really? How long does it take?', '真的？要多久？'),
        L(1, 'About an hour. Or you could trade it in.', '大概一小时。也可以折价换新。'),
        L(0, 'What would a trade-in be worth?', '折价能值多少？', 'trade in 是旧机折价，名词形式 trade-in。'),
        L(1, 'Around a hundred, depending on the condition.', '大概一百，看机况。'),
        L(0, 'I will do the battery first. Do I need an appointment?', '我先换电池吧。要预约吗？'),
        L(1, 'No, but there is a two-hour wait today.', '不用，但今天要等两小时。'),
      ],
      variants: [
        { tag: '电池撑不到下午', setting: '手机用两年了，电池撑不到下午，你走进街角的维修店。' },
        V('屏幕碎了', '手机摔过，屏幕右下角裂了但还能用，你想知道修多少钱。', {
          1: ['My screen cracked. It still works, but the corner is sharp.', '我屏幕裂了。还能用，但角上很刮手。'],
          2: ['We can do the glass for ninety, or the whole screen for a hundred and sixty.', '换外层玻璃九十，换整块屏一百六。'],
          3: ['Is the cheaper one as good?', '便宜的那种一样好吗？'],
          4: ['The glass is original. The full screen is a copy, so it can feel slower.', '外层玻璃是原厂的。整块屏是副厂的，触感会差一点。'],
          7: ['I will think about it. Thanks for the quote.', '我再想想。谢谢报价。'],
          8: ['No problem. We are open till seven.', '没事。我们开到七点。'],
        }),
        V('进水了', '手机掉进水里，你当时还试着开机，现在充不进电。', {
          1: ['It fell in water and I tried to turn it on. Now it will not charge.', '掉水里了，我还试着开机。现在充不进电。', '进水后开机是大忌，但跟店员说清楚才不会白修。'],
          2: ['That is usually the board. I can look, but it may not be worth it.', '一般是主板问题。我可以看看，但可能不值。'],
          3: ['Can you at least dry it out and check?', '能至少烘干检查一下吗？'],
          4: ['I can, but the deposit is twenty, and it is not refundable.', '可以，但要二十押金，不修也不退。'],
          7: ['Let me sleep on it. I will come back tomorrow.', '我想想。明天再来。'],
          8: ['Sure. Keep it dry until then.', '好。这之前别再碰水。'],
        }),
        V('问保修', '你能接受价格，但担心换完两个月又坏。', {
          7: ['I will do the battery. Is the repair guaranteed?', '我换电池。维修有保修吗？'],
          8: ['Ninety days on the part and the labour.', '零件和人工保九十天。'],
        }),
        V('买二手', '你想买一台二手手机，但不放心机况。', {
          1: ['Do you sell refurbished phones?', '你们卖翻新机吗？'],
          2: ['We do. They come with a one-year warranty.', '卖。带一年保修。'],
          3: ['Is the battery new in those?', '那些电池是新的吗？'],
          4: ['New in most of them. The label on the box tells you.', '大部分是新的。盒子上标签会写。'],
          7: ['I will look at the refurbished ones. Which shelf?', '我看看翻新机。在哪一排？'],
          8: ['Right behind you. Take your time.', '就在你后面。慢慢看。'],
        }),
      ],
      branches: [
        {
          at: 3, kind: 'change',
          task: '对方说你的机型修不了，你要换个方案',
          prompt: S('Actually, your model is on the list we cannot open. The glass is glued to the frame.', '其实你这个型号我们不能拆，玻璃是粘在框上的。'),
          options: [
            O(S('So what are my options?', '那我有什么选择？'), S('Trade it in as is, or send it to the official service centre.', '按现状折价，或者送官方售后。')),
            O(S('How much would the official centre charge?', '官方售后要多少钱？'), S('Around a hundred and twenty, and it takes a week.', '大概一百二，要一周。')),
          ],
        },
      ],
      phrases: [
        P('My battery dies by noon.', '我电池到中午就没电了。', '描述耗电快，比 my battery is bad 具体。'),
        P('How long does it take?', '要多久？', '维修、办证、排队都能用。'),
        P('What would a trade-in be worth?', '折价能值多少？', '换新机前必问，避免被低价收走。'),
      ],
    },

    /* ---------------- 家具店 ---------------- */
    {
      
      branches: [
        B(5, 'change', '送货时间有变，你要调整安排',
          S('Delivery is thirty, but we cannot do Saturdays.', '送货三十，但周六送不了。'),
          [O(S('A weekday evening, then?', '那工作日晚上呢？'), S('Thursday after six works.', '周四六点后可以。')),
           O(S('I will collect it myself.', '那我自己来取。'), S('Then it is free. Bring a friend, it is heavy.', '那就免费。带个朋友来，挺沉的。'))]),
      ],
id: 'furniture', name: '家具店量尺寸', lv: 2, cefr: 'A2',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Can I help you find anything?', '需要帮您找什么吗？'),
        L(0, 'I am looking for a desk, something small.', '我想找一张书桌，小一点的。'),
        L(1, 'How wide is the space?', '空间有多宽？'),
        L(0, 'About a meter. It has to fit under the window.', '大概一米。得能塞进窗户下面。'),
        L(1, 'This one is ninety centimeters. It comes flat-packed.', '这张九十厘米。是平板包装的。', 'flat-packed 是自己回家组装的平板包装，宜家那种。'),
        L(0, 'Do you deliver?', '你们送货吗？'),
        L(1, 'Yes, thirty for delivery, or free if you pick it up.', '送，三十块运费。自提免费。'),
        L(0, 'I will take it. Can I pay now and pick it up Saturday?', '我要了。能现在付、周六来取吗？'),
      ],
      variants: [
        { tag: '窗下那块空地', setting: '你搬进新公寓，卧室只有窗下一块空地能放书桌。' },
        V('要组装服务', '你没有工具，也不想自己装。', {
          5: ['Does it come assembled? I do not have tools.', '是组装好的吗？我没有工具。'],
          6: ['No, but we can build it for twenty-five.', '不是，但我们可以帮您装，二十五块。'],
          7: ['Build it and deliver it, then. When could you come?', '那就装好送来。你们什么时候能来？'],
        }),
        V('问承重', '你打算在上面放两台显示器和打印机，怕压塌。', {
          3: ['It has to hold two monitors and a printer. How much weight can it take?', '上面要放两台显示器和一台打印机。能承重多少？'],
          4: ['About forty kilos. The legs are steel.', '大概四十公斤。桌腿是钢的。'],
        }),
        V('问送货时间', '你周末才在家，想约一个能收货的时间。', {
          6: ['Yes, delivery is thirty, and the next slot is Thursday.', '送，运费三十，最近能约周四。'],
          7: ['Thursday is fine. Can you bring it up to the third floor?', '周四可以。能帮我搬上三楼吗？'],
        }),
      ],
      phrases: [
        P('I am looking for a desk.', '我想找一张书桌。', '换掉名词就能在店里找任何东西。'),
        P('How wide is the space?', '空间有多宽？', '买家具第一句永远是量尺寸。'),
        P('Do you deliver?', '你们送货吗？', '大件必问，运费往往比想象贵。'),
      ],
    },

    /* ---------------- 菜市场 ---------------- */
    {
      id: 'market', name: '菜市场买水果', lv: 2, cefr: 'A2',
      roles: ['你', '摊主'],
      lines: [
        L(1, 'Tomatoes, two fifty a pound.', '西红柿，两块五一磅。'),
        L(0, 'That is a bit much. How about two?', '有点贵。两块行吗？'),
        L(1, 'Two twenty, and I will throw in an onion.', '两块二，再送你一个洋葱。', 'throw in 是「白送、搭一个」，菜市场砍价的标准收尾。'),
        L(0, 'Deal. Two pounds, please.', '成交。来两磅。'),
        L(1, 'Anything else? The peaches came in this morning.', '还要别的吗？桃子今早到的。'),
        L(0, 'Are they sweet?', '甜吗？'),
        L(1, 'Very. Try a piece.', '很甜。尝一块。'),
        L(0, 'They are good. I will take four.', '不错。来四个。'),
      ],
      variants: [
        { tag: '周六早市', setting: '周六早市，你想买点能生吃的西红柿，摊主开价偏高。' },
        V('挑水果', '你想自己挑，不想让摊主随手抓。', {
          3: ['Could I pick them myself?', '我能自己挑吗？'],
          4: ['Go ahead. The softer ones are for today.', '挑吧。软一点的今天就得吃。'],
        }),
        V('问怎么吃', '你没见过这种菜，不知道怎么处理。', {
          5: ['What is this? How do you cook it?', '这是什么？怎么做？'],
          6: ['Bitter melon. Slice it thin and stir fry with egg.', '苦瓜。切薄片和鸡蛋一起炒。'],
        }),
        V('只要一点点', '你一个人吃，只想买一颗。', {
          3: ['Just one, please. I cook for one.', '就一个。我一个人吃。'],
          4: ['One is fine. Here, this one is ripe.', '一个也行。这个熟了。'],
        }),
        V('问产地', '你想知道桃子是不是本地的，新不新鲜。', {
          5: ['Where are they from?', '这是哪儿产的？'],
          6: ['The farm up the road. Picked yesterday.', '就在这条路上的农场。昨天摘的。'],
          7: ['Then I will take four.', '那来四个。'],
        }),
      ],
      branches: [
        {
          at: 3, kind: 'cost',
          task: '对方不肯让价，你要决定买还是不买',
          prompt: S('Two fifty is already the early price. I cannot go lower.', '两块五已经是早市价了，不能再低。'),
          options: [
            O(S('All right, two pounds then.', '行，那来两磅。'), S('Good choice. Anything else?', '好眼光。还要别的吗？')),
            O(S('I will look around first.', '我先转转。'), S('Suit yourself. I am here till noon.', '随你。我开到中午。')),
          ],
        },
      ],
      phrases: [
        P('That is a bit much.', '有点贵。', '砍价开场，比 too expensive 不伤人。'),
        P('How about two?', '两块行吗？', '报出你的价，短句最有效。'),
        P('I will throw in an onion.', '再送你一个洋葱。', '摊主常说的话，听懂就知道谈成了。'),
      ],
    },

    /* ---------------- 快递点寄件 ---------------- */
    {
      
      branches: [
        B(5, 'short', '对方没有包装箱，你要临时解决',
          S('We have run out of boxes today.', '今天我们箱子用完了。'),
          [O(S('Can I buy one next door?', '我能去隔壁买一个吗？'), S('The shop on the corner sells them for two pounds.', '街角那家两镑一个。')),
           O(S('I will bring it back tomorrow in my own box.', '我明天用自己箱子拿回来。'), S('Fine. Keep the label, it stays valid for a week.', '行。面单留着，一周内有效。'))]),
      ],
id: 'post-return', name: '快递点寄退货', lv: 3, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Next, please. What are you sending?', '下一位。寄什么？'),
        L(0, 'I need to return this. The screen came cracked.', '我要退这个。屏幕到货就是裂的。', '电商退货说 return，保修维修说 repair —— 两者流程完全不同。'),
        L(1, 'Do you have the return label?', '有退货面单吗？'),
        L(0, 'Yes, it is on my phone.', '有，在手机里。'),
        L(1, 'I need it printed. There is a printer by the door.', '得打印出来。门边有打印机。'),
        L(0, 'All right. Does it need to be boxed?', '好。需要装箱吗？'),
        L(1, 'Please. And keep the tracking slip.', '要装。还有，收好这张追踪单。'),
        L(0, 'Will the refund go through once it is scanned?', '他们一扫码就退款吗？'),
        L(1, 'Usually the same day it reaches the warehouse.', '一般到仓当天就退。'),
      ],
      variants: [
        { tag: '开箱就是裂的', setting: '网购的显示器开箱就裂了，你按客服说的来寄回去。' },
        V('寄国际', '你要把东西寄到国外，不确定怎么填申报单。', {
          3: ['Yes, on my phone. It is going to Canada, so do I need a customs form?', '有，在手机里。寄到加拿大，要填报关单吗？', 'customs form 是报关单，寄国际件必填。'],
          4: ['Print it at the door. And yes, describe the contents in English.', '门边打印。要填，而且内容用英文写。'],
        }),
        V('自己付运费', '这次退货要你自己出运费，你想问最便宜的寄法。', {
          5: ['All right, I will print it. What is the cheapest option? It is not urgent.', '行，我去打印。最便宜的是哪种？不急。'],
          6: ['Surface mail, about three weeks.', '平邮，大概三周。', 'surface mail 是走海运的平邮，慢但便宜。'],
          7: ['Three weeks is fine. Will the refund still go through?', '三周没问题。退款还照样走吗？'],
        }),
        V('包裹丢了', '你上个月寄的包裹一直没到，单号也查不到。', {
          1: ['I sent a parcel three weeks ago and the tracking has not moved.', '我三周前寄了个包裹，物流一直没动。'],
          2: ['Let me see the tracking number. If it is lost, we open a claim.', '给我看单号。如果丢了，我们提查件。'],
          3: ['Here it is. How long does a claim take?', '在这儿。查件要多久？'],
          4: ['About two weeks. If it turns up, we will call you.', '大概两周。要是找到了，我们会打给您。'],
          5: ['Thanks. That is all for today.', '谢谢。今天就这些。'],
          6: ['Sorry about the trouble.', '给您添麻烦了。'],
          7: ['Not your fault. Have a good day.', '不是你们的错。祝你今天顺利。'],
          8: ['You too.', '你也是。'],
        }),
        V('上门取件', '你东西太大搬不动，想问能不能上门取。', {
          1: ['Do you do pickups? The box is too big for me to carry.', '你们上门取件吗？箱子太大我搬不动。'],
          2: ['We do, for five pounds. Book online before noon.', '可以，五镑。中午前在网上预约。'],
          3: ['Booked. Can they come tomorrow morning?', '约好了。他们能明天上午来吗？'],
          4: ['Morning slots go fast. Leave it at the door if you are out.', '上午的时段很抢手。你不在家就放门口。'],
          5: ['Should I box it before they come?', '他们来之前我要装箱吗？'],
        }),
      ],
      phrases: [
        P('Do you have the return label?', '有退货面单吗？', '退货第一步，没面单寄不了。'),
        P('Does it need to be boxed?', '需要装箱吗？', '寄件前问一句，省得白跑。'),
        P('Keep the tracking slip.', '收好追踪单。', '店员一定会说，听不懂就等于把凭证丢了。'),
      ],
    },

    /* ---------------- 鞋店 ---------------- */
    {
      
      branches: [
        B(3, 'offer', '店员给你另一个选择，你要判断合不合脚',
          S('That model runs narrow. Try the wide fit in the same size.', '那个版型偏窄。试试同码的宽版。'),
          [O(S('I did not know there was a wide fit.', '我不知道还有宽版。'), S('Most people do not. It makes a difference.', '多数人都不知道。差别很大。')),
           O(S('Do they look much wider?', '看着会宽很多吗？'), S('Only inside. Same shape outside.', '只有里面宽。外面一样。'))]),
      ],
id: 'shoe-shop', name: '买跑鞋', lv: 1, cefr: 'A1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'What size are you looking for?', '您要什么码？'),
        L(0, 'Forty-two, something for running.', '四十二，跑步穿的。'),
        L(1, 'Try these. They run a little small.', '试试这双。这双偏小。', 'run small 是「偏小」，试鞋时店员一定会提醒。'),
        L(0, 'They are tight at the toe.', '脚趾那儿有点紧。'),
        L(1, 'Then go half a size up.', '那大半码。'),
        L(0, 'Much better. Do they come in black?', '好多了。有黑色的吗？'),
        L(1, 'Only in grey and blue.', '只有灰色和蓝色。'),
        L(0, 'Grey is fine. I will take them.', '灰色也行。就这双。'),
      ],
      variants: [
        { tag: '第一次买跑鞋', setting: '你开始跑步，需要一双正经的跑鞋，但不知道自己该穿多大。' },
        V('脚宽', '你脚背高、脚掌宽，普通鞋总挤两侧。', {
          1: ['My feet are wide. Do you have a wide fit?', '我脚宽。有宽版的吗？', 'wide fit 是宽版鞋楦，不是「大一号」。'],
          2: ['We do, in this model only.', '有，只有这个型号有。'],
        }),
        V('给孩子买', '你带孩子来买鞋，他一直在动，你想让他自己穿得上。', {
          1: ['He is six. I need something he can put on himself.', '他六岁。我想要他自己能穿的。'],
          2: ['Velcro, then. These are easy for kids.', '那要魔术贴的。这些小孩好穿。'],
          3: ['He wants the blue ones.', '他要那双蓝的。'],
          4: ['Try the blue in a twenty-eight.', '蓝色那双试试二十八码。'],
          5: ['These fit. Do they wash well?', '这双正好。好洗吗？'],
          6: ['They do. Cold water, and no dryer.', '好洗。冷水，别烘干。'],
          7: ['Great. I will take them.', '好，这双我要了。'],
        }),
        V('问打折', '这双鞋你看中很久了，想知道会不会降价。', {
          5: ['Much better. Will these go on sale soon?', '好多了。这双最近会打折吗？'],
          6: ['Not this season. The older model is half price.', '这一季不会。老款半价。'],
          7: ['Then I will take these. Full price is fine.', '那就要这双。原价可以。'],
        }),
        V('问网上同款', '你打算再买一双替换着穿，想知道网上有没有。', {
          5: ['Much better. Do you have these online?', '好多了。这双网上有吗？'],
          6: ['Only in grey and blue, and yes, they are online too.', '只有灰色和蓝色，网上也有。'],
          7: ['Then I will order a second pair later. These are mine.', '那我之后再订一双。这双我要了。'],
        }),
      ],
      phrases: [
        P('They run a little small.', '这双偏小。', '试鞋必听的一句，run 在这里是「尺码偏」。'),
        P('Do you have a wide fit?', '有宽版的吗？', '脚宽的人唯一的救命词。'),
        P('They are tight at the toe.', '脚趾那儿有点紧。', '说清哪里紧，店员才知道该换码还是换版型。'),
      ],
    },

    /* ---------------- 挑礼物 ---------------- */
    {
      
      branches: [
        B(5, 'short', '对方没有礼盒了，你要换个包装方案',
          S('We are out of gift boxes, only paper bags left.', '礼盒用完了，只剩纸袋。'),
          [O(S('A bag is fine, as long as it is not see-through.', '纸袋也行，只要不透。'), S('These are thick. I will add ribbon.', '这些很厚。我加条丝带。')),
           O(S('Could you order a box for tomorrow?', '能订个盒子明天取吗？'), S('I can, if you can come back.', '可以，如果您能再来一趟。'))]),
      ],
id: 'gift', name: '给同事挑礼物', lv: 2, cefr: 'A2',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Looking for a gift?', '在挑礼物吗？'),
        L(0, 'Yes, for a colleague who just had a baby.', '是，送给刚生孩子的同事。'),
        L(1, 'How much do you want to spend?', '预算多少？'),
        L(0, 'Around twenty, not more.', '二十左右，不超过。'),
        L(1, 'This blanket is eighteen, and it is very soft.', '这条毯子十八，很软。'),
        L(0, 'Nice. Can you gift wrap it?', '不错。能包装一下吗？'),
        L(1, 'For three more. Would you like a card?', '加三块。要卡片吗？'),
        L(0, 'Just the wrap, thanks. And what is your return policy?', '只包装就行。你们的退换政策是什么？'),
        L(1, 'Thirty days with the receipt, no questions asked.', '带收据三十天，不问理由。'),
      ],
      variants: [
        { tag: '同事生孩子', setting: '同事刚生了孩子，办公室凑份子，你负责去买。' },
        V('送老板', '你要送即将离职的老板，不能太贵也不能太随便。', {
          1: ['It is for my boss, who is leaving. Something not too personal.', '送给我要离职的老板。不要太私人的。'],
          4: ['A nice notebook and a pen set is twenty-two.', '一本好笔记本加一套笔，二十二。'],
        }),
        V('送女朋友', '你完全不知道送什么，只能说清楚她喜欢什么。', {
          1: ['It is for my girlfriend. She likes things for the kitchen.', '送我女朋友。她喜欢厨房用品。'],
          4: ['Then this olive oil set is popular, and it is under twenty.', '那这套橄榄油很受欢迎，二十以内。'],
        }),
        V('送小孩', '你要送朋友的孩子，不知道几岁合适。', {
          1: ['For a four-year-old. Nothing with small parts.', '给四岁孩子。不要有小零件的。'],
          4: ['These wooden blocks are safe from three up.', '这套木积木三岁以上都能玩。'],
        }),
        V('要礼盒不要袋子', '你需要能直接送人的礼盒，不是纸袋。', {
          5: ['Could you box it instead of a bag?', '能装盒而不是纸袋吗？'],
          6: ['Sure, the box is two dollars.', '可以，盒子两块。'],
        }),
      ],
      phrases: [
        P('How much do you want to spend?', '预算多少？', '店员的标准问法，也是你砍掉一半选择的最快方式。'),
        P('Can you gift wrap it?', '能包装一下吗？', 'gift wrap 是礼品包装，通常另收费。'),
        P('What is your return policy?', '你们的退换政策是什么？', '送礼必问，对方不合用才不至于浪费。'),
      ],
    },
  ],
};
