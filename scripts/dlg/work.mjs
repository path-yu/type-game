import { L, V, S, O, B, P } from './_dsl.mjs';
import { LEGACY } from './_legacy.mjs';

const old = id => LEGACY.find(s => s.id === id);

export default {
  cat: '职场',
  items: [
    /* ---------------- 求职面试 ---------------- */
    {
      ...old('interview'),
      variants: [
        { tag: '前端第三轮', setting: '你面试一家做产品的公司，岗位是前端工程师，聊到第三轮。' },
        V('面试产品岗', '你从开发转产品，来面一个支付方向的产品经理岗。', {
          1: ['I have been a product manager for four years, mostly in payments.', '我做产品四年了，主要做支付。'],
          3: ['I want a smaller team and more ownership of the whole flow.', '我想要更小的团队，和整条链路的自主权。'],
        }),
        V('转行', '你原来是老师，去年转做教学设计，现在想进企业。', {
          1: ['I taught for six years and moved into instructional design last year.', '我教了六年书，去年转做教学设计。'],
          3: ['Your product is used in classrooms. I know that user well.', '你们的产品在课堂里用。那类用户我很熟。'],
        }),
        V('问薪资', '你对岗位有兴趣，想先确认薪资范围。', {
          9: ['Yes, two things. What is the salary range, and who would I report to?', '有两个问题。薪资范围是多少，我向谁汇报？', '薪资一定问 range 不问具体数，留出谈判空间。'],
        }),
        V('问团队', '你想知道团队规模和协作方式。', {
          9: ['Yes. How big is the team, and how do you run projects?', '有。团队多大，项目怎么推进？'],
        }),
      ],
      branches: [
        ...(old('interview').branches ?? []),
        {
          at: 5, kind: 'probe',
          task: '对方追问一个你答不上来的细节，你要稳住',
          prompt: S('You mentioned asking for help earlier. Can you give me a specific example?', '你说会早点求助。能举个具体的例子吗？'),
          options: [
            O(S('Last quarter I flagged a delay two weeks early, and we cut scope together.', '上季度我提前两周报了延迟，我们一起砍了范围。'), S('That is exactly the kind of thing I hoped to hear.', '这正是我想听到的。')),
            O(S('I would rather give you the real story than a polished one.', '我更愿意讲真实的情况，而不是包装过的。'), S('Fair. Take your time.', '很好。你慢慢说。')),
          ],
        },
      ],
    },

    /* ---------------- 客服电话 ---------------- */
    {
      ...old('phone'),
      variants: [
        { tag: '物流停更', setting: '你十天前订的显示器还没到，物流页面停在上周四。你打了客服。' },
        V('要退款', '你不想等了，只想退款。', {
          1: ['Hi, I want to cancel order 88214 and get a refund.', '你好，我想取消 88214 这个订单，退款。'],
          2: ['I can do that if it has not shipped. Let me check.', '如果还没发货可以。我查一下。'],
          3: ['It says packed, not shipped.', '显示已打包，未发货。'],
          4: ['Then I can cancel it. The refund takes five days.', '那可以取消。退款五天到账。'],
        }),
        V('重复扣款', '同一笔订单被扣了两次。', {
          1: ['Hi, I was charged twice for the same order.', '你好，同一笔订单我被扣了两次钱。'],
          2: ['I am sorry. Could you read me the last four digits of the card?', '抱歉。能报一下卡号后四位吗？'],
          3: ['It ends in 4402. Both charges are on my statement.', '后四位 4402。两笔都在账单上。'],
        }),
        V('登不上账号', '密码重置邮件一直收不到。', {
          1: ['I cannot log in, and the reset email never arrives.', '我登录不了，重置邮件一直收不到。'],
          2: ['Is it the address on the account, or a different inbox?', '是账户上的邮箱，还是别的邮箱？'],
        }),
        V('要工单号', '问题解决了，你想要一个书面记录。', {
          9: ['That is all. Could you email me the case number?', '就这些。能把工单号发我邮箱吗？'],
        }),
      ],
      branches: [
        ...(old('phone').branches ?? []),
        {
          at: 5, kind: 'offer',
          task: '对方给了一个补偿方案，你要判断接不接受',
          prompt: S('I can offer ten percent off your next order for the delay.', '因为延误，下次下单可以打九折。'),
          options: [
            O(S('That works for me.', '可以接受。'), S('I have applied it to your account.', '已经加到您账户上了。')),
            O(S('I would rather have the shipping refunded.', '我更想要退运费。'), S('Let me see if I can authorise that.', '我看看能不能批。')),
          ],
        },
      ],
    },

    /* ---------------- 项目会议 ---------------- */
    {
      id: 'meeting', name: '项目会议改期', lv: 5, cefr: 'B1+',
      roles: ['你', '同事'],
      lines: [
        L(1, 'Shall we start? We have forty minutes.', '开始吧？我们有四十分钟。'),
        L(0, 'Before we begin, can everyone see the agenda?', '开始前，大家能看到议程吗？'),
        L(1, 'It is on the screen. Item one is the launch date.', '在屏幕上。第一项是上线日期。'),
        L(0, 'I have a concern about the date. QA needs another week.', '日期我有顾虑。测试还需要一周。'),
        L(1, 'That pushes us past the campaign. Can we cut scope?', '那就赶不上活动了。能砍范围吗？'),
        L(0, 'We could ship the core and leave reporting for later.', '可以先上核心功能，报表往后放。'),
        L(1, 'All right. Who owns the new timeline?', '行。谁负责新的时间表？'),
        L(0, 'I will send it by tomorrow and flag the risks.', '我明天发出来，并标出风险。'),
        L(1, 'Good. Anything else before we close?', '好。结束前还有别的吗？'),
        L(0, 'Just one thing. Let us keep the notes in one place.', '就一件。会议记录放同一个地方。'),
      ],
      variants: [
        { tag: '上线日期要延', setting: '上线前两周，测试报告显示还有一批严重缺陷没修。' },
        V('预算超了', '项目预算已经超了两成，你要在会议上提出来。', {
          3: ['I need to flag the budget. We are twenty percent over.', '我要提一下预算。已经超了两成。'],
          4: ['Where did it go? The estimate looked fine in March.', '花在哪儿了？三月的估算看着没问题。'],
        }),
        V('人手不够', '两个同事被调走，交付时间不变。', {
          3: ['We lost two people last week. The date does not move.', '上周少了两个人。日期却不变。'],
          4: ['Then something has to give. What is the smallest version?', '那必须让步。最小可用版本是什么？'],
        }),
        V('需求改了', '客户临时加了一个大功能。', {
          3: ['The client added a feature yesterday. It is not small.', '客户昨天加了个功能。不算小。'],
        }),
        V('会上没结论', '讨论了一小时，没人拍板。', {
          9: ['We are going in circles. Can we decide by Friday?', '我们在原地打转。能周五前定下来吗？'],
        }),
      ],
      branches: [
        {
          at: 3, kind: 'probe',
          task: '对方质疑你的判断，你要拿出依据',
          prompt: S('QA always says they need another week. Is it really that bad?', '测试每次都说要一周。真有那么糟？'),
          options: [
            O(S('Two crash bugs on checkout. That is not a polish issue.', '结账流程有两个崩溃 bug。这不是打磨问题。'), S('All right, show me the list after this.', '行，会后把清单给我看。')),
            O(S('We can ship behind a flag and turn it on later.', '可以先带开关上线，之后再打开。'), S('That I can sell to the client.', '这个我能跟客户交代。')),
          ],
        },
      ],
      phrases: [
        P('I have a concern about the date.', '日期我有顾虑。', '会上提反对意见最不伤人的句式。'),
        P('Can we cut scope?', '能砍范围吗？', 'scope 是范围，cut scope 是砍需求。'),
        P('Who owns the new timeline?', '谁负责新的时间表？', 'own 在这里是「负责」，不是「拥有」。'),
      ],
    },

    /* ---------------- 每日站会 ---------------- */
    {
      
      branches: [
        B(5, 'change', '你要等的人不在，得换一种推进方式',
          S('Mina is out until Wednesday. No design review today.', 'Mina 周三才回来。今天没有设计评审。'),
          [O(S('Then I will build behind a flag and review later.', '那我先带开关做，之后再评审。'), S('Good call. Keep it off in production.', '好主意。生产环境先关着。')),
           O(S('Can I pair with someone else for thirty minutes?', '能找别人陪我过三十分钟吗？'), S('Take Tom, he did the last settings page.', '找 Tom，上一个设置页是他做的。'))]),
      ],
id: 'standup', name: '每日站会', lv: 4, cefr: 'B1',
      roles: ['你', '组长'],
      lines: [
        L(1, 'Morning. Anything blocking you?', '早。有卡住的地方吗？'),
        L(0, 'Yesterday I finished the login flow. Today I am on the API errors.', '昨天我做完了登录流程。今天在处理接口报错。'),
        L(1, 'Any blockers?', '有阻塞吗？'),
        L(0, 'The staging server is down, so I cannot test.', '测试服务器挂了，我没法测。'),
        L(1, 'I will ping ops. Anything else?', '我去催运维。还有吗？'),
        L(0, 'One more. I need a design review before I build the settings page.', '还有一件。做设置页之前我需要设计评审。'),
        L(1, 'I will book thirty minutes with Mina this afternoon.', '我下午跟 Mina 约三十分钟。'),
        L(0, 'Perfect. That unblocks me for the rest of the week.', '太好了。这周剩下的就顺了。'),
      ],
      variants: [
        { tag: '服务器挂了', setting: '早上十点站会，你已经卡了两天。' },
        V('等设计稿', '你要的稿子还没来。', {
          1: ['Yesterday I wrote the API layer. Today I am waiting on design.', '昨天写了接口层。今天在等设计。'],
          3: ['The empty state mockup still has not come.', '空状态的稿子还没来。'],
        }),
        V('任务太多', '你手上同时有三件事。', {
          0: ['Yesterday three things, today the same three. I need a priority.', '昨天三件，今天还是三件。我需要一个优先级。'],
          1: ['Fair. Do the export first, the rest can wait.', '有道理。先做导出，其余可以等。'],
        }),
        V('没进展', '你昨天一天都在开会。', {
          0: ['No progress yesterday. I was in meetings from nine to five.', '昨天没进展。我从九点开到五点。'],
        }),
        V('要请假', '你下周要休三天。', {
          5: ['I will be off Thursday and Friday next week. Who covers the release?', '我下周四、五休假。发布谁顶上？'],
        }),
      ],
      phrases: [
        P('Anything blocking you?', '有卡住的地方吗？', '站会主持人最常问的一句。'),
        P('I am on the API errors.', '我在处理接口报错。', 'be on 某件事 = 正在做。'),
        P('That unblocks me.', '这就通了。', 'unblock 是解除阻塞，工程团队高频词。'),
      ],
    },

    /* ---------------- 茶水间闲聊 ---------------- */
    {
      
      branches: [
        B(5, 'probe', '对方发现自己说错了，你要接得自然',
          S('Actually it is tomorrow, not Thursday. My mistake.', '其实是明天，不是周四。我记错了。'),
          [O(S('Tomorrow is even better. I am in the office.', '明天更好。我在办公室。'), S('Then I will add you to the booking.', '那我把你加进预订。')),
           O(S('I cannot do tomorrow. Next week?', '明天我不行。下周？'), S('Let me check the dates and come back.', '我看看日期再找你。'))]),
      ],
id: 'office-chat', name: '茶水间遇到同事', lv: 3, cefr: 'B1',
      roles: ['你', '同事'],
      lines: [
        L(1, 'Hey, how was the weekend?', '嘿，周末怎么样？'),
        L(0, 'Quiet. I finally finished a book I started in March.', '挺安静。三月开始的书终于看完了。'),
        L(1, 'Nice. I meant to rest and ended up painting the flat.', '不错。我本来想休息，结果刷了一天墙。'),
        L(0, 'That sounds like work, not rest.', '那听着像干活，不像休息。'),
        L(1, 'It was. Are you coming to the team lunch on Thursday?', '确实是。周四团队午餐你来吗？'),
        L(0, 'I did not know about it. Where is it?', '我不知道有这事。在哪儿？'),
        L(1, 'The Thai place round the corner. Twelve thirty.', '拐角那家泰国菜。十二点半。'),
        L(0, 'Count me in. Should I bring anything?', '算我一个。要带什么吗？'),
      ],
      variants: [
        { tag: '周一茶水间', setting: '周一早上，你在茶水间接咖啡，同事也进来了。' },
        V('同事要离职', '你听说同事要走了，想确认一下。', {
          4: ['I heard you are leaving. Is it true?', '听说你要走了。真的吗？'],
          5: ['Friday is my last day. I start somewhere smaller in June.', '周五是我最后一天。六月去一家小点的公司。'],
        }),
        V('问项目进展', '你想打听另一个组的项目。', {
          0: ['Do you know where the billing migration stands?', '你知道计费迁移到什么程度了吗？'],
          1: ['Still in testing. They found a rounding bug last week.', '还在测试。上周发现一个舍入 bug。'],
        }),
        V('抱怨会议', '你刚开完一个两小时的会。', {
          0: ['That meeting could have been an email.', '那个会其实一封邮件就够了。', 'That meeting could have been an email 是办公室吐槽的经典句。'],
          1: ['Two hours and no decision. Same as last week.', '两小时没结论。跟上周一样。'],
        }),
        V('聊通勤', '你想问对方怎么上班。', {
          2: ['How long is your commute?', '你通勤要多久？'],
          3: ['Forty minutes if I catch the fast train.', '赶上快车四十分钟。'],
        }),
      ],
      phrases: [
        P('How was the weekend?', '周末怎么样？', '周一最安全的开场。'),
        P('Count me in.', '算我一个。', '答应邀约的口语说法。'),
        P('That meeting could have been an email.', '那会一封邮件就够了。', '办公室通用吐槽，慎用于领导在场时。'),
      ],
    },

    /* ---------------- 视频会议开场 ---------------- */
    {
      
      branches: [
        B(5, 'change', '对方共享不了，你要换个方式看材料',
          S('I cannot share. The file is on my other laptop.', '我共享不了。文件在另一台电脑上。'),
          [O(S('Could you email it and I will follow on my side?', '能发邮件吗？我这边跟着看。'), S('Sending now. Give it a minute.', '正在发。等一下。')),
           O(S('Just talk me through the numbers.', '你直接讲数字就行。'), S('Fine. Page one, the totals.', '好。第一页，总数。'))]),
      ],
id: 'video-call', name: '视频会议连不上', lv: 4, cefr: 'B1',
      roles: ['你', '对方'],
      lines: [
        L(1, 'Can you hear me now?', '现在能听见吗？'),
        L(0, 'I can, but your video is frozen.', '能听见，但你画面卡住了。'),
        L(1, 'Let me turn the camera off. Better?', '我把摄像头关了。好点吗？'),
        L(0, 'Much better. You were breaking up for a moment.', '好多了。刚才断断续续的。'),
        L(1, 'Sorry, the wifi here is weak. Shall we continue?', '抱歉，这边网络不好。继续？'),
        L(0, 'Yes. Before we start, could you share the deck?', '好。开始前，能共享一下文档吗？'),
        L(1, 'Sharing now. Can you see it?', '正在共享。能看到吗？'),
        L(0, 'I can. The third slide is blank on my side.', '能看到。第三页我这边是空白。'),
      ],
      variants: [
        { tag: '画面卡住', setting: '跨国会议，你这边网络时好时坏。' },
        V('听不清', '对方的声音一直在断续。', {
          1: ['Sorry, you are cutting out. Could you repeat that?', '抱歉，你那边断断续续。能再说一遍吗？'],
          3: ['Thanks. I caught the date but not the owner.', '谢谢。日期听到了，负责人没听到。'],
        }),
        V('背景太吵', '你这边有人在装修。', {
          0: ['Apologies for the noise. There is building work next door.', '抱歉有噪音。隔壁在施工。'],
          1: ['No problem. I will turn on captions.', '没事。我开字幕。'],
        }),
        V('要录屏', '你想录下这段会议。', {
          5: ['Do you mind if I record this? It is easier than notes.', '介意我录一下吗？比记笔记省事。'],
        }),
        V('会议超时', '时间到了但还有事项没讨论。', {
          7: ['We are out of time. Shall we take the rest offline?', '时间到了。剩下的线下聊？'],
        }),
      ],
      phrases: [
        P('Can you hear me now?', '现在能听见吗？', '视频会议第一句永远是这句。'),
        P('You are breaking up.', '你那边断断续续。', 'breaking up 指声音或画面中断。'),
        P('Shall we take the rest offline?', '剩下的线下聊？', 'offline 在这里是「会后单独说」。'),
      ],
    },

    /* ---------------- 工作交接 ---------------- */
    {
      
      branches: [
        B(4, 'probe', '对方把问题推回给你，你要给出可执行的答案',
          S('Then I am the only one left. What if it breaks in my first week?', '那我是唯一剩下的人了。第一周就出问题怎么办？'),
          [O(S('Call me. I will answer for the first month.', '打给我。第一个月我都会接。'), S('That takes a lot off my mind.', '这让我安心不少。')),
           O(S('We write a runbook together before Friday.', '周五前我们一起写份操作手册。'), S('Two hours, then. I will book a room.', '那两小时。我订个会议室。'))]),
      ],
id: 'handover', name: '离职交接', lv: 5, cefr: 'B2',
      roles: ['你', '接手同事'],
      lines: [
        L(0, 'Thanks for taking this over. Where do you want to start?', '谢谢你接手。你想从哪儿开始？'),
        L(1, 'The billing service. I have never touched it.', '计费服务。我从没碰过。'),
        L(0, 'It has three parts. The docs cover two of them.', '它有三部分。文档覆盖了两部分。'),
        L(1, 'Which one is not documented?', '哪部分没写文档？'),
        L(0, 'The nightly job. Only two people understand it, and one is leaving.', '夜间任务。只有两个人懂，其中一个要走了。'),
        L(1, 'That is me now. Can we go through it together?', '现在就是我了。能一起过一遍吗？'),
        L(0, 'I blocked two hours tomorrow. Bring questions.', '我明天留了两小时。带上问题来。'),
        L(1, 'I will. And who do I ask when something breaks at night?', '好。夜里出问题我问谁？'),
        L(0, 'The on-call rota is in the wiki. Start with the platform team.', '值班表在 wiki 上。先找平台组。'),
      ],
      variants: [
        { tag: '接手计费服务', setting: '同事下周离职，你要接手他维护了三年的服务。' },
        V('交接文档', '你想先确认文档在哪。', {
          1: ['Where is the documentation?', '文档在哪儿？'],
          2: ['In the repo, under docs. It is a year out of date.', '在仓库的 docs 下。落后一年了。'],
        }),
        V('权限', '你没有生产环境的权限。', {
          5: ['I do not have production access yet. Who approves it?', '我还没有生产环境权限。谁审批？'],
          6: ['Raise a ticket and cc me. I will approve before Friday.', '提个工单抄送我。我周五前批。'],
        }),
        V('历史包袱', '你想知道哪些代码不能动。', {
          3: ['Which parts should I not touch?', '哪些部分我不能动？'],
          4: ['The reconciliation script. Nobody knows why it works.', '对账脚本。没人知道它为什么能跑。'],
        }),
        V('时间不够', '交接只剩一天。', {
          0: ['We only have one day. What is the minimum I need to know?', '我们只有一天。最少要知道什么？'],
        }),
      ],
      phrases: [
        P('Where do you want to start?', '你想从哪儿开始？', '交接、培训、讨论都能用。'),
        P('Bring questions.', '带上问题来。', '简短但有效的邀请。'),
        P('It is a year out of date.', '落后一年了。', 'out of date 是过期，不是「出去约会」。'),
      ],
    },

    /* ---------------- 客户投诉 ---------------- */
    {
      id: 'client-complaint', name: '接客户投诉', lv: 5, cefr: 'B2',
      roles: ['你', '客户'],
      lines: [
        L(1, 'We have been waiting three weeks for the report.', '那份报告我们等了三周。'),
        L(0, 'I understand, and I am sorry. Let me tell you where it stands.', '我理解，也很抱歉。我说一下现在的情况。'),
        L(1, 'Where it stands is that my board meeting is on Monday.', '现在的情况是，我周一的董事会。'),
        L(0, 'You will have it Friday. I will send a draft Thursday for your comments.', '周五会给您。周四我先发一版草稿给您好提意见。'),
        L(1, 'Friday is cutting it close. Why was it late?', '周五太紧了。为什么会晚？'),
        L(0, 'Two of the numbers came in late from your finance team.', '有两个数字你们财务给晚了。'),
        L(1, 'Nobody told me that.', '没人告诉我这件事。'),
        L(0, 'That is on us. I should have flagged it two weeks ago.', '这是我们的问题。我两周前就该提出来。'),
        L(1, 'All right. Friday, and I want the draft Thursday.', '行。周五，还有周四要看到草稿。'),
      ],
      variants: [
        { tag: '报告迟到', setting: '客户在电话里语气很硬，董事会要用这份报告。' },
        V('产品故障', '客户的生产环境昨天停了两小时。', {
          1: ['Your service was down for two hours yesterday.', '你们的服务昨天停了两小时。'],
          2: ['I know. The post-mortem is being written now.', '我知道。复盘正在写。'],
        }),
        V('账单争议', '客户认为被多收了钱。', {
          1: ['This invoice is double what we agreed.', '这张发票是我们约定金额的两倍。'],
          2: ['Let me pull the contract and compare line by line.', '我调合同，逐条对。'],
        }),
        V('要换对接人', '客户不想再跟你对接。', {
          1: ['I would rather deal with someone else.', '我想换个人对接。'],
        }),
        V('挽回', '问题解决了，你想确认关系没坏。', {
          8: ['Thank you for being direct with me. I will call Friday to confirm.', '谢谢您直接跟我说。我周五打电话确认。'],
        }),
      ],
      branches: [
        {
          at: 3, kind: 'probe',
          task: '客户逼你给一个承诺，你要给得既确定又留余地',
          prompt: S('Can you promise it will be on my desk Friday morning?', '你能保证周五上午放到我桌上吗？'),
          options: [
            O(S('By noon Friday, and I will confirm Thursday night.', '周五中午前，周四晚上我跟您确认。'), S('Noon Friday. I will hold you to that.', '周五中午。我会盯着。')),
            O(S('I can promise Thursday night, not Friday morning.', '我能保证周四晚上，不是周五上午。'), S('Then Thursday night it is.', '那就周四晚上。')),
          ],
        },
      ],
      phrases: [
        P('Let me tell you where it stands.', '我说一下现在的情况。', '接投诉时先把事实摆出来，比连声道歉有用。'),
        P('That is on us.', '这是我们的问题。', '主动认责，一句话止住火气。'),
        P('I should have flagged it earlier.', '我该早点提出来。', 'flag 是「提出来、标记风险」。'),
      ],
    },

    /* ---------------- 谈加薪 ---------------- */
    {
      id: 'raise', name: '跟主管谈加薪', lv: 6, cefr: 'B2',
      roles: ['你', '主管'],
      lines: [
        L(0, 'Do you have twenty minutes? I would like to talk about my role.', '你有二十分钟吗？我想聊聊我的岗位。'),
        L(1, 'Sure, sit down. What is on your mind?', '当然，坐。什么事？'),
        L(0, 'I have taken on the billing service and two new clients this year.', '今年我接了计费服务，还带了两个新客户。'),
        L(1, 'You have. The team is smaller than it was.', '是的。团队比之前小了。'),
        L(0, 'My scope has grown, but my title and pay have not changed.', '我的范围扩大了，但职级和薪资没变。'),
        L(1, 'What are you asking for?', '你想要什么？'),
        L(0, 'A review of my band, and a title that matches the work.', '重新评估我的职级带宽，还有匹配工作的头衔。', 'band 是薪资带宽，谈薪时说 band 比说 money 专业。'),
        L(1, 'I cannot promise a number today. Can I come back to you next week?', '我今天给不了具体数字。下周回复你可以吗？'),
        L(0, 'That is fair. I will send you the list of what I have taken on.', '可以。我把接手的事情列一份发你。'),
      ],
      variants: [
        { tag: '范围变大薪资没变', setting: '你接手了离职同事的全部工作，半年没有调薪。' },
        V('拿到外部 offer', '你手上有另一个 offer，想给主管一个机会。', {
          6: ['I have an offer at fifteen percent more. I would rather stay.', '我有个高百分之十五的 offer。但我更想留下。'],
        }),
        V('要升职', '你想从高级工程师升到技术负责人。', {
          6: ['I would like to be considered for tech lead in the next cycle.', '下个周期我想被考虑做技术负责人。'],
        }),
        V('要远程', '你想要每周两天远程，不是加薪。', {
          6: ['What I want most is two remote days a week.', '我最想要的是每周两天远程。'],
        }),
        V('被拒绝', '主管说今年没有预算，你想知道下一步。', {
          8: ['I understand. What would make it a yes in six months?', '我理解。半年后做到什么才能批？'],
        }),
      ],
      branches: [
        {
          at: 6, kind: 'probe',
          task: '对方要你把要求量化，你要给出可比较的依据',
          prompt: S('Give me a number. What do you think you should be on?', '给我个数。你觉得应该是多少？'),
          options: [
            O(S('The market range for this scope is ten to fifteen percent above mine.', '这个范围的市场价比我高百分之十到十五。'), S('Let me check that against our bands.', '我拿这个跟我们的带宽对一下。')),
            O(S('I would rather hear your range first.', '我更想先听你们的范围。'), S('Fair enough. I will bring it next week.', '行。我下周带来。')),
          ],
        },
      ],
      phrases: [
        P('My scope has grown, but my pay has not.', '我的范围扩大了，薪资没变。', '谈薪的核心论点，一句话说清。'),
        P('What are you asking for?', '你想要什么？', '主管开口问，说明有戏。'),
        P('What would make it a yes in six months?', '半年后做到什么才能批？', '被拒后最有用的追问。'),
      ],
    },
  ],
};
