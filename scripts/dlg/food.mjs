import { L, V, S, O, B, P } from './_dsl.mjs';
import { LEGACY } from './_legacy.mjs';

const old = id => LEGACY.find(s => s.id === id);

export default {
  cat: '餐饮',
  items: [
    /* ---------------- 咖啡店：同一段柜台对话的七种走法 ---------------- */
    {
      ...old('cafe'),
      variants: [
        { tag: '赶时间的早晨', setting: '工作日的早晨，街角咖啡店排着队。你只想快点拿到咖啡，别迟到。' },
        V('想坐一会儿', '周末上午，店里空着大半。你今天没有安排，想坐着看完一章书。', {
          3: ['Hot, please. Black, no sugar.', '热的，纯黑，不加糖。'],
          4: ['No milk, no charge. Coming right up.', '不加奶，不加钱。马上好。'],
          5: ['And a butter croissant, please.', '再来一个黄油可颂。'],
          7: ['For here, please. I will take that corner table.', '在这儿喝。我坐那个角落的位子。', 'For here 是堂食，to go 是外带 —— 这一句答错，店员会把咖啡装进纸杯。'],
        }),
        V('帮同事带两杯', '上班路上，同事发消息让你顺路带咖啡，还指定了一杯燕麦奶。', {
          1: ['Could I get two large lattes, please?', '我要两杯大杯拿铁。'],
          3: ['Both iced. One with oat milk, one regular.', '都冰的。一杯燕麦奶，一杯普通奶。'],
          4: ['One oat milk, that is fifty cents extra. Is that okay?', '一杯燕麦奶要加五毛，行吗？'],
          5: ['Nothing to eat, thanks. We are in a rush.', '不要吃的，谢谢，我们赶时间。'],
        }),
        V('乳糖不耐', '你乳糖不耐，平时只喝植物奶，但这家店加不加钱你不确定。', {
          3: ['Iced, with soy milk, please. I am lactose intolerant.', '冰的，换豆奶，谢谢。我乳糖不耐。', 'lactose intolerant 比 I cannot drink milk 更准，餐厅里一听就懂。'],
          4: ['Soy milk is free here. So one large iced soy latte.', '我们这儿豆奶不加钱。那就是一杯大杯冰豆奶拿铁。'],
          5: ['No muffin. But is there anything without dairy?', '不要麦芬。有没有不含奶的？'],
        }),
        V('问集点卡', '你常来这家店，一周四五次，想问问有没有集点卡。', {
          5: ['That is fine. And do you have a stamp card?', '行。你们有集点卡吗？'],
          6: ['We do. Buy nine, the tenth one is on us.', '有的。买九杯，第十杯我们请。'],
          7: ['Great, I will take one. To go, please.', '好，给我一张。带走。'],
        }, 1),
        V('只有一张二十', '你出门只带了现金，钱包里是一张二十，怕店员找不开。', {
          7: ['To go, please. I only have a twenty. Is that all right?', '带走。我只有一张二十的，可以吗？'],
          8: ['That is fine. I will bring your change. Name for the cup?', '可以。待会儿找您零钱。杯子上写什么名字？'],
        }),
        V('名字总被写错', '你的名字在这家店被写错过三次，这次你决定直接拼出来。', {
          9: ['It is Wen. W-E-N. Short for Wenjing.', 'Wen，W-E-N，是 Wenjing 的简称。', '报名字时一个字母一个字母说，是最省事的救场动作。'],
        }),
      ],
      branches: [
        {
          at: 7, kind: 'change',
          task: '收银台出了状况，给出一个能继续走下去的解决方案',
          prompt: S('So sorry, the card machine is down. It is cash only today.', '抱歉，刷卡机坏了，今天只收现金。', 'down 在这里是「坏掉」，不是「往下」。'),
          options: [
            O(S('That is fine, I have cash.', '没事，我有现金。'), S('Perfect. And what name should I put on the cup?', '好的。杯子上写什么名字？')),
            O(S('Could I pay by phone instead?', '我能用手机付吗？'), S('Sure, just tap here. Name for the cup?', '可以，在这儿碰一下。杯子上写什么名字？')),
          ],
        },
        {
          at: 5, kind: 'short',
          task: '你想要的东西没有了，换一个同等的东西',
          prompt: S('Ah, we just sold the last blueberry muffin.', '啊，蓝莓麦芬刚卖完。'),
          options: [
            O(S('Then I will take a croissant instead.', '那我换成可颂。'), S('Good choice. They came out of the oven an hour ago.', '好眼光，一小时前刚出炉。')),
            O(S('No problem. Just the coffee then.', '没事，那就只要咖啡。'), S('Sure. For here or to go?', '好的。在这儿喝还是带走？')),
          ],
        },
        {
          at: 3, kind: 'probe',
          task: '对方追问一个你不知道答案的细节',
          prompt: S('Oat milk or almond? We do both.', '燕麦奶还是杏仁奶？我们两种都有。'),
          options: [
            O(S('Whatever you recommend.', '你推荐哪个就哪个。'), S('Oat is creamier. I will do oat.', '燕麦奶更顺口，我给你换燕麦。')),
            O(S('Almond, please. Is it sweetened?', '杏仁奶。是甜的吗？'), S('Unsweetened. I will leave the sugar out.', '不加糖的。那我就不另放糖了。')),
          ],
        },
      ],
    },

    /* ---------------- 餐厅点菜 ---------------- */
    {
      ...old('restaurant'),
      variants: [
        { tag: '先说忌口', setting: '你和朋友坐在餐厅里，菜还没点，你有坚果过敏。' },
        V('吃素', '你吃素半年了，菜单上的英文菜名看着都像荤的，只能直接问。', {
          1: ['A few more minutes. Do you have vegetarian options?', '再看一会儿。你们有素食吗？'],
          2: ['We do. The mushroom risotto is vegetarian, and the lentil soup is vegan.', '有的。蘑菇烩饭是素的，扁豆汤是纯素。'],
          3: ['I will have the risotto. Is the cheese in it vegetarian?', '那我要烩饭。里面的奶酪是素的吗？', 'vegetarian 是不吃肉，vegan 是连蛋奶都不吃 —— 这两个词点菜时不能混。'],
          5: ['Sparkling water, please. And no nuts in the risotto, right?', '气泡水。烩饭里没有坚果吧？'],
        }),
        V('带五岁的女儿', '你带女儿吃饭，她坐不住，你只想快点让她吃上东西。', {
          1: ['A few more minutes. Could we get a high chair first?', '再看一会儿。能先给我们一把儿童椅吗？'],
          2: ['Of course, I will bring one. The kids menu is on the back.', '当然，我去拿。儿童菜单在背面。'],
          3: ['I will have the salmon. And she wants the pasta from the kids menu.', '我要三文鱼。她要儿童菜单上的意面。'],
          5: ['Water for me, and a small apple juice for her.', '我白水，给她一小杯苹果汁。'],
          6: ['I will put that in now. The pasta comes plain, no sauce.', '我这就下单。意面不放酱。'],
        }),
        V('赶八点的火车', '你们八点要赶火车，现在七点十分，只想点最快能上的菜。', {
          1: ['A few more minutes. Actually, what can you make fast? We have a train at eight.', '再看一会儿。其实你们什么上得快？我们八点的火车。'],
          2: ['The pasta takes about ten minutes. The salmon takes twenty.', '意面大概十分钟，三文鱼要二十分钟。'],
          3: ['Then the pasta. Could you bring the bill with it?', '那要意面。能把账单一起带来吗？'],
          7: ['Thank you. Could we get the bill now? We are in a hurry.', '谢谢。现在能结账吗？我们赶时间。'],
        }),
        V('想点酒', '你和同事庆功，想点一杯酒，但看不懂酒单上的产区名。', {
          5: ['Could I see the wine list first? And I am allergic to nuts.', '能先给我酒单吗？另外我对坚果过敏。'],
          6: ['Here it is. The house red is six a glass. I will check the nuts with the kitchen.', '酒单给您。店里的红酒六块一杯。坚果我去问后厨。'],
          7: ['The red, then. And could we get the bill at the same time?', '那就红酒。能顺便把账单带来吗？'],
          9: ['Two cards, please. We are splitting it. Everything was delicious.', '两张卡，我们分开付。菜很好吃。'],
        }),
        V('三个人 AA', '你们三个人吃饭，说好各付各的，但店员只拿了一张账单过来。', {
          7: ['Thank you. Could we get the bill? We are splitting it three ways.', '谢谢。麻烦结账，我们三个人分。', 'split the bill 是分账；go Dutch 更口语，但店员不一定顺着说。'],
          8: ['Certainly. Three cards is fine.', '当然。三张卡可以。'],
          9: ['Three, please. Everything was great, thanks.', '三张。菜很好，谢谢。'],
        }),
        V('吃不完打包', '菜量比你想的大，你吃了一半就饱了，不想浪费。', {
          9: ['Card, please. And could you box up what is left?', '刷卡。剩下的能打包吗？', 'box up / wrap it up 都是打包；to go box 是打包盒。'],
        }),
      ],
    },

    /* ---------------- 面包店 ---------------- */
    {
      id: 'bakery', name: '面包店买早餐', lv: 1, cefr: 'A1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Morning! What can I get you?', '早上好！要点什么？'),
        L(0, 'Two croissants, please.', '两个可颂，谢谢。'),
        L(1, 'Just the two? They are still warm.', '就两个？还热着呢。'),
        L(0, 'Then make it three.', '那来三个吧。'),
        L(1, 'Anything to drink?', '要喝的吗？'),
        L(0, 'A small coffee, please. No sugar.', '一小杯咖啡，不加糖。'),
        L(1, 'That is six fifty. Cash or card?', '一共六块五。现金还是刷卡？'),
        L(0, 'Card, please. Thank you.', '刷卡，谢谢。'),
      ],
      variants: [
        { tag: '上班路上顺一个', setting: '你上班路上拐进一家面包店，只想买点能边走边吃的东西。' },
        V('问有没有无麸质', '你不吃麸质，货架上的面包看着都差不多，只能问人。', {
          1: ['Do you have anything gluten free?', '有无麸质的东西吗？', 'gluten free 是无麸质；问句比 I cannot eat gluten 更直接。'],
          2: ['We have a rice flour loaf, but it sells out early.', '我们有无麸质的米面包，但很早就卖完。'],
          3: ['Is there any left today?', '今天还有剩吗？'],
        }),
        V('给同事带一盒', '办公室下午茶轮到你买，你要带一整盒回去。', {
          1: ['Could I get a box of assorted pastries?', '能给我一盒什锦点心吗？'],
          2: ['Sure. Six or twelve?', '可以。六个还是十二个？'],
          3: ['Twelve, please. The ones with chocolate, if you have them.', '十二个。有巧克力的话多放几个。'],
          6: ['That comes to fourteen twenty. Cash or card?', '一共十四块二。现金还是刷卡？'],
        }),
        V('问几点出炉', '你想买刚出炉的，但柜台里只剩早上的。', {
          2: ['Are these from this morning?', '这些是早上做的吗？'],
          3: ['The next batch comes out at eleven.', '下一炉十一点出来。'],
          4: ['Then I will come back at eleven.', '那我十一点再来。'],
        }),
        V('只剩零钱', '你身上只有一把硬币，怕不够。', {
          6: ['I only have coins. Is that okay?', '我只有硬币，可以吗？'],
          7: ['Of course. I will count them for you.', '当然，我帮您数。'],
        }),
      ],
      branches: [
        {
          at: 3, kind: 'offer',
          task: '对方推销一个你没打算买的东西',
          prompt: S('We also have fresh cinnamon rolls, just out.', '我们还有刚出炉的肉桂卷。'),
          options: [
            O(S('All right, add one, please.', '行，加一个。'), S('Good pick. That is seven twenty in total.', '好眼光，一共七块二。')),
            O(S('Not today, thanks. Maybe next time.', '今天不了，谢谢。下次吧。'), S('No problem. Three croissants and a coffee.', '没问题。三个可颂一杯咖啡。')),
          ],
        },
      ],
      phrases: [
        P('What can I get you?', '您要什么？', '所有小店通用的开场问法。'),
        P('Do you have anything gluten free?', '有无麸质的东西吗？', '换掉 gluten free 就能问任何饮食限制。'),
        P('That is six fifty.', '一共六块五。', '报价格式，听到就知道该付钱了。'),
      ],
    },

    /* ---------------- 酒吧 ---------------- */
    {
      id: 'bar', name: '酒吧点一杯', lv: 3, cefr: 'B1',
      roles: ['你', '调酒师'],
      lines: [
        L(1, 'What can I get you tonight?', '今晚喝点什么？'),
        L(0, 'Something light. I am not staying long.', '来点淡的，我待不久。'),
        L(1, 'How about a spritz? Not too strong.', '来杯 spritz 怎么样？不太烈。'),
        L(0, 'Sounds good. What is in it?', '听起来不错。里面是什么？'),
        L(1, 'Prosecco, soda, and a bitter orange liqueur.', '起泡酒、苏打水，还有一点苦橙利口酒。'),
        L(0, 'Perfect. And could I run a tab?', '好。能开个账单吗？', 'run a tab 是先记账最后一起付，酒吧常用。'),
        L(1, 'Sure. I will need a card to hold.', '可以。得押一张卡。'),
        L(0, 'Here you go. One more thing, is there a cover charge?', '给你。还有，有最低消费吗？'),
        L(1, 'Not on weekdays. Last call is at midnight.', '平日没有。最后点单是十二点。'),
        L(0, 'Good to know. Cheers.', '知道了。干杯。'),
      ],
      variants: [
        { tag: '一个人喝一杯', setting: '出差住在酒店附近，你一个人下楼喝一杯，不想喝醉。' },
        V('问无酒精的', '你开车来的，一滴酒都不能喝，但想跟大家坐一会儿。', {
          1: ['Something without alcohol, please. I am driving.', '来点不含酒精的，我开车。'],
          2: ['A virgin mojito? Same taste, no rum.', '无酒精莫吉托？味道一样，不放朗姆。', 'virgin 在酒吧里就是「无酒精版」，不是「处女」。'],
          3: ['Does it still taste like a mojito?', '喝起来还像莫吉托吗？'],
          4: ['Same mint and lime. Just no rum.', '薄荷和青柠一样，就是不放朗姆。'],
        }),
        V('朋友请客，想点一样的', '同事请客，说随便点，你不想显得太客气也不想太贵。', {
          1: ['I will have whatever he is having.', '他喝什么我就来什么。'],
          3: ['Actually, make it a small one.', '不过，给我小杯的。'],
        }),
        V('问小吃', '你空着肚子喝酒，想点点能垫肚子的。', {
          5: ['Do you serve food?', '你们有吃的吗？'],
          6: ['Just bar snacks. Nuts, olives, and fries.', '只有下酒小食。坚果、橄榄、薯条。'],
          7: ['Fries, please. And no nuts, I am allergic.', '薯条吧。不要坚果，我过敏。'],
        }),
        V('结账分开付', '你们四个人要走了，账单上还挂着两轮酒。', {
          9: ['Could we settle up? Four ways, please.', '能结账吗？四个人分。', 'settle up 是结清账单，比 pay 更准确。'],
        }),
      ],
      branches: [
        {
          at: 5, kind: 'probe',
          task: '对方要确认你的年龄或身份',
          prompt: S('I will need to see some ID for the tab.', '开账单得看一下证件。'),
          options: [
            O(S('Sure, here is my passport.', '可以，这是我的护照。'), S('Thank you. I will start the tab under Chen.', '谢谢。账单记在 Chen 名下。')),
            O(S('I left it at the hotel. Can I just pay as I go?', '证件落在酒店了。我能一杯一杯付吗？'), S('That works too. Card or cash?', '也行。刷卡还是现金？')),
          ],
        },
      ],
      phrases: [
        P('What can I get you tonight?', '今晚喝点什么？', '酒吧开场，和咖啡店那句同源。'),
        P('Could I run a tab?', '能开个账单吗？', '先喝后付，酒吧餐厅都能用。'),
        P('Is there a cover charge?', '有最低消费吗？', '进店先问这句，避免结账时多出一笔。'),
        P('Could we settle up?', '能结账吗？', '比 check please 更地道，尤其在酒吧。'),
      ],
    },

    /* ---------------- 电话订餐 ---------------- */
    {
      id: 'phone-order', name: '打电话订餐', lv: 3, cefr: 'B1',
      roles: ['你', '店员'],
      lines: [
        L(1, 'Golden Wok, how can I help?', '金锅餐厅，您好。', '接电话的店名+how can I help 是餐馆标准开场。'),
        L(0, 'Hi, I would like to place an order for pickup.', '你好，我想订餐自取。', 'pickup 自取，delivery 外送 —— 这两个词一换，地址问题就全变了。'),
        L(1, 'Sure. What would you like?', '好的。要点什么？'),
        L(0, 'One beef fried rice and a hot and sour soup.', '一个牛肉炒饭，一个酸辣汤。'),
        L(1, 'Anything else? The dumplings are on special tonight.', '还要别的吗？今晚饺子特价。'),
        L(0, 'No, that is all. How long will it take?', '不用了，就这些。要多久？'),
        L(1, 'About twenty minutes. Can I get a name and number?', '大约二十分钟。留个名字和电话？'),
        L(0, 'Chen, and the number is five five five, zero one two three.', '陈，电话是 555-0123。'),
        L(1, 'Got it. See you in twenty.', '记下了。二十分钟后见。'),
      ],
      variants: [
        { tag: '加班后订餐', setting: '你加班到八点，回家路上想先打电话订好，到了直接拿。' },
        V('要外送', '你不想出门，想问他们送不送，送不送得到你那条街。', {
          1: ['Hi, do you deliver to Elm Street?', '你好，你们送榆树街吗？'],
          2: ['We do, but the minimum is twenty dollars.', '送，不过起送二十块。', 'minimum 是起送金额，点不够要加钱。'],
        }),
        V('有忌口', '你不吃辣，但这家店的菜默认都放辣椒。', {
          3: ['One beef fried rice, no chili please. I cannot eat spicy food.', '一个牛肉炒饭，不要辣椒。我吃不了辣。'],
          5: ['Is the soup spicy too?', '汤也辣吗？'],
        }),
        V('报地址', '改成外送后，店员要你说清楚楼号和门牌。', {
          3: ['One beef fried rice and a soup, for delivery.', '一个牛肉炒饭一个汤，外送。'],
          7: ['Chen. And the address is 42 Elm Street, apartment 3B. The buzzer does not work, please call me.', '陈。地址是榆树街 42 号 3B。门铃坏了，到了打我电话。', 'buzzer 是楼下的门铃，说清楚能省掉外卖员在楼下等十分钟。'],
        }, 1),
        V('问能不能刷卡', '你身上没现金，不确定取餐能不能刷卡。', {
          5: ['No, that is all. Can I pay by card when I pick it up?', '不用了。我取餐的时候能刷卡吗？'],
          6: ['About twenty minutes. And yes, we take cards at the counter.', '大约二十分钟。可以，柜台能刷卡。'],
        }),
      ],
      branches: [
        {
          at: 3, kind: 'short',
          task: '你点的东西没有了，换一个',
          prompt: S('We are out of the hot and sour soup tonight.', '今晚酸辣汤没有了。'),
          options: [
            O(S('Then the wonton soup, please.', '那换馄饨汤。'), S('Wonton soup, got it. Anything else?', '馄饨汤，记下了。还要别的吗？')),
            O(S('Just the fried rice then.', '那就只要炒饭。'), S('One beef fried rice. Name?', '一个牛肉炒饭。留个名字？')),
          ],
        },
        {
          at: 3, kind: 'change',
          task: '送到的那条街他们不送，你要给出替代方案',
          prompt: S('We do not cross the river, sorry. Elm Street is on the other side.', '河那边我们不送，抱歉。榆树街在河对岸。'),
          options: [
            O(S('Then I will pick it up myself.', '那我自己来取。'), S('Sounds good. Anything else tonight?', '好的。今晚还要别的吗？')),
            O(S('Could you deliver to my office instead? It is on your side.', '能送到我办公室吗？就在你们这边。'), S('Sure, that works. Anything else?', '可以。还要别的吗？')),
          ],
        },
      ],
      phrases: [
        P('I would like to place an order for pickup.', '我想订餐自取。', '换成 delivery 就是外送，一句话定下整个流程。'),
        P('How long will it take?', '要多久？', '订餐、修东西、等位都能用。'),
        P('Do you deliver to Elm Street?', '你们送榆树街吗？', '换掉街名就能问任何一片区域。'),
      ],
    },

    /* ---------------- 美食广场找座位 ---------------- */
    {
      
      branches: [
        B(0, 'change', '座位不像看起来那样空，你要重新找',
          S('Sorry, my friend is coming back in a minute.', '抱歉，我朋友马上回来。'),
          [O(S('No problem, I will look elsewhere.', '没事，我再找找。'), S('Try the row by the window, it clears fast.', '窗边那排，空得快。')),
           O(S('Would you mind if I stood here until then?', '能让我先站这儿等吗？'), S('Go ahead, I am nearly done anyway.', '行，反正我快吃完了。'))]),
      ],
id: 'food-court', name: '美食广场拼桌', lv: 2, cefr: 'A2',
      roles: ['你', '陌生人'],
      lines: [
        L(0, 'Excuse me, is this seat taken?', '打扰一下，这个位子有人吗？', '问座位先说 is this seat taken，比 Can I sit here 更自然。'),
        L(1, 'Go ahead. The whole table is free.', '坐吧，整张桌子都空着。'),
        L(0, 'Thanks. It is packed today.', '谢谢。今天人真多。'),
        L(1, 'Friday lunch is always like this.', '周五中午都这样。'),
        L(0, 'Do you know where I can get napkins?', '你知道哪儿能拿纸巾吗？'),
        L(1, 'By the counter on the left, next to the bins.', '左边柜台那儿，垃圾桶旁边。'),
        L(0, 'Got it. Could you watch my bag for a second?', '好。能帮我看一下包吗？'),
        L(1, 'Sure, no problem.', '没问题。'),
        L(0, 'Thanks. That was quick.', '谢谢。我很快回来。'),
      ],
      variants: [
        { tag: '午休找位子', setting: '午休时间美食广场坐满了人，你端着一盘饭找不到位子。' },
        V('想借充电口', '你手机只剩百分之三，看到对方桌边有个插座。', {
          4: ['Is that socket free? My phone is about to die.', '那个插座能用吗？我手机快关机了。'],
          5: ['Help yourself. The one under the table works too.', '随便用。桌子底下那个也能用。'],
        }),
        V('问推荐哪家', '你第一次来，七八个档口不知道吃哪家。', {
          2: ['First time here. Which stall is good?', '第一次来。哪家好吃？'],
          3: ['The noodle place has a queue for a reason.', '那家面排队是有原因的。'],
        }),
        V('对方要走了', '你刚坐下，对方就收拾东西准备走。', {
          1: ['Are you leaving? Then I will take this side.', '你要走了？那我坐这边。'],
        }),
        V('想拼桌但对方有意见', '桌子只空一个位子，对方的行李占了一半。', {
          0: ['Would you mind moving your bag a little?', '能把包挪一点吗？'],
          1: ['Oh, sorry. I did not realize it was that wide.', '哦抱歉，我没注意它占了这么多。'],
        }),
      ],
      phrases: [
        P('Is this seat taken?', '这个位子有人吗？', '拼桌第一句，说错会很尴尬。'),
        P('Could you watch my bag for a second?', '能帮我看一下包吗？', '起身拿东西时最常用的一句。'),
        P('Which stall is good?', '哪家好吃？', '换掉 stall 就能问任何摊位。'),
      ],
    },
  ],
};
