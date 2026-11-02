/**
 * 给已有骨架补「第二种岔路」。
 *
 * 起因：204 个情境里 202 个只有一种岔路。同一情境的 5~7 个变体，练六遍都是同一种
 * 意外 —— 想练「对方要加钱」只能碰运气，报告里"你最容易卡在哪类意外"也就永远
 * 只有同一条数据。
 *
 * 为什么不直接改骨架文件：那是 10 个文件里的字符串手术，改错一个引号整份语料就挂，
 * 而且新增内容和原稿混在一起，复核时分不清谁写的。这里集中放，一个文件看得完。
 *
 * 写法：
 *   'restaurant': {
 *     branch: B(7, 'cost', '目标说明', S('对方的话', '中文'), [O(S(...), S(...)), O(...)]),
 *     for: ['三个人 AA', '两个人分一份'],   // 这几个变体改走这条（下标自动算）
 *   }
 *
 * 三条硬规矩（生成器会校验，违反会直接报错）：
 * 1. at 必须落在「你的台词」上 —— 下面每处都在注释里写了那一句是什么；
 * 2. at 后面必须是对方的台词（岔路的 react 会顶替它）；
 * 3. 新岔路的意思要和指向它的变体对得上。不能给"问周六篮球"的变体塞一句
 *    "周四满了给你隔壁礼堂" —— 岔路读起来不对，练习就废了。
 */
import { B, S, O } from './_dsl.mjs';

