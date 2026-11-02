import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '职场',
  items: [
    {
      id: 'first-day', name: '入职第一天', lv: 3, cefr: 'B1',
      roles: ['你', '主管'],
      lines: [
        L(1, 'Welcome. Let me show you around the floor.', '欢迎。我带你转一圈。'),
        L(0, 'Thanks. Where should I sit?', '谢谢。我坐哪儿？'),
        L(1, 'By the window, next to Sam. He will set up your laptop.', '窗边，Sam 旁边。他帮你配电脑。'),
        L(0, 'Do I need to do any paperwork today?', '今天要办什么手续吗？'),
        L(1, 'HR will email you. Bank details and next of kin.', '人事会给你发邮件。银行信息和紧急联系人。'),
        L(0, 'Who do I ask if I get stuck?', '卡住了问谁？'),
        L(1, 'Sam for anything technical, me for anything else.', '技术问题找 Sam，其它找我。'),
        L(0, 'Got it. Is there a standup I should join today?', '明白。今天有站会我要参加吗？'),
      ],
      variants: [
        { tag: '第一天到办公室', setting: '你换了新公司，第一天提前二十分钟到。' },
        V('远程入职', '团队在三个城市，你远程入职。', {
          1: ['I am remote. How do I get my laptop?', '我远程办公。电脑怎么拿？'],
          2: ['It ships today. Until then, use your own machine with a VPN.', '今天就寄。在那之前用你自己的电脑连 VPN。'],
        }),
        V('换组', '你在公司内部转组。', {
          0: ['I am moving over from the payments team. Who do I hand my old work to?', '我从支付组转过来。旧工作交给谁？'],
        }),
        V('实习生', '你是实习生。', {
          3: ['Is there a buddy I should shadow for the first week?', '第一周有带我的人吗？'],
          4: ['Tom. Sit with him and take notes, even if it is boring.', 'Tom。跟他坐着记笔记，无聊也记。'],
        }),
        V('回聘', '你之前在这家公司待过。', {
          0: ['I worked here three years ago. Do my old accounts still exist?', '我三年前在这儿待过。旧账号还在吗？'],
        }),
        V('问流程', '你想知道日常节奏。', {
          6: ['What does a normal week look like? Meetings, or mostly heads down?', '正常一周是什么样？会议多还是埋头干？'],
        }),
      ],
      branches: [
        B(5, 'probe', '主管问你的预期，你要说得具体',
          S('What do you want to be doing in six months?', '你半年后想做到什么程度？'),
          [O(S('Owning one service end to end, without help.', '独立负责一个服务，不用人帮。'), S('That is a clear goal. We can plan around it.', '目标很清楚。可以围着它排。')),
           O(S('I would rather find out first, then decide.', '我想先看看，再定。'), S('Fair. Ask me again in a month.', '合理。一个月后再问我。'))]),
      ],
      phrases: [
        P('Where should I sit?', '我坐哪儿？', '第一天最实际的问题。'),
        P('Who do I ask if I get stuck?', '卡住了问谁？', '比硬撑一周强。'),
        P('What does a normal week look like?', '正常一周是什么样？', '了解节奏比了解职责有用。'),
      ],
    },

    {
      id: 'conflict', name: '和同事意见冲突', lv: 5, cefr: 'B2',
      roles: ['你', '同事'],
      lines: [
        L(1, 'I do not think we should ship this week.', '我觉得这周不该上线。'),
        L(0, 'Why not? QA signed off yesterday.', '为什么？测试昨天签了。'),
        L(1, 'They signed off the old build. The fix went in after.', '他们签的是旧构建。修复是之后才进去的。'),
        L(0, 'Then we ship the old build and patch on Monday.', '那就发旧构建，周一打补丁。'),
        L(1, 'That is two releases in three days. Support will hate it.', '三天两个版本。客服会疯。'),
        L(0, 'What would you do instead?', '那你想怎么办？'),
        L(1, 'Wait until Thursday and ship once.', '等到周四，一次发完。'),
        L(0, 'Fine by me, but I want that in writing to the client.', '我没问题，但你要写下来发给客户。'),
      ],
      variants: [
        { tag: '该不该这周上线', setting: '上线前一天的评审会，两个人意见相反。' },
        V('设计争议', '你和设计师对布局意见不同。', {
          0: ['I think the button belongs at the top. Data says people miss it.', '我觉得按钮该放上面。数据显示有人找不到。'],
          1: ['It breaks the visual hierarchy. Let us test both next week.', '那会破坏视觉层级。下周两个都测。'],
        }),
        V('优先级', '两个需求撞车。', {
          0: ['We cannot do both this sprint. Which one matters more?', '这个迭代做不完两个。哪个更要紧？'],
          1: ['The refund bug. Money is leaking every day.', '退款那个 bug。每天都在漏钱。'],
        }),
        V('测试环境', '你俩抢同一个测试环境。', {
          4: ['I need staging this afternoon. Can you take it tomorrow?', '我下午要用测试环境。你能明天吗？'],
          5: ['I have a demo at four. Take it after five.', '我四点有个演示。五点后归你。'],
        }),
        V('回滚', '线上出问题了，该不该回滚。', {
          0: ['Error rate doubled after the release. I am rolling back.', '发布后错误率翻倍。我要回滚。'],
          1: ['Give it ten minutes. It may be the cache warming.', '再等十分钟。可能是缓存预热。'],
        }),
        V('会后', '你想把结论固定下来。', {
          7: ['Let us write down what we agreed, so nobody reopens it.', '把结论写下来吧，免得再翻。'],
        }),
      ],
      branches: [
        B(5, 'probe', '同事把球踢回给你，你要给出可执行的方案',
          S('What would you do instead?', '那你想怎么办？'),
          [O(S('Ship behind a flag, turn it on Tuesday.', '带开关上线，周二再打开。'), S('That works. Support gets one release.', '这个行。客服只面对一个版本。')),
           O(S('Let us ask the client which risk they prefer.', '问客户他们更愿意承担哪个风险。'), S('I would rather decide ourselves.', '我更希望我们自己定。'))]),
      ],
      phrases: [
        P('QA signed off yesterday.', '测试昨天签了。', 'sign off 是正式验收。'),
        P('What would you do instead?', '那你想怎么办？', '把争论转成方案。'),
        P('I want that in writing.', '我要书面确认。', '口头共识最容易反悔。'),
      ],
    },

    {
      id: 'performance-review', name: '绩效面谈', lv: 5, cefr: 'B2',
      roles: ['你', '主管'],
      lines: [
        L(1, 'Let us go through the year. Overall, you are on track.', '过一下这一年。整体你是达标的。'),
        L(0, 'Thanks. Where do you think I could do better?', '谢谢。你觉得我哪儿能做得更好？'),
        L(1, 'You are strong technically, but you work quietly.', '技术很强，但你太安静了。'),
        L(0, 'Meaning I do not flag risks early enough?', '是说我没有及时报风险？'),
        L(1, 'Partly. People only hear from you when it is done.', '一部分是。大家只在完成时听到你。'),
        L(0, 'I can send a short weekly note. Would that help?', '我可以每周发一份简短进展。有用吗？'),
        L(1, 'It would. Keep it to five lines.', '有用。控制在五行。'),
        L(0, 'Understood. And what would a promotion case look like?', '明白。那升职需要什么条件？'),
      ],
      variants: [
        { tag: '年度达标', setting: '年度评估，你等这个结论等了两个月。' },
        V('超预期', '你今年带了一个新人还接了新客户。', {
          0: ['I took on a new client and mentored someone. Does that change the rating?', '我接了个新客户还带了个新人。评级会变吗？'],
          1: ['It puts you in the top band, but the budget is set.', '能进最高一档，但预算已经定了。'],
        }),
        V('需要改进', '你的评级是「部分达标」。', {
          0: ['The rating says partially met. Which part?', '评级是部分达标。哪部分？'],
          1: ['Two deadlines slipped. The work was good, the timing was not.', '两次延期。活干得好，时间没守住。'],
        }),
        V('试用期', '你还在试用期。', {
          6: ['What has to be true for the probation to pass?', '试用期通过的标准是什么？'],
          7: ['Own one feature end to end by month five.', '第五个月前独立负责一个功能。'],
        }),
        V('目标调整', '你想改明年的目标。', {
          7: ['Could next year goal be about depth, not volume?', '明年目标能定在深度而不是数量上吗？'],
        }),
        V('问薪资', '你想把评级和钱挂钩。', {
          6: ['Does the rating translate into a raise this cycle?', '这个评级这轮会带调薪吗？'],
        }),
      ],
      branches: [
        B(3, 'probe', '主管的反馈很含糊，你要追到具体',
          S('You could be more visible in the team.', '你在团队里可以更显眼一些。'),
          [O(S('Visible how? Reviews, demos, or writing?', '怎么显眼？评审、演示，还是写文档？'), S('Writing. Your design notes are the best in the team.', '写文档。你的设计笔记是全组最好的。')),
           O(S('I would rather ship than present.', '我更愿意做事而不是讲。'), S('Then write more. Same effect, less stage.', '那就多写。效果一样，不用上台。'))]),
      ],
      phrases: [
        P('Where could I do better?', '我哪儿能做得更好？', '面谈最有用的一个问题。'),
        P('People only hear from you when it is done.', '大家只在完成时听到你。', '「太安静」的具体表现。'),
        P('What would a promotion case look like?', '升职需要什么条件？', '比问「我能升吗」有效。'),
      ],
    },

    {
      id: 'layoff', name: '被裁员沟通', lv: 6, cefr: 'B2',
      roles: ['你', '人事'],
      lines: [
        L(1, 'I have difficult news. Your role is being cut.', '我有个坏消息。你的岗位被取消了。'),
        L(0, 'I see. Is this effective immediately?', '明白。是立即生效吗？'),
        L(1, 'Your last day is the end of the month. From today you are on garden leave.', '最后一天是月底。从今天起你带薪离岗。'),
        L(0, 'What is the package?', '补偿是什么？'),
        L(1, 'Three months pay, plus outplacement support.', '三个月工资，加求职辅导。'),
        L(0, 'Can I have that in writing before I sign anything?', '签任何东西之前能给我书面版本吗？'),
        L(1, 'Of course. Take it home and read it.', '当然。带回去读。'),
        L(0, 'My visa depends on this job. What are my options?', '我的签证靠这份工作。我有什么选择？'),
      ],
      variants: [
        { tag: '岗位被取消', setting: '公司重组，你在名单里。' },
        V('整个团队', '整个团队都被裁。', {
          1: ['The whole team is affected. This is not about your work.', '整个团队都受影响。这跟你的工作表现无关。'],
          2: ['That is some comfort. Who else is in the meeting today?', '这算点安慰。今天还有谁被谈？'],
        }),
        V('自愿离职', '公司在征集自愿离职。', {
          0: ['Is the voluntary scheme still open? What does it pay?', '自愿离职方案还开着吗？给多少？'],
          1: ['Four months, and it closes on Friday.', '四个月，周五截止。'],
        }),
        V('绩效为由', '对方说是因为绩效。', {
          0: ['The letter says performance. I have no written warnings.', '信上写的是绩效。我从没收到过书面警告。'],
          1: ['Then we should say role redundancy instead.', '那我们该写岗位裁撤。'],
        }),
        V('远程被通知', '你在视频会议里被告知。', {
          0: ['I would rather have had this conversation in person.', '我更希望这个对话是当面进行的。'],
        }),
        V('问设备', '你想知道设备和交接。', {
          6: ['When do I hand back the laptop, and how do I get my files?', '电脑什么时候还，我的文件怎么拿？'],
        }),
      ],
      branches: [
        B(5, 'probe', '人事催你当场签，你要争取时间',
          S('The package is better if you sign today.', '今天签的话补偿更高。'),
          [O(S('How much better? I need the number before I decide.', '高多少？我要看到数字再决定。'), S('One extra month, if signed by five.', '多一个月，五点前签。')),
           O(S('I am not signing anything today. I will take advice first.', '我今天不签。我要先咨询。'), S('That is your right. I will hold the offer until Friday.', '这是您的权利。我把方案留到周五。'))]),
      ],
      phrases: [
        P('Is this effective immediately?', '是立即生效吗？', '被裁时第一个要问的。'),
        P('Can I have that in writing?', '能给我书面版本吗？', '没签字前一切都可以谈。'),
        P('This is not about your work.', '这跟你的表现无关。', '标准说法，也是裁员话术。'),
      ],
    },

    {
      
      branches: [
        B(4, 'probe', '前主管问你要强调什么，你要给出可核查的例子',
          S('What should I say about the outage?', '那次故障我该怎么说？'),
          [O(S('That I owned it, wrote the post-mortem, and shipped the fix.', '说我扛下来了，写了复盘，也修好了。'), S('That is the version I remember too.', '我记得的也是这个版本。')),
           O(S('That the vendor caused it, not the team.', '说是供应商的问题，不是团队。'), S('I would rather not blame a vendor. I will keep it factual.', '我不想甩锅给供应商。我就照实说。'))]),
      ],
id: 'reference', name: '请前老板做推荐人', lv: 4, cefr: 'B1',
      roles: ['你', '前主管'],
      lines: [
        L(0, 'Would you be willing to be a reference for me?', '你愿意给我做个推荐人吗？'),
        L(1, 'Of course. What is the role?', '当然。什么岗位？'),
        L(0, 'A senior engineer position at a smaller company.', '一家小公司的高级工程师。'),
        L(1, 'What do you want me to emphasise?', '你希望我强调什么？'),
        L(0, 'The migration project, and how I handled the outage.', '迁移项目，还有那次故障我怎么处理的。'),
        L(1, 'I remember both. Will they call or email?', '两件我都记得。他们打电话还是发邮件？'),
        L(0, 'A short call, probably next week.', '一个短电话，大概下周。'),
        L(1, 'Fine. Send me the job description so I am consistent.', '行。把职位描述发我，我保持一致。'),
      ],
      variants: [
        { tag: '请前主管', setting: '你面试到最后一轮，对方要两个推荐人。' },
        V('前同事', '你想找同级同事。', {
          0: ['Could you be a reference? We worked on the same team for two years.', '你能做推荐人吗？我们在一个组两年。'],
          1: ['Happy to. I can speak to how you worked with the client.', '乐意。我可以讲你怎么对客户的。'],
        }),
        V('学校导师', '你刚毕业。', {
          0: ['Would my tutor be a better reference than a manager?', '找导师做推荐人比找经理好吗？'],
        }),
        V('背调', '公司要做背景调查。', {
          6: ['They will do a background check. Is there anything I should warn you about?', '他们要做背调。有什么我该先跟你说的吗？'],
        }),
        V('前老板不太乐意', '前老板回复很冷淡。', {
          2: ['He said he is busy but could write a short note. Is that enough?', '他说忙，但可以写个短评。够吗？'],
        }),
        V('感谢', '对方答应了，你想表达感谢。', {
          7: ['Thank you. I will send you the details and a reminder a day before.', '谢谢。我把细节发你，前一天再提醒。'],
        }),
      ],
      phrases: [
        P('Would you be willing to be a reference?', '你愿意做推荐人吗？', 'reference 是推荐人，不是推荐信。'),
        P('What do you want me to emphasise?', '你希望我强调什么？', '主动给方向，推荐才有用。'),
        P('So I am consistent.', '这样我说的一致。', '提前对齐口径，避免穿帮。'),
      ],
    },

    {
      id: 'supplier', name: '和供应商谈价', lv: 6, cefr: 'B2',
      roles: ['你', '供应商'],
      lines: [
        L(1, 'Our price is fixed for this year.', '我们的价格今年是固定的。'),
        L(0, 'We doubled the order. That should move the price.', '我们的订单翻倍了。价格应该能动。'),
        L(1, 'How much are we talking about?', '你想谈多少？'),
        L(0, 'Ten percent, and net sixty instead of thirty.', '十个点，账期从三十天改六十天。'),
        L(1, 'Ten is too much. I can do six and net forty-five.', '十太多。六，账期四十五天。'),
        L(0, 'Seven and net sixty, and we sign for two years.', '七，账期六十天，我们签两年。'),
        L(1, 'Seven and net fifty. That is my final offer.', '七，账期五十天。这是我的底线。'),
        L(0, 'Agreed. Send the contract and we will sign this week.', '成交。把合同发来，这周签。'),
      ],
      variants: [
        { tag: '订单翻倍要折扣', setting: '你们把采购量翻了一倍，想重新谈价。' },
        V('对方涨价', '供应商要涨一成五。', {
          0: ['Fifteen percent is above the index. What is driving it?', '一成五高于指数。是什么原因？'],
          1: ['Freight and the new packaging. Both went up in March.', '运费和新包装。三月都涨了。'],
        }),
        V('要独家', '你想拿独家代理。', {
          4: ['We would want exclusivity in this region for two years.', '我们想要这个区域两年独家。'],
          5: ['Exclusivity needs a minimum volume. Double it.', '独家要有最低采购量。翻倍。'],
        }),
        V('交付延期', '对方交期一拖再拖。', {
          0: ['The last three shipments were late. What is the plan?', '最近三批都晚了。怎么解决？'],
        }),
        V('质量索赔', '一批货有质量问题。', {
          3: ['We are claiming for the faulty batch. Here is the report.', '我们要为那批不良品索赔。报告在这儿。'],
        }),
        V('签长约', '你想要更长的合同。', {
          7: ['Before we sign for two years, what happens if volumes drop?', '签两年之前，如果量掉了怎么办？'],
        }),
      ],
      branches: [
        B(5, 'cost', '对方给了一个还价，你要判断还能不能推',
          S('Seven percent is already below our margin for this volume.', '这个量下七个点已经低于我们的利润线。'),
          [O(S('Then take it out of the packaging cost instead.', '那从包装成本里让出来。'), S('We can switch to a simpler box. That is another two.', '可以换简装盒，再让两个点。')),
           O(S('Seven and net sixty, and we announce it as a partnership.', '七加六十天账期，我们对外说是战略合作。'), S('The announcement is worth something. Done.', '这个宣传有价值。成交。'))]),
      ],
      phrases: [
        P('That should move the price.', '价格应该能动。', '谈价先给理由，再给数字。'),
        P('That is my final offer.', '这是我的底线。', '听到这句就该决定签不签。'),
        P('Net sixty instead of thirty.', '账期从三十天改六十天。', 'net 30 是账期术语。'),
      ],
    },

    {
      
      branches: [
        B(3, 'probe', '同事提了一个具体改进，你要接住',
          S('The last exercise was too long. We ran over by ten minutes.', '最后一个练习太长。超时十分钟。'),
          [O(S('I will cut it in half and keep one worked example.', '我砍一半，只留一个示例。'), S('That would fix it.', '那就解决了。')),
           O(S('Was it the exercise or my explanation before it?', '是练习长，还是我前面的讲解拖了？'), S('Honestly, the explanation.', '说实话，是讲解。'))]),
      ],
id: 'training', name: '内部培训反馈', lv: 3, cefr: 'B1',
      roles: ['你', '同事'],
      lines: [
        L(1, 'Thanks for running the session. It was useful.', '谢谢你的培训。挺有用。'),
        L(0, 'Glad it landed. What would you change?', '有用就好。哪里可以改？'),
        L(1, 'The last exercise was too long. We ran over by ten minutes.', '最后一个练习太长。超时十分钟。'),
        L(0, 'I will cut it in half next time.', '下次我砍一半。'),
        L(1, 'Could you send the slides? People asked.', '能发课件吗？有人问。'),
        L(0, 'I will put them on the wiki today.', '我今天放到 wiki 上。'),
        L(1, 'One more thing. Can we do this quarterly?', '还有一件。能每季度一次吗？'),
        L(0, 'If you can give me a room and an hour, yes.', '你能给我一间会议室和一小时，就行。'),
      ],
      variants: [
        { tag: '一次内部培训', setting: '你给团队讲了一小时工具用法，反馈刚收上来。' },
        V('新人培训', '你要给新入职的人讲。', {
          0: ['What do new joiners struggle with most in week one?', '新人第一周最容易卡在哪儿？'],
          1: ['Access and environment setup. Two days lost, usually.', '权限和环境配置。一般浪费两天。'],
        }),
        V('客户培训', '你要给客户做培训。', {
          2: ['The customer wants a session for twenty people. Do we charge?', '客户想要二十人的培训。收费吗？'],
        }),
        V('线上培训', '培训改成线上。', {
          4: ['Online works, but the exercises need breaking into smaller parts.', '线上可以，但练习要拆得更小。'],
        }),
        V('讲得太快', '有人反馈跟不上。', {
          3: ['Two people said it went too fast. Should I add a second session?', '两个人说太快了。要加一场吗？'],
        }),
        V('要材料', '你想让学员提前准备。', {
          6: ['Should I send a short pre-read? It would save twenty minutes.', '要发一份预读吗？能省二十分钟。'],
        }),
      ],
      phrases: [
        P('Glad it landed.', '有用就好。', 'land 指话说到了、听懂了。'),
        P('We ran over by ten minutes.', '我们超时十分钟。', 'run over 是超时。'),
        P('Should I send a pre-read?', '要发预读材料吗？', 'pre-read 是课前材料。'),
      ],
    },

    {
      id: 'one-on-one', name: '一对一沟通', lv: 4, cefr: 'B1',
      roles: ['你', '主管'],
      lines: [
        L(1, 'How are things? Anything on your mind?', '怎么样？有什么想聊的？'),
        L(0, 'I am stretched. Three projects, and I am the only one who knows the billing code.', '我有点撑不住。三个项目，而且只有我一个人懂计费那块代码。'),
        L(1, 'That is a bus factor of one. Let us fix it.', '那是一个人扛一个系统。得解决。'),
        L(0, 'I could pair with Tom for a week.', '我可以跟 Tom 结对一周。'),
        L(1, 'Do that. Drop the reporting project until then.', '那就这么办。报表项目先放一放。'),
        L(0, 'Will the client accept a delay?', '客户能接受延期吗？'),
        L(1, 'I will tell them myself.', '我去跟他们说。'),
        L(0, 'Then that unblocks me. Thanks.', '那我就松口气了。谢谢。'),
      ],
      variants: [
        { tag: '一个人扛三个项目', setting: '月度一对一，你准备了三件事要说。' },
        V('想换项目', '你想离开现在的项目。', {
          0: ['I would like to move off the reporting work. It has no future for me.', '我想离开报表那块。对我来说没前景。'],
          1: ['Let us finish the quarter and move you in July.', '先把这个季度做完，七月调你。'],
        }),
        V('想升职', '你在准备升职材料。', {
          0: ['I would like to be considered for senior next cycle. What is missing?', '下个周期我想评高级。还差什么？'],
        }),
        V('家庭原因', '你要调整工作时间。', {
          0: ['I need to start at eight and finish at four for a few months.', '接下来几个月我需要八点到四点。'],
          1: ['That is fine as long as the overlap with the team stays.', '只要和团队有重叠时间就行。'],
        }),
        V('人际摩擦', '你和另一个同事合不来。', {
          0: ['I am finding it hard to work with Sam. Can you help?', '我和 Sam 配合有点难。能帮一下吗？'],
        }),
        V('问反馈', '你想要更直接的反馈。', {
          7: ['Could you tell me one thing I should stop doing?', '能告诉我一件我该停止做的事吗？'],
        }),
      ],
      branches: [
        B(3, 'probe', '主管问你具体怎么解决，你要给方案',
          S('How would you fix the bus factor?', '你怎么解决这个问题？'),
          [O(S('Pair for a week, then let Tom own the next release.', '结对一周，然后让 Tom 负责下个版本。'), S('That is a real plan. Book the time now.', '这是实操方案。现在就把时间订了。')),
           O(S('Write the runbook first, then hand over.', '先写操作手册，再交接。'), S('Good. Two weeks, and I will check in.', '好。两周，我来跟进。'))]),
      ],
      phrases: [
        P('I am stretched.', '我有点撑不住。', '比 I am busy 更准确。'),
        P('A bus factor of one.', '只有一个人懂。', '工程团队常用，指人被车撞了项目就停。'),
        P('That unblocks me.', '那我就通了。', 'unblock 解除阻塞。'),
      ],
    },

    {
      id: 'deadline-talk', name: '推掉不合理截止期', lv: 5, cefr: 'B2',
      roles: ['你', '客户经理'],
      lines: [
        L(1, 'The client wants this by Friday.', '客户想周五要。'),
        L(0, 'Friday is not realistic. The migration alone is three days.', '周五不现实。光迁移就三天。'),
        L(1, 'They have a board meeting on Monday.', '他们周一开董事会。'),
        L(0, 'Then we send the dashboard and leave the export for the week after.', '那就先交看板，导出放下一周。'),
        L(1, 'Can you do the export by Wednesday?', '导出能周三吗？'),
        L(0, 'Wednesday is possible if the schema is signed off today.', '今天能把表结构定下来，周三可以。'),
        L(1, 'I will get the sign-off this afternoon.', '我下午去要签字。'),
        L(0, 'Then Wednesday is on, and I will write it in the plan.', '那周三算数，我写进计划。'),
      ],
      variants: [
        { tag: '客户要周五交', setting: '客户经理转来一个不可能的日期。' },
        V('范围太大', '需求比预估大三倍。', {
          0: ['The scope is three times the estimate. We need to cut or extend.', '范围是估算的三倍。要么砍要么延。'],
          1: ['Which half matters to the board?', '董事会更在意哪一半？'],
        }),
        V('缺人', '两个同事在休假。', {
          0: ['Two of the team are on leave. Friday would mean overtime for everyone.', '组里两个人在休假。周五意味着所有人加班。'],
        }),
        V('依赖外部', '等第三方接口。', {
          2: ['We are waiting on their API key. Nothing moves until it arrives.', '我们在等他们的接口密钥。到了才能动。'],
        }),
        V('已经延期一次', '上次已经延过。', {
          0: ['We moved this once already. Another delay needs a real reason.', '这个已经延过一次。再延要有真理由。'],
        }),
        V('给替代方案', '你想主动给选项。', {
          6: ['I can give you a working demo Friday, and the full thing Wednesday.', '周五能给可跑的演示，完整版周三。'],
        }),
      ],
      branches: [
        B(5, 'probe', '对方追问你的前提，你要说清依赖',
          S('What has to happen for Wednesday to be real?', '周三要成立，前提是什么？'),
          [O(S('Schema signed off today, and one tester free on Monday.', '今天定表结构，周一有一个测试空闲。'), S('You will have both. I will confirm by five.', '两样都给你。我五点前确认。')),
           O(S('No new requirements after Monday.', '周一之后不加需求。'), S('I will put that in the email.', '我写进邮件里。'))]),
      ],
      phrases: [
        P('That is not realistic.', '这不现实。', '直接但不对人。'),
        P('We need to cut or extend.', '要么砍要么延。', '把选择摆出来。'),
        P('Wednesday is on, if…', '周三可以，前提是……', '有条件答应，比硬拒绝有用。'),
      ],
    },

    {
      id: 'resignation', name: '提离职', lv: 5, cefr: 'B2',
      roles: ['你', '主管'],
      lines: [
        L(0, 'I have decided to move on. Here is my notice.', '我决定走了。这是我的辞职信。'),
        L(1, 'I am sorry to hear it. Where are you going?', '很遗憾。去哪儿？'),
        L(0, 'A smaller team, closer to home. Nothing personal.', '一个更小的团队，离家近。跟公司无关。'),
        L(1, 'When is your last day?', '最后一天是哪天？'),
        L(0, 'Four weeks from Friday, as my contract says.', '按合同，周五起四周后。'),
        L(1, 'Can we keep you for the handover?', '交接能多留一段吗？'),
        L(0, 'I will write the runbook and do two weeks of pairing.', '我会写操作手册，再结对两周。'),
        L(1, 'Then let us plan the transition this week.', '那这周把过渡计划定下来。'),
      ],
      variants: [
        { tag: '去另一家公司', setting: '你拿到 offer，决定走。' },
        V('对方加薪挽留', '主管当场提出加薪。', {
          5: ['Would more money change your mind?', '加钱能改变主意吗？'],
          6: ['It is not about the money. I have already signed.', '不是钱的问题。我已经签了。'],
        }),
        V('内部转岗', '你想转去别的部门。', {
          0: ['I would like to move to the platform team rather than leave.', '我想转去平台组，而不是离职。'],
          1: ['That is easier. Let me speak to their manager.', '那好办。我跟他们经理谈。'],
        }),
        V('合同期未满', '你的合同要求两个月。', {
          3: ['My contract asks for two months. Can we agree on six weeks?', '合同要求两个月。能定六周吗？'],
        }),
        V('带走客户', '对方担心你带走客户。', {
          6: ['I will not approach any client for twelve months. Put it in writing.', '十二个月内我不接触任何客户。可以写进协议。'],
        }),
        V('问推荐信', '你想要一封推荐信。', {
          7: ['Would you write me a short reference before I go?', '走之前能给我写份简短的推荐吗？'],
        }),
      ],
      branches: [
        B(4, 'probe', '主管想留你，你要在不撕破脸的前提下拒绝',
          S('Give me two weeks to find you something better here.', '给我两周，我在这儿给你找个更好的位置。'),
          [O(S('I appreciate it, but my mind is made up.', '谢谢，但我已经决定了。'), S('Then I will make the handover as easy as I can.', '那我把交接尽量做顺。')),
           O(S('I will listen, but I am not staying.', '我可以听，但我不会留下。'), S('Fair. Let us talk on Monday anyway.', '行。周一还是聊聊。'))]),
      ],
      phrases: [
        P('Here is my notice.', '这是我的辞职信。', 'notice 是正式通知。'),
        P('Nothing personal.', '跟公司无关。', '离职时最有用的一句缓冲。'),
        P('I will write the runbook.', '我会写操作手册。', '主动交接，走得更体面。'),
      ],
    },
  ],
};
