import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '出行',
  items: [
    {
      id: 'immigration', name: '边检问答', lv: 4, cefr: 'B1',
      roles: ['你', '边检'],
      lines: [
        L(1, 'What is the purpose of your trip?', '这次旅行的目的是什么？'),
        L(0, 'Tourism. Ten days, then I fly home.', '旅游。十天，然后回国。'),
        L(1, 'Where will you stay?', '住哪儿？'),
        L(0, 'A hotel in the centre. I have the booking here.', '市中心一家酒店。预订在这儿。'),
        L(1, 'How much cash are you carrying?', '带了多少现金？'),
        L(0, 'About three hundred pounds, and two cards.', '大概三百镑，还有两张卡。'),
        L(1, 'Is this your first visit?', '第一次来吗？'),
        L(0, 'Second. I was here two years ago, for work.', '第二次。两年前来过，出差。'),
      ],
      variants: [
        { tag: '旅游十天', setting: '你落地后排在非欧盟通道，前面几个人被问得比较久。' },
        V('探亲', '你去看在那边读书的女儿。', {
          0: ['I am visiting my daughter. She is studying here.', '我去看女儿。她在这边读书。'],
          1: ['Do you have her address and a copy of her visa?', '有她的地址和签证复印件吗？'],
        }),
        V('商务', '你来开会。', {
          0: ['Business. A conference, and meetings with a supplier.', '商务。一个会议，还有跟供应商的会谈。'],
          1: ['Who is your host company?', '接待公司是哪家？'],
        }),
        V('转机', '你只是转机。', {
          0: ['I am only transiting. My connection leaves in four hours.', '我只是转机。下一班四小时后。'],
        }),
        V('带药品', '你带了处方药。', {
          4: ['I have prescription medicine in my bag. Do I need to declare it?', '我包里有处方药。要申报吗？'],
          5: ['Keep it in the original box with the prescription.', '保留原包装和处方。'],
        }),
        V('被追问', '边检问你为什么待这么久。', {
          6: ['Ten days is long for tourism. Why so long?', '旅游十天有点长。为什么？'],
          7: ['I am visiting three cities. The trains take a day each.', '我要去三个城市。坐火车各要一天。'],
        }),
      ],
      branches: [
        B(3, 'probe', '边检追问细节，你要给得出凭证',
          S('You say a hotel. Which one, and for how many nights?', '你说酒店。哪家，住几晚？'),
          [O(S('The Riverside, nine nights. I can show the confirmation.', '河畔酒店，九晚。我可以出示确认单。'), S('That is fine. Welcome in.', '可以。欢迎入境。')),
           O(S('The first two nights are with a friend.', '头两晚住朋友家。'), S('Then I need his address and phone number.', '那要他的地址和电话。'))]),
      ],
      phrases: [
        P('What is the purpose of your trip?', '这次旅行的目的是什么？', '边检第一问，答一个词就够。'),
        P('I am only transiting.', '我只是转机。', 'transit 转机，不入境。'),
        P('Do I need to declare it?', '要申报吗？', '现金、药品、食品都可能要报。'),
      ],
    },

    {
      
      branches: [
        B(4, 'change', '转机流程有变化，你要换一条路',
          S('Security for connections is closed. You have to exit and come back in.', '转机安检关了。要出去再重新进。'),
          [O(S('Will I still make the flight?', '还赶得上吗？'), S('It is twenty minutes extra. You have thirty.', '多花二十分钟。你有三十分钟。')),
           O(S('Is there another route to gate B42?', '去 B42 还有别的路吗？'), S('The walkway on level two stays open.', '二楼通道还开着。'))]),
      ],
id: 'transit', name: '转机找登机口', lv: 3, cefr: 'B1',
      roles: ['你', '地勤'],
      lines: [
        L(0, 'Excuse me, where do I go for a connecting flight?', '打扰一下，转机往哪边走？'),
        L(1, 'Follow the purple signs for transfers.', '跟着紫色的转机指示走。'),
        L(0, 'My connection is in fifty minutes. Is that enough?', '我下一班五十分钟后。来得及吗？'),
        L(1, 'It is tight but doable. Which gate?', '有点紧，但来得及。哪个登机口？'),
        L(0, 'B42. Do I need to go through security again?', 'B42。还要再过安检吗？'),
        L(1, 'Not from this terminal. Just keep walking.', '这个航站楼不用。一直走就行。'),
        L(0, 'And if I miss it, where do I rebook?', '如果我没赶上，在哪儿改签？'),
        L(1, 'The transfer desk at the end of this corridor.', '这条走廊尽头的转机柜台。'),
      ],
      variants: [
        { tag: '转机五十分钟', setting: '你只有五十分钟，前一段还晚点了十分钟。' },
        V('要换航站楼', '你要坐摆渡车去另一个楼。', {
          2: ['I have to change terminals. How long does the shuttle take?', '我要换航站楼。摆渡车多久？'],
          3: ['Fifteen minutes, every five. You will be fine.', '十五分钟，每五分钟一班。来得及。'],
        }),
        V('行李直挂', '你想确认行李。', {
          4: ['Is my bag checked through to the final destination?', '我的行李是直挂到终点吗？'],
          5: ['It is. You will see it at the other end.', '是直挂。到终点取。'],
        }),
        V('安检排队', '安检队伍很长。', {
          6: ['The queue is enormous. Is there a fast track for connections?', '队太长了。转机有快速通道吗？'],
        }),
        V('已经错过', '你到的时候登机口已经关了。', {
          0: ['I missed the connection. The gate was already closed.', '我没赶上转机。登机口已经关了。'],
          1: ['Come to the desk. We will put you on the next one.', '到柜台来。我们给您安排下一班。'],
        }),
        V('问休息室', '你有三个小时。', {
          7: ['Is there a lounge I can use with this card?', '这张卡能用休息室吗？'],
        }),
      ],
      phrases: [
        P('Where do I go for a connecting flight?', '转机往哪边走？', 'connecting flight 是联程航班。'),
        P('Is that enough time?', '时间够吗？', '转机必问。'),
        P('Where do I rebook?', '在哪儿改签？', '误机后的第一句。'),
      ],
    },

    {
      
      branches: [
        B(4, 'change', '海关要求你先出示商品，和你预期不同',
          S('I need to see the goods here, before the bag goes on the belt.', '我要在这儿看到商品，行李过传送带之前。'),
          [O(S('Then I will open the case now.', '那我现在开箱。'), S('Just the items on the form. This will be quick.', '只要单子上的东西。很快。')),
           O(S('Can I bring the bag back after checking in?', '托运后能再拿出来吗？'), S('Once it is on the belt, no.', '过了传送带就不行。'))]),
      ],
id: 'tax-refund', name: '机场退税', lv: 4, cefr: 'B1',
      roles: ['你', '海关'],
      lines: [
        L(0, 'I would like to claim a tax refund on these purchases.', '我想为这些购物办退税。'),
        L(1, 'Do you have the forms and the receipts?', '有退税单和收据吗？'),
        L(0, 'Yes, all in this envelope.', '有，都在这个信封里。'),
        L(1, 'Are the goods in your checked luggage or with you?', '东西在托运行李里还是随身？'),
        L(0, 'In the suitcase. Should I bring them out?', '在箱子里。要拿出来吗？'),
        L(1, 'I need to see them before you check the bag in.', '我要在托运前看一眼。', '退税的关键顺序：先海关验货，再托运 —— 反了就退不了。'),
        L(0, 'How long does the refund take to reach my card?', '退款多久到卡上？'),
        L(1, 'About four weeks. Keep the stamped copy.', '大概四周。留好盖章的副本。'),
      ],
      variants: [
        { tag: '服装和电子产品', setting: '你买了八百镑的东西，想退一成多的税。' },
        V('只在随身', '东西都在登机箱里。', {
          4: ['Everything is in my hand luggage. Do I still need to show it?', '东西都在随身行李里。还要看吗？'],
          5: ['Yes, at the desk after security.', '要，过安检后的柜台看。'],
        }),
        V('金额小', '你只买了两百。', {
          0: ['These come to two hundred. Is it worth claiming?', '这些两百。值得退吗？'],
          1: ['The fee is ten, so you would get about fifteen back.', '手续费十，能退大概十五。'],
        }),
        V('网上买', '你在网上买的，寄到酒店。', {
          3: ['I bought online. Is the invoice enough?', '我网上买的。发票够吗？'],
        }),
        V('被拒', '海关说商品不符合条件。', {
          6: ['Why is this one refused?', '这个为什么不行？'],
        }),
        V('现金退税', '你想现场拿现金。', {
          7: ['Can I get the refund in cash instead?', '能拿现金吗？'],
        }),
      ],
      phrases: [
        P('I would like to claim a tax refund.', '我想办退税。', 'claim a refund 申请退税。'),
        P('Before you check the bag in.', '托运之前。', '顺序错了就退不成。'),
        P('Keep the stamped copy.', '留好盖章的副本。', '没盖章等于没办。'),
      ],
    },

    {
      id: 'return-car', name: '还车被扣钱', lv: 4, cefr: 'B1',
      roles: ['你', '租车行'],
      lines: [
        L(1, 'The car has a scratch on the rear door.', '车后门有一道划痕。'),
        L(0, 'That was there when I picked it up. It is on the check-out sheet.', '我取车时就有。取车单上记了。'),
        L(1, 'Let me look at the sheet. Do you have photos?', '我看下单子。你拍照片了吗？'),
        L(0, 'I photographed all four sides before I drove off.', '我开走前把四面都拍了。'),
        L(1, 'I see it on the sheet. Sorry, we will not charge for that.', '单子上有。抱歉，这项不收费。'),
        L(0, 'What about the fuel? I filled it up ten minutes ago.', '油呢？我十分钟前加满了。'),
        L(1, 'The gauge shows full. Here is your receipt.', '油表是满的。这是您的收据。'),
      ],
      variants: [
        { tag: '划痕争议', setting: '你还车，店员绕车一圈后指着一道划痕。' },
        V('油没加满', '你赶飞机，没来得及加油。', {
          5: ['I did not have time to refuel. What is the charge?', '我没时间加油。收多少？'],
          6: ['Forty, plus the fuel itself. It is on your contract.', '四十，加油费另算。合同上写着。'],
        }),
        V('迟到还车', '你晚了三个小时。', {
          0: ['I am three hours late. Is there an extra day charge?', '我晚了三小时。要收一天吗？'],
          1: ['There is a grace period of two hours, so yes.', '有两小时宽限，所以是的。'],
        }),
        V('轮胎', '轮胎被扎了。', {
          2: ['One tyre is flat. I did not notice until this morning.', '一个轮胎没气了。我今早才发现。'],
        }),
        V('罚单', '你收到一张停车罚单。', {
          6: ['I got a parking ticket while I had the car. Who pays it?', '用车期间我吃了张停车罚单。谁付？'],
        }),
        V('押金', '你想确认押金什么时候退。', {
          7: ['When is the deposit released?', '押金什么时候解冻？'],
        }),
      ],
      branches: [
        B(3, 'probe', '店员不认账，你要拿证据',
          S('The sheet is not signed. It does not prove anything.', '单子没签字。证明不了什么。'),
          [O(S('My photos carry a timestamp from the car park.', '我的照片带停车场的时间戳。'), S('Let me see them. All right, no charge.', '我看看。好，不收费。')),
           O(S('Then call the branch and ask who checked the car out.', '那打给门店，问是谁办的交车。'), S('I will do that. Please wait.', '我去问。请稍等。'))]),
      ],
      phrases: [
        P('That was there when I picked it up.', '我取车时就有。', '还车争议第一句。'),
        P('It is on the check-out sheet.', '取车单上记了。', '取车单是关键证据。'),
        P('When is the deposit released?', '押金什么时候解冻？', '还车后别忘问。'),
      ],
    },

    {
      
      branches: [
        B(3, 'short', '屋里少了东西，你要先解决再安顿',
          S('There are no towels in the bathroom.', '浴室里没有毛巾。'),
          [O(S('Could someone bring them tonight?', '今晚能送过来吗？'), S('I will drop them at nine.', '我九点送过来。')),
           O(S('Are they in the cupboard?', '在柜子里吗？'), S('Top shelf, behind the spare pillows.', '最上层，备用枕头后面。'))]),
      ],
id: 'airbnb-checkin', name: '民宿自助入住', lv: 3, cefr: 'B1',
      roles: ['你', '房东'],
      lines: [
        L(1, 'The key is in the lock box by the door. The code is 4471.', '钥匙在门边的密码盒里。密码 4471。'),
        L(0, 'I am at the door but the box will not open.', '我到门口了，但盒子打不开。'),
        L(1, 'Try pressing the numbers firmly, then pull the shackle down.', '数字按实一点，然后把锁梁往下拉。'),
        L(0, 'It opened. Thank you. Where is the wifi password?', '开了。谢谢。wifi 密码在哪儿？'),
        L(1, 'On the card by the router, in the hall.', '在走廊路由器旁边的卡片上。'),
        L(0, 'The heating is not coming on. Is there a switch?', '暖气不热。有开关吗？'),
        L(1, 'The thermostat is behind the living room door. Set it to twenty.', '温控器在客厅门后。调到二十度。'),
      ],
      variants: [
        { tag: '密码盒打不开', setting: '晚上十一点到民宿，楼道很暗。' },
        V('钥匙不对', '密码盒开了但钥匙开不了门。', {
          2: ['The box opened but this key does not turn the lock.', '盒子开了，但钥匙转不动。'],
          3: ['Wrong key. The other one on the ring is for the door.', '拿错了。钥匙圈上另一把是门的。'],
        }),
        V('房间没打扫', '进去发现床没铺。', {
          4: ['The flat has not been cleaned. The beds are unmade.', '房子没打扫。床都没铺。'],
          5: ['I am sorry. The cleaner is coming at eight tomorrow.', '抱歉。保洁明早八点来。'],
        }),
        V('邻居投诉', '你晚上太吵被敲门。', {
          6: ['The neighbour knocked about the noise. What are the quiet hours?', '邻居来敲门说太吵。安静时段是几点？'],
        }),
        V('退房', '你想知道怎么还钥匙。', {
          7: ['What do I do with the key when I leave?', '走的时候钥匙怎么处理？'],
        }),
        V('要多住一晚', '你想续住。', {
          0: ['Could I stay one more night? The booking ends tomorrow.', '能多住一晚吗？预订明天结束。'],
        }),
      ],
      phrases: [
        P('The key is in the lock box.', '钥匙在密码盒里。', 'lock box 自助入住的标准配置。'),
        P('The wifi password is on the card.', 'wifi 密码在卡片上。', '进门先解决网络。'),
        P('What are the quiet hours?', '安静时段是几点？', '住公寓式民宿必问。'),
      ],
    },

    {
      
      branches: [
        B(4, 'offer', '售票员推销一个组合票，你要判断值不值',
          S('For four pounds more you can add the tower.', '加四镑可以加塔楼。'),
          [O(S('Is the view better from the tower?', '塔楼视野更好吗？'), S('It is the only place you see the whole city.', '那是唯一能看全城的地方。')),
           O(S('Not today. We are short of time.', '今天不了。我们时间不够。'), S('Then just the museum ticket.', '那就只要博物馆票。'))]),
      ],
id: 'attraction', name: '景点买票', lv: 2, cefr: 'A2',
      roles: ['你', '售票员'],
      lines: [
        L(0, 'Two adults, please. Is there a student rate?', '两张成人票。有学生票吗？'),
        L(1, 'There is, with a student card. Eight each instead of twelve.', '有，带学生证。八块，原价十二。'),
        L(0, 'I have mine, but not my friend.', '我有，我朋友没有。'),
        L(1, 'Then one adult and one student. Twenty pounds.', '那一个成人一个学生。二十镑。'),
        L(0, 'Does that include the exhibition upstairs?', '含楼上的展览吗？'),
        L(1, 'The permanent one, yes. The temporary one is extra.', '常设展含。特展另收。'),
        L(0, 'What time does it close?', '几点关门？'),
        L(1, 'Six, and last entry is half past five.', '六点，最后入场五点半。'),
      ],
      variants: [
        { tag: '两人一学生', setting: '周末，景点门口排了二十分钟。' },
        V('家庭票', '你们一家四口。', {
          0: ['Two adults and two children. Is there a family ticket?', '两个大人两个孩子。有家庭票吗？'],
          1: ['Thirty-five for the four of you, which saves eight.', '四个人三十五，省八块。'],
        }),
        V('网上票', '你在网上买了，想问怎么进。', {
          0: ['I booked online. Do I queue here or at the other door?', '我网上订的。在这儿排还是另一个门？'],
        }),
        V('多日票', '你想连着几天看。', {
          4: ['Is there a ticket valid for two days?', '有两天的票吗？'],
          5: ['The city pass covers this and five other museums.', '城市通票含这里和另外五个博物馆。'],
        }),
        V('闭馆', '你想看的部分在维修。', {
          6: ['The east wing is closed. Do I get a discount?', '东翼关了。有折扣吗？'],
        }),
        V('导览', '你想参加讲解团。', {
          7: ['Is there a guided tour in English today?', '今天有英文讲解团吗？'],
        }),
      ],
      phrases: [
        P('Two adults, please.', '两张成人票。', '买票第一句。'),
        P('Does that include the exhibition?', '含那个展览吗？', 'include 是门票最关键的信息。'),
        P('Last entry is half past five.', '最后入场五点半。', 'last entry 不是关门时间。'),
      ],
    },

    {
      id: 'day-tour', name: '跟一日游', lv: 3, cefr: 'B1',
      roles: ['你', '导游'],
      lines: [
        L(1, 'Everyone on the bus? We leave in two minutes.', '都上车了吗？两分钟后出发。'),
        L(0, 'Excuse me, how long do we stay at the castle?', '请问城堡停多久？'),
        L(1, 'Ninety minutes. Meet back at this spot at two.', '九十分钟。两点回这儿集合。'),
        L(0, 'Is the ticket included or do we pay there?', '门票含还是现场买？'),
        L(1, 'Included. Show the sticker on your jacket.', '含。把外套上的贴纸给他们看。'),
        L(0, 'What if I want to skip the castle and walk in the village?', '如果我不进城堡，在村里走走呢？'),
        L(1, 'That is fine. Just be back at the bus at two.', '可以。两点回车上就行。'),
      ],
      variants: [
        { tag: '城堡停九十分钟', setting: '你报了个一日游，行程很满。' },
        V('迟到', '你两点十分才回来。', {
          0: ['I am sorry I am late. Did everyone wait?', '抱歉我迟到了。大家都在等吗？'],
          1: ['Ten minutes. It is fine, but do not make it a habit.', '十分钟。没事，但别成习惯。'],
        }),
        V('讲解听不懂', '导游语速太快。', {
          2: ['Sorry, could you speak a little slower? I am still learning.', '抱歉，能说慢一点吗？我还在学。'],
          3: ['Of course. I will repeat the key points at each stop.', '当然。每站我把重点重复一遍。'],
        }),
        V('洗手间', '你想知道在哪儿。', {
          4: ['Where are the toilets before we go in?', '进去之前厕所在哪儿？'],
        }),
        V('午餐', '你想知道午饭怎么安排。', {
          6: ['Is lunch included, or do we buy our own?', '午饭含吗，还是自己买？'],
        }),
        V('想脱团', '你想自己回去。', {
          7: ['Could I make my own way back and skip the last stop?', '我能自己回去，跳过最后一站吗？'],
        }),
      ],
      branches: [
        B(3, 'change', '行程临时变了，你要决定跟不跟',
          S('The castle is closed for a private event. We will swap it for the abbey.', '城堡因私人活动关闭。改成修道院。'),
          [O(S('The abbey is fine, I came for the old town anyway.', '修道院也行，我本来就想看老城。'), S('Then nobody loses. We leave in five.', '那谁都不亏。五分钟后走。')),
           O(S('I paid for the castle. Can I get a partial refund?', '我付的是城堡的钱。能部分退款吗？'), S('Ask at the office tonight, they will sort it.', '今晚去办公室问，他们会处理。'))]),
      ],
      phrases: [
        P('How long do we stay here?', '在这儿停多久？', '跟团第一问。'),
        P('Meet back at this spot at two.', '两点回这儿集合。', 'spot 是集合点。'),
        P('Is lunch included?', '含午餐吗？', '一日游的常见增项。'),
      ],
    },

    {
      
      branches: [
        B(6, 'change', '天气影响了船期，你要重新安排',
          S('The six o clock is cancelled. The sea is too rough.', '六点那班取消了。风浪太大。'),
          [O(S('Then we will take the eight tomorrow morning.', '那我们坐明早八点的。'), S('I will change the booking at no charge.', '我免费给您改签。')),
           O(S('Is there a bus from the port instead?', '码头有替代的大巴吗？'), S('There is one at seven, but it takes four hours.', '七点有一班，但要四小时。'))]),
      ],
id: 'ferry', name: '坐轮渡', lv: 2, cefr: 'A2',
      roles: ['你', '售票员'],
      lines: [
        L(0, 'Two foot passengers to the island, please.', '两张去岛上的步行乘客票。'),
        L(1, 'Returning today?', '今天回吗？'),
        L(0, 'Tomorrow afternoon. What time are the crossings?', '明天下午。几点的船？'),
        L(1, 'Every two hours until eight. The last one is at six.', '每两小时一班，到八点。最后一班六点。'),
        L(0, 'Do we need to book a seat?', '要订座吗？'),
        L(1, 'Not for foot passengers. Cars need booking.', '步行乘客不用。车要订位。'),
        L(0, 'Is the crossing rough in this weather?', '这种天气船晃吗？'),
        L(1, 'A bit. Take a tablet an hour before if you get seasick.', '有点。晕船的话提前一小时吃药。'),
      ],
      variants: [
        { tag: '两人带车', setting: '你开车上岛，后备箱塞满东西。' },
        V('开车上船', '你要带车上船。', {
          0: ['One car and two passengers, please.', '一辆车两个乘客。'],
          1: ['That has to be booked. The next space is at four.', '那要预订。下一个空位是四点。'],
        }),
        V('误船', '你没赶上六点那班。', {
          0: ['We missed the last ferry. Is there any crossing tonight?', '我们错过了末班船。今晚还有吗？'],
          1: ['Not tonight. There is one at seven tomorrow.', '今晚没有。明早七点有一班。'],
        }),
        V('宠物', '你带狗。', {
          4: ['Can I bring a dog on board?', '能带狗上船吗？'],
          5: ['On the outside deck, on a lead.', '在外甲板，要牵绳。'],
        }),
        V('改签', '你想改时间。', {
          6: ['I have a ticket for four. Can I move it to six?', '我买了四点的票。能改六点吗？'],
        }),
        V('车上船', '你想知道车怎么上。', {
          7: ['Which lane do I use for the car deck?', '车道上船走哪条道？'],
        }),
      ],
      phrases: [
        P('Two foot passengers, please.', '两张步行乘客票。', 'foot passenger 是不开车的乘客。'),
        P('What time are the crossings?', '几点的船？', 'crossing 是渡轮班次。'),
        P('Do we need to book?', '要预订吗？', '带车一定要，步行不用。'),
      ],
    },
  ],
};
