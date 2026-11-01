import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '社交',
  items: [
    {
      id: 'party', name: '同事家的派对', lv: 3, cefr: 'B1',
      roles: ['你', '主人'],
      lines: [
        L(1, 'You made it! Come in.', '你来了！进来。'),
        L(0, 'Thanks for having me. What can I bring?', '谢谢邀请。我带点什么？', 'Thanks for having me 是做客的标准开场，比 thanks for inviting 更自然。'),
        L(1, 'Nothing, you are already here. Drinks are in the kitchen.', '什么都不用，人来了就行。饮料在厨房。'),
        L(0, 'I brought some wine. Where should I put it?', '我带了瓶酒。放哪儿？'),
        L(1, 'On the table by the window. Have you met Sam?', '窗边那张桌子。你见过 Sam 吗？'),
        L(0, 'Not yet. Could you introduce us?', '还没有。能介绍一下吗？'),
        L(1, 'Sam, this is Wen. She just moved into the building.', 'Sam，这是 Wen。她刚搬进这栋楼。'),
        L(0, 'Nice to meet you. How do you know the host?', '很高兴认识你。你怎么认识主人的？'),
      ],
      variants: [
        { tag: '同事家的乔迁派对', setting: '同事搬了新家，办了个小型派对，你一个人来的。' },
        V('一个人来', '你谁都不认识，站在角落。', {
          5: ['I do not know anyone here. Could you introduce me?', '我这儿谁都不认识。能介绍一下吗？'],
          6: ['Of course. That is Mia, she runs the book club.', '当然。那是 Mia，她组织读书会。'],
        }),
        V('带错了东西', '你带了甜点，但主人说大家都带了甜点。', {
          3: ['I brought a cake. Is there too much food already?', '我带了蛋糕。是不是已经太多了？'],
          4: ['Never. Put it next to the other three.', '从来不会。放那三个旁边。'],
        }),
        V('想早走', '你明天要早起，想礼貌地先走。', {
          7: ['I should head off soon. Thanks again for tonight.', '我该走了。今晚多谢。'],
        }),
        V('聊工作', '有人问你是做什么的。', {
          1: ['I work in data, at a small company. And you?', '我做数据，在一家小公司。你呢？'],
        }),
      ],
      branches: [
        {
          at: 5, kind: 'offer',
          task: '有人递给你一样你不想吃或不想喝的东西',
          prompt: S('Try this, I made it myself. It is quite strong.', '尝尝这个，我自己做的。挺烈的。'),
          options: [
            O(S('Just a small one, thanks.', '少来一点，谢谢。'), S('Careful, it goes down too easily.', '小心，这个很容易喝多。')),
            O(S('I am driving tonight, so none for me.', '我今晚开车，就不喝了。'), S('Fair enough. There is plenty of soda.', '没问题。苏打水管够。')),
          ],
        },
      ],
      phrases: [
        P('Thanks for having me.', '谢谢邀请。', '做客开场，比 thanks for inviting me 自然。'),
        P('Could you introduce us?', '能介绍一下吗？', '一个人赴约时最有用的一句。'),
        P('I should head off soon.', '我该走了。', 'head off 是礼貌离场。'),
      ],
    },

    {
      
      branches: [
        B(5, 'probe', '对方坦白了一件尴尬事，你要接得轻松',
          S('I tried climbing once and hated it. Is that a problem?', '我试过一次攀岩，很讨厌。这算问题吗？'),
          [O(S('Only if you judge me for liking it.', '除非你因为我喜欢就评判我。'), S('Deal. I will come and watch.', '成交。我去看。')),
           O(S('What did you hate about it?', '你讨厌它哪一点？'), S('The height. All of it.', '高度。全部。'))]),
      ],
id: 'date', name: '第一次约会', lv: 4, cefr: 'B1',
      roles: ['你', '对方'],
      lines: [
        L(1, 'So how do you know Alex?', '你怎么认识 Alex 的？'),
        L(0, 'We worked together two years ago. You?', '两年前一起工作过。你呢？'),
        L(1, 'We were at university. He has not changed at all.', '我们大学同学。他一点没变。'),
        L(0, 'That is either good or worrying.', '这要么是好事，要么挺让人担心。'),
        L(1, 'Mostly good. So what do you do when you are not at work?', '基本是好事。那你不上班的时候做什么？'),
        L(0, 'I climb on weekends. Badly, but often.', '我周末攀岩。水平很差，但很勤。'),
        L(1, 'I have always wanted to try that. Is it expensive to start?', '我一直想试。入门贵吗？'),
        L(0, 'Not really. You can rent everything at the gym.', '不贵。装备在馆里都能租。'),
      ],
      variants: [
        { tag: '朋友介绍的约会', setting: '朋友介绍你们认识，第一次单独吃饭，气氛有点拘谨。' },
        V('聊得太干', '对方话很少，你想把话题接下去。', {
          4: ['Do you have a favourite place in the city?', '你在城里有最喜欢的地方吗？'],
          5: ['The market on Saturdays. I go for the bread.', '周六的市集。我去买面包。'],
        }),
        V('结账', '吃完了，你想买单但不想尴尬。', {
          7: ['Shall we split it? Or I can get this one.', '我们分开付？还是这顿我来。'],
        }),
        V('想再见', '聊得不错，你想约下一次。', {
          7: ['I enjoyed this. Would you want to do it again?', '今天挺开心的。还想再约吗？'],
        }),
        V('没感觉', '你不打算再见面，想体面结束。', {
          7: ['I had a nice evening. I should get going.', '今晚挺愉快的。我该走了。'],
        }),
      ],
      phrases: [
        P('So what do you do when you are not at work?', '你不上班时做什么？', '比 what do you do 更容易展开。'),
        P('Badly, but often.', '水平很差，但很勤。', '自嘲式回答，气氛立刻松。'),
        P('Shall we split it?', '我们分开付？', '约会结账不尴尬的说法。'),
      ],
    },

    {
      
      branches: [
        B(4, 'probe', '对方提了一个你需要现场决定的限制',
          S('Two of the guests are allergic to nuts. Is that workable?', '有两位客人对坚果过敏。能安排吗？'),
          [O(S('I will keep nuts off the menu entirely.', '我菜单里完全不放坚果。'), S('Then nobody has to worry.', '那大家都不用担心了。')),
           O(S('I will label everything clearly.', '我会把每样都标清楚。'), S('That works too.', '那也行。'))]),
      ],
id: 'invite', name: '邀请同事来家里', lv: 3, cefr: 'B1',
      roles: ['你', '同事'],
      lines: [
        L(0, 'We are having a few people over on Saturday. Would you like to come?', '周六我们家来几个人。你来吗？', 'have people over 是「在家招待人」，比 invite to my home 自然。'),
        L(1, 'That sounds nice. What is the occasion?', '听着不错。什么 occasion？'),
        L(0, 'No occasion. Just dinner and a lot of talking.', '没什么 occasion。就是吃顿饭，聊聊天。'),
        L(1, 'Can I bring anything?', '要带什么吗？'),
        L(0, 'A dessert, if you like. Nothing else.', '愿意的话带个甜点。别的不用。'),
        L(1, 'What time should I come?', '我几点到？'),
        L(0, 'Seven, but come at seven thirty if you want to miss the chaos.', '七点，但想避开混乱就七点半来。'),
        L(1, 'Seven thirty it is. Should I bring my partner?', '那就七点半。要带我伴侣吗？'),
      ],
      variants: [
        { tag: '周六晚饭', setting: '你想请几个同事来家里吃饭，第一次开口。' },
        V('带家属', '对方问能不能带孩子。', {
          7: ['Can I bring my daughter? She is eight.', '我能带女儿吗？她八岁。'],
        }),
        V('对方吃素', '你知道对方吃素，主动说明。', {
          3: ['I should say, one of the guests is vegetarian.', '我先说一下，有位客人吃素。'],
        }),
        V('改期', '你家里出了点事，要改时间。', {
          2: ['Actually, could we move it to Sunday? Something came up.', '其实能改到周日吗？有点事。'],
        }),
        V('被婉拒', '对方说有事来不了。', {
          0: ['No problem at all. Next time, then.', '完全没问题。那下次。'],
        }),
      ],
      phrases: [
        P('We are having a few people over.', '我们家要来几个人。', 'have people over 在家招待。'),
        P('What is the occasion?', '什么 occasion？', '问「为什么聚」最自然的方式。'),
        P('A dessert, if you like.', '愿意的话带个甜点。', '接受对方带东西又不给对方压力。'),
      ],
    },

    {
      
      branches: [
        B(3, 'probe', '对方追问原因，你要坚持又不撕破脸',
          S('Are you sure? A weekend away would do you good.', '你确定？出去一个周末对你有好处。'),
          [O(S('I know, but I would be poor company right now.', '我知道，但我现在状态不好，陪不好人。'), S('Fair enough. Rest well.', '行。好好休息。')),
           O(S('Can I take a rain check?', '能改天吗？'), S('Any time. I will ask again in a month.', '随时。一个月后我再问。'))]),
      ],
id: 'decline', name: '婉拒一个邀请', lv: 4, cefr: 'B1',
      roles: ['你', '朋友'],
      lines: [
        L(1, 'We are going to the coast this weekend. Want to join?', '这周末我们去海边。一起来吗？'),
        L(0, 'That sounds great, but I have to work Saturday.', '听着很好，但我周六要上班。'),
        L(1, 'Sunday, then? We are staying one night.', '那周日呢？我们住一晚。'),
        L(0, 'I would love to, but I am already stretched thin this month.', '我很想去，但这个月我已经排满了。', 'stretched thin 是「精力被摊得太薄」，比 I am busy 更具体也更诚恳。'),
        L(1, 'No worries. Another time.', '没事。下次。'),
        L(0, 'Definitely. Let me know when you go again.', '一定。你们再去的时候告诉我。'),
      ],
      variants: [
        { tag: '周末加班', setting: '朋友临时约你周末出门，你已经累到不想动。' },
        V('不想去但不想伤人', '你只是不想去，没有具体理由。', {
          3: ['I am going to sit this one out, honestly. I need a quiet weekend.', '说实话这次我就不去了。我需要一个安静的周末。'],
          4: ['Totally fair. We will send photos.', '完全理解。我们发照片给你。'],
        }),
        V('拒绝借钱', '朋友开口借钱，你不想借。', {
          1: ['Could you lend me five hundred until Friday?', '能借我五百，周五还吗？'],
          2: ['I am not comfortable lending money to friends. It changes things.', '我不太愿意借钱给朋友。这会改变关系。'],
        }),
        V('拒绝加班', '老板问你能不能周末来。', {
          1: ['Can you come in on Saturday?', '周六能来吗？'],
          2: ['I can do a couple of hours remotely, but not the whole day.', '我可以远程两小时，不能一整天。'],
        }),
        V('拒绝推销', '有人在街上推销，你不想听。', {
          1: ['Excuse me, do you have a minute?', '打扰一下，有空吗？'],
          2: ['Sorry, I am on my way to an appointment.', '抱歉，我赶着赴约。'],
        }),
      ],
      phrases: [
        P('I would love to, but I am already stretched thin.', '我很想去，但这个月排满了。', '先肯定再拒绝，最不伤人。'),
        P('I am going to sit this one out.', '这次我就不去了。', 'sit out 是「不参加」。'),
        P('No worries. Another time.', '没事。下次。', '被拒时的体面回应。'),
      ],
    },

    {
      
      branches: [
        B(2, 'change', '对方时间更紧，你要压缩这次见面',
          S('Actually I have to leave in ten minutes.', '其实我十分钟后得走。'),
          [O(S('Then let me at least pay for your coffee.', '那至少让我付你的咖啡。'), S('You do not have to, but thank you.', '不用，但谢谢。')),
           O(S('Let us do a proper dinner next week.', '下周好好吃顿饭。'), S('I will hold you to that.', '我可记住了。'))]),
      ],
id: 'apology', name: '迟到了怎么道歉', lv: 3, cefr: 'B1',
      roles: ['你', '朋友'],
      lines: [
        L(0, 'I am so sorry. The trains were a mess.', '真的很抱歉。地铁一团糟。'),
        L(1, 'It is fine, I only got here five minutes ago.', '没事，我也才到五分钟。'),
        L(0, 'Still, I kept you waiting. Have you ordered?', '还是让你等了。点了吗？'),
        L(1, 'Just a coffee. Sit down.', '就一杯咖啡。坐吧。'),
        L(0, 'Let me get the next round. It is the least I can do.', '下一轮我请。至少该这样。', 'the least I can do 是道歉时最常用的一句补偿话。'),
        L(1, 'You do not have to, but I will not argue.', '不用，但我也不推。'),
      ],
      variants: [
        { tag: '地铁延误迟到', setting: '你迟到了二十分钟，朋友已经在咖啡馆坐着。' },
        V('忘了约定', '你完全忘了，朋友发消息才想起来。', {
          0: ['I completely forgot. That is not like me, and I am sorry.', '我完全忘了。这不像我，对不起。'],
          1: ['It happens. I was about to leave, though.', '会有的。不过我正要走。'],
        }),
        V('说错话', '你上次聚会说了句不合适的话。', {
          0: ['I have been thinking about what I said on Friday. It was out of line.', '我一直在想周五说的那句话。太过了。'],
          1: ['I appreciate you saying that.', '你愿意说这个，我很感激。'],
        }),
        V('工作失误', '你给客户发错了报价。', {
          0: ['I sent the wrong quote yesterday. I have already corrected it.', '我昨天发错了报价。已经改正了。'],
        }),
        V('弄坏东西', '你借朋友的书弄湿了。', {
          0: ['I got your book wet. I will replace it.', '我把你的书弄湿了。我赔你一本。'],
        }),
      ],
      phrases: [
        P('I am so sorry. The trains were a mess.', '很抱歉。地铁一团糟。', '道歉先给原因，但别当借口。'),
        P('It is the least I can do.', '至少该这样。', '补偿时的固定说法。'),
        P('It was out of line.', '那话太过了。', '承认越界，比 sorry 更具体。'),
      ],
    },

    {
      
      branches: [
        B(4, 'probe', '对方觉得分工本来就清楚，你要把事实摆出来',
          S('I thought it was obvious. I do the bathroom, you do the bins.', '我以为很明显。我打扫浴室，你倒垃圾。'),
          [O(S('We never said it out loud, and I have been doing both.', '我们没明说过，而且我一直在做两样。'), S('Then I owe you two weeks of bins.', '那我欠你两周垃圾。')),
           O(S('Fine, but let us write the rest down too.', '行，但其余也写下来。'), S('Agreed. Fridge, tonight.', '同意。今晚贴冰箱。'))]),
      ],
id: 'roommate', name: '室友分工', lv: 4, cefr: 'B1',
      roles: ['你', '室友'],
      lines: [
        L(0, 'Can we talk about the flat for a minute?', '能聊一下房子的事吗？'),
        L(1, 'Sure. Is something wrong?', '行。怎么了？'),
        L(0, 'The bins have not gone out for a week, and the kitchen is getting bad.', '垃圾一周没拿出去，厨房开始有味儿了。'),
        L(1, 'I thought you were doing bins this week.', '我以为这周你负责垃圾。'),
        L(0, 'We never actually agreed on that. That is the problem.', '我们其实没定过。问题就在这儿。'),
        L(1, 'Fair. Shall we write it down?', '有道理。写下来？'),
        L(0, 'Yes. Bins on Tuesday, bathroom on Sunday, and dishes daily.', '好。周二倒垃圾，周日打扫浴室，碗每天洗。'),
        L(1, 'Deal. I will put it on the fridge.', '成交。我贴冰箱上。'),
      ],
      variants: [
        { tag: '垃圾没人倒', setting: '你和室友合住三个月，卫生一直靠自觉，现在不行了。' },
        V('房租分摊', '室友晚交房租两周。', {
          0: ['The rent came out of my account again this month.', '这个月房租又从我账户扣了。'],
          1: ['I know, I am sorry. I get paid on Friday.', '我知道，抱歉。我周五发工资。'],
        }),
        V('带人回来', '室友经常带朋友回来到很晚。', {
          0: ['Could you give me a heads-up when people come over?', '有人来的时候能提前说一声吗？'],
        }),
        V('要搬走', '你想提前解约。', {
          0: ['I am thinking about moving out in June. What does the lease say?', '我在考虑六月搬走。租约怎么写的？'],
        }),
        V('室友要搬走', '室友说要走，你要找新人。', {
          1: ['I am moving out at the end of the month.', '我月底搬走。'],
        }),
      ],
      phrases: [
        P('Can we talk about the flat for a minute?', '能聊一下房子的事吗？', '把冲突变成议题，不指责人。'),
        P('We never actually agreed on that.', '我们其实没定过。', '点出问题根源，而不是争谁对。'),
        P('Shall we write it down?', '写下来？', '口头约定最容易失效。'),
      ],
    },

    {
      
      branches: [
        B(4, 'change', '器械马上要被别人占了，你要调整计划',
          S('The rack is free now, but only for twenty minutes.', '架子现在空着，但只有二十分钟。'),
          [O(S('I will take it. Twenty minutes is enough.', '那我用。二十分钟够了。'), S('I will spot you if you want.', '需要的话我帮你护。')),
           O(S('I will do dumbbells instead and wait.', '那我先做哑铃，等着。'), S('Good call. It frees up after seven.', '明智。七点后就空了。'))]),
      ],
id: 'gym-friend', name: '健身房认识人', lv: 3, cefr: 'B1',
      roles: ['你', '常客'],
      lines: [
        L(0, 'Sorry, are you using this bench?', '不好意思，你用这张凳吗？'),
        L(1, 'All yours. I am done with it.', '你用吧。我用完了。'),
        L(0, 'Thanks. Do you know if the squat rack is free?', '谢谢。你知道深蹲架空着吗？'),
        L(1, 'Someone is on it, but he is nearly finished.', '有人在用，但快结束了。'),
        L(0, 'I will wait. How often do you come here?', '我等会儿。你多久来一次？'),
        L(1, 'Three mornings a week. It is quiet at this hour.', '一周三个早上。这个点人少。'),
        L(0, 'That is why I switched. Evenings are impossible.', '所以我才改时间。晚上根本挤不进去。'),
        L(1, 'Tell me about it. Good luck with the rack.', '可不是。祝你抢到架子。'),
      ],
      variants: [
        { tag: '抢器械', setting: '晚上七点的健身房，所有器械都有人。' },
        V('请教动作', '你想问对方怎么做这个动作。', {
          4: ['Could you check my form? I keep feeling it in my lower back.', '能帮我看下姿势吗？我总觉得腰在发力。'],
          5: ['Your hips are rising too early. Slow the first half down.', '你的髋起得太早。前半程放慢。'],
        }),
        V('问私教', '你想知道值不值得请私教。', {
          0: ['Do you work with a trainer, or on your own?', '你请教练还是自己练？'],
        }),
        V('想一起练', '你想找人搭伴。', {
          6: ['I am here most Tuesdays. Happy to spot each other.', '我周二基本都在。可以互相保护。'],
        }),
        V('退会', '你想问怎么取消会员。', {
          0: ['Do you know how to cancel a membership here?', '你知道这儿怎么退会吗？'],
        }),
      ],
      phrases: [
        P('Are you using this bench?', '你用这张凳吗？', '健身房最高频的一句。'),
        P('Could you check my form?', '能帮我看下姿势吗？', 'form 是动作姿势。'),
        P('Happy to spot each other.', '可以互相保护。', 'spot 是帮忙护住杠铃。'),
      ],
    },

    {
      
      branches: [
        B(4, 'probe', '对方说了句矛盾的话，你要接住',
          S('The Friday report. But I do not want people to think I cannot cope.', '周五那份报告。但我不想让人觉得我扛不住。'),
          [O(S('Nobody thinks that. Taking help is not the same as failing.', '没人会这么想。接受帮忙不等于扛不住。'), S('I needed to hear that.', '这话我需要听。')),
           O(S('I will do it quietly. Nobody has to know.', '我低调地做，没人会知道。'), S('That helps. Thank you.', '帮了大忙。谢谢。'))]),
      ],
id: 'condolence', name: '安慰与吊唁', lv: 5, cefr: 'B2',
      roles: ['你', '同事'],
      lines: [
        L(0, 'I heard about your father. I am so sorry.', '我听说了你父亲的事。真的很难过。', 'I am so sorry 在吊唁里是标准说法，不是道歉。'),
        L(1, 'Thank you. It was sudden.', '谢谢。很突然。'),
        L(0, 'I cannot imagine. How are you holding up?', '我难以想象。你还撑得住吗？'),
        L(1, 'Some days are fine. Some are not.', '有些天还好。有些天不行。'),
        L(0, 'That sounds about right. Is there anything I can take off your plate?', '这很正常。有什么我能替你分担的吗？', 'take something off your plate 是「替你分担工作」。'),
        L(1, 'The Friday report, if you could cover it once.', '周五那份报告，能帮我顶一次吗？'),
        L(0, 'Consider it done. Do not think about it again.', '交给我。别再想它了。'),
        L(1, 'That means more than you know.', '这比你知道的更重要。'),
      ],
      variants: [
        { tag: '同事父亲去世', setting: '同事请假一周后回来上班，你想说点什么又怕说错。' },
        V('朋友失恋', '朋友刚分手，你想安慰但不想说教。', {
          0: ['I heard. That is rough. Do you want to talk or be distracted?', '我听说了。这很难。你想聊聊还是想转移注意力？'],
          1: ['Distracted, honestly. Come for a walk?', '说实话，转移注意力。一起去走走？'],
        }),
        V('同事生病', '同事在做治疗，你只想表达支持。', {
          0: ['I am not going to ask how you are feeling. Just tell me what helps.', '我不问你感觉怎么样。就告诉我什么对你有用。'],
        }),
        V('说不出口', '你怕说错话，干脆说实话。', {
          0: ['I do not know what to say. But I am here.', '我不知道该说什么。但我在。'],
        }),
        V('追悼会', '你要去参加追悼会，先问安排。', {
          4: ['Is the service open to colleagues? I would like to come.', '追悼会同事能去吗？我想去。'],
        }),
      ],
      phrases: [
        P('I am so sorry for your loss.', '节哀。', '吊唁的标准说法。'),
        P('How are you holding up?', '你还撑得住吗？', '比 how are you 更适合艰难时刻。'),
        P('Anything I can take off your plate?', '有什么我能替你分担的吗？', '具体支援比「需要帮忙就说」有用。'),
      ],
    },
  ],
};
