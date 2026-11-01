import { L, V, S, O, B, P } from './_dsl.mjs';
import { LEGACY } from './_legacy.mjs';

const old = id => LEGACY.find(s => s.id === id);

export default {
  cat: '出行',
  items: [
    /* ---------------- 街头问路 ---------------- */
    {
      ...old('directions'),
      variants: [
        { tag: '找药店', setting: '你在陌生城市找一家药店，手机没电了，只能问人。' },
        V('找地铁站', '你拖着箱子出站，找不到地铁入口，天又快黑了。', {
          0: ['Excuse me, where is the nearest subway station?', '打扰一下，最近的地铁站在哪儿？'],
          1: ['Two blocks that way, next to the bakery.', '往那边两个街区，面包店旁边。'],
          2: ['Two blocks. Does it have an elevator?', '两个街区。有电梯吗？'],
          3: ['It does, on the corner. Look for the glass box.', '有，在街角。找那个玻璃盒子就行。'],
          4: ['Great. And does it run late?', '太好了。地铁运营到很晚吗？'],
          5: ['Until midnight on weekdays.', '平日到午夜。'],
        }),
        V('找厕所', '你带着孩子，急需找厕所，最近的公共厕所关门了。', {
          0: ['Sorry, is there a public toilet around here?', '不好意思，附近有公共厕所吗？'],
          1: ['The one in the library closed at six, I am afraid.', '图书馆那个六点就关了。'],
          2: ['It is half past six now, right?', '现在六点半了吧？'],
          3: ['Yeah. Try the cafe on the corner, they usually let people use theirs.', '是啊。试试街角那家咖啡馆，他们一般让人用。'],
          4: ['Will they mind if I just use the toilet?', '我只用厕所他们会介意吗？'],
          5: ['Buy a coffee and they will not.', '买杯咖啡就不会。'],
        }),
        V('问开车路线', '你租了车，想上高速，但导航一直把你往小巷里带。', {
          0: ['How do I get to the motorway from here?', '从这儿怎么上高速？'],
          1: ['Left at the lights, then follow the signs for the ring road.', '红绿灯左转，然后跟着环城路的指示走。'],
          2: ['Left at the lights. How long does it take?', '红绿灯左转。要多久？'],
          3: ['Fifteen minutes if the traffic is kind.', '路况好的话十五分钟。'],
          4: ['Is there a toll on the ring road?', '环城路收费吗？'],
          5: ['No, it is free. The tunnel is the one that charges.', '不收。收费的是隧道。'],
        }),
        V('手机没电', '你手机没电，又不会念这条街的英文名，只能指给对方看。', {
          0: ['My phone died. Could you show me on your map?', '我手机没电了。能在你的地图上指给我看吗？'],
          1: ['Sure, where are you trying to go?', '可以，你要去哪儿？'],
          2: ['This address. I cannot pronounce it.', '这个地址。我念不出来。'],
          3: ['That is ten minutes on foot. I will walk you to the corner.', '走路十分钟。我送你到路口。'],
        }),
      ],
    },

    /* ---------------- 机场值机 ---------------- */
    {
      ...old('airport'),
      variants: [
        { tag: '行李有点多', setting: '国际航班起飞前两小时，你在值机柜台前，行李有点多。' },
        V('行李超重', '你的箱子在家称过，但心里没底，果然超了。', {
          5: ['Two, actually. One might be over the limit.', '其实是两件。有一件可能超重。'],
          6: ['Let me weigh it. Three kilos over, that is forty-five to check.', '我称一下。超了三公斤，托运要加四十五。'],
          7: ['Can I move some things into my carry-on?', '我能挪点东西到手提行李吗？'],
          8: ['Sure. There is a bench over there.', '可以。那边有张长椅。'],
          9: ['Thanks. I will be right back.', '谢谢。我马上回来。'],
        }),
        V('带吉他', '你要带一把吉他上飞机，不确定能不能进客舱。', {
          4: ['Just this guitar. Can I take it on board?', '就这把吉他。能带上飞机吗？'],
          5: ['It fits the cabin size, so yes, but it goes in the overhead bin.', '尺寸符合客舱要求，可以，但得放行李架。'],
          6: ['No problem. Does it count as my carry-on?', '没问题。它算我的手提行李吗？'],
          7: ['It does, so one bag only in the cabin.', '算。所以客舱里只能再带一件。'],
        }),
        V('想升舱', '你飞十个小时，想问问升舱要多少钱。', {
          3: ['An aisle, please. Is an upgrade available?', '靠走廊。可以升舱吗？'],
          4: ['We have two seats in premium for ninety. Interested?', '高级经济舱还有两个位子，九十。要吗？'],
          5: ['What does it include?', '包含什么？'],
          6: ['Extra legroom and a hot meal.', '更大的腿部空间和一份热餐。'],
          7: ['Then yes, please. What time does boarding start?', '那就要。几点开始登机？'],
        }),
        V('要转机', '你要在下一站转机，担心行李和安检。', {
          1: ['Here you go. I am connecting to Vancouver. Is my bag checked through?', '给你。我要转机去温哥华。行李是直挂吗？'],
          2: ['It is. You will pick it up in Vancouver.', '是直挂。到温哥华取。'],
          3: ['Good. Do I go through security again?', '好。还要再过一次安检吗？'],
          4: ['No, just follow the transit signs.', '不用，跟着中转指示走。'],
          5: ['And how long is the connection?', '转机时间有多久？'],
          6: ['Two hours, which is plenty.', '两小时，很充裕。'],
        }),
      ],
      branches: [
        ...(old('airport').branches ?? []),
        {
          at: 3, kind: 'change',
          task: '你的座位没了，得换一个能接受的位置',
          prompt: S('I am sorry, the aisle seats are all gone. Only middle seats left.', '抱歉，靠走廊的位子都没了，只剩中间座位。'),
          options: [
            O(S('Middle is fine. I will sleep anyway.', '中间也行，反正我要睡觉。'), S('Thanks for being easy about it. Do you have bags to check?', '谢谢您这么好说话。有行李要托运吗？')),
            O(S('Is there anything by the window?', '有靠窗的吗？'), S('One, in the back row. It does not recline.', '有一个，最后一排。靠背放不下去。')),
          ],
        },
      ],
    },

    /* ---------------- 打车 ---------------- */
    {
      id: 'taxi', name: '打车去机场', lv: 2, cefr: 'A2',
      roles: ['你', '司机'],
      lines: [
        L(0, 'Hi, are you free?', '你好，空车吗？'),
        L(1, 'Where to?', '去哪儿？'),
        L(0, 'The airport, Terminal 2.', '机场，二号航站楼。'),
        L(1, 'That is about forty minutes with this traffic.', '这个点堵，大概四十分钟。'),
        L(0, 'That is fine. Could you take the motorway?', '行。能走高速吗？'),
        L(1, 'Sure, it is faster, but there is a toll.', '可以，快一些，但要过路费。'),
        L(0, 'No problem. Roughly how much will it be?', '没问题。大概多少钱？', 'roughly 是「大概」，打车问价先说 roughly，司机不会觉得你在压价。'),
        L(1, 'Around thirty-five, plus the toll.', '三十五左右，过路费另算。'),
        L(0, 'Good. Can I pay by card?', '好。能刷卡吗？'),
        L(1, 'Yes, the machine takes cards.', '能，机器支持刷卡。'),
      ],
      variants: [
        { tag: '赶飞机', setting: '你出门晚了，离登机只剩一个半小时，拦下一辆出租。' },
        V('赶时间', '你要赶一班一小时后起飞的飞机。', {
          3: ['I am late for a flight. How fast can you get there?', '我赶飞机，晚了。最快多久能到？'],
          4: ['The motorway, then. It costs extra but it is worth it.', '那走高速。多花点钱，但值。'],
        }),
        V('行李多', '你有一个大箱子和两个包，怕后备箱放不下。', {
          0: ['Hi, are you free? I have three bags.', '你好，空车吗？我有三件行李。'],
          1: ['A big one? The boot is small in this car.', '有大箱子吗？这车后备箱小。'],
          2: ['One large case and two backpacks.', '一个大箱子加两个背包。'],
        }),
        V('中途停一下', '你要顺路去酒店取行李。', {
          4: ['Could we stop at a hotel on the way?', '能顺路在一家酒店停一下吗？'],
          5: ['That is ten minutes extra. The meter keeps running.', '要多十分钟。表一直走。'],
        }),
        V('深夜', '凌晨一点，你在路边拦车，想先确认加价规则。', {
          6: ['Is there a night surcharge?', '夜间加价吗？', 'night surcharge 是夜班附加费，上车先问能避免下车时吵。'],
          7: ['Twenty percent after midnight.', '午夜后加两成。'],
        }),
      ],
      branches: [
        {
          at: 6, kind: 'cost',
          task: '对方报的价比你预期高，你要决定接受还是换方案',
          prompt: S('With the toll it will be nearer fifty. Still want the motorway?', '加过路费差不多五十。还是走高速吗？'),
          options: [
            O(S('Fine, I am in a hurry.', '行，我赶时间。'), S('Then the motorway it is.', '那就走高速。')),
            O(S('Take the normal road, then. I have time.', '那走普通路吧，我有时间。'), S('Your call. It will be slower but cheaper.', '听您的。慢一点，但便宜。')),
          ],
        },
      ],
      phrases: [
        P('Are you free?', '空车吗？', '拦出租车第一句。'),
        P('Roughly how much will it be?', '大概多少钱？', '上车先问价，避免下车吵。'),
        P('Is there a night surcharge?', '夜间加价吗？', '深夜打车必问。'),
      ],
    },

    /* ---------------- 火车票 ---------------- */
    {
      id: 'train-ticket', name: '买火车票', lv: 2, cefr: 'A2',
      roles: ['你', '售票员'],
      lines: [
        L(0, 'Hi, a return ticket to Leeds, please.', '你好，一张去利兹的往返票。', 'return 是往返，single 是单程 —— 英国售票窗口的标准说法。'),
        L(1, 'Coming back today or another day?', '今天回还是改天？'),
        L(0, 'Today, sometime after six.', '今天，六点以后。'),
        L(1, 'There is one at six forty. That is thirty-two pounds.', '六点四十有一班。三十二镑。'),
        L(0, 'Is that the fast train?', '那是快车吗？'),
        L(1, 'It is, two hours ten.', '是，两小时十分。'),
        L(0, 'Great. Which platform?', '好。哪个站台？'),
        L(1, 'Platform four. It leaves in twenty minutes.', '四号站台。二十分钟后开。'),
        L(0, 'Thanks. Do I need to reserve a seat?', '谢谢。需要订座吗？'),
        L(1, 'Not on this route, but you can.', '这条线不用，但也可以订。'),
      ],
      variants: [
        { tag: '往返当天回', setting: '你去利兹当天往返，售票窗口排着队。' },
        V('单程', '你只去不回，买一张单程票。', {
          0: ['Hi, a single to Leeds, please.', '你好，一张去利兹的单程票。'],
          1: ['One way? That is nineteen pounds.', '单程？十九镑。'],
        }),
        V('学生票', '你带着学生证，想问有没有折扣。', {
          0: ['A return to Leeds, please. Do you do student discount?', '一张去利兹的往返票。有学生折扣吗？'],
          1: ['With a student card, yes. A third off.', '有学生证就有，打七折。'],
        }),
        V('带自行车', '你要带自行车上火车，不确定要不要预订。', {
          0: ['A return to Leeds, and a bike. Do I need to book the bike on?', '一张去利兹的往返票，加一辆自行车。自行车要预订吗？', 'book the bike on 是给自行车占位，英国火车上必须。'],
          1: ['You do, and there are only two spaces.', '要，而且只有两个位置。'],
        }),
        V('问退改', '你行程可能变，想先问清楚能不能改。', {
          8: ['Can I change the time if my meeting runs late?', '如果会议拖了，能改时间吗？'],
          9: ['Anytime tickets can be changed. This one has a fee.', '随时票可以改。这张要收手续费。'],
        }),
      ],
      branches: [
        {
          at: 6, kind: 'change',
          task: '站台临时变了，你要听清楚新信息',
          prompt: S('Correction, that train now leaves from platform nine, not four.', '更正一下，那班车改从九号站台发车，不是四号。'),
          options: [
            O(S('Platform nine. Thank you for telling me.', '九号站台。谢谢你告诉我。'), S('You have got time. It is a five-minute walk.', '来得及。走过去五分钟。')),
            O(S('How do I get to platform nine?', '九号站台怎么走？'), S('Up the stairs and to the left.', '上楼左转。')),
          ],
        },
      ],
      phrases: [
        P('A return ticket to Leeds, please.', '一张去利兹的往返票。', 'return 往返 / single 单程。'),
        P('Which platform?', '哪个站台？', '买完票必问。'),
        P('Do I need to reserve a seat?', '需要订座吗？', '长途车不问可能上不了车。'),
      ],
    },

    /* ---------------- 地铁售票机 ---------------- */
    {
      
      branches: [
        B(2, 'change', '售票机不收卡，你要换个买票方式',
          S('The card reader is down. Machines are cash only today.', '读卡器坏了。今天机器只收现金。'),
          [O(S('I have no cash. Is there a counter?', '我没现金。有柜台吗？'), S('Upstairs, but the queue is twenty minutes.', '楼上，但要排二十分钟。')),
           O(S('Then I will find an ATM first.', '那我先找台取款机。'), S('There is one by the exit.', '出口有一台。'))]),
      ],
id: 'metro-ticket', name: '地铁买票进站', lv: 1, cefr: 'A1',
      roles: ['你', '工作人员'],
      lines: [
        L(0, 'Excuse me, how do I get to the museum?', '打扰一下，去博物馆怎么走？'),
        L(1, 'Take the blue line, three stops.', '坐蓝线，三站。'),
        L(0, 'Where do I buy a ticket?', '在哪儿买票？'),
        L(1, 'The machines by the gate take cards.', '闸机边的机器可以刷卡。'),
        L(0, 'Do they take cash?', '收现金吗？'),
        L(1, 'The one on the left does.', '左边那台收。'),
        L(0, 'And do I need to validate it?', '需要刷卡激活吗？'),
        L(1, 'Yes, tap it on the yellow reader.', '要，在黄色读卡器上刷一下。'),
        L(0, 'Got it. Thanks a lot.', '明白了。多谢。'),
      ],
      variants: [
        { tag: '第一次坐地铁', setting: '你第一次坐这条线，站在闸机前不知道票怎么用。' },
        V('买一日票', '你一天要去好几个地方，想买一日票。', {
          3: ['Is there a day pass?', '有一日票吗？'],
          4: ['There is, and it covers the buses too.', '有，公交也能用。'],
        }),
        V('机场线加价', '你要去机场，听说机场线单独收费。', {
          0: ['Does this line go to the airport?', '这条线到机场吗？'],
          1: ['It does, but you need an extension ticket.', '到，但要买一张延伸段票。'],
        }),
        V('坐过站', '你坐过站了，想知道怎么回去。', {
          0: ['I missed my stop. What should I do?', '我坐过站了。怎么办？'],
          1: ['Cross over and take the train back. You do not need a new ticket.', '到对面坐回去。不用重新买票。'],
        }),
        V('末班车', '你玩到很晚，想确认末班车时间。', {
          6: ['What time is the last train?', '末班车几点？'],
          7: ['Half past midnight on Fridays.', '周五是午夜十二点半。'],
        }),
      ],
      phrases: [
        P('Where do I buy a ticket?', '在哪儿买票？', '换掉 ticket 就能问任何票务。'),
        P('Do I need to validate it?', '需要激活吗？', 'validate 是刷卡/打票，很多城市不刷会被罚。'),
        P('What time is the last train?', '末班车几点？', '夜归必问。'),
      ],
    },

    /* ---------------- 租车 ---------------- */
    {
      id: 'rental-car', name: '租车取车', lv: 4, cefr: 'B1',
      roles: ['你', '柜台'],
      lines: [
        L(0, 'Hi, I have a booking under Chen.', '你好，我用陈的名字订了车。'),
        L(1, 'Found it. Compact, three days. Licence and card, please.', '找到了。紧凑型，三天。驾照和卡。'),
        L(0, 'Here they are. Is insurance included?', '都在这儿。含保险吗？'),
        L(1, 'Basic is. Full cover is twelve a day.', '基本险含。全险一天十二。'),
        L(0, 'I will take the full cover.', '那我要全险。'),
        L(1, 'Good choice. The car is in bay seven.', '明智。车在七号位。'),
        L(0, 'Does it come with a full tank?', '是满油吗？'),
        L(1, 'Full to full. Bring it back full or we charge for the fuel.', '满油取满油还。还车不满要收油费。'),
        L(0, 'Understood. Is there a number for breakdowns?', '明白。有救援电话吗？'),
        L(1, 'It is on the key tag.', '钥匙牌上就有。'),
      ],
      variants: [
        { tag: '取紧凑型', setting: '你在机场租车柜台，订了一辆紧凑型，准备开三天。' },
        V('加第二驾驶员', '你和朋友轮流开，需要加一个驾驶员。', {
          4: ['Could I add a second driver?', '能加一个驾驶员吗？'],
          5: ['That is six a day, and their licence has to be seen.', '一天六块，要看他的驾照。'],
        }),
        V('要儿童座椅', '你带着两岁的孩子，需要安全座椅。', {
          4: ['I need a child seat for a two-year-old.', '我需要一个两岁孩子的安全座椅。'],
          5: ['We have them for five a day. Fitting is free.', '一天五块。安装免费。'],
        }),
        V('异地还车', '你想在另一个城市还车。', {
          9: ['Could I drop it off in Bristol instead?', '能改在布里斯托还车吗？'],
        }),
        V('想升级车型', '你们的行李太多，紧凑型装不下。', {
          1: ['We have four suitcases. Is a bigger car available?', '我们有四个箱子。有大一点的车吗？'],
          2: ['An estate is twenty more a day. It has the room.', '旅行车一天多二十。装得下。'],
        }),
      ],
      branches: [
        {
          at: 4, kind: 'cost',
          task: '对方推销全险，你要判断要不要买',
          prompt: S('Without full cover, the excess is eight hundred pounds.', '不买全险的话，免赔额是八百镑。', 'excess 是免赔额 —— 出事时你自己要掏的那部分。'),
          options: [
            O(S('Then I will take the full cover.', '那我要全险。'), S('Smart. Twelve a day, and nothing to pay if anything happens.', '明智。一天十二，出事不用赔。')),
            O(S('My own insurance covers the excess.', '我自己的保险覆盖免赔额。'), S('Fine, just note it on the form.', '好，在表上注明一下。')),
          ],
        },
      ],
      phrases: [
        P('Is insurance included?', '含保险吗？', '租车第一问。'),
        P('Full to full?', '满油取满油还？', '油政策不问清，还车时会被扣钱。'),
        P('Is there a number for breakdowns?', '有救援电话吗？', 'breakdown 是车辆抛锚。'),
      ],
    },

    /* ---------------- 行李丢失 ---------------- */
    {
      
      branches: [
        B(5, 'change', '今晚的航班也取消了，你要争取替代方案',
          S('The last flight from Madrid tonight is cancelled as well.', '今晚从马德里来的最后一班也取消了。'),
          [O(S('Then what are my options?', '那我有什么选择？'), S('It can go tomorrow at noon, or we can courier it.', '明天中午到，或者我们走快递。')),
           O(S('Courier it to my hotel, please.', '请快递到我酒店。'), S('It will be there by ten tomorrow.', '明天十点前送到。'))]),
      ],
id: 'lost-luggage', name: '行李没出来', lv: 4, cefr: 'B1',
      roles: ['你', '行李处'],
      lines: [
        L(1, 'Baggage services. How can I help?', '行李服务处。有什么可以帮您？'),
        L(0, 'My suitcase did not come out. Flight BA two one four.', '我的箱子没出来。BA214 航班。'),
        L(1, 'Do you have the bag tag?', '有行李牌吗？'),
        L(0, 'Yes, here it is.', '有，在这儿。'),
        L(1, 'It is still in Madrid. It should be on the next flight tonight.', '它还在马德里。今晚下一班应该能到。'),
        L(0, 'I need it tonight. I have a meeting tomorrow morning.', '我今晚就要用。明天上午有会。'),
        L(1, 'We can deliver it to your hotel by nine tomorrow.', '我们明早九点前送到酒店。'),
        L(0, 'All right. Can I claim for essentials?', '行。我能报销必需品吗？', 'claim for essentials 是申报临时购置的必需品，航司一般有上限。'),
        L(1, 'Keep the receipts and claim online within twenty-one days.', '留好收据，二十一天内在网上申报。'),
      ],
      variants: [
        { tag: '箱子没出来', setting: '转机两次之后，你在行李转盘前站了四十分钟，箱子没出现。' },
        V('箱子摔坏了', '箱子出来了，但轮子被摔掉一个。', {
          1: ['My suitcase came out, but a wheel is broken.', '我的箱子出来了，但轮子摔坏了。'],
          2: ['Was it like that when you checked it in?', '托运时就是这样吗？'],
        }),
        V('拿错别人的', '你拿错了箱子，回来换。', {
          1: ['I picked up the wrong bag. Mine is still on the belt.', '我拿错箱子了。我的还在传送带上。'],
          2: ['It happens. Let me check what is left.', '常有的事。我看看还剩什么。'],
        }),
        V('索赔额度', '你想知道能赔多少。', {
          6: ['How much can I claim for essentials?', '必需品能报多少？'],
          7: ['Up to fifty a day, for three days.', '一天最多五十，最多三天。'],
        }),
        V('保险理赔', '你要一份书面证明去走保险。', {
          8: ['Could I get a written report for my insurance?', '能给我一份书面报告走保险吗？'],
          9: ['I will email it to you before you leave.', '您走之前我发到邮箱。'],
        }),
      ],
      phrases: [
        P('My suitcase did not come out.', '我的箱子没出来。', '行李转盘前最有用的一句。'),
        P('Can I claim for essentials?', '能报销必需品吗？', '衣物洗漱都能报，记得留收据。'),
        P('Could I get a written report?', '能给我一份书面报告吗？', '走保险必须要。'),
      ],
    },

    /* ---------------- 航班延误 ---------------- */
    {
      id: 'flight-delay', name: '航班延误改签', lv: 4, cefr: 'B1',
      roles: ['你', '地勤'],
      lines: [
        L(0, 'Excuse me, how long is the delay?', '打扰一下，延误多久？'),
        L(1, 'About three hours, due to weather.', '大约三小时，天气原因。'),
        L(0, 'Will I still make my connection?', '我还赶得上转机吗？'),
        L(1, 'It will be tight. Come to the desk and we will rebook you.', '会很紧。到柜台来，我们给您改签。'),
        L(0, 'Can you put me on the next flight instead?', '能直接把我改到下一班吗？'),
        L(1, 'There is one at four, but it is full. I can waitlist you.', '四点有一班，但满了。我可以把您放候补。'),
        L(0, 'Please do. And what about a meal voucher?', '那就候补吧。餐券呢？'),
        L(1, 'Here is one for fifteen. Sorry for the trouble.', '这张十五的。给您添麻烦了。'),
        L(0, 'Thanks. Where do I wait for the waitlist call?', '谢谢。候补叫号在哪儿等？'),
        L(1, 'By gate twelve. I will call your name.', '十二号登机口。我会叫您名字。'),
      ],
      variants: [
        { tag: '延误三小时', setting: '登机口屏幕上的时间改了三次，你走到服务台。' },
        V('航班取消', '航班直接取消了，你要今晚就到。', {
          0: ['The flight is cancelled. I need to get there tonight.', '航班取消了。我今晚必须到。'],
          1: ['There is a flight via Frankfurt, arriving at eleven.', '有一班经法兰克福，十一点到。'],
        }),
        V('要过夜住宿', '改签到明天早上，你需要一晚酒店。', {
          6: ['Do you provide a hotel for the night?', '你们提供过夜酒店吗？'],
          7: ['For cancellations, yes. For delays, only if it is over six hours.', '取消才提供。延误要超过六小时。'],
        }),
        V('行李已托运', '你的行李已经托运了，想取回来。', {
          4: ['My bag is already checked in. Can I get it back?', '我的行李已经托运了。能取回来吗？'],
          5: ['It takes about an hour. Come back to this desk.', '大概一小时。回这个柜台来。'],
        }),
        V('改坐火车', '你不想等，想改成火车。', {
          4: ['Could I take the train instead, and you cover the ticket?', '能改坐火车，你们出票钱吗？'],
        }),
      ],
      branches: [
        {
          at: 4, kind: 'offer',
          task: '对方给了一个你不太满意的方案，你要争取更好的',
          prompt: S('The next available seat is tomorrow morning, unless someone cancels.', '最近的空位是明天早上，除非有人退票。'),
          options: [
            O(S('Please waitlist me for today as well.', '把我也放今天的候补吧。'), S('Done. You are second in line.', '好了。您排第二。')),
            O(S('What about another airline?', '别的航空公司呢？'), S('We can endorse your ticket. Let me check.', '我们可以签转。我查一下。')),
          ],
        },
      ],
      phrases: [
        P('How long is the delay?', '延误多久？', '延误现场第一句。'),
        P('We will rebook you.', '我们给您改签。', '听到这句就知道有救。'),
        P('Do you provide a hotel for the night?', '提供过夜酒店吗？', '取消和延误的政策不一样。'),
      ],
    },
  ],
};
