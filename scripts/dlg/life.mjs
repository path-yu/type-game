import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '生活',
  items: [
    {
      id: 'vet', name: '带猫看兽医', lv: 4, cefr: 'B1',
      roles: ['你', '兽医'],
      lines: [
        L(1, 'What seems to be the problem with her?', '她怎么了？'),
        L(0, 'She has not eaten for two days and is hiding under the bed.', '她两天没吃东西，躲在床底下。'),
        L(1, 'Any vomiting or change in the litter tray?', '有呕吐吗？猫砂盆里的情况有变化吗？'),
        L(0, 'She drank a lot of water yesterday.', '昨天喝了很多水。'),
        L(1, 'That can point to the kidneys. We should run blood tests.', '这可能指向肾脏。应该验血。'),
        L(0, 'How much will the tests cost?', '化验多少钱？'),
        L(1, 'About a hundred and forty, results tomorrow.', '大概一百四，明天出结果。'),
        L(0, 'Please do it. She is insured, so I will claim it back.', '那就做。她有保险，我事后报。'),
      ],
      variants: [
        { tag: '猫不吃东西', setting: '你的猫两天没进食，躲在床底下不出来。' },
        V('狗腿瘸了', '你的狗走路一瘸一拐。', {
          1: ['He is limping on the back leg and will not put weight on it.', '他后腿瘸了，不敢落地。'],
          2: ['Did he jump or fall?', '他跳下来过或者摔过吗？'],
        }),
        V('打疫苗', '你带幼犬来打疫苗。', {
          1: ['He is here for his second set of vaccinations.', '他来打第二针疫苗。'],
          2: ['Any reaction after the first one?', '第一针之后有反应吗？'],
        }),
        V('绝育', '你要给猫做绝育。', {
          1: ['I would like to book her in for neutering.', '我想给她约绝育手术。'],
        }),
        V('急诊', '宠物被车撞了。', {
          1: ['He was hit by a car. He is breathing but cannot stand.', '他被车撞了。还有呼吸，但站不起来。'],
        }),
        V('问费用', '你最关心价格。', {
          5: ['What is the total likely to be, including treatment?', '连治疗大概一共多少？'],
        }),
        V('问保险', '你想确认保险能报。', {
          7: ['Will you fill in the insurance form for me?', '能帮我填保险单吗？'],
        }),
      ],
      branches: [
        B(3, 'probe', '兽医提出要加一项检查，你要决定做不做',
          S('I would also like to scan her, just in case there is a blockage.', '我还想给她做个扫描，以防有阻塞。'),
          [O(S('If it changes the treatment, do it.', '如果会改变治疗方案，那就做。'), S('It would, in about one case in ten.', '一成的情况下会。')),
           O(S('Let us start with the blood tests only.', '先只做验血。'), S('Sensible. We can scan later if needed.', '稳妥。需要再扫。'))]),
      ],
      phrases: [
        P('She has not eaten for two days.', '她两天没吃东西。', '宠物问诊先说进食和饮水。'),
        P('Any vomiting or change in the litter tray?', '有呕吐或猫砂盆变化吗？', '兽医的黑话，听懂能省一轮问答。'),
        P('She is insured, so I will claim it back.', '她有保险，我事后报。', 'claim back 是事后报销。'),
      ],
    },

    {
      
      branches: [
        B(4, 'cost', '报价之外还有一笔费用，你要判断要不要',
          S('Saturday drop-off is fifteen extra, for the weekend staff.', '周六送是加十五，算周末人手费。'),
          [O(S('Then I will drop him Friday evening.', '那我周五晚上送来。'), S('Friday is quiet. He will settle faster.', '周五人少。他能适应得快些。')),
           O(S('Fifteen for a drop-off seems steep.', '送一趟加十五有点贵。'), S('It is the weekend rate. Friday is free.', '这是周末价。周五不收。'))]),
      ],
id: 'pet-boarding', name: '宠物寄养', lv: 3, cefr: 'B1',
      roles: ['你', '寄养店'],
      lines: [
        L(0, 'I need someone to look after my dog for ten days.', '我需要有人帮我看十天狗。'),
        L(1, 'Is he good with other dogs?', '他和其他狗相处得好吗？'),
        L(0, 'Mostly. He is nervous around big ones.', '基本可以。遇到大狗会紧张。'),
        L(1, 'Then he would do better in a home, not a kennel.', '那家庭寄养比犬舍更合适。'),
        L(0, 'How much is that?', '多少钱？'),
        L(1, 'Twenty-two a night, food included.', '一晚二十二，含狗粮。'),
        L(0, 'What if he needs a vet while I am away?', '如果我不在时他需要看医生呢？'),
        L(1, 'We use your vet, and we call you first.', '我们找你常去的兽医，先给你打电话。'),
      ],
      variants: [
        { tag: '出差十天寄养', setting: '你要出差十天，狗的寄养还没定。' },
        V('猫', '你要寄养猫。', {
          0: ['It is a cat. She hates travelling.', '是一只猫。她讨厌坐车。'],
          1: ['Then a sitter at your home is better. Twenty-five a visit.', '那上门喂养更合适。一次二十五。'],
        }),
        V('短期', '只要两天。', {
          0: ['Just two nights, Friday to Sunday.', '只要两晚，周五到周日。'],
        }),
        V('特殊饮食', '狗要吃处方粮。', {
          3: ['He is on a prescription diet. Can you handle that?', '他吃处方粮。你们能处理吗？'],
        }),
        V('疫苗要求', '你想知道要带什么证明。', {
          4: ['Do you need his vaccination record?', '需要疫苗记录吗？'],
        }),
        V('看环境', '你想先参观。', {
          6: ['Could I visit before I decide?', '决定前能来看看吗？'],
        }),
        V('取消', '行程变了。', {
          7: ['If my trip is cancelled, what is the cancellation policy?', '如果行程取消，退订政策是什么？'],
        }),
      ],
      phrases: [
        P('He is nervous around big dogs.', '他遇到大狗会紧张。', '描述性格比说 he is good 更有用。'),
        P('Twenty-two a night, food included.', '一晚二十二，含狗粮。', '寄养按夜计价。'),
        P('What is the cancellation policy?', '退订政策是什么？', '行程变动前问清。'),
      ],
    },

    {
      id: 'school-meeting', name: '家长会', lv: 4, cefr: 'B1',
      roles: ['你', '老师'],
      lines: [
        L(1, 'Thanks for coming. He is doing well in most subjects.', '谢谢您来。他大部分科目都不错。'),
        L(0, 'That is good to hear. Is there anything I should worry about?', '听着不错。有什么我该担心的吗？'),
        L(1, 'His reading is strong, but he avoids writing tasks.', '他阅读很强，但总躲着写作。'),
        L(0, 'At home he says he does not know what to write.', '在家他说不知道写什么。'),
        L(1, 'That is common. We are trying a five-minute free write each morning.', '这很常见。我们每天早上试五分钟自由写作。'),
        L(0, 'Should we do the same at home?', '我们在家也这样吗？'),
        L(1, 'Ten minutes after dinner, no corrections. Just keep the pen moving.', '晚饭后十分钟，不要改错。让笔一直动。'),
        L(0, 'I can do that. How will we know it is working?', '可以。怎么知道有没有效？'),
      ],
      variants: [
        { tag: '阅读强写作弱', setting: '学期中家长会，十五分钟一位家长。' },
        V('上课走神', '老师说他上课注意力不集中。', {
          2: ['I have noticed he loses focus after twenty minutes.', '我发现他二十分钟后就走神。'],
          3: ['He says the class is too easy in the first half.', '他说前半节课太简单。'],
        }),
        V('被欺负', '孩子在学校被同学欺负。', {
          1: ['He came home with a torn jacket and would not say why.', '他回家时外套被撕了，不肯说原因。'],
          2: ['Thank you for telling me. I will speak to the other children tomorrow.', '谢谢您告诉我。我明天找那几个孩子谈。'],
        }),
        V('成绩下滑', '数学成绩掉了。', {
          1: ['His maths has dropped since the new topic started.', '换了新单元之后他数学成绩掉了。'],
        }),
        V('想换班', '你考虑换班。', {
          5: ['Would a different class suit him better?', '换个班会不会更适合他？'],
        }),
        V('问作业量', '你觉得作业太多。', {
          4: ['He spends an hour and a half on homework. Is that expected?', '他每天写一个半小时作业。这是正常的吗？'],
        }),
        V('英文不好', '你担心孩子的英语。', {
          7: ['We speak another language at home. Does that slow him down?', '我们在家说另一种语言。会拖慢他吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '老师给了一个家庭任务，你要问清怎么做',
          S('Ten minutes after dinner, no corrections. Just keep the pen moving.', '晚饭后十分钟，不要改错，让笔一直动。'),
          [O(S('What if he writes the same sentence five times?', '如果他同一句写五遍呢？'), S('Let him. Fluency comes before variety.', '随他。先流畅，再谈变化。')),
           O(S('Should I read it afterwards?', '之后我要看吗？'), S('Only if he offers. Do not turn it into marking.', '他主动给你看才看。别变成批改。'))]),
      ],
      phrases: [
        P('Is there anything I should worry about?', '有什么我该担心的吗？', '家长会最有用的一个问题。'),
        P('He avoids writing tasks.', '他躲着写作任务。', 'avoid 比 does not like 更准确。'),
        P('Fluency comes before variety.', '先流畅，再谈变化。', '语言学习的次序，家长也该懂。'),
      ],
    },

    {
      
      branches: [
        B(4, 'probe', '对方问一个你需要现场决定的问题',
          S('If the little one will not settle, should I let her stay up?', '小的要是不肯睡，能让她晚点睡吗？'),
          [O(S('Try for twenty minutes, then let her read in bed.', '试二十分钟，不行就让她在床上看书。'), S('That usually works with her.', '她一般吃这套。')),
           O(S('Do not let her skip the nap routine. It ruins the next day.', '别跳过睡前流程。第二天就乱了。'), S('Understood. Same order every time.', '明白。每次顺序一样。'))]),
      ],
id: 'babysitter', name: '找临时保姆', lv: 3, cefr: 'B1',
      roles: ['你', '保姆'],
      lines: [
        L(0, 'We need someone for Saturday evening, about four hours.', '我们周六晚上需要人，大约四小时。'),
        L(1, 'How old are the children?', '孩子多大？'),
        L(0, 'Six and three. The little one goes to bed at seven.', '六岁和三岁。小的七点睡。'),
        L(1, 'Any allergies or medication?', '有过敏或要吃药的吗？'),
        L(0, 'No allergies. The older one has an inhaler in the kitchen drawer.', '没有过敏。大的吸入器在厨房抽屉里。'),
        L(1, 'Good. Do you have a number I can reach you on?', '好。有能联系到您的电话吗？'),
        L(0, 'Both of us will have our phones on.', '我们俩都会开机。'),
        L(1, 'Fifteen an hour, and I will need a taxi home after ten.', '一小时十五，十点后回家要打车。'),
      ],
      variants: [
        { tag: '周六晚上四小时', setting: '你要去参加一个婚礼，两个孩子没人看。' },
        V('第一次请', '你没请过保姆，想先见一面。', {
          0: ['We have never used a sitter. Could we meet first?', '我们没请过保姆。能先见一面吗？'],
          1: ['Of course. Coffee with the children there is best.', '当然。最好孩子们在场，喝杯咖啡。'],
        }),
        V('过夜', '你要出去一整天。', {
          0: ['It is a full day, eight in the morning to six.', '是一整天，早上八点到下午六点。'],
        }),
        V('紧急情况', '你临时有事。', {
          4: ['Could you come tonight? It is short notice, I know.', '今晚能来吗？我知道很临时。'],
        }),
        V('问急救', '你想确认对方会处理突发。', {
          6: ['Are you trained in first aid?', '你受过急救培训吗？'],
        }),
        V('做饭', '你想让对方做晚饭。', {
          7: ['Could you do their dinner? Pasta is fine.', '能给她们做晚饭吗？意面就行。'],
        }),
        V('付钱', '你想确认怎么付。', {
          6: ['Do you prefer cash or a transfer at the end?', '你要现金还是结束时转账？'],
        }),
      ],
      phrases: [
        P('Do you have a number I can reach you on?', '有能联系到您的电话吗？', 'reach someone on a number 是固定说法。'),
        P('The little one goes to bed at seven.', '小的七点睡。', '交代作息比交代性格更实用。'),
        P('Are you trained in first aid?', '你受过急救培训吗？', '找人看孩子必问。'),
      ],
    },

    {
      id: 'swim-class', name: '报游泳课', lv: 3, cefr: 'B1',
      roles: ['你', '前台'],
      lines: [
        L(0, 'I would like to join the adult beginners class.', '我想报成人初级班。'),
        L(1, 'Can you swim at all?', '你会游泳吗？'),
        L(0, 'Not really. I can float but I panic in deep water.', '不太会。能漂，但深水会慌。'),
        L(1, 'Then beginners is right. It runs twice a week for eight weeks.', '那初级班合适。一周两次，八周。'),
        L(0, 'How many people in a class?', '一个班多少人？'),
        L(1, 'Six, with one teacher and one assistant.', '六个，一个教练一个助教。'),
        L(0, 'Do I need to bring anything?', '要带什么吗？'),
        L(1, 'Just a costume, a towel and a lock for the locker.', '泳衣、毛巾，还有锁柜子的锁。'),
      ],
      variants: [
        { tag: '成人零基础', setting: '你三十岁，小时候没学过游泳。' },
        V('带孩子报名', '你要给孩子报班。', {
          0: ['I am asking for my daughter. She is seven and cannot swim.', '我是给女儿问的。她七岁，不会游。'],
          1: ['Children start at five. The Saturday class has space.', '五岁就能报。周六班还有位子。'],
        }),
        V('提高班', '你会游，但想改动作。', {
          0: ['I can swim, but my freestyle is inefficient. Is there a stroke class?', '我会游，但自由泳效率低。有技术课吗？'],
        }),
        V('怕水', '你一下水就紧张。', {
          3: ['I panic as soon as my feet leave the bottom.', '脚一离地我就慌。'],
          4: ['We start in the shallow end with a pole. Nobody is thrown in.', '我们从浅水区带浮杆开始。不会有人把你扔进去。'],
        }),
        V('问退款', '你想先确认能不能退。', {
          6: ['What happens if I miss sessions or want to stop?', '缺课或者想停怎么办？'],
        }),
        V('时间', '你只有周末有空。', {
          5: ['Are there weekend classes? Weekdays are impossible for me.', '有周末班吗？工作日我不行。'],
        }),
        V('体检', '你有肩伤。', {
          7: ['I have a shoulder injury. Should I check with a doctor first?', '我肩膀有旧伤。要先问医生吗？'],
        }),
      ],
      branches: [
        B(4, 'probe', '前台问你的水性，你要如实说',
          S('Can you put your face in the water without panicking?', '你能把脸放进水里不慌吗？'),
          [O(S('Not yet. That is the part I want to fix.', '还不行。这正是我想解决的。'), S('Then we start there, in the shallow end.', '那从这儿开始，浅水区。')),
           O(S('I can, but I hold my nose.', '可以，但我得捏鼻子。'), S('We will teach you to breathe out slowly.', '我们会教你慢慢呼气。'))]),
      ],
      phrases: [
        P('I can float but I panic in deep water.', '能漂，但深水会慌。', '描述水性比说 I cannot swim 准。'),
        P('How many people in a class?', '一个班多少人？', '报课必问，人多学不会。'),
        P('Do I need to bring anything?', '要带什么吗？', '第一次上课前问。'),
      ],
    },

    {
      
      branches: [
        B(4, 'change', '付款方式有限制，你要换个办法',
          S('The online payment is down. You can pay at the desk.', '线上支付挂了。可以到前台付。'),
          [O(S('Then I will come early and pay in person.', '那我早点来现场付。'), S('I will hold it until six.', '我给您留到六点。')),
           O(S('Can I transfer the money and send you the screenshot?', '我能转账把截图发你们吗？'), S('That works today. Not usually.', '今天可以。平时不行。'))]),
      ],
id: 'court-booking', name: '订球场', lv: 3, cefr: 'B1',
      roles: ['你', '场馆'],
      lines: [
        L(0, 'Do you have a badminton court free on Thursday evening?', '周四晚上有羽毛球场地吗？'),
        L(1, 'Seven to eight is taken. Eight to nine is free.', '七点到八点满了。八点到九点空着。'),
        L(0, 'I will take eight to nine. How much is it?', '那我要八点到九点。多少钱？'),
        L(1, 'Twelve an hour, and we need a deposit for regular bookings.', '一小时十二，长期订要押金。'),
        L(0, 'Just this once for now. Can I pay online?', '先订这一次。能网上付吗？'),
        L(1, 'You can. Booking is confirmed when it is paid.', '可以。付款后预订才生效。'),
        L(0, 'Do you rent rackets?', '租球拍吗？'),
        L(1, 'Two pounds each. Shuttlecocks are three for a tube.', '一副两块。球一筒三个。'),
      ],
      variants: [
        { tag: '订周四羽毛球', setting: '你和同事约了四个人打球，场地还没定。' },
        V('长期订场', '你想每周固定。', {
          0: ['Could I book the same slot every Thursday for three months?', '能每周四同一时段订三个月吗？'],
          1: ['We can hold it, with a deposit of forty.', '可以留位，押金四十。'],
        }),
        V('取消', '你们临时取消。', {
          6: ['Can I cancel and get the money back?', '能取消退款吗？'],
        }),
        V('换项目', '你们想打篮球。', {
          0: ['Is the sports hall free for basketball on Saturday?', '周六体育馆能打篮球吗？'],
        }),
        V('人数', '你们来了六个人。', {
          3: ['There are six of us. Is one court enough?', '我们有六个人。一个场地够吗？'],
        }),
        V('设备', '场地灯光太暗。', {
          7: ['The lights on court three are dim. Could someone look at them?', '三号场的灯很暗。能有人看看吗？'],
        }),
        V('发票', '你要开票报销。', {
          5: ['Could I get a receipt in the company name?', '能开公司抬头的收据吗？'],
        }),
      ],
      phrases: [
        P('Do you have a court free on Thursday?', '周四有场地吗？', '换掉 court 就能问任何场地。'),
        P('Booking is confirmed when it is paid.', '付款后预订才生效。', '没付钱不算订上。'),
        P('Could I get a receipt in the company name?', '能开公司抬头的收据吗？', '团建报销常用。'),
      ],
    },

    {
      id: 'it-support', name: '找 IT 修电脑', lv: 4, cefr: 'B1',
      roles: ['你', 'IT 支持'],
      lines: [
        L(0, 'My laptop will not connect to the office wifi since this morning.', '我的笔记本今早开始连不上办公室 wifi。'),
        L(1, 'Does it connect anywhere else?', '别的地方能连吗？'),
        L(0, 'At home it works fine. Two colleagues on this floor have the same problem.', '在家没问题。这层楼有两个同事也一样。'),
        L(1, 'Then it is the access point, not your machine.', '那是接入点的问题，不是你的机器。'),
        L(0, 'Should I log a ticket?', '我要提工单吗？'),
        L(1, 'I will log one and copy your manager.', '我提一个，抄送你经理。'),
        L(0, 'How long until it is fixed?', '多久能好？'),
        L(1, 'The replacement arrives this afternoon. Use the meeting room wifi until then.', '替换件下午到。这之前用会议室的 wifi。'),
      ],
      variants: [
        { tag: '连不上公司 wifi', setting: '早上九点，三个人的电脑同时连不上网。' },
        V('电脑很慢', '开机要五分钟。', {
          0: ['It takes five minutes to boot and the fan never stops.', '开机要五分钟，风扇一直转。'],
          1: ['Sounds like the disk. I will check the health report.', '像是硬盘问题。我看下健康报告。'],
        }),
        V('打印机', '打印机连不上。', {
          0: ['The printer on the third floor is offline again.', '三楼打印机又离线了。'],
        }),
        V('忘记密码', '你被锁在系统外。', {
          0: ['I am locked out of my account after three wrong passwords.', '我输错三次密码被锁了。'],
          1: ['I will reset it. You will get a link in a minute.', '我重置。一分钟内你会收到链接。'],
        }),
        V('数据恢复', '你的文件丢了。', {
          0: ['A folder disappeared from my desktop. Is there a backup?', '桌面上一个文件夹不见了。有备份吗？'],
        }),
        V('新设备', '你要申请一台新电脑。', {
          5: ['What is the process for a replacement laptop?', '换笔记本要走什么流程？'],
        }),
        V('安全', '你收到可疑邮件。', {
          6: ['I got an email asking me to confirm my password. Is it real?', '我收到一封要我确认密码的邮件。是真的吗？'],
        }),
      ],
      branches: [
        B(4, 'probe', '对方要你提供信息，你要判断哪些能给',
          S('Send me your password so I can log in and test it.', '把密码发我，我登进去测一下。'),
          [O(S('I would rather not. Can you reset it instead?', '我不太想。能重置吗？'), S('Fair. I will send a reset link.', '合理。我发重置链接。')),
           O(S('Our policy says never share it. Can you use remote access?', '公司规定不能给。你能远程接入吗？'), S('Good answer. I will use the admin console.', '答得好。我用管理后台。'))]),
      ],
      phrases: [
        P('It will not connect since this morning.', '今早开始连不上。', '说时间点，排除偶发。'),
        P('Should I log a ticket?', '我要提工单吗？', 'log a ticket 是提工单。'),
        P('Is there a backup?', '有备份吗？', '数据丢了第一句。'),
      ],
    },

    {
      id: 'account-security', name: '账号被盗', lv: 4, cefr: 'B1',
      roles: ['你', '平台客服'],
      lines: [
        L(0, 'Someone has changed my password and I cannot get back in.', '有人改了我的密码，我登不进去了。'),
        L(1, 'When did you last log in successfully?', '您最后一次成功登录是什么时候？'),
        L(0, 'Last night. This morning the password was wrong.', '昨晚。今早密码就不对了。'),
        L(1, 'Do you still have access to the email on the account?', '账户绑定的邮箱还能用吗？'),
        L(0, 'I do. I got a notification about a login from another country.', '能。我收到一条异地登录提醒。'),
        L(1, 'I will lock the account and start a recovery. Do not click any links in the meantime.', '我锁定账户并启动找回。期间别点任何链接。'),
        L(0, 'Should I change my email password too?', '我邮箱密码也要改吗？'),
        L(1, 'Yes, and turn on two-factor authentication everywhere.', '要，而且所有地方都开两步验证。'),
      ],
      variants: [
        { tag: '密码被改', setting: '你早上发现登不进自己的账号。' },
        V('被盗刷', '账号里的钱被花了。', {
          0: ['There are payments I did not make on my account.', '我账户里有不是我付的款。'],
          1: ['I will freeze the card and open a dispute for each one.', '我冻结卡，逐笔发起争议。'],
        }),
        V('邮箱被盗', '你的邮箱被别人登录。', {
          0: ['Someone is reading my email. Friends got strange messages from me.', '有人在看我的邮件。朋友收到我发的奇怪消息。'],
        }),
        V('社交媒体', '你的社交账号被冒充。', {
          0: ['My account is posting things I did not write.', '我的账号在发我没写过的东西。'],
        }),
        V('钓鱼', '你点了可疑链接。', {
          0: ['I clicked a link and typed my password. What should I do?', '我点了个链接还输了密码。怎么办？'],
        }),
        V('问恢复', '你想知道要多久。', {
          5: ['How long does the recovery take?', '找回要多久？'],
        }),
        V('二次验证', '你收不到验证码。', {
          6: ['I am not receiving the verification code.', '我收不到验证码。'],
        }),
      ],
      branches: [
        B(4, 'probe', '客服要核实身份，你要提供能证明的东西',
          S('I need to verify you. What was the last item you ordered?', '我要核实身份。您最后一笔订单是什么？'),
          [O(S('A pair of running shoes, last Tuesday.', '一双跑鞋，上周二。'), S('That matches. I will unlock it now.', '对上了。我现在解锁。')),
           O(S('I can read you the last four digits of the card.', '我能报卡号后四位。'), S('That is not enough on its own. Anything else?', '光这个不够。还有别的吗？'))]),
      ],
      phrases: [
        P('I cannot get back in.', '我登不进去了。', '比 I cannot log in 更口语。'),
        P('Someone has changed my password.', '有人改了我的密码。', '报案式描述，客服一听就懂。'),
        P('Turn on two-factor authentication.', '开启两步验证。', '2FA 是账号安全的核心。'),
      ],
    },
  ],
};
