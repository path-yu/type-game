import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '学习',
  items: [
    {
      id: 'enroll', name: '报名语言班', lv: 4, cefr: 'B1',
      roles: ['你', '课程顾问'],
      lines: [
        L(0, 'Hi, I would like to join a general English course.', '你好，我想报一个通用英语班。'),
        L(1, 'Have you taken a test with us before?', '您在我们这儿考过测试吗？'),
        L(0, 'No. Could I do a placement test?', '没有。能做分级测试吗？', 'placement test 是分级测试，决定你进哪个班，不是考试入学。'),
        L(1, 'Of course. It takes about forty minutes.', '当然。大概四十分钟。'),
        L(0, 'That is fine. How often do the classes run?', '可以。课多久一次？'),
        L(1, 'Twice a week, evenings or Saturdays.', '一周两次，晚上或周六。'),
        L(0, 'Evenings suit me better. What is the fee?', '晚上更适合我。学费多少？'),
        L(1, 'Three hundred and twenty for twelve weeks.', '十二周三百二。'),
        L(0, 'Is there a discount if I pay upfront?', '一次付清有折扣吗？'),
        L(1, 'Five percent, and you can change class once.', '九折，而且可以换一次班。'),
      ],
      variants: [
        { tag: '报通用英语班', setting: '你在这座城市待一年，想把口语练起来。' },
        V('要考雅思', '你不是为了日常，是为了考试。', {
          0: ['I need IELTS preparation, not general English.', '我要雅思备考，不是通用英语。'],
          1: ['Then we test you the same way, but the class is exam-focused.', '分级测试一样，但课是备考方向。'],
        }),
        V('只能周末', '你工作日都要上班。', {
          6: ['Evenings are hard. Is there a Saturday-only class?', '晚上不太行。有只上周六的班吗？'],
          7: ['There is, but it runs sixteen weeks instead of twelve.', '有，但要十六周，不是十二周。'],
        }),
        V('问退款', '你想先确认能不能退。', {
          8: ['What happens if I have to stop halfway?', '如果我中途要停怎么办？'],
          9: ['You can transfer to the next term once, no refund.', '可以顺延到下一期一次，不退费。'],
        }),
        V('试听', '你想先试一节再决定。', {
          4: ['Could I sit in on a class before I pay?', '付钱前能听一节课吗？'],
          5: ['Yes, any Tuesday. Just arrive ten minutes early.', '可以，任意周二。提前十分钟到。'],
        }),
      ],
      branches: [
        B(4, 'change', '测试结果和你预期的不一样，你要决定进哪个班',
          S('Your test puts you in intermediate, but the evening intermediate class is full.', '测试结果是中级，但晚上的中级班满了。'),
          [O(S('Could I take the morning class instead?', '那我能上周中的上午班吗？'), S('We have space on Tuesday and Thursday mornings.', '周二周四上午有位子。')),
           O(S('How long is the waiting list?', '候补要等多久？'), S('Two weeks, usually. People drop out.', '一般两周。总有人退。'))]),
      ],
      phrases: [
        P('Could I do a placement test?', '能做分级测试吗？', '报名语言班的第一个动作。'),
        P('How often do the classes run?', '课多久一次？', '问频率，不是问时长。'),
        P('Is there a discount if I pay upfront?', '一次付清有折扣吗？', 'upfront 是预付全款。'),
      ],
    },

    {
      
      branches: [
        B(3, 'probe', '老师反问回来，你要把不懂的地方说具体',
          S('Which part exactly? The sign, or the step before it?', '具体哪儿？变号，还是前面那一步？'),
          [O(S('The step before. I lost the reason for moving it.', '前面那一步。我没抓住为什么要移过去。'), S('Let me do it once more, slowly.', '我再慢慢做一遍。')),
           O(S('The sign. I thought it should stay the same.', '变号那里。我以为不用变。'), S('It does when you move terms across. Let me show you again.', '移项时是要变的。我再给你演示一遍。'))]),
      ],
id: 'classroom', name: '课堂提问', lv: 3, cefr: 'B1',
      roles: ['你', '老师'],
      lines: [
        L(1, 'Any questions before we move on?', '继续之前有问题吗？'),
        L(0, 'Sorry, could you go back to the second example?', '抱歉，能回到第二个例子吗？'),
        L(1, 'Of course. Which part was unclear?', '当然。哪部分不清楚？'),
        L(0, 'I did not follow why you changed the sign there.', '我没跟上那里为什么变号。'),
        L(1, 'Because we moved it across the equals sign. Does that help?', '因为移到了等号另一边。这样清楚吗？'),
        L(0, 'Yes, thank you. Could you write that step on the board?', '清楚了，谢谢。能把这一步写在黑板上吗？'),
        L(1, 'Sure. Anything else?', '可以。还有吗？'),
        L(0, 'Not from me.', '我没有了。'),
      ],
      variants: [
        { tag: '没跟上推导', setting: '课上老师讲得很快，你在第三步就掉了。' },
        V('没听清', '老师声音太小。', {
          1: ['Sorry, could you say that again a bit louder?', '抱歉，能大声一点再说一遍吗？'],
        }),
        V('问作业', '下课你想确认作业要求。', {
          6: ['Could you confirm what we hand in on Friday?', '能确认一下周五交什么吗？'],
          7: ['The worksheet, not the essay. The essay is next week.', '是练习纸，不是论文。论文下周交。'],
        }),
        V('问考试范围', '你想知道考什么。', {
          0: ['Will the exam cover chapter five as well?', '考试也包括第五章吗？'],
          1: ['Chapters one to five, but five is only ten percent.', '一到五章，但第五章只占一成。'],
        }),
        V('私下问', '你想课后单独问一个问题。', {
          6: ['Could I ask you something after class?', '课后能问您一个问题吗？'],
        }),
      ],
      phrases: [
        P('Could you go back to the second example?', '能回到第二个例子吗？', '课上没跟上时最有用的一句。'),
        P('I did not follow why…', '我没跟上为什么……', '比 I do not understand 具体得多。'),
        P('Could you write that step on the board?', '能把这步写在黑板上吗？', '听懂了但想留个记录。'),
      ],
    },

    {
      
      branches: [
        B(4, 'short', '你要的额度说法变了，你要确认',
          S('Actually, new members start with six books for the first month.', '其实新会员头一个月只能借六本。'),
          [O(S('Six is plenty. I read slowly anyway.', '六本够了。我读得慢。'), S('Then I will issue the card now.', '那我现在给您办卡。')),
           O(S('Can I get more after the first month?', '一个月后能多借吗？'), S('Automatic. It goes up to twelve.', '自动升到十二本。'))]),
      ],
id: 'library', name: '图书馆借书', lv: 2, cefr: 'A2',
      roles: ['你', '馆员'],
      lines: [
        L(0, 'Hi, I would like to join the library.', '你好，我想办借书证。'),
        L(1, 'Are you a resident? I need proof of address.', '您是本地居民吗？需要地址证明。'),
        L(0, 'I have a letter from my landlord.', '我有房东开的信。'),
        L(1, 'That works. How many books can I put you down for?', '可以。给您开多少本的额度？'),
        L(0, 'How many is normal?', '一般是多少？'),
        L(1, 'Twelve at a time, three weeks each.', '一次十二本，每本三周。'),
        L(0, 'Good. Can I renew online?', '好。能在网上续借吗？'),
        L(1, 'You can, twice, unless someone has reserved it.', '能续两次，除非有人预约了。'),
      ],
      variants: [
        { tag: '办借书证', setting: '你刚搬来，想借书而不是一直买。' },
        V('找一本书', '你要找一本指定的书。', {
          0: ['I am looking for a book on local history. Where would that be?', '我在找一本本地历史的书。在哪一区？'],
          1: ['Second floor, under nine-four-two.', '二楼，942 那一排。'],
        }),
        V('预约', '书被借走了，你想预约。', {
          6: ['It is checked out. Can I reserve it?', '书被借走了。能预约吗？'],
          7: ['Yes, two pounds, and we will email you.', '可以，两镑，我们邮件通知您。'],
        }),
        V('还书逾期', '你还书晚了，想问罚多少。', {
          0: ['I am returning these two days late. Is there a fine?', '这两本晚还了两天。有罚金吗？'],
        }),
        V('用电脑', '你想用馆内电脑打印。', {
          4: ['Can I use a computer to print something?', '能用电脑打印东西吗？'],
          5: ['Any machine on the first floor. Printing is ten pence a page.', '一楼任意一台。打印一页十便士。'],
        }),
      ],
      phrases: [
        P('I would like to join the library.', '我想办借书证。', 'join 在这里是「办证」。'),
        P('Can I renew online?', '能在网上续借吗？', 'renew 是续借，不是「更新」。'),
        P('It is checked out.', '书被借走了。', 'checked out 在外借语境是「已借出」。'),
      ],
    },

    {
      id: 'group-work', name: '小组作业分工', lv: 4, cefr: 'B1',
      roles: ['你', '组员'],
      lines: [
        L(0, 'Shall we split the report now, so nobody doubles up?', '现在分一下报告吧，免得重复做。'),
        L(1, 'Good idea. I can take the introduction and the method.', '好主意。我可以写引言和方法。'),
        L(0, 'I will do the results and the charts.', '我来做结果和图表。'),
        L(1, 'That leaves the discussion. Who wants it?', '剩下讨论部分。谁写？'),
        L(0, 'Sam said he would, but he has not answered since Monday.', 'Sam 说他要写，但周一起就没回消息。'),
        L(1, 'Then we should have a backup. Can you draft it if he goes quiet?', '那我们得有个后手。他不吭声的话你能起草吗？'),
        L(0, 'I can, but I need his data by Wednesday.', '可以，但我周三前要他的数据。'),
        L(1, 'I will message him today and copy you.', '我今天给他发消息，抄送你。'),
      ],
      variants: [
        { tag: '分报告章节', setting: '四个人一组，报告下周五交，还没分工。' },
        V('有人不干活', '有个组员一直消失。', {
          4: ['We have not heard from Sam all week. Should we tell the tutor?', 'Sam 一周没消息了。要告诉老师吗？'],
          5: ['Let us give him until Friday, then yes.', '先等到周五，之后再说。'],
        }),
        V('想换题目', '你觉得选题太大，做不完。', {
          0: ['The topic is too broad for four weeks. Can we narrow it?', '这个题目四周做不完。能收窄吗？'],
          1: ['We could focus on one city instead of the whole country.', '可以只做一个城市，不做全国。'],
        }),
        V('定时间', '你们要定下一次讨论时间。', {
          6: ['When can we all meet again?', '我们什么时候能再碰一次？'],
          7: ['Thursday after the lecture, in the library.', '周四课后，图书馆。'],
        }),
        V('分工不均', '你做的部分明显比别人多。', {
          6: ['I am doing two sections. Can we rebalance?', '我写了两节。能重新分一下吗？'],
        }),
      ],
      branches: [
        B(4, 'change', '组员临时退出，你要重新分活',
          S('Sam just emailed. He is dropping the module.', 'Sam 刚发邮件。他退课了。'),
          [O(S('Then we split his part between us.', '那他的部分我们分掉。'), S('I will take the discussion if you take his charts.', '你接他的图表，我接讨论。')),
           O(S('Can we ask the tutor for an extension?', '能跟老师申请延期吗？'), S('Worth asking. Losing a member is a valid reason.', '值得问。少一个人是正当理由。'))]),
      ],
      phrases: [
        P('Shall we split the report now?', '现在分一下报告吧？', '分工开场，避免有人重复做。'),
        P('Who wants it?', '谁想写这个？', '分活时最省事的问法。'),
        P('Can we rebalance?', '能重新分一下吗？', '觉得不公平时用，不指责人。'),
      ],
    },

    {
      id: 'exam-defer', name: '申请考试延期', lv: 5, cefr: 'B2',
      roles: ['你', '教务'],
      lines: [
        L(0, 'I would like to apply for a deferral for the exam next week.', '我想申请下周考试的延期。'),
        L(1, 'What is the reason?', '什么原因？'),
        L(0, 'I was in hospital last week. I have the discharge letter.', '我上周住院了。有出院小结。'),
        L(1, 'That is normally accepted. Have you missed any coursework?', '这种情况一般可以。有缺交的作业吗？'),
        L(0, 'One assignment. I emailed the tutor but got no reply.', '一份作业。我给老师发过邮件但没回复。'),
        L(1, 'I will note it here. The deferred exam is in August.', '我在这儿备注。延期考试在八月。'),
        L(0, 'Does the deferral affect my grade?', '延期会影响我的成绩吗？'),
        L(1, 'No, it is marked the same. You just sit it later.', '不会，评分一样。只是晚点考。'),
      ],
      variants: [
        { tag: '住院错过考试', setting: '你住院一周，正好撞上期中考试。' },
        V('家里有事', '你要回国处理家里的事。', {
          0: ['I need to fly home for a family emergency. Can I defer?', '我要回国处理家里急事。能延期吗？'],
          1: ['We may ask for evidence. A flight booking is not enough.', '可能要证明。机票不算。'],
        }),
        V('设备故障', '线上考试时网络断了。', {
          0: ['My internet dropped halfway through the online exam.', '线上考试考到一半网断了。'],
          1: ['Did you get a screenshot or a ticket from your provider?', '有截图或者运营商的工单吗？'],
        }),
        V('问补考时间', '你想知道下次机会。', {
          6: ['When is the next sitting after August?', '八月之后下一次是什么时候？'],
        }),
        V('被拒', '申请被拒了，你想问申诉。', {
          8: ['The application was rejected. How do I appeal?', '申请被拒了。怎么申诉？'],
        }),
      ],
      branches: [
        B(4, 'probe', '对方要你证明，但你的材料不齐',
          S('The letter does not cover the exam date. Do you have anything else?', '这份小结没覆盖考试日期。还有别的吗？'),
          [O(S('I can ask the hospital for a letter covering that week.', '我可以让医院开一份覆盖那周的信。'), S('That would settle it. Send it within ten days.', '那就可以了。十天内发来。')),
           O(S('My GP can confirm it by phone.', '我的家庭医生可以电话确认。'), S('We need it in writing, I am afraid.', '恐怕要书面的。'))]),
      ],
      phrases: [
        P('I would like to apply for a deferral.', '我想申请延期。', 'deferral 是延期考试/入学。'),
        P('Does the deferral affect my grade?', '延期会影响成绩吗？', '申请前先问清代价。'),
        P('We may ask for evidence.', '可能要证明。', 'evidence 是书面材料，不是口头说明。'),
      ],
    },

    {
      
      branches: [
        B(6, 'probe', '老师说不能重交，你要问出下一步该怎么做',
          S('Not for this one. The marks have gone to the board.', '这次不行。分数已经报上去了。'),
          [O(S('What should I do differently next time?', '下次我该怎么做？'), S('Come to me with a plan before you start writing.', '动笔前先拿个提纲来找我。')),
           O(S('I understand. Thanks for explaining.', '我明白。谢谢您解释。'), S('Any time. That is what office hours are for.', '随时。办公时间就是干这个的。'))]),
      ],
id: 'grade-query', name: '找老师问成绩', lv: 5, cefr: 'B2',
      roles: ['你', '老师'],
      lines: [
        L(0, 'Do you have a minute? I would like to ask about my essay grade.', '您有空吗？我想问一下论文成绩。'),
        L(1, 'Of course. Which question?', '当然。哪一题？'),
        L(0, 'Question two. I got fifty-eight, and I am not sure why.', '第二题。我得了五十八，不太清楚原因。'),
        L(1, 'Your argument was solid, but the sources were thin.', '你的论证扎实，但文献太少。'),
        L(0, 'I cited four. Was that not enough for this length?', '我引了四篇。这个篇幅还不够吗？'),
        L(1, 'For a three-thousand-word essay, I expect eight to ten.', '三千字的论文，我希望八到十篇。'),
        L(0, 'That is fair. Is there any chance to resubmit?', '有道理。有机会重交吗？', 'resubmit 是重新提交，问的时候要接受「没有」这个答案。'),
        L(1, 'Not for this one, but come to me before the next essay.', '这次不行，但下一篇之前来找我。'),
      ],
      variants: [
        { tag: '论文分数偏低', setting: '你觉得评分不公，但想先弄清楚标准。' },
        V('算错分', '你怀疑加总错了。', {
          0: ['I think the marks may have been added up wrong.', '我觉得分数可能加错了。'],
          1: ['Let me check. Four sections, twenty-five each.', '我看看。四部分，各二十五。'],
        }),
        V('想复议', '你正式申请复核。', {
          6: ['How do I request a formal review?', '怎么申请正式复核？'],
          7: ['Fill in the form, and a second marker reads it.', '填表，第二位老师重读。'],
        }),
        V('问下次要求', '你只想知道下次怎么拿高分。', {
          6: ['What would a seventy look like for the next one?', '下一篇要做到什么程度能拿七十？'],
        }),
        V('组员分数', '小组作业大家分数一样，你觉得不公。', {
          0: ['We all got the same mark, but I wrote most of it.', '我们分数一样，但大部分是我写的。'],
        }),
      ],
      phrases: [
        P('I am not sure why.', '我不太清楚原因。', '问成绩时最不挑衅的开场。'),
        P('Is there any chance to resubmit?', '有机会重交吗？', 'chance 让问题变成请求，不是要求。'),
        P('How do I request a formal review?', '怎么申请正式复核？', 'review 在这里是复核评分。'),
      ],
    },

    {
      id: 'presentation', name: '课堂演讲被打断', lv: 5, cefr: 'B2',
      roles: ['你', '同学'],
      lines: [
        L(0, 'Today I will cover three points: the problem, the data, and what we suggest.', '今天讲三点：问题、数据、以及我们的建议。'),
        L(1, 'Sorry to interrupt. Where did the data come from?', '抱歉打断。数据从哪儿来的？'),
        L(0, 'Good question. It is the city survey from last year, about four thousand responses.', '好问题。是去年的城市调查，大约四千份回复。'),
        L(1, 'Was it a random sample?', '是随机抽样吗？'),
        L(0, 'Mostly. They weighted it by age and district.', '基本是。他们按年龄和区做了加权。'),
        L(1, 'All right. Sorry, go on.', '好。抱歉，继续。'),
        L(0, 'Thanks. So the second point is what changed after the policy.', '谢谢。第二点是政策之后发生了什么变化。'),
        L(1, 'One more thing. How confident are you in the last number?', '还有一点。最后一个数字你有多大把握？'),
      ],
      variants: [
        { tag: '被追问数据来源', setting: '课堂展示，你讲到第二页就被打断。' },
        V('超时', '你讲得太久，老师提醒时间。', {
          6: ['I am running over. Let me skip to the conclusion.', '我超时了。直接跳到结论。'],
        }),
        V('紧张卡住', '你忘词了。', {
          2: ['Sorry, let me start that again.', '抱歉，我重说一遍。'],
        }),
        V('设备坏了', '投影连不上。', {
          0: ['The projector is not picking up my laptop. Can I email the file?', '投影连不上我的电脑。能发邮件吗？'],
        }),
        V('被质疑结论', '同学不同意你的结论。', {
          7: ['That is a fair challenge. The sample was small, so I would not overclaim.', '这个质疑有道理。样本小，我不会过度断言。'],
        }),
      ],
      branches: [
        B(4, 'probe', '有人问了一个你没准备的问题',
          S('What would change your conclusion?', '什么情况会改变你的结论？'),
          [O(S('If the response rate had been lower, the numbers would not hold.', '如果回复率更低，这些数字就站不住。'), S('That is a good answer.', '这个回答不错。')),
           O(S('I would need to rerun it with this year data.', '要用今年的数据重跑一遍。'), S('Could you do that before the final?', '期末前能做吗？'))]),
      ],
      phrases: [
        P('Sorry to interrupt.', '抱歉打断。', '打断和被中断都用。'),
        P('Sorry, go on.', '抱歉，继续。', '打断完让对方接回去。'),
        P('I would not overclaim.', '我不会过度断言。', '学术场合承认局限，比硬撑更有说服力。'),
      ],
    },

    {
      
      branches: [
        B(4, 'change', '客服给的办法都不管用，你要一个实际补偿',
          S('Clearing the cache did not help either?', '清缓存也没用？'),
          [O(S('Same result. Can you unlock the next module?', '一样。能先解锁下一模块吗？'), S('I can, and the deadline moves with it.', '可以，截止日跟着顺延。')),
           O(S('Could you send me the file directly?', '能直接把文件发我吗？'), S('I am not allowed to, but I can report the fault.', '这个不允许，但我可以报故障。'))]),
      ],
id: 'online-course', name: '网课平台出问题', lv: 4, cefr: 'B1',
      roles: ['你', '客服'],
      lines: [
        L(0, 'The video for week three will not play. It stops after two minutes.', '第三周的视频放不了。两分钟就停。'),
        L(1, 'Which browser are you using?', '您用什么浏览器？'),
        L(0, 'Chrome, on a laptop. It works on my phone, but I want the big screen.', '笔记本上的 Chrome。手机能放，但我想用大屏。'),
        L(1, 'Try clearing the cache, or using a different browser.', '试试清缓存，或者换个浏览器。'),
        L(0, 'I did both. Same result.', '都试了。一样。'),
        L(1, 'Then it may be the file. I will report it and unlock the next module for you.', '那可能是文件问题。我上报，并给您解锁下一模块。'),
        L(0, 'Thanks. Will the quiz still count?', '谢谢。测验还算数吗？'),
        L(1, 'It will. The deadline moves with the unlock.', '算。截止日跟着顺延。'),
      ],
      variants: [
        { tag: '视频播不了', setting: '你晚上抽时间上课，视频卡在第二分钟。' },
        V('证书没发', '你学完了但没收到证书。', {
          0: ['I finished the course last week but have not received the certificate.', '我上周学完了，但没收到证书。'],
          1: ['It is issued within five working days. Let me check your progress.', '五个工作日内发。我查一下您的进度。'],
        }),
        V('作业被误判', '系统判你抄袭。', {
          0: ['The system flagged my essay for plagiarism. It was my own writing.', '系统标我论文抄袭。那是我自己写的。'],
          1: ['We will have a tutor review it manually.', '我们让老师人工复核。'],
        }),
        V('想退课', '课和你预期差太多。', {
          6: ['Can I get a refund after two weeks?', '上了两周能退款吗？'],
          7: ['Within fourteen days, yes. After that it is credit only.', '十四天内可以。之后只能转成学分。'],
        }),
        V('字幕问题', '你想开字幕。', {
          2: ['Is there a captions option? I learn better reading along.', '有字幕选项吗？我边看边读学得更好。'],
        }),
      ],
      phrases: [
        P('It stops after two minutes.', '两分钟就停。', '描述故障要给具体现象。'),
        P('I did both. Same result.', '都试了。一样。', '客服让你试的两招都做完再说这句。'),
        P('The deadline moves with the unlock.', '截止日跟着顺延。', '延期一定要确认这句。'),
      ],
    },
  ],
};