export const EXTRA = {
  /* ---------------- 餐厅点菜：账单上多出一笔 ---------------- */
  restaurant: {
    // at 7 = "Excuse me, could we get the bill? And could we split it?"
    branch: B(7, 'cost', '账单上多了一笔，你要么接受、要么问清它是什么',
      S('We can split it, but there is a two-pound charge for separate bills.', '可以分开结，不过分单要加两镑。'),
      [O(S('Two pounds just to split? We will pay together then.', '分个单要两镑？那我们一块付。'), S('One card, no charge. Here is the machine.', '一张卡不收钱。机器给您。')),
       O(S('Fine, take the two pounds off the tip.', '行，那这两镑就从服务费里扣。'), S('Fair enough. I will take it off.', '也合理。我给您减掉。'))]),
    for: ['三个人 AA', '两个人分一份'],
  },

  /* ---------------- 宠物寄养：只能住笼舍 ---------------- */
  'pet-boarding': {
    // at 0 = "I need someone to look after my dog for ten days."
    branch: B(0, 'change', '原本的安排没了，你要接受一个更差的替代或换一家',
      S('We have no home boarder that week. It would have to be a kennel.', '那周没有家庭寄养了，只能住笼舍。'),
      [O(S('How big is the kennel? He is nervous in small spaces.', '笼子多大？他进窄地方会紧张。'), S('Each dog has a run and a sleeping box. Not a cage.', '每只狗有一个活动区和睡箱，不是铁笼。')),
       O(S('Then I will look somewhere else. Thanks anyway.', '那我去别处问问。还是谢谢。'), S('Understood. Ring us if nothing turns up.', '明白。找不到再给我们打电话。'))]),
    for: ['出差十天寄养', '短期'],
  },

  /* ---------------- 家长会：学校要调整分组 ---------------- */
  'school-meeting': {
    // at 5 = "Should we do the same at home?"（at 7 是最后一句，后面没有可顶替的台词）
    branch: B(5, 'change', '学校改了做法，你要接受新安排并问清自己该配合什么',
      S('From next term the writing is a diary he keeps himself.', '下学期起，写作改成他自己记日记。'),
      [O(S('Who chooses what he writes about?', '写什么由谁定？'), S('He does. Ten minutes a night, and you only read it if he asks.', '他自己定。每晚十分钟，他不请你别看。')),
       O(S('Then we will keep the same ten minutes at home.', '那我们家里也照这十分钟来。'), S('Perfect. Same time every night, no corrections.', '正好。每晚同一时间，不要改他的句子。'))]),
    for: ['想换班', '成绩下滑'],
  },

  /* ---------------- 保姆：时薪之外还有车费 ---------------- */
  babysitter: {
    // at 6 = "Both of us will have our phones on."
    branch: B(6, 'cost', '报价里还有没算进去的部分，你要问清总价',
      S('Fifteen an hour, plus a taxi home after ten. That is about seventy for the evening.', '一小时十五，十点后还要打车回去。一晚上大概七十。'),
      [O(S('Seventy is fine. Can I pay you in cash on the night?', '七十可以。当晚现金给你行吗？'), S('Cash is easiest. I will leave the number on the fridge.', '现金最省事。我把电话留在冰箱上。')),
       O(S('Could we finish by nine thirty so no taxi is needed?', '能九点半结束吗？那样就不用打车了。'), S('That works for me. Same rate.', '可以。价钱不变。'))]),
    for: ['周六晚上四小时', '付钱', '过夜'],
  },

  /* ---------------- 游泳课：储物柜不够用 ---------------- */
  'swim-class': {
    // at 6 = "Do I need to bring anything?"
    branch: B(6, 'short', '你要的东西没有，换个能凑合的办法',
      S('We have no lockers free this term. You would keep your bag poolside.', '这学期储物柜都满了，包只能放在池边。'),
      [O(S('Is poolside safe? I am bringing my phone.', '池边安全吗？我要带手机。'), S('There are open shelves in sight of the teacher.', '有开放架子，老师看得见。')),
       O(S('Then I will bring a small bag and leave the phone at home.', '那我带个小包，手机留家里。'), S('Good idea. Bring flip-flops too.', '好主意。再带双拖鞋。'))]),
    for: ['成人零基础', '时间'],
  },

  /* ---------------- 账号被盗：顺手给你装个密码管理器 ---------------- */
  'account-security': {
    // at 6 = "Should I change my email password too?"
    branch: B(6, 'offer', '对方主动提出一个你没想过的方案，你要判断接不接受',
      S('Yes. And while we are on the phone I can set up a password manager for you.', '要改。趁通话这会儿，我还可以给你装一个密码管理器。'),
      [O(S('What does it actually do?', '它到底管什么？'), S('It remembers long passwords so you only learn one.', '它替你记长密码，你只要记一个。')),
       O(S('Not now. Let us fix the account first.', '先不用。先把账号弄回来。'), S('Sensible. I will send you the link for later.', '稳妥。链接我发你，回头再说。'))]),
    for: ['问恢复', '二次验证'],
  },

  /* ---------------- 报税：服务要收费 ---------------- */
  'tax-return': {
    // at 0 = "I need help filing my tax return. It is my first year."
    branch: B(0, 'cost', '服务要收费，你要么接受、要么问清贵在哪、有没有便宜的路',
      S('We charge ninety for a first return, and seventy if we did last year.', '第一次报税收费九十，我们做过去年的收七十。'),
      [O(S('What does the ninety cover?', '这九十包含什么？'), S('Preparation, filing and one amendment if needed.', '填表、申报，需要时改一次。')),
       O(S('Is the free government form hard to do?', '政府那份免费表格难填吗？'), S('Not hard, but one wrong box costs more than ninety.', '不难，但填错一栏赔的比九十多。'))]),
    for: ['第一次报税', '问抵扣'],
  },

  /* ---------------- 报销：这季度的额度没了 ---------------- */
  expense: {
    // at 6 = "How long does the refund take?"
    branch: B(6, 'short', '钱暂时拿不到，你要问清什么时候能拿、能不能变通',
      S('We have no budget left this quarter. It would be paid in April.', '这季度预算用完了，要四月才付。'),
      [O(S('Is there any way to get it sooner?', '有没有办法早点拿到？'), S('Petty cash, if your manager signs it off.', '经理签字的话，可以走备用金。')),
       O(S('That is two months. I will tell my manager today.', '那就是两个月。我今天就跟经理说。'), S('Good. Ask him to email me and I will queue it.', '好。让他邮件我，我排上队。'))]),
    for: ['超期提交', '被退回'],
  },

  /* ---------------- 催款：加急转账要手续费 ---------------- */
  invoice: {
    // at 6 = "Could you confirm the payment date in writing?"
    branch: B(6, 'cost', '对方愿意付，但要多收一笔，你要判断值不值',
      S('I can send written confirmation, but an express transfer costs fifteen.', '书面确认可以发，不过加急转账要十五块手续费。'),
      [O(S('Take the fifteen out of what you owe me.', '这十五从我应得的里扣。'), S('That is fair. I will note it on the remittance.', '合理。我在汇款单上注明。')),
       O(S('Do not bother with express. Standard is fine.', '不用加急，普通转账就行。'), S('Standard clears in three working days.', '普通转账三个工作日到账。'))]),
    for: ['要利息', '逾期三十天'],
  },

  /* ---------------- 市政税：单人折扣的窗口关了 ---------------- */
  'council-tax': {
    // at 5 = "Is there a single person discount?"
    branch: B(5, 'short', '你要的东西拿不到，你要问清能不能补救、从什么时候算',
      S('There is, but you have to claim within a month of moving in. That window closed on the third.', '有的，但得在入住一个月内申请。那个期限三号就过了。'),
      [O(S('Can it be backdated to when I moved in?', '能从入住那天开始补吗？'), S('No, but I can start it from next month.', '不能，不过可以从下个月开始算。')),
       O(S('Then I will claim it and pay the difference later.', '那我先申请，差额以后再补。'), S('Fine. I will send the form with the new bill.', '行。表格随新账单一起寄。'))]),
    for: ['账单还是旧名字', '折扣取消'],
  },

  /* ---------------- 垃圾分类：改成两周收一次 ---------------- */
  recycling: {
    // at 6 = "Do you collect on bank holidays?"
    branch: B(6, 'change', '规则要变，你要问清新规则怎么影响自己',
      S('From April we collect every other week, not every week.', '四月起改成两周收一次，不再每周收。'),
      [O(S('Will the blue bin be big enough?', '蓝桶够大吗？'), S('Same bin, but put food waste in the small caddy.', '桶不变，但厨余要放小桶里。')),
       O(S('Which week starts first?', '先收哪一周？'), S('The week of the fifth. The calendar goes on the lid.', '五号那周。日历贴在桶盖上。'))]),
    for: ['不确定怎么分', '厨余'],
  },

  /* ---------------- 停车证：访客券只能整本买 ---------------- */
  'parking-permit': {
    // at 6 = "How many visitors can I have?"
    branch: B(6, 'cost', '要多花一笔才能用，你要问清最小购买量和更便宜的路',
      S('Ten a month, but visitor books are sold in tens. Fifteen pounds up front.', '一个月十张，但访客券整本卖，先付十五镑。'),
      [O(S('Fine, add a book to the permit.', '行，给我加一本。'), S('Added. It comes with the permit in the post.', '加好了。和停车证一起寄。')),
       O(S('Can I buy them one at a time instead?', '能一张一张买吗？'), S('Only online, two pounds each.', '只能网上买，一张两镑。'))]),
    for: ['访客', '续期'],
  },

  /* ---------------- 买床垫：搬走旧的、送上楼都要钱 ---------------- */
  'buy-mattress': {
    // at 5 = "It feels good. Do you take the old one away?"
    branch: B(5, 'cost', '报价之外还有附加费，你要问清总额再决定',
      S('Twenty to take the old one, and delivery upstairs is thirty on top.', '搬走旧的二十，送上楼再加三十。'),
      [O(S('Both, please. Can you do Saturday?', '两样都要。周六能送吗？'), S('Saturday morning is free. Before noon.', '周六上午有空。中午之前。')),
       O(S('I will carry it up myself and save the thirty.', '我自己搬上去，省那三十。'), S('It is heavy. Bring two people and a trolley.', '很重。带两个人加一辆推车。'))]),
    for: ['旧床垫顶出弹簧', '送货上楼'],
  },

  /* ---------------- 租货车：开没开过这么大的车 ---------------- */
  'hire-van': {
    // at 5 = "Is insurance included?"
    branch: B(5, 'probe', '对方追问你的经验，你要如实说清、并问出后果',
      S('It is. Have you driven a van this size before?', '包含。你开过这么大的货车吗？'),
      [O(S('No, only a small car. Is that a problem?', '没开过，只开过小轿车。有问题吗？'), S('Then take the medium van. Same price, easier to park.', '那租中号吧。同价，好停。')),
       O(S('Yes, I drive one for work every week.', '开过，我上班每周都开。'), S('Good. I will skip the walkthrough, but check the height.', '好。那就不带你看车了，但注意限高。'))]),
    for: ['租四小时搬沙发', '超高'],
  },

  /* ---------------- 租菜地：只能整块租 ---------------- */
  allotment: {
    // at 2 = "Yes. What size are the plots?"
    branch: B(2, 'short', '你想要的那种没有，只能接受更大的或排更久的队',
      S('Only full plots now. We stopped splitting them two years ago.', '现在只有整块地。两年前就不分半块了。'),
      [O(S('Five rods is a lot for one person, but I will take it.', '五杆对一个人是多了点，那我也租。'), S('You can share the digging with a neighbour.', '你可以跟隔壁分着翻地。')),
       O(S('Can I go on the list for a half plot?', '能排半块地的队吗？'), S('That list is closed. Full plots only.', '那个队已经停了。只租整块。'))]),
    for: ['半块地', '排队租菜地'],
  },

  /* ---------------- 清排水槽：管道另算 ---------------- */
  gutter: {
    // at 4 = "Is that including the downpipe?"
    // 不能放在 at 2：那句话后面对方正好报出"九十包管道"，
    // 岔路若在这里先说了管道的价钱，下一页你又问"包不包管道"，就成了自问自答。
    branch: B(4, 'cost', '报价里有一项要另算，你要问清总额再让他动手',
      S('It is, but if the pipe is broken, replacing it is sixty on top.', '包在内。可管道要是破了，换一根再加六十。'),
      [O(S('Check the pipe first and tell me before replacing.', '先看看管道，换之前告我一声。'), S('I will photograph it and ring you from the roof.', '我拍照，在屋顶上给你打电话。')),
       O(S('Do it all. I would rather not call you back next month.', '都弄了吧。不想下个月再叫你。'), S('Then a hundred and fifty, parts included.', '那就算一百五，含材料。'))]),
    for: ['报价', '排水槽溢出'],
  },

  /* ---------------- 电视执照：规则要变 ---------------- */
  'tv-licence': {
    // at 1 = "Mostly streaming, but I watch the news live."
    branch: B(1, 'change', '规则改了，你要问清新规则对自己算不算',
      S('From April the rule changes. Streaming-only households need one too.', '四月起规则变了，只看流媒体的家庭也要交。'),
      [O(S('So everyone pays, whether they watch live or not?', '那就是谁都逃不掉了？'), S('Everyone who uses the player. It is the same fee.', '用播放平台的都算。价钱一样。')),
       O(S('When does that start, exactly?', '具体从什么时候开始？'), S('The first of April. The letter goes out in March.', '四月一号。信三月寄出。'))]),
    for: ['只看流媒体', '学生宿舍'],
  },

  /* ---------------- 狗登记：法规改过 ---------------- */
  'dog-register': {
    // at 4 = "Do I need a licence as well?"
    branch: B(4, 'change', '规定变了，你要问清变化对你要做什么',
      S('The rules changed in April. The chip transfer is free now, but you must register with us too.', '四月起规定改了。芯片过户现在免费，但你还要在本地登记。'),
      [O(S('Is the local register free as well?', '本地登记也免费吗？'), S('Twelve a year, and it covers the park bins.', '一年十二，含公园的垃圾桶。')),
       O(S('What happens if I do not register?', '不登记会怎样？'), S('A fixed penalty, eighty. It is cheaper to register.', '定额罚款八十。登记更便宜。'))]),
    for: ['领养狗要登记', '攻击'],
  },

  /* ---------------- 自助仓储：带暖气的租不到 ---------------- */
  storage: {
    // at 5 = "What does that cost?"
    branch: B(5, 'short', '你要的那一档租不到，只能等或降级',
      S('The ten-metre heated units are all taken until March.', '十平米的暖气仓都租出去了，要到三月。'),
      [O(S('Then give me the cold one and I will pack the books in plastic.', '那给我不带暖气的，我把书用塑料包起来。'), S('That works. Five metres, fifty a month.', '行。五平米，一月五十。')),
       O(S('Can you call me if one comes free?', '有空出来的能给我打电话吗？'), S('I will put you on the list. It moves fast.', '我给你排上。那队走得快。'))]),
    for: ['要暖气', '大件'],
  },

  /* ---------------- 退健身房：提前解约要付费 ---------------- */
  'gym-cancel': {
    // at 5 = "I checked. It has no pool, and that is why I joined."
    branch: B(5, 'cost', '能退，但要付一笔，你要判断值不值',
      S('We can cancel today, but there is a thirty-pound early release fee.', '今天就能退，不过提前解约有三十镑的费用。'),
      [O(S('Thirty is less than two months of fees. Do it.', '三十比两个月的会费少。退吧。'), S('Done. No further payments.', '办好了。之后不再扣款。')),
       O(S('Is there a way to avoid the fee?', '有没有办法免掉？'), S('Freeze it for three months instead. No fee.', '改成冻结三个月。不收费。'))]),
    for: ['搬家离太远', '扣款'],
  },

  /* ---------------- 跨境汇款：换了渠道，慢了 ---------------- */
  remittance: {
    // at 4 = "When will it arrive?"
    branch: B(4, 'change', '时效变了，你要重新安排',
      S('We changed provider last month. It is two to three working days now.', '上个月换了渠道。现在要两到三个工作日。'),
      [O(S('That is slower than before. Is there a faster option?', '比从前慢了。有更快的吗？'), S('Express is twenty-five pounds and arrives tomorrow.', '加急二十五镑，明天到。')),
       O(S('Two days is fine. My parents are not in a hurry.', '两天可以。我父母不着急。'), S('Then standard it is. Keep the receipt.', '那就普通。收好回执。'))]),
    for: ['要更快', '限额'],
  },

  /* ---------------- 争议款：给你寄新卡 ---------------- */
  'card-dispute': {
    // at 6 = "Will I get the money back while you investigate?"
    branch: B(6, 'offer', '对方主动加一件你没提的事，你要判断要不要',
      S('You will. And we can courier a new card to you tomorrow.', '会的。而且明天可以用快递给你寄张新卡。'),
      [O(S('Yes please. I need it before the weekend.', '要。周末前得拿到。'), S('Before nine tomorrow, signed for.', '明天九点前，要签收。')),
       O(S('I will keep this one until the dispute is settled.', '我先用这张，等争议处理完再说。'), S('Then keep it frozen for online payments.', '那先冻结它的线上支付。'))]),
    for: ['新卡', '境外盗刷'],
  },

  /* ---------------- 邮件转寄：加名字要钱 ---------------- */
  'mail-redirect': {
    // at 5 = "Can I add the old tenant names?"
    branch: B(5, 'cost', '想加的东西要另付，你要问清单价',
      S('You can, but each extra name is five pounds.', '可以，不过每加一个名字五镑。'),
      [O(S('Just the one name, then.', '那就加一个。'), S('Added. The redirect starts on the sixth.', '加好了。转寄六号开始。')),
       O(S('Do I really need it?', '真有必要吗？'), S('It stops the bank writing to them by mistake.', '能防止银行错寄给他们。'))]),
    for: ['期限', '改地址'],
  },

  /* ---------------- 水费：只能拍照报数 ---------------- */
  'water-bill': {
    // at 3 = "No. It says estimated on the bill."
    branch: B(3, 'change', '报数的方式变了，你要问清怎么弄',
      S('From this month we only take readings by photo in the app. No phone readings.', '这个月起只收 app 里拍照报数。电话报的不算了。'),
      [O(S('I do not have the app. Can I email a photo?', '我没装那个 app。能邮件发照片吗？'), S('Email works this month, while the app is new.', '这个月邮件也行，app 刚上。')),
       O(S('Fine, I will download it now.', '行，我现在就下。'), S('Take the photo in daylight, digits clear.', '白天拍，数字要清楚。'))]),
    for: ['换表', '新住户'],
  },

  /* ---------------- 路灯：这周没有电工 ---------------- */
  'street-light': {
    // at 1 = "Elm Road, outside number fourteen. Dark for a week."
    branch: B(1, 'short', '负责的人手没有，要么等、要么换个说法催',
      S('We have no lighting engineer this week. That work goes to a contractor.', '这周没有路灯的电工。那种活得转给外包。'),
      [O(S('How long does the contractor take?', '外包要多久？'), S('Ten days, unless it is marked dangerous.', '十天，除非标成危险。')),
       O(S('A school is on that corner. Can you mark it dangerous?', '那个转角有学校。能标成危险吗？'), S('I can. That puts it at three days.', '可以。那样就三天。'))]),
    for: ['路灯坏了一周', '跟进'],
  },

  /* ---------------- 买校服：校徽改由供应商缝 ---------------- */
  'school-uniform': {
    // at 3 = "Do the blazers come with the badge?"
    branch: B(3, 'change', '做法变了，你要问清时间和替代办法',
      S('This year the badge is sewn on by the supplier. Six weeks from order.', '今年校徽由供应商缝。下单起六周。'),
      [O(S('Six weeks? School starts in four.', '六周？开学只剩四周。'), S('Order today and it arrives the second week.', '今天下单，第二周能到。')),
       O(S('Can I sew it on myself and save the wait?', '我自己缝能省这时间吗？'), S('You can, but the stitch has to match.', '可以，但针脚要对得上。'))]),
    for: ['刺绣', '尺码'],
  },

  /* ---------------- 看新生儿：对方主动给钥匙 ---------------- */
  'baby-visit': {
    // at 1 = "Congratulations. How are you holding up?"
    branch: B(1, 'offer', '对方提出一个你没想过的安排，你要判断接不接受',
      S('Tired. Look, we have a spare key. Drop round any time you need an hour.', '累。这样，我们有把备用钥匙。你想歇一小时随时来。'),
      [O(S('Are you sure? That is a lot to offer.', '你们确定？这可不是小事。'), S('You are the third person we have offered it to.', '你是第三个了。')),
       O(S('I will take it, but I will text first.', '我拿着，但来之前一定发消息。'), S('Please do. Mornings are easier.', '一定。上午比较方便。'))]),
    for: ['第一次探望', '别待太久'],
  },

  /* ---------------- 接孩子：第二次就要见校长 ---------------- */
  'school-pickup': {
    // at 5 = "What happens now?"
    branch: B(5, 'change', '处理方式变了，你要问清后面会怎样',
      S('It goes on record now. A second incident means a meeting with the head.', '这次要记录在案。再有第二次就要见校长。'),
      [O(S('Is that on both children or only mine?', '两个孩子都记，还是只记我家这个？'), S('Both. It is the same entry.', '都记。同一条记录。')),
       O(S('Understood. I would rather know now than later.', '明白。早知道比晚知道好。'), S('That is the right attitude. We will tell you either way.', '这态度对。有事我们都会告诉你。'))]),
    for: ['孩子推了人', '约面谈'],
  },

  /* ---------------- 火车票：没订座不让上车 ---------------- */
  'seat-reservation': {
    // at 1 = "So I can buy the ticket but not sit down?"
    branch: B(1, 'change', '规矩变了，你要问清新规矩怎么执行',
      S('That changed last month. You cannot board this service without a reservation now.', '上个月改了。这趟车没订座不让上。'),
      [O(S('So the cheap fare is useless without another twelve pounds?', '那这便宜票不加十二镑就白买了？'), S('For this route, yes. Regional trains are still open.', '这条线是这样。区域车还不用。')),
       O(S('Can I reserve at the platform instead?', '能在站台再订吗？'), S('Only if seats are left. Today there are four.', '有余座才行。今天还剩四个。'))]),
    for: ['便宜票不含座', '长途'],
  },

  /* ---------------- 租车：费用在预订时就扣了 ---------------- */
  'rental-fees': {
    // at 5 = "Then remove it. My licence is on the counter."
    branch: B(5, 'change', '当场退不了，要走另一条路',
      S('I cannot take it off here. It was charged at booking, so you claim it back afterwards.', '我这儿退不了。预订时就扣了，你事后申请退回。'),
      [O(S('How do I claim it back?', '怎么申请？'), S('Online, with the licence photo. Ten working days.', '网上，附驾照照片。十个工作日。')),
       O(S('Then I want it noted on the contract now.', '那现在就在合同上写清楚。'), S('I will write it and sign it. Keep your copy.', '我写上并签字。你留一份。'))]),
    for: ['多出年轻驾驶员费', '拒付'],
  },

  /* ---------------- 改签：期限过了 ---------------- */
  'flight-change-fee': {
    // at 3 = "The airline cancelled my first booking. Do I still pay?"
    branch: B(3, 'change', '政策有个你没算到的时间条件',
      S('If we cancelled, the change is free, but it must be rebooked within a year. That was fourteen months ago.', '我们取消的免费改，但要在一年内重订。那已经是十四个月前了。'),
      [O(S('Nobody told me about the year. Can it be extended?', '没人跟我说过一年这回事。能延吗？'), S('I can ask a supervisor. It is not automatic.', '我可以问主管。不是自动的。')),
       O(S('Then book the cheapest flight and I will pay the difference.', '那就订最便宜的，差价我付。'), S('That I can do today. Which date?', '这个今天就能办。哪天？'))]),
    for: ['航班取消', '被收改签费'],
  },

  /* ---------------- 随身行李：货舱满了 ---------------- */
  'baggage-weight': {
    // at 5 = "Forty-five for two kilos seems steep."
    branch: B(5, 'short', '不是钱的问题，是根本没位置',
      S('It is not the fee. The hold is full on this flight. We cannot take bags today.', '不是钱的事。这班货舱满了，今天不收行李。'),
      [O(S('So my only option is to wear it all?', '那我只能全穿身上？'), S('Or leave it with the left-luggage desk for ten.', '或者存到行李寄存，十块。')),
       O(S('Can it go on the next flight and I collect it?', '能走下一班，我到了再取吗？'), S('Yes, it arrives at nine tonight.', '可以，今晚九点到。'))]),
    for: ['随身超两公斤', '拒付'],
  },

  /* ---------------- 买车票：售票机坏了，只卖往返 ---------------- */
  busticket: {
    // at 3 = "Single, please."（这一场你是乘客，you=1 —— 别按角色下标 0 去数）
    branch: B(3, 'change', '只能卖另一种票，你要让对方明白为什么',
      S('Sorry, the machine is down. I can only sell returns today.', '抱歉，机器坏了。今天只能卖往返票。'),
      [O(S('How much more is a return?', '往返贵多少？'), S('One pound twenty more. Use it coming back or not.', '贵一块二。回程用不用都行。')),
       O(S('Then a return to the station.', '那来一张到车站的往返。'), S('Three seventy, and keep the second half.', '三块七，回程票留着。'))]),
    for: ['单程去车站', '一日票'],
  },

  /* ---------------- 寄包裹：空邮停了 ---------------- */
  'parcel-basic': {
    // at 3 = "To China."（这一场你是寄件人，you=1）
    branch: B(3, 'change', '路线改了，时效完全不同',
      S('We have stopped air mail to China. It goes by sea now, about six weeks.', '到中国的空邮停了。现在走海运，大约六周。'),
      [O(S('Six weeks is too long. Is there a courier?', '六周太久了。有快递吗？'), S('Courier is twenty-eight, three days, separate counter.', '快递二十八，三天，另一个柜台。')),
       O(S('Sea is fine. It is only books.', '海运可以。就是些书。'), S('Then two pounds eighty, and wrap it well.', '那两块八。包结实点。'))]),
    // 不给「寄一封信」：这条岔路说的是"包结实点"，配信件不合适
    for: ['寄小包裹', '要快的'],
  },

  /* ---------------- 转机：服务台关了 ---------------- */
  transit: {
    // at 6 = "And if I miss it, where do I rebook?"
    branch: B(6, 'short', '该在的地方没人了，你要问替代窗口',
      S('The transfer desk closed ten minutes ago. It is the ticket counter now.', '转机服务台十分钟前关了。现在得去售票柜台。'),
      [O(S('Where is that, and is it still open?', '在哪儿，还开着吗？'), S('Two floors down. Open until eleven.', '下两层。开到十一点。')),
       O(S('Then I will run. Thanks.', '那我跑过去。谢谢。'), S('Take the lift, not the escalator.', '坐电梯，别走扶梯。'))]),
    for: ['已经错过', '要换航站楼'],
  },

  /* ---------------- 退税：现金要扣手续费 ---------------- */
  'tax-refund': {
    // at 4 = "In the suitcase. Should I bring them out?"
    branch: B(4, 'cost', '能办，但要扣一笔，你要算清哪种划算',
      S('You can, but cash refunds carry a fifteen per cent handling charge.', '可以，不过退现金要扣百分之十五的手续费。'),
      [O(S('What about refunding to the card?', '退到卡里呢？'), S('No charge, but four weeks. Cash is instant.', '不收费，但要四周。现金当场给。')),
       O(S('Card, then. I am not paying fifteen per cent.', '那退卡里。我可不出这百分之十五。'), S('Fill in the card number on the form.', '在表上填卡号。'))]),
    for: ['服装和电子产品', '现金退税'],
  },

  /* ---------------- 还车：多一笔清洁费 ---------------- */
  'return-car': {
    // at 5 = "What about the fuel? I filled it up ten minutes ago."
    branch: B(5, 'cost', '本来以为没事了，又冒出一笔',
      S('The fuel is fine. There is a thirty-pound cleaning charge, the seats are marked.', '油没问题。还有三十镑清洁费，座椅上有印子。'),
      [O(S('That is mud from the car park. Can I clean it now?', '那是停车场的泥。我现在擦掉行吗？'), S('If it comes off, I will drop the charge.', '擦得掉就不收。')),
       O(S('Show me the marks before you charge me.', '收钱之前先给我看印子。'), S('Come round to the rear seat with me.', '跟我到后排看。'))]),
    for: ['划痕争议', '押金'],
  },

  /* ---------------- 民宿：还没打扫 ---------------- */
  'airbnb-checkin': {
    // at 3 = "It opened. Thank you. Where is the wifi password?"
    branch: B(3, 'change', '房间还不能用，你要问清什么时候能用',
      S('Ah, the cleaner has not been yet. The flat will be ready at four.', '啊，保洁还没来。房间四点才能好。'),
      [O(S('It is two now. Where can I leave my bags?', '现在两点。我行李能放哪儿？'), S('The cafe downstairs holds them for free.', '楼下咖啡店免费寄存。')),
       O(S('Four is fine. I will go and eat something.', '四点可以。我去吃点东西。'), S('I will text you the moment she leaves.', '她一走我就发消息。'))]),
    for: ['房间没打扫', '密码盒打不开'],
  },

  /* ---------------- 景点：楼上在装修 ---------------- */
  attraction: {
    // at 6 = "What time does it close?"
    branch: B(6, 'short', '有一部分看不了，你要问清票价会不会减',
      S('Six. But the upper floor is closed for refurbishment, ground floor only today.', '六点。不过楼上在装修，今天只开一层。'),
      [O(S('Is the ticket cheaper then?', '那票便宜吗？'), S('Eight instead of twelve. I should have said.', '八块，不是十二。我该早说。')),
       O(S('Then I will come back next month.', '那我下个月再来。'), S('The upper floor opens on the third.', '楼上三号开。'))]),
    for: ['闭馆', '导览'],
  },

  /* ---------------- 配眼镜：镜架停产了 ---------------- */
  glasses: {
    // at 5 = "Do I need new glasses, or just new lenses?"
    branch: B(5, 'cost', '想只换镜片，可镜架没了',
      S('New lenses in the same frame is ninety, but your frame is discontinued. A new one starts at a hundred and forty.', '原镜架换镜片九十，可你这副停产了。新镜架一百四起。'),
      [O(S('Ninety plus a frame is a lot. Is there a cheaper line?', '九十再加镜架太贵。有便宜的系列吗？'), S('The basic range starts at sixty.', '基础系列六十起。')),
       O(S('Then fix the lenses in my old frame however you can.', '那想办法把镜片装回我这副旧的。'), S('I can, if the screws hold. Two days.', '可以，只要螺丝还吃得住。两天。'))]),
    for: ['问价格', '镜片划伤'],
  },

  /* ---------------- 体检报告：有个营养门诊 ---------------- */
  'checkup-report': {
    // at 5 = "What should I change in my diet?"
    branch: B(5, 'offer', '医生主动提一个额外资源，你要判断要不要',
      S('Less fried food and more fish. We also run a free nutrition group on Wednesdays.', '少吃油炸，多吃鱼。我们周三还有个免费营养门诊。'),
      [O(S('Is it one-to-one or a lecture?', '是一对一还是讲座？'), S('Six people, one dietitian. Forty minutes.', '六个人，一个营养师。四十分钟。')),
       O(S('I will try it. My diet is mostly guesswork.', '我去试试。我吃饭基本靠猜。'), S('Come at six. No booking needed.', '六点来。不用预约。'))]),
    for: ['胆固醇偏高', '血糖偏高'],
  },

  /* ---------------- 理疗：疗程要预付 ---------------- */
  physio: {
    // at 5 = "Will I need scans?"
    branch: B(5, 'cost', '不用做检查，但疗程要花钱，而且预付更便宜',
      S('No scans. Six sessions is four hundred, or three hundred if you pay up front.', '不用做检查。六次四百，预付的话三百。'),
      [O(S('What if I only need three?', '只要三次呢？'), S('Then pay as you go, sixty-five a session.', '那就单次付，一次六十五。')),
       O(S('I will pay for six up front.', '我预付六次。'), S('Good. Book them now, same time each week.', '好。现在约，每周同一时间。'))]),
    for: ['问费用', '术后康复'],
  },

  /* ---------------- 贷款：钱要花在哪 ---------------- */
  loan: {
    // at 2 = "Five thousand, over two years."
    branch: B(2, 'probe', '对方追问一个你没准备过的细节，你要当场说清',
      S('And what is the loan for? Car, holiday, or consolidating debt?', '这笔钱用来做什么？买车、度假，还是还别的债？'),
      [O(S('Consolidating two credit cards. Both at nineteen percent.', '还两张信用卡。都是十九个点的利息。'), S('Then this is cheaper. I will mark it as refinancing.', '那这个便宜。我按债务重组标记。')),
       O(S('Does it make a difference to the rate?', '这会影响利率吗？'), S('Not the rate, but it changes the term we can offer.', '利率不变，但能给的期限不一样。'))]),
    for: ['比价', '提前还清'],
  },
};
