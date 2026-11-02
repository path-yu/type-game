import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '医疗',
  items: [
    {
      id: 'glasses', name: '配眼镜验光', lv: 2, cefr: 'A2',
      roles: ['你', '验光师'],
      lines: [
        L(1, 'When did you last have your eyes tested?', '上次验光是什么时候？'),
        L(0, 'Three years ago. I squint at the screen by the evening.', '三年前。到晚上看屏幕会眯眼。'),
        L(1, 'Let us check. Read the smallest line you can.', '查一下。读你能看清的最小一行。'),
        L(0, 'The fourth one. The fifth is a blur.', '第四行。第五行是糊的。'),
        L(1, 'You are slightly short-sighted, and the astigmatism has moved.', '轻度近视，散光轴位也变了。'),
        L(0, 'Do I need new glasses, or just new lenses?', '要换整副，还是只换镜片？'),
        L(1, 'New lenses in the same frame is cheaper.', '同框换镜片便宜些。'),
        L(0, 'How long will that take?', '要多久？'),
      ],
      variants: [
        { tag: '三年没验光', setting: '你晚上看屏幕总要眯眼，来配新眼镜。' },
        V('想配隐形', '你想试试隐形眼镜。', {
          1: ['I would like to try contact lenses.', '我想试试隐形眼镜。'],
          2: ['Then we need a separate fitting, and a trial pair.', '那要单独做适配，还有一副试戴。'],
        }),
        V('孩子视力', '你带孩子来查。', {
          1: ['My son is seven and sits very close to the television.', '我儿子七岁，看电视坐得很近。'],
          2: ['Children should be tested every year. Let us start today.', '孩子应该每年查。今天就开始。'],
        }),
        V('阅读镜', '你只需要看近处。', {
          5: ['I only need them for reading. Can I get cheap ones?', '我只需要看近用。能配便宜的吗？'],
          6: ['Off the shelf will do, if both eyes are the same.', '两眼度数一样的话，成品老花镜就行。'],
        }),
        V('镜片划伤', '镜片花了，框还好。', {
          0: ['The lenses are scratched but the frame is fine.', '镜片花了，镜框还好。'],
        }),
        V('问价格', '你想知道总价。', {
          7: ['What is the total with the anti-glare coating?', '加防反光镀膜一共多少？'],
        }),
      ],
      branches: [
        B(5, 'probe', '验光师建议一项附加服务，你要判断',
          S('I would add the anti-fatigue coating. It helps with screens.', '我建议加抗疲劳镀膜。对屏幕有帮助。'),
          [O(S('How much extra?', '加多少钱？'), S('Thirty. It lasts as long as the lenses.', '三十。跟镜片一样耐用。')),
           O(S('Does it actually work, or is it marketing?', '真有用还是营销？'), S('It helps some people. Not everyone notices.', '对部分人有用。不是人人有感。'))]),
      ],
      phrases: [
        P('I squint at the screen.', '我看屏幕会眯眼。', 'squint 是眯眼。'),
        P('The fifth is a blur.', '第五行是糊的。', '描述视力最直接的方式。'),
        P('New lenses in the same frame.', '同框换镜片。', '省钱的标准方案。'),
      ],
    },

    {
      id: 'checkup-report', name: '看体检报告', lv: 4, cefr: 'B1',
      roles: ['你', '医生'],
      lines: [
        L(1, 'Your results are back. Most of it is normal.', '报告出来了。大部分正常。'),
        L(0, 'Most of it? What is not?', '大部分？哪项不正常？'),
        L(1, 'Your cholesterol is a little high, and vitamin D is low.', '胆固醇偏高一点，维生素 D 偏低。'),
        L(0, 'Does that need medication?', '需要吃药吗？'),
        L(1, 'Not yet. Diet and a supplement, then we retest in three months.', '暂时不用。调整饮食加补充剂，三个月后复查。'),
        L(0, 'What should I change in my diet?', '饮食要怎么改？'),
        L(1, 'Less fried food, more fish, and twenty minutes outside a day.', '少吃油炸，多吃鱼，每天户外二十分钟。'),
        L(0, 'Can I get a copy of the numbers?', '能给我一份具体数值吗？'),
      ],
      variants: [
        { tag: '胆固醇偏高', setting: '年度体检报告出来，家庭医生约你谈。' },
        V('血糖偏高', '空腹血糖在临界值。', {
          2: ['My fasting glucose is borderline. Does that mean diabetes?', '空腹血糖在临界值。是糖尿病吗？'],
          3: ['Not yet. It is pre-diabetes, and it can be reversed.', '还不是。是糖尿病前期，可以逆转。'],
        }),
        V('甲状腺', 'TSH 偏高。', {
          2: ['The thyroid reading is high. What does that affect?', '甲状腺指标偏高。影响什么？'],
        }),
        V('贫血', '血红蛋白偏低。', {
          2: ['My iron is low. Should I take tablets?', '我铁偏低。要吃片剂吗？'],
        }),
        V('全都正常', '你想知道还要注意什么。', {
          0: ['Everything is normal? Then why am I always tired?', '都正常？那我为什么总累？'],
          1: ['Blood tests do not explain everything. How is your sleep?', '验血不能解释一切。你睡眠怎么样？'],
        }),
        V('要转诊', '医生建议看专科。', {
          7: ['Do I need a referral, or can I book directly?', '需要转诊，还是能自己约？'],
        }),
      ],
      branches: [
        B(5, 'probe', '医生问你生活习惯，你要如实答',
          S('How many units of alcohol do you drink a week?', '你一周喝多少酒？'),
          [O(S('About ten, mostly at weekends.', '大概十个单位，多在周末。'), S('That is within the limit, but it affects cholesterol.', '在建议范围内，但会影响胆固醇。')),
           O(S('Very little. Maybe twice a month.', '很少。一个月两次。'), S('Then diet is the main lever.', '那饮食是主要抓手。'))]),
      ],
      phrases: [
        P('Most of it is normal.', '大部分正常。', '医生报告的标准开场。'),
        P('Does that need medication?', '需要吃药吗？', '看报告最想问的一句。'),
        P('We retest in three months.', '三个月后复查。', 'retest 是复查。'),
      ],
    },

    {
      id: 'physio', name: '理疗第一次', lv: 4, cefr: 'B1',
      roles: ['你', '理疗师'],
      lines: [
        L(1, 'Where does it hurt?', '哪里疼？'),
        L(0, 'Lower back, mostly on the left, worse in the morning.', '下背，多偏左，早上更明显。'),
        L(1, 'How long has it been like this?', '这样多久了？'),
        L(0, 'Six weeks. It started after I moved flats.', '六周。搬完家开始的。'),
        L(1, 'Lifting boxes, probably. Let me test your range.', '大概是搬箱子。我测一下活动度。'),
        L(0, 'Will I need scans?', '需要做检查吗？'),
        L(1, 'Not yet. Six sessions of this usually settles it.', '暂时不用。一般六次治疗能缓过来。'),
        L(0, 'What can I do between sessions?', '两次之间我能做什么？'),
      ],
      variants: [
        { tag: '搬箱子闪了腰', setting: '搬完家腰疼六周，坐久了更难受。' },
        V('膝盖疼', '你跑步后膝盖疼。', {
          1: ['My knee hurts after running, on the outside.', '跑步后膝盖外侧疼。'],
          2: ['That is usually the band, not the joint. We will work on the hip.', '一般是髂胫束，不是关节。我们会练髋。'],
        }),
        V('肩膀', '你抬不起右臂。', {
          1: ['I cannot lift my right arm above the shoulder.', '我右臂抬不过肩。'],
        }),
        V('术后康复', '你做完手术。', {
          3: ['I had surgery four weeks ago. The surgeon sent me.', '四周前做了手术。外科医生让我来的。'],
        }),
        V('久坐', '你每天坐十小时。', {
          0: ['It is from sitting. Ten hours a day at a desk.', '是坐出来的。每天桌前坐十小时。'],
        }),
        V('问费用', '你想知道疗程价格。', {
          7: ['How much is a session, and can I claim it back?', '一次多少钱？能报销吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '理疗师要你做一个动作测试，你要说清感受',
          S('Bend forward slowly and tell me when it pulls.', '慢慢前弯，哪里拉紧就告诉我。'),
          [O(S('Now, on the left, just above the hip.', '现在，左边，髋部上方。'), S('That is the spot I expected.', '跟我预计的位置一致。')),
           O(S('It is more of a dull ache than a pull.', '更像是钝痛，不是拉紧。'), S('Good. That changes the exercise.', '好。那练的东西要换。'))]),
      ],
      phrases: [
        P('Worse in the morning.', '早上更明显。', '时间规律帮医生定位。'),
        P('Let me test your range.', '我测一下活动度。', 'range of motion 活动范围。'),
        P('What can I do between sessions?', '两次之间能做什么？', '康复靠自己练。'),
      ],
    },

    {
      id: 'quit-smoking', name: '戒烟咨询', lv: 4, cefr: 'B1',
      roles: ['你', '戒烟顾问'],
      lines: [
        L(1, 'How many a day?', '一天几支？'),
        L(0, 'About fifteen. More at weekends.', '十五支左右。周末更多。'),
        L(1, 'Have you tried stopping before?', '以前试过戒吗？'),
        L(0, 'Twice. I lasted a week both times.', '两次。都只撑了一周。'),
        L(1, 'Then let us plan it, not just pick a date.', '那我们来做个计划，不只是挑个日子。'),
        L(0, 'What does the plan involve?', '计划包括什么？'),
        L(1, 'Patches, a quit date in two weeks, and someone to call.', '贴片、两周后的戒烟日，还有一个能打电话的人。'),
        L(0, 'Can I still come to you if I slip?', '如果我破戒了还能来找你吗？'),
      ],
      variants: [
        { tag: '一天十五支', setting: '你咳嗽了两个月，决定戒烟。' },
        V('电子烟', '你在用电子烟过渡。', {
          0: ['I switched to vaping. Is that better or just different?', '我换成电子烟了。是更好还是只是换了个方式？'],
          1: ['Better, but the goal is still to stop nicotine.', '好一些，但目标还是戒掉尼古丁。'],
        }),
        V('家人也抽', '你伴侣也抽烟。', {
          3: ['My partner smokes too. It is hard to stop alone.', '我伴侣也抽。一个人戒很难。'],
          4: ['Bring them to the next session. Couples do better.', '下次带他来。一起戒的成功率高。'],
        }),
        V('压力大', '你怕戒烟后更焦虑。', {
          5: ['I am worried I will be unbearable at work.', '我怕上班时变得很难相处。'],
        }),
        V('减量', '你不想一次戒断。', {
          6: ['Could I cut down first instead of stopping?', '能先减量而不是直接戒吗？'],
        }),
        V('孕期', '你怀孕了。', {
          1: ['I am pregnant. Is the patch safe?', '我怀孕了。贴片安全吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '顾问问你复吸的触发点，你要具体',
          S('What was happening when you started again last time?', '上次复吸时是什么情况？'),
          [O(S('A work deadline. I bought a pack at midnight.', '工作截止。半夜买了一包。'), S('Then we plan for that night, not just the day.', '那我们针对那个晚上做准备。')),
           O(S('Drinking with friends.', '跟朋友喝酒。'), S('We will talk about the first month of that.', '我们聊聊头一个月怎么应付。'))]),
      ],
      phrases: [
        P('I lasted a week.', '我撑了一周。', 'last 在这里是「维持」。'),
        P('Let us plan it, not just pick a date.', '我们做计划，不只是挑日子。', '戒烟成功率的关键。'),
        P('If I slip.', '如果我破戒。', 'slip 是偶尔破戒，不是失败。'),
      ],
    },

    {
      
      branches: [
        B(5, 'probe', '护士做接种前筛查，你要如实答',
          S('Any fever or infection in the last week?', '最近一周有发烧或感染吗？'),
          [O(S('I had a cold last week but it has gone.', '上周感冒，已经好了。'), S('Then we can go ahead today.', '那今天可以打。')),
           O(S('I still have a sore throat.', '我嗓子还疼。'), S('Let us wait until that settles.', '等它好了再来。'))]),
      ],
id: 'vaccine', name: '打疫苗', lv: 2, cefr: 'A2',
      roles: ['你', '护士'],
      lines: [
        L(1, 'Which one are you here for?', '今天打哪种？'),
        L(0, 'The flu jab. I get it every year.', '流感疫苗。我每年都打。'),
        L(1, 'Any reaction last time?', '上次有反应吗？'),
        L(0, 'A sore arm for a day, nothing else.', '胳膊疼了一天，别的没有。'),
        L(1, 'Good. Are you on any medication?', '好。在吃什么药吗？'),
        L(0, 'Just blood pressure tablets.', '只有降压药。'),
        L(1, 'That is fine. Which arm do you write with?', '没问题。你哪只手写字？'),
        L(0, 'The right. Use the left, then.', '右手。那打左边吧。'),
      ],
      variants: [
        { tag: '年度流感疫苗', setting: '十月，诊所门口贴着打流感疫苗的通知。' },
        V('旅行疫苗', '你要去热带。', {
          0: ['I am travelling to Thailand. Which jabs do I need?', '我要去泰国。需要打哪些疫苗？'],
          1: ['Hepatitis A and typhoid. Come back in six weeks for the second.', '甲肝和伤寒。六周后来打第二针。'],
        }),
        V('儿童疫苗', '你带孩子来补种。', {
          0: ['He missed his pre-school booster. Can he have it now?', '他错过了入园加强针。现在能补吗？'],
        }),
        V('过敏', '你对鸡蛋过敏。', {
          4: ['I am allergic to eggs. Does that matter for this one?', '我对鸡蛋过敏。这个有影响吗？'],
          5: ['Not for this vaccine. It is grown differently now.', '这个不影响。现在的工艺不一样了。'],
        }),
        V('记录', '你要接种记录。', {
          7: ['Could you write it in my vaccination record?', '能写进我的接种记录本吗？'],
        }),
        V('晕针', '你怕打针。', {
          6: ['I faint with needles. Can I lie down?', '我见针会晕。能躺着打吗？'],
        }),
      ],
      phrases: [
        P('Any reaction last time?', '上次有反应吗？', '打疫苗必被问。'),
        P('Which arm do you write with?', '你哪只手写字？', '护士借此选非惯用臂。'),
        P('A sore arm for a day.', '胳膊疼了一天。', '最常见的接种反应。'),
      ],
    },

    {
      id: 'blood-donate', name: '第一次献血', lv: 3, cefr: 'B1',
      roles: ['你', '护士'],
      lines: [
        L(1, 'First time donating?', '第一次献血？'),
        L(0, 'Yes. I am a bit nervous about the needle.', '是。针头有点怕。'),
        L(1, 'Most people are. Have you eaten today?', '多数人都怕。今天吃东西了吗？'),
        L(0, 'A light breakfast, about three hours ago.', '吃了点早饭，大概三小时前。'),
        L(1, 'Good. Have some water and sit here.', '好。喝点水，坐这儿。'),
        L(0, 'How long does it take?', '要多久？'),
        L(1, 'Ten minutes for the donation, twenty resting after.', '采血十分钟，之后休息二十分钟。'),
        L(0, 'Can I drive home afterwards?', '之后能开车回家吗？'),
      ],
      variants: [
        { tag: '第一次献血', setting: '献血车停在公司楼下，你中午下来了。' },
        V('体重不够', '你偏瘦。', {
          3: ['I am quite light. Does that matter?', '我比较瘦。有影响吗？'],
          4: ['The minimum is fifty kilos. Let me weigh you.', '最低五十公斤。我称一下。'],
        }),
        V('吃药', '你在服抗生素。', {
          5: ['I finished antibiotics four days ago. Am I allowed?', '我四天前停的抗生素。可以献吗？'],
        }),
        V('间隔', '你三个月前刚献过。', {
          6: ['I donated three months ago. Is that too soon?', '我三个月前献过。太近了吗？'],
        }),
        V('献血证', '你想要记录。', {
          7: ['Do I get a card with my blood type?', '会给我一张写血型的卡吗？'],
        }),
        V('之后头晕', '你拔针后有点晕。', {
          0: ['I feel light-headed. Should I lie down?', '我有点头轻。要躺下吗？'],
          1: ['Yes, feet up. It passes in a few minutes.', '躺下，脚抬高。几分钟就好。'],
        }),
      ],
      branches: [
        B(5, 'probe', '护士做筛查问话，你要如实答',
          S('Have you had a tattoo or piercing in the last four months?', '最近四个月有纹身或穿孔吗？'),
          [O(S('A piercing in June, so four months ago exactly.', '六月打了个洞，正好四个月。'), S('Then we wait a week to be safe.', '那安全起见再等一周。')),
           O(S('No, neither.', '没有，都没有。'), S('Good. Let us get you set up.', '好。给你安排上。'))]),
      ],
      phrases: [
        P('First time donating?', '第一次献？', 'donate 是献血。'),
        P('I feel light-headed.', '我有点头轻。', '献血后最常见的不适。'),
        P('The minimum is fifty kilos.', '最低五十公斤。', '献血体重要求。'),
      ],
    },

    {
      id: 'braces', name: '咨询牙齿矫正', lv: 5, cefr: 'B2',
      roles: ['你', '正畸医生'],
      lines: [
        L(1, 'Have you seen an orthodontist before?', '以前看过正畸医生吗？'),
        L(0, 'No. My front teeth overlap and it is getting worse.', '没有。我门牙重叠，越来越明显。'),
        L(1, 'How old are you? Adults take longer than teenagers.', '你多大？成人比青少年慢。'),
        L(0, 'Thirty-two. I wish I had done it earlier.', '三十二。我后悔没早点做。'),
        L(1, 'Clear braces would take about eighteen months.', '隐形牙套大概十八个月。'),
        L(0, 'What does that cost, roughly?', '大概多少钱？'),
        L(1, 'Three thousand, paid monthly.', '三千，可以按月付。'),
        L(0, 'Is there anything cheaper?', '有便宜点的吗？'),
      ],
      variants: [
        { tag: '成人门牙重叠', setting: '你三十二岁，门牙越来越挤，笑起来不敢露齿。' },
        V('孩子矫正', '你带孩子来。', {
          1: ['It is for my daughter. She is eleven.', '是给我女儿看。她十一岁。'],
          2: ['That is the right age. The jaw is still growing.', '这个年龄正合适。颌骨还在长。'],
        }),
        V('金属托槽', '你想选最便宜的。', {
          7: ['The metal ones are cheaper, right? How visible are they?', '金属的便宜些吧？明显吗？'],
        }),
        V('保持器', '你以前做过矫正。', {
          3: ['I had braces as a teenager and did not wear the retainer.', '我十几岁戴过牙套，没好好戴保持器。'],
        }),
        V('拔牙', '医生说可能要拔牙。', {
          4: ['Would I need teeth out? That worries me.', '要拔牙吗？这个我担心。'],
          5: ['Possibly two. We decide after the scan.', '可能要拔两颗。扫描后再定。'],
        }),
        V('保险', '你想知道能不能报。', {
          6: ['Does dental insurance cover orthodontics for adults?', '牙科保险报成人正畸吗？'],
        }),
      ],
      branches: [
        B(5, 'cost', '医生给了方案和价格，你要判断承受力',
          S('Three thousand, or two thousand two hundred for metal braces.', '三千，金属托槽两千二。'),
          [O(S('What do the extra eight hundred actually buy?', '多出的八百买的是什么？'), S('Discretion and fewer visits. That is mostly it.', '隐蔽性和复诊次数少。基本就这些。')),
           O(S('Can I start with a deposit and pay monthly?', '能先付定金再按月付吗？'), S('Yes, over eighteen months.', '可以，分十八个月。'))]),
      ],
      phrases: [
        P('My front teeth overlap.', '我门牙重叠。', 'overlap 是重叠。'),
        P('Paid monthly.', '可以按月付。', '大额治疗的分期方式。'),
        P('What do the extra eight hundred buy?', '多出的钱买什么？', '问加价的实际价值。'),
      ],
    },

    {
      id: 'hearing', name: '听力检查', lv: 4, cefr: 'B1',
      roles: ['你', '听力师'],
      lines: [
        L(1, 'Which ear is worse?', '哪只耳朵差一些？'),
        L(0, 'The left. I keep asking people to repeat themselves.', '左边。我总让别人重复。'),
        L(1, 'Any ringing?', '有耳鸣吗？'),
        L(0, 'A high tone at night, mostly when it is quiet.', '晚上有高音，安静的时候明显。'),
        L(1, 'Let us do a hearing test. It takes twenty minutes.', '做个听力测试。二十分钟。'),
        L(0, 'If I need hearing aids, are they covered?', '如果需要助听器，能报吗？'),
        L(1, 'Partially, through the health service. Private ones cost more.', '公立的能报一部分。自费更贵。'),
        L(0, 'How long do the batteries last?', '电池能用多久？'),
      ],
      variants: [
        { tag: '左耳听不清', setting: '你开会总听漏，家人说你电视开太响。' },
        V('耳鸣', '你耳鸣三个月。', {
          3: ['The ringing started three months ago and never stops.', '耳鸣三个月了，一直没停。'],
          4: ['We should check for wax and for noise damage.', '要查耳垢和噪声损伤。'],
        }),
        V('孩子', '你怀疑孩子听力。', {
          0: ['My son does not respond when I call from another room.', '我在另一个房间叫他，他没反应。'],
        }),
        V('助听器', '你想试戴。', {
          6: ['Could I try a pair before buying?', '买之前能试戴吗？'],
        }),
        V('噪声', '你在工厂工作。', {
          1: ['I work in a factory. It has been getting worse for years.', '我在工厂工作。这几年越来越差。'],
        }),
        V('耳垢', '你耳朵堵。', {
          2: ['My ear feels blocked. Is it wax?', '耳朵感觉堵。是耳垢吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '听力师问你的日常影响，你要给具体场景',
          S('Does it affect you at work or only at home?', '影响工作还是只在家里？'),
          [O(S('Meetings. I nod and hope I heard it right.', '开会。我点头，希望自己听对了。'), S('That is exactly what we need to fix first.', '这正是我们首先该解决的。')),
           O(S('Mostly television and restaurants.', '主要是电视和餐厅。'), S('Restaurants are the hardest for everyone.', '餐厅对所有人都是最难的。'))]),
      ],
      phrases: [
        P('I keep asking people to repeat.', '我总让别人重复。', '听力下降最典型的表现。'),
        P('Any ringing?', '有耳鸣吗？', 'ringing 是耳鸣。'),
        P('Are they covered?', '能报销吗？', '助听器价格差异极大。'),
      ],
    },
  ],
};
