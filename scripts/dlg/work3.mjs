import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '职场',
  items: [
    {
      id: 'timezone-sync', name: '跨时区协作', lv: 5, cefr: 'B2',
      roles: ['你', '海外同事'],
      lines: [
        L(1, 'Your morning is my evening, so let us agree on an overlap.', '你的早上是我的晚上，定个重叠时段吧。'),
        L(0, 'I can do three to five my time, which is your afternoon.', '我这边三点到五点可以，就是你们的下午。'),
        L(1, 'That works for two days a week. The rest, write it down.', '一周两天可以。其余写下来。'),
        L(0, 'I will post a daily note before I log off.', '我每天下班前发一条进展。'),
        L(1, 'And if something is urgent at your night?', '如果你们夜里出急事呢？'),
        L(0, 'Call the on-call phone. Do not wait for me.', '打值班电话。别等我。'),
        L(1, 'Good. Who else can answer for your area?', '好。你那块还有谁能回答？'),
        L(0, 'Tom knows the deploy process. I will add him to the channel.', 'Tom 懂发布流程。我把他加进频道。'),
      ],
      variants: [
        { tag: '和欧洲团队对接', setting: '你和欧洲团队差七小时，上线撞在一起。' },
        V('只有一小时重叠', '重叠时间只剩一小时。', {
          1: ['We only have one hour of overlap. Is that enough?', '我们只重叠一小时。够吗？'],
          2: ['For decisions, no. For blocking issues, yes.', '做决策不够。解阻塞够。'],
        }),
        V('对方不回消息', '你发的消息第二天才回。', {
          0: ['My questions sit for a day. Can we agree a response time?', '我的问题要等一天。能定个响应时间吗？'],
        }),
        V('节假日', '两边假期不同。', {
          4: ['Your holiday week is our busiest. How do we cover it?', '你们放假那周我们最忙。怎么顶？'],
        }),
        V('文档', '你想减少会议。', {
          6: ['Could we replace the weekly call with a written update?', '能把周会换成书面更新吗？'],
        }),
        V('时差疲劳', '你受不了熬夜开会。', {
          7: ['I cannot keep taking calls at eleven at night.', '我不能一直十一点开会。'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方问紧急情况怎么处理，你要给明确规则',
          S('What counts as urgent enough to call at night?', '什么程度算急到可以夜里打电话？'),
          [O(S('Anything customer-facing and broken. Nothing else.', '影响客户且已坏。别的都不算。'), S('That is a clear line. I will write it up.', '界线很清楚。我写进文档。')),
           O(S('If you are unsure, call. I would rather be woken.', '不确定就打。我宁愿被吵醒。'), S('That will be abused, but I will note it.', '这会被人滥用，不过我先记下。'))]),
      ],
      phrases: [
        P('Let us agree on an overlap.', '定个重叠时段吧。', '跨时区协作的第一件事。'),
        P('Call the on-call phone.', '打值班电话。', 'on-call 是值班。'),
        P('Anything customer-facing and broken.', '影响客户且已坏。', '定义「紧急」的标准。'),
      ],
    },

    {
      id: 'vendor-manage', name: '管理外包团队', lv: 5, cefr: 'B2',
      roles: ['你', '外包负责人'],
      lines: [
        L(1, 'The sprint is half done. Two items slipped.', '这个迭代做了一半。有两项滑了。'),
        L(0, 'Which two, and why?', '哪两项，为什么？'),
        L(1, 'The export and the permissions screen. Both need your API.', '导出和权限页。都要你们的接口。'),
        L(0, 'The API has been ready since Monday. Did you get the docs?', '接口周一开始就绪。文档收到了吗？'),
        L(1, 'We got them yesterday. The example was wrong.', '昨天才收到。示例是错的。'),
        L(0, 'Then that is on us. I will fix the example today.', '那是我们的问题。我今天改示例。'),
        L(1, 'And we need a decision on the export format by Friday.', '还有，导出格式周五前要定。'),
        L(0, 'You will have it tomorrow, in writing.', '明天给你，书面。'),
      ],
      variants: [
        { tag: '两项延期', setting: '外包团队第三个迭代，进度落后。' },
        V('质量不行', '交付的代码 bug 很多。', {
          0: ['The last delivery had eleven defects. That is too many.', '上次交付有十一个缺陷。太多了。'],
          1: ['We lost a tester. The regression suite was skipped.', '我们少了个测试。回归没跑。'],
        }),
        V('加人', '对方想加人。', {
          3: ['We would like to add two developers next month.', '我们下个月想加两个人。'],
          4: ['Adding people now will slow us down. Let us fix the pipeline first.', '现在加人会更慢。先把流程修好。'],
        }),
        V('需求变更', '你这边又改了需求。', {
          5: ['We changed the scope last week. How much does that cost?', '上周我们改了范围。代价多少？'],
        }),
        V('账单', '对方账单超出预算。', {
          7: ['The invoice is twenty percent over the estimate. Can we go through it?', '发票超估算两成。能过一遍吗？'],
        }),
        V('换人', '对方换了主力。', {
          1: ['You replaced the lead without telling us. Why?', '你们换了负责人没通知。为什么？'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方把延误归到你这边，你要认领但不全认',
          S('Honestly, most of the delay is your API documentation.', '说实话，大部分延误是你们的接口文档。'),
          [O(S('The example was wrong, and that is ours. The rest was late access.', '示例错了，那是我们的。其余是权限给晚了。'), S('Fair. Let us split the difference.', '合理。我们各认一半。')),
           O(S('Let us not score it. What unblocks you now?', '别算账了。现在什么能让你动起来？'), S('The corrected example and a decision on format.', '改好的示例和格式决定。'))]),
      ],
      phrases: [
        P('Two items slipped.', '有两项滑了。', 'slip 是延期。'),
        P('That is on us.', '那是我们的问题。', '主动认领，才谈得下去。'),
        P('What unblocks you now?', '现在什么能让你动起来？', '把追责转成推进。'),
      ],
    },

    {
      id: 'product-review', name: '产品评审会', lv: 5, cefr: 'B2',
      roles: ['你', '产品经理'],
      lines: [
        L(1, 'This is the flow for the new checkout. Feedback welcome.', '这是新结账流程。欢迎提意见。'),
        L(0, 'Where does the guest option sit? I cannot see it.', '游客结账在哪儿？我没看到。'),
        L(1, 'We removed it. Data says most people log in.', '我们去掉了。数据显示多数人会登录。'),
        L(0, 'Most is not all. What happens to the rest?', '多数不是全部。其余的怎么办？'),
        L(1, 'They create an account at the end.', '他们在最后注册。'),
        L(0, 'That adds a step after payment. People abandon there.', '那是在付款后加一步。人会在这儿流失。'),
        L(1, 'Do we have numbers for that?', '这个有数据吗？'),
        L(0, 'Last quarter, forty percent dropped at registration.', '上季度四成在注册环节流失。'),
      ],
      variants: [
        { tag: '结账流程评审', setting: '评审会八个人，设计师和工程师都在。' },
        V('支持方案', '你认可这个方案。', {
          0: ['The flow is clear. I would only change the button label.', '流程清楚。我只想改按钮文案。'],
          1: ['Label feedback is the cheapest kind. What would you use?', '文案是最便宜的意见。你会用什么？'],
        }),
        V('技术成本', '实现成本很高。', {
          6: ['This needs a rewrite of the payment service. Do we know that?', '这要重写支付服务。大家知道吗？'],
        }),
        V('没数据', '对方拿不出数据。', {
          3: ['You said most people log in. Where is that from?', '你说多数人登录。数据哪来的？'],
        }),
        V('可访问性', '你担心无障碍。', {
          7: ['The contrast on the grey button fails the standard.', '灰按钮的对比度不达标。'],
        }),
        V('时间', '上线时间太紧。', {
          5: ['Can we ship the simple version first and test it?', '能先上简单版再测吗？'],
        }),
      ],
      branches: [
        B(5, 'probe', '产品经理要你给判断，你要给依据',
          S('So what would you do about the guest option?', '那游客结账你怎么处理？'),
          [O(S('Keep it, behind a link. One extra tap, no account.', '保留，放在一个链接后面。多点一下，不用注册。'), S('That is testable. I will add it.', '这个可以测。我加上。')),
           O(S('I would test both flows for a week.', '两种流程各测一周。'), S('We do not have a week. Pick one.', '我们没一周时间。选一个。'))]),
      ],
      phrases: [
        P('Feedback welcome.', '欢迎提意见。', '评审开场。'),
        P('Most is not all.', '多数不是全部。', '反驳数据结论的短句。'),
        P('People abandon there.', '人会在这儿流失。', 'abandon 是放弃流程。'),
      ],
    },
  ],
};
