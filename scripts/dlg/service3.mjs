import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '服务',
  items: [
    {
      id: 'takeaway-missing', name: '外卖少送了', lv: 3, cefr: 'B1',
      roles: ['你', '骑手'],
      lines: [
        L(1, 'Delivery for 7421? That is you, right?', '7421 的单？是您吧？'),
        L(0, 'It is. Thanks. Wait, the bag feels light.', '是。谢谢。等一下，袋子有点轻。'),
        L(1, 'There were only two items on my list.', '我单子上只有两样。'),
        L(0, 'There should be rice and a soup as well.', '还应该有米饭和一个汤。'),
        L(1, 'The restaurant may have packed them separately.', '餐厅可能分开打包了。'),
        L(0, 'There is no second bag. Could you check with them?', '没有第二个袋子。能问一下餐厅吗？'),
        L(1, 'I will call. If they missed it, they send another rider.', '我打一下。要是漏了，他们再派一个人送。'),
        L(0, 'Please do. We have not eaten yet.', '麻烦你了。我们还没吃。'),
      ],
      variants: [
        { tag: '少了饭和汤', setting: '你等了四十分钟，打开袋子发现主食没来。' },
        V('送错单', '整袋都是别人的。', {
          1: ['This is not my order. The name on the bag is someone else.', '这不是我的单。袋子上的名字是别人。'],
          2: ['Let me look. You are right, wrong bag.', '我看一下。你说得对，拿错了。'],
          3: ['Can you bring mine back? I already paid.', '能把我那份拿回来吗？我已经付了。'],
        }),
        V('全凉了', '饭到了但是凉的。', {
          1: ['It is here, but everything is cold.', '到了，但都凉了。'],
          2: ['It waited at the restaurant for a while.', '在餐厅放了一会儿。'],
          3: ['Could I get the delivery fee back?', '配送费能退吗？'],
        }),
        V('迟到五十分钟', '你等得快要取消。', {
          1: ['You are fifty minutes late. I nearly cancelled.', '你晚了五十分钟。我差点取消。'],
          2: ['Sorry, the app sent me to the wrong street.', '抱歉，app 把我导到别的街了。'],
          3: ['It was the right street. I watched you go past twice.', '地址是对的。我看着你过去两次。'],
        }),
        V('显示送达没收到', 'app 说送到了，门口什么都没有。', {
          1: ['The app says delivered, but there is nothing at my door.', 'app 显示已送达，但门口什么都没有。'],
          2: ['I left it with a neighbour in number twelve.', '我放在十二号邻居那儿了。'],
          3: ['Nobody told me. Which neighbour?', '没人告诉我。哪个邻居？'],
        }),
      ],
      branches: [
        B(5, 'probe', '骑手把责任推给餐厅，你要把事推进',
          S('The restaurant says everything was in the bag.', '餐厅说都装进去了。'),
          [O(S('Then something came out on the way. Can you check your box?', '那可能路上掉了。你能看下车箱吗？'), S('Let me look. There is a container rolling around.', '我看一下。有个餐盒在滚。')),
           O(S('I would rather not argue. Can you ask them to resend?', '我不想争。能请他们补送吗？'), S('I will call the manager now.', '我现在打给店长。'))]),
      ],
      phrases: [
        P('The bag feels light.', '袋子有点轻。', '签收前先掂一下。'),
        P('There should be rice as well.', '还应该有米饭。', 'should be 比 is missing 更不冲。'),
        P('Could you check with them?', '能问一下他们吗？', '把责任交给骑手去核实。'),
      ],
    },

    {
      id: 'parcel-damage', name: '快递破损索赔', lv: 4, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(1, 'How can I help with the claim?', '理赔这边怎么帮您？'),
        L(0, 'The box arrived crushed and the screen is cracked.', '箱子到的时候压扁了，屏幕是裂的。'),
        L(1, 'Did anyone sign for it?', '有人签收吗？'),
        L(0, 'The driver left it at the door. No signature.', '司机放门口了。没人签。'),
        L(1, 'Do you have photos from before you opened it?', '拆箱前拍照片了吗？'),
        L(0, 'Four photos and a video of the unboxing.', '四张照片，还有一段开箱视频。'),
        L(1, 'Then I will open a damage claim now.', '那我现在提一个破损索赔。'),
        L(0, 'How much will you cover?', '你们赔多少？'),
      ],
      variants: [
        { tag: '显示器碎了', setting: '你网购的显示器到货，外箱有明显压痕。' },
        V('没保价', '你没买保价。', {
          7: ['It was not insured. What does that mean for me?', '没保价。那对我意味着什么？'],
          6: ['Then it is a fixed amount per kilo, usually below the value.', '那按公斤定额赔，通常低于货值。'],
        }),
        V('丢件', '包裹显示签收但没收到。', {
          1: ['The tracking says delivered, but nothing came.', '物流显示签收，但没收到。'],
          2: ['I will ask the driver to retrace the route today.', '我让司机今天回查路线。'],
        }),
        V('退货途中丢', '你寄回去的包裹消失了。', {
          1: ['I sent it back and the return parcel disappeared.', '我寄回去了，退件消失了。'],
          3: ['It was scanned at the depot on Monday, then nothing.', '周一在站点扫过一次，之后没了。'],
        }),
        V('延误', '晚了十天，你错过了截止。', {
          1: ['It was ten days late and I missed a deadline.', '晚了十天，我错过了截止日期。'],
        }),
        V('证据不足', '你只拍了箱子的照片。', {
          4: ['I only photographed the box, not the screen.', '我只拍了箱子，没拍屏幕。'],
          5: ['Then bring it to a depot so we can inspect it.', '那拿到站点来，我们验一下。'],
        }),
      ],
      branches: [
        B(5, 'probe', '客服质疑证据，你要补得上',
          S('Photos of the box alone do not prove it was not dropped after delivery.', '只有箱子照片，不能证明不是签收后摔的。'),
          [O(S('The video shows the seal intact before I cut it.', '视频里封条是我剪开前完好的。'), S('Then the claim should go through.', '那索赔应该能过。')),
           O(S('The driver photographed it at the door. Compare the two.', '司机在门口拍过照。对比一下就知道。'), S('I will pull his photo now.', '我现在调他的照片。'))]),
      ],
      phrases: [
        P('The box arrived crushed.', '箱子到的时候压扁了。', 'crushed 是压坏。'),
        P('A video of the unboxing.', '一段开箱视频。', '索赔最有力的证据。'),
        P('Up to the declared value.', '最高到申报价值。', '保价与赔付的关系。'),
      ],
    },

    {
      id: 'car-service', name: '汽车保养', lv: 4, cefr: 'B1',
      roles: ['你', '修车厂'],
      lines: [
        L(1, 'What can we do for you?', '有什么可以帮您？'),
        L(0, 'It is due a service, and there is a noise when I brake.', '该保养了，刹车时还有异响。'),
        L(1, 'How many miles since the last one?', '上次保养后跑了多少英里？'),
        L(0, 'About nine thousand, mostly short trips.', '大概九千，多半是短途。'),
        L(1, 'We will do the oil, filters and check the brakes.', '我们换机油、滤芯，再检查刹车。'),
        L(0, 'Call me before doing anything extra, please.', '额外项目请先打电话问我。'),
        L(1, 'Of course. Nothing goes ahead without your okay.', '当然。没您同意不动手。'),
        L(0, 'How long will it take?', '要多久？'),
      ],
      variants: [
        { tag: '九千英里保养', setting: '车开了两年，刹车有吱吱声。' },
        V('换轮胎', '前胎磨平了。', {
          1: ['The front tyres are nearly bald. Do they need changing?', '前胎快磨平了。要换吗？'],
          2: ['The tread is at two millimetres. I would change them.', '胎纹只剩两毫米。我建议换。'],
        }),
        V('故障灯', '仪表盘亮了橙灯。', {
          1: ['An orange engine light came on yesterday.', '昨天发动机故障灯亮了。'],
          2: ['We read the codes first. That is thirty.', '先读故障码。三十块。'],
        }),
        V('年检', '这个月要年检。', {
          4: ['It needs an MOT this month. Can you do both at once?', '这个月要年检。能一起做吗？'],
          5: ['Yes, and if it fails we retest for free.', '可以，没过的话免费复检。'],
        }),
        V('报价太高', '报价超出预期。', {
          6: ['That is more than I expected. Which parts are essential?', '比我预期贵。哪些是必须的？'],
        }),
        V('要代步车', '你当天要用车。', {
          7: ['Could I have a courtesy car for the day?', '今天能借辆代步车吗？'],
        }),
      ],
      branches: [
        B(5, 'cost', '修车厂加了项目，你要判断买不买',
          S('The brake pads are down to three millimetres. We recommend changing them now.', '刹车片只剩三毫米。建议现在换。'),
          [O(S('How much, and is it safe to wait a month?', '多少钱？等一个月安全吗？'), S('Ninety fitted. A month is fine at this wear.', '装好九十。这个磨损等一个月没事。')),
           O(S('Just the service today. I will book the pads later.', '今天只做保养。刹车片以后再约。'), S('I will note it on your file.', '我在您档案里记一下。'))]),
      ],
      phrases: [
        P('There is a noise when I brake.', '刹车时有异响。', '描述症状，别说「刹车坏了」。'),
        P('Call me before anything extra.', '额外项目先打电话。', '修车行最实用的一句。'),
        P('Which parts are essential?', '哪些是必须的？', '压报价的关键问法。'),
      ],
    },

    {
      id: 'bike-repair', name: '修自行车', lv: 3, cefr: 'B1',
      roles: ['你', '修车师傅'],
      lines: [
        L(1, 'What is wrong with it?', '车怎么了？'),
        L(0, 'The gears skip, and the back brake is soft.', '变速跳档，后刹很软。'),
        L(1, 'When did you last change the cables?', '上次换线是什么时候？'),
        L(0, 'Two years, maybe three. I ride it every day.', '两三年吧。我每天骑。'),
        L(1, 'Cables and pads, about forty, ready tomorrow.', '线管和刹车皮，四十左右，明天好。'),
        L(0, 'Could you check the chain as well?', '链条也帮我看一下？'),
        L(1, 'It is worn. A new one is eighteen, fitted.', '磨得挺厉害。新的连装十八。'),
        L(0, 'Do both, then. I will collect tomorrow afternoon.', '那两样都做。我明天下午来取。'),
      ],
      variants: [
        { tag: '跳档加软刹', setting: '通勤车骑了三年，最近换挡总打滑。' },
        V('爆胎', '后胎扎了。', {
          1: ['The back tyre is flat. I think I ran over glass.', '后胎没气了。可能轧到玻璃。'],
          2: ['Inner tube and labour is fifteen. I can do it while you wait.', '内胎加工时十五。等着就能好。'],
        }),
        V('轮圈变形', '撞了路沿，轮子歪了。', {
          1: ['I hit a kerb and now the wheel wobbles.', '我撞了路沿，轮子开始晃。'],
          2: ['The rim is bent. I can true it, but a new wheel is stronger.', '圈歪了。能校，但换新轮更结实。'],
        }),
        V('电助力', '电动自行车不助力了。', {
          1: ['It is an e-bike. The motor cuts out on hills.', '是电助力车。上坡时电机断。'],
        }),
        V('事故后检查', '你被车撞了，想全面检查。', {
          5: ['I was hit by a car. Could you check the frame?', '我被车撞了。能查一下车架吗？'],
          6: ['There is a dent. I would not ride it far.', '有个凹陷。我不建议骑远。'],
        }),
        V('想自己修', '你想学着自己弄。', {
          7: ['Could you show me how to change the pads myself?', '能教我自己换刹车皮吗？'],
        }),
      ],
      branches: [
        B(5, 'offer', '师傅建议你多换一样，你要判断',
          S('The rear wheel bearing is rough. Twenty more and it runs smooth.', '后轮轴承有点涩。再加二十就顺了。'),
          [O(S('Do it. I would rather not come back next month.', '做吧。我不想下个月再来。'), S('Smart. It takes ten minutes.', '明智。十分钟的事。')),
           O(S('Leave it for now. I am not sure I can feel it.', '先不管。我还不确定能不能感觉到。'), S('Fair. It will get worse slowly.', '行。它会慢慢变差。'))]),
      ],
      phrases: [
        P('The gears skip.', '变速跳档。', 'skip 是打滑跳档。'),
        P('The back brake is soft.', '后刹很软。', 'soft 指刹车手感软、不咬。'),
        P('Could you check the chain as well?', '链条也帮我看一下？', 'as well 顺带检查。'),
      ],
    },

    {
      id: 'watch-repair', name: '修表换电池', lv: 3, cefr: 'B1',
      roles: ['你', '钟表店'],
      lines: [
        L(1, 'Is it a battery or a service?', '换电池还是保养？'),
        L(0, 'It stopped two days ago. It is a quartz watch.', '两天前停了。是石英表。'),
        L(1, 'Battery is fifteen, and I can do it now.', '电池十五，现在就能换。'),
        L(0, 'Please. Could you also shorten the strap?', '好。能顺便把表带调短吗？'),
        L(1, 'Two links out, no charge.', '去掉两节，不收费。'),
        L(0, 'How long will the battery last?', '电池能用多久？'),
        L(1, 'Two to three years, depending on the model.', '两到三年，看型号。'),
        L(0, 'Good. Do you reseal it afterwards?', '好。之后会重新密封吗？'),
      ],
      variants: [
        { tag: '石英表停了', setting: '手表停在两天前，你顺手想调表带。' },
        V('机械表', '这是自动机械表。', {
          1: ['It is automatic. It loses about five minutes a week.', '是自动机械表。一周慢五分钟左右。'],
          2: ['Then it needs a service, not a battery. That is ninety.', '那要保养不是换电池。九十。'],
        }),
        V('换表带', '表带断了。', {
          0: ['The strap broke. Can you fit a new one?', '表带断了。能换一条吗？'],
          1: ['Leather is twenty-five, steel is forty.', '皮带二十五，钢带四十。'],
        }),
        V('玻璃裂了', '表镜有裂纹。', {
          3: ['There is a crack in the glass. Can it be replaced?', '表镜裂了。能换吗？'],
        }),
        V('进水', '表里有雾。', {
          1: ['There is condensation inside.', '里面有水汽。'],
          2: ['That needs a full strip down. Sixty, one week.', '那要全拆。六十，一周。'],
        }),
        V('古董表', '这是祖父留下的表。', {
          0: ['It was my grandfather. I do not want to change anything.', '这是我祖父的表。我不想改任何东西。'],
        }),
      ],
      branches: [
        B(5, 'probe', '店员问表的历史，你要说清楚',
          S('Has it ever been opened before?', '以前拆开过吗？'),
          [O(S('Once, by a shop abroad. They scratched the back.', '拆过一次，国外一家店。后盖刮花了。'), S('I will use a proper tool this time.', '这次我用专业工具。')),
           O(S('I do not know. It was a gift.', '我不知道。是别人送的。'), S('Then I will check the seal first.', '那我先检查密封。'))]),
      ],
      phrases: [
        P('It stopped two days ago.', '两天前停了。', '描述故障时间点。'),
        P('Could you shorten the strap?', '能把表带调短吗？', '调表带通常免费。'),
        P('Do you reseal it afterwards?', '之后会重新密封吗？', '换电池后的防水测试。'),
      ],
    },

    {
      id: 'appliance-install', name: '装洗衣机', lv: 4, cefr: 'B1',
      roles: ['你', '安装工'],
      lines: [
        L(1, 'Delivery and install for the washing machine?', '洗衣机送货加安装？'),
        L(0, 'Yes. It is replacing an old one, first floor, no lift.', '是。替换旧的，二楼，没电梯。'),
        L(1, 'We need to disconnect the old one. Is the valve working?', '要先拆旧的。水阀好用吗？'),
        L(0, 'It is. I turned it off yesterday and nothing leaked.', '好用。我昨天关了，没漏。'),
        L(1, 'Good. We can take the old one away for fifteen.', '好。旧机我们可以带走，十五。'),
        L(0, 'Please do. Do you need a parking space?', '那就带走。需要停车位吗？'),
        L(1, 'The van needs ten minutes. There is a bay outside?', '货车停十分钟。外面有位子吗？'),
        L(0, 'There is, but it is a loading bay until six.', '有，但六点前是卸货区。'),
      ],
      variants: [
        { tag: '换洗衣机', setting: '旧机用了十年，新机当天送到。' },
        V('装洗碗机', '厨房没有预留接口。', {
          1: ['It is a dishwasher, and there is no plumbing under the sink.', '是洗碗机，水槽下面没留接口。'],
          2: ['Then a plumber has to come first. We cannot do that.', '那得先让水管工来。这个我们做不了。'],
        }),
        V('旧机没搬走', '送货只放到门口。', {
          3: ['They left it in the hall. Nobody connected it.', '他们放在走廊就走了。没人接。'],
          4: ['That is a different job. I will book an installer.', '那是另一项。我给您约安装。'],
        }),
        V('改管', '位置要挪半米。', {
          5: ['Could you move the connection half a metre?', '能把接口挪半米吗？'],
        }),
        V('装坏了', '装完地上一滩水。', {
          1: ['It leaked on the first wash. The hose is loose.', '第一次洗就漏了。管子没接紧。'],
        }),
        V('问保修', '你想确认安装也有保修。', {
          7: ['Is the installation covered if something goes wrong?', '安装出问题有保修吗？'],
        }),
      ],
      branches: [
        B(5, 'change', '安装条件比你预期复杂，要改方案',
          S('The old machine is plumbed in with fixed copper pipe. We cannot disconnect it.', '旧机是固定铜管接的。我们拆不了。'),
          [O(S('Then leave it and fit the new one beside it?', '那别拆，把新的装在旁边？'), S('There is not enough width. You need a plumber.', '宽度不够。得找水管工。')),
           O(S('Can you come back after the plumber?', '水管工弄完你们能再来吗？'), S('We can, but there is a second call-out fee.', '可以，但要再收一次上门费。'))]),
      ],
      phrases: [
        P('It is replacing an old one.', '是替换旧的。', '安装报价要先说清新旧。'),
        P('We can take the old one away.', '旧机可以带走。', '收旧通常另收费。'),
        P('Is the installation covered?', '安装有保修吗？', '装坏了找谁，问清。'),
      ],
    },

    {
      id: 'pest-control', name: '找灭虫公司', lv: 4, cefr: 'B1',
      roles: ['你', '灭虫公司'],
      lines: [
        L(1, 'What have you seen?', '您看到了什么？'),
        L(0, 'Droppings under the sink, and something moving at night.', '水槽下面有粪便，晚上有东西在动。'),
        L(1, 'Any damage to food packaging?', '食品包装有被咬吗？'),
        L(0, 'Two bags of flour were chewed open.', '两袋面粉被咬开了。'),
        L(1, 'That sounds like mice. We can treat this week.', '听起来是老鼠。这周就能处理。'),
        L(0, 'Is it safe with a cat in the flat?', '家里有猫，安全吗？'),
        L(1, 'Traps in the kitchen, bait only in locked boxes.', '厨房用夹子，诱饵只放在锁盒里。'),
        L(0, 'How long until they are gone?', '多久能清干净？'),
      ],
      variants: [
        { tag: '厨房有老鼠', setting: '你半夜听见水槽下面有动静，面粉被咬开了。' },
        V('蟑螂', '晚上开灯看到蟑螂。', {
          1: ['I see cockroaches when I turn the kitchen light on at night.', '晚上开厨房灯能看到蟑螂。'],
          2: ['Gel treatment works best. Two visits, ten days apart.', '胶饵最有效。两次，间隔十天。'],
        }),
        V('蚂蚁', '窗台一排蚂蚁。', {
          1: ['There is a line of ants along the kitchen window.', '厨房窗台有一排蚂蚁。'],
        }),
        V('臭虫', '你怀疑床上有臭虫。', {
          1: ['I wake up with bites in a line on my arm.', '我醒来手臂上有一排咬痕。'],
          2: ['That is usually bedbugs. It needs two treatments.', '一般是臭虫。要做两次。'],
        }),
        V('房东责任', '这是租的房子。', {
          5: ['The landlord should pay for this. Can you bill them directly?', '这个该房东出钱。能直接开票给他们吗？'],
        }),
        V('问安全', '你有小孩。', {
          6: ['We have a two-year-old. How long do we stay out?', '我们有个两岁孩子。要离开多久？'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方问你环境细节，你要给准确信息',
          S('Have you seen any gaps where pipes come in?', '管道进来的地方有缝吗？'),
          [O(S('There is a gap behind the sink cabinet.', '水槽柜后面有个缝。'), S('That is the entry point. We will seal it.', '那就是入口。我们会封上。')),
           O(S('I have not looked. Should I check now?', '我没看过。现在看一下？'), S('Take a photo and send it before we come.', '来之前拍张照发我。'))]),
      ],
      phrases: [
        P('Droppings under the sink.', '水槽下面有粪便。', 'droppings 是动物粪便。'),
        P('Chewed open.', '被咬开了。', 'chewed 是啃咬。'),
        P('Is it safe with a cat?', '有猫安全吗？', '有宠物必问。'),
      ],
    },
  ],
};
