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
