import { L, V, S, O, B, P } from './_dsl.mjs';
import { LEGACY } from './_legacy.mjs';

const old = id => LEGACY.find(s => s.id === id);

export default {
  cat: '医疗',
  items: [
    /* ---------------- 看医生 ---------------- */
    {
      ...old('doctor'),
      variants: [
        { tag: '喉咙痛四天', setting: '喉咙痛了四天，越来越严重，你去了社区诊所。' },
        V('腰痛', '你搬完家腰一直疼，两周没好转。', {
          1: ['My lower back has been hurting for two weeks.', '我腰疼了两周。'],
          2: ['Does the pain go down your leg?', '疼痛会往腿上串吗？', 'go down your leg 是问坐骨神经放射痛，腰疼必问。'],
          3: ['A little, on the left side, down to the knee.', '有一点，左边，一直到膝盖。'],
        }),
        V('登记新病人', '你刚搬来，想在这家诊所建档。', {
          1: ['I just moved here. I would like to register with the practice.', '我刚搬来。想在这家诊所登记。'],
          2: ['Do you have your previous records, or a list of medication?', '有之前的病历，或者用药清单吗？'],
        }),
        V('复诊', '上次开的药吃完了，皮疹好了一些但没消。', {
          1: ['I am here for a follow-up. The rash is better but not gone.', '我来复诊。皮疹好点了，但还没消。'],
          7: ['Should I keep taking the cream?', '药膏还要继续用吗？'],
        }),
        V('带孩子', '孩子发烧两天，你带他来。', {
          1: ['He has had a fever for two days and is not eating.', '他发烧两天了，也不吃东西。'],
          2: ['Any rash, vomiting, or trouble breathing?', '有皮疹、呕吐或呼吸困难吗？'],
        }),
      ],
      branches: [
        ...(old('doctor').branches ?? []),
        {
          at: 5, kind: 'probe',
          task: '医生问你一个你不确定的病史，你要说实话',
          prompt: S('Have you ever had a reaction to antibiotics?', '你对抗生素有过反应吗？'),
          options: [
            O(S('I am not sure. I had a rash once but nobody checked.', '不确定。我有过一次皮疹，但没人查过。'), S('Then we will avoid that family entirely.', '那我们完全避开那一类。')),
            O(S('No, never.', '没有，从来没有。'), S('Good. I will write it on your file.', '好。我记在你的档案里。')),
          ],
        },
      ],
    },

    /* ---------------- 牙医 ---------------- */
    {
      id: 'dentist', name: '看牙医补牙', lv: 3, cefr: 'B1',
      roles: ['你', '牙医'],
      lines: [
        L(1, 'When did you last see a dentist?', '上次看牙是什么时候？'),
        L(0, 'About two years ago. One tooth hurts when I drink cold water.', '大概两年前。有一颗牙喝冷水会疼。'),
        L(1, 'Let me take an X-ray. Does it hurt right now?', '我拍个片子。现在疼吗？'),
        L(0, 'Only with cold. Not with hot.', '只有冷的疼。热的没事。', '冷疼热不疼，通常是龋齿；反过来可能是牙髓问题 —— 医生就靠这个区分。'),
        L(1, 'There is a small cavity. We can fill it today.', '有个小蛀洞。今天就能补。'),
        L(0, 'Will it hurt?', '会疼吗？'),
        L(1, 'We will numb it. You will feel pressure, not pain.', '会打麻药。你会觉得有压力，不疼。'),
        L(0, 'How much will it cost?', '要多少钱？'),
        L(1, 'A hundred and twenty, including the X-ray.', '一百二，含拍片。'),
        L(0, 'All right. Let us do it.', '好。那就补吧。'),
      ],
      variants: [
        { tag: '冷热敏感', setting: '你喝冰水时右边一颗牙刺痛，拖了两个月。' },
        V('洗牙', '你两年没洗牙了，想约一次洁牙。', {
          1: ['I would like a cleaning. It has been two years.', '我想洗牙。已经两年了。'],
          2: ['Any bleeding when you brush?', '刷牙会出血吗？'],
        }),
        V('拔智齿', '你的智齿长歪了，反复发炎。', {
          1: ['My wisdom tooth keeps getting infected. Should it come out?', '我的智齿总是发炎。要拔吗？'],
          2: ['It is growing sideways. I would take it out, but not today.', '它长歪了。我建议拔，但不是今天。'],
        }),
        V('急诊牙痛', '半夜牙疼得睡不着，第二天一早就来了。', {
          1: ['I could not sleep from the pain. It started last night.', '疼得睡不着。昨晚开始的。'],
        }),
        V('问保险', '你想确认保险能报多少。', {
          7: ['Does my insurance cover this?', '我的保险能报这个吗？'],
          8: ['Fillings are covered at seventy percent. The X-ray is included.', '补牙报七成。拍片含在内。'],
        }),
      ],
      branches: [
        {
          at: 3, kind: 'change',
          task: '医生说情况比预想复杂，你要决定今天做还是改天',
          prompt: S('The cavity is deeper than the X-ray showed. It may need a root canal.', '蛀得比片子上深。可能需要根管治疗。'),
          options: [
            O(S('What does that involve, and what does it cost?', '那要怎么做，多少钱？'), S('Two visits, and about four hundred.', '两次，大概四百。')),
            O(S('Can we start with the filling and see?', '能先补，看看情况吗？'), S('We can, but there is a chance it fails.', '可以，但有可能失败。')),
          ],
        },
      ],
      phrases: [
        P('It hurts when I drink cold water.', '喝冷水会疼。', '描述牙痛最有效的一句。'),
        P('Will it hurt?', '会疼吗？', '看牙前人人都想问。'),
        P('Does my insurance cover this?', '保险能报这个吗？', '治疗前问清，避免账单惊喜。'),
      ],
    },

    /* ---------------- 急诊 ---------------- */
    {
      id: 'emergency', name: '急诊处理伤口', lv: 4, cefr: 'B1',
      roles: ['你', '护士'],
      lines: [
        L(1, 'What seems to be the problem?', '哪里不舒服？'),
        L(0, 'I cut my hand on a glass. It will not stop bleeding.', '我的手被玻璃划了。血止不住。'),
        L(1, 'Let me see. How long ago?', '我看看。多久之前？'),
        L(0, 'Twenty minutes. I have been pressing it with a towel.', '二十分钟。我一直用毛巾按着。'),
        L(1, 'You need stitches. Are you on any medication?', '需要缝针。你在吃什么药吗？'),
        L(0, 'Just aspirin, one a day.', '只有阿司匹林，一天一片。'),
        L(1, 'That thins the blood, so expect a bit more bleeding. Any allergies?', '那会稀释血液，可能会多流一点。有过敏吗？'),
        L(0, 'None that I know of.', '据我所知没有。'),
        L(1, 'Good. We will numb the area and close it with four stitches.', '好。我们先麻醉，再缝四针。'),
      ],
      variants: [
        { tag: '玻璃划伤', setting: '你打碎了一个杯子，捡碎片时划开手掌。' },
        V('崴脚', '你下楼梯踩空，脚踝肿了。', {
          1: ['I twisted my ankle. It is swelling and I cannot put weight on it.', '我崴了脚。肿了，踩不下去。'],
          2: ['Can you move your toes?', '脚趾能动吗？'],
        }),
        V('烫伤', '你被开水烫了小臂。', {
          1: ['I spilled boiling water on my arm.', '开水泼到我手臂上了。'],
          2: ['How long ago? Did you cool it under running water?', '多久之前？用流动水冲过了吗？', '烫伤第一步是冲冷水十分钟，医生一定会问。'],
        }),
        V('过敏反应', '你吃完海鲜后嘴唇肿了。', {
          1: ['My lips swelled up after dinner. My throat feels tight.', '晚饭后嘴唇肿了。喉咙发紧。'],
        }),
        V('孩子发烧', '孩子烧到三十九度五，精神很差。', {
          1: ['My son is thirty-nine five and very sleepy.', '我儿子三十九度五，很没精神。'],
        }),
      ],
      branches: [
        {
          at: 5, kind: 'probe',
          task: '护士问你的用药情况，你要给准确信息',
          prompt: S('Do you take anything else? Even supplements count.', '还在吃别的吗？保健品也算。'),
          options: [
            O(S('Fish oil and vitamin D, nothing prescription.', '鱼油和维生素 D，没有处方药。'), S('Noted. We will keep pressure on it.', '记下了。我们继续按压。')),
            O(S('I took ibuprofen this morning, about four hours ago.', '今天早上吃了布洛芬，大概四小时前。'), S('Good to know. That also affects bleeding.', '知道了。那也会影响出血。')),
          ],
        },
      ],
      phrases: [
        P('It will not stop bleeding.', '血止不住。', '止血 = stop the bleeding。'),
        P('I have been pressing it with a towel.', '我一直用毛巾按着。', 'press 加压是急救第一步。'),
        P('None that I know of.', '据我所知没有。', '被问过敏时的标准回答。'),
      ],
    },

    /* ---------------- 保险理赔 ---------------- */
    {
      
      branches: [
        B(6, 'cost', '额度不够，你要判断剩下的怎么处理',
          S('Then only five hundred is left, and the treatment was six hundred.', '那只剩五百额度，治疗花了六百。'),
          [O(S('So I pay the last hundred myself?', '那一百我自己付？'), S('Exactly. We settle it after the claim.', '对。理赔之后结清。')),
           O(S('Can it go against next year?', '能算到明年吗？'), S('Only if the treatment happens next year.', '只有治疗发生在明年才行。'))]),
      ],
id: 'insurance', name: '医疗保险理赔', lv: 5, cefr: 'B2',
      roles: ['你', '客服'],
      lines: [
        L(0, 'I need to make a claim for a dental visit.', '我要申请一笔牙科理赔。'),
        L(1, 'Do you have the invoice and the receipt?', '有发票和收据吗？'),
        L(0, 'I have both, and the treatment notes.', '两样都有，还有治疗记录。'),
        L(1, 'Was it an emergency or planned treatment?', '是急诊还是计划内治疗？'),
        L(0, 'Planned. I have the pre-approval email from March.', '计划内。我有三月的预审批邮件。', 'pre-approval 是事先审批，有计划治疗一定要先拿，否则可能不报。'),
        L(1, 'Then it is covered at seventy percent, up to eight hundred a year.', '那报七成，每年上限八百。'),
        L(0, 'I have already used three hundred this year.', '我今年已经用了三百。'),
        L(1, 'Then five hundred of cover is left. Send the documents and we will process it.', '那还剩五百额度。把材料寄来我们处理。'),
      ],
      variants: [
        { tag: '牙科理赔', setting: '你自费补了牙，想把钱报回来一部分。' },
        V('住院理赔', '你上个月住了一晚院。', {
          0: ['I was in hospital for one night last month. How do I claim?', '我上个月住院一晚。怎么申请理赔？'],
          1: ['Send the discharge letter and the itemised bill.', '寄出院小结和分项账单。'],
        }),
        V('被拒赔', '你的理赔被拒了，想知道原因。', {
          0: ['My claim was rejected. It says pre-existing condition.', '我的理赔被拒了。理由是既往症。'],
          1: ['Was it diagnosed before you joined? That is what the rule means.', '是在你投保前确诊的吗？条款就是这个意思。'],
        }),
        V('加家属', '你想把配偶加进保单。', {
          0: ['Can I add my wife to the policy?', '我能把我太太加进保单吗？'],
        }),
        V('问报销进度', '材料寄了两周，没有回音。', {
          7: ['It has been two weeks. Is there a reference number?', '已经两周了。有受理号吗？'],
        }),
      ],
      phrases: [
        P('I need to make a claim.', '我要申请理赔。', 'claim 名词动词同形。'),
        P('Was it planned or an emergency?', '是计划内还是急诊？', '这句决定报多少。'),
        P('covered at seventy percent', '报七成', 'covered 是「在保障范围内」。'),
      ],
    },

    /* ---------------- 心理咨询初诊 ---------------- */
    {
      
      branches: [
        B(5, 'probe', '咨询师问了一个你不想答的问题，你要决定说多少',
          S('What do you think keeps you from meeting people here?', '你觉得是什么让你没法在这里认识人？'),
          [O(S('Honestly, I am afraid of starting over again.', '说实话，我怕再重新开始一次。'), S('That is worth staying with for a minute.', '这一点值得多聊一会儿。')),
           O(S('I would rather not go there yet.', '我还不想谈这个。'), S('That is fine. We can come back to it.', '可以。我们以后再说。'))]),
      ],
id: 'counseling', name: '心理咨询初诊', lv: 6, cefr: 'B2',
      roles: ['你', '咨询师'],
      lines: [
        L(1, 'What brings you here?', '是什么让你来这儿？'),
        L(0, 'I have not been sleeping well, and I cannot focus at work.', '我一直睡不好，工作也集中不了。'),
        L(1, 'How long has that been going on?', '持续多久了？'),
        L(0, 'About two months, since I moved here.', '大概两个月，从我搬来开始。'),
        L(1, 'Do you have anyone here you can talk to?', '这边有能说话的人吗？'),
        L(0, 'Not really. Most of my friends are in another time zone.', '不太有。我的朋友大多在另一个时区。'),
        L(1, 'That is a lot to carry on your own. What would help most right now?', '这些一个人扛很重。现在最需要什么？'),
        L(0, 'I would like to sleep through the night, and to stop dreading Mondays.', '我想一觉睡到天亮，也不想再害怕周一。'),
      ],
      variants: [
        { tag: '搬到新城市', setting: '你搬来两个月，睡不好，也不想上班。' },
        V('工作压力', '你连续加班三个月，开始心悸。', {
          1: ['I have been working late for three months and my heart races at night.', '我连续加班三个月，晚上会心悸。'],
        }),
        V('失去亲人', '你父亲半年前去世。', {
          0: ['My father died six months ago and I have not really felt anything.', '我父亲半年前去世，我好像什么感觉都没有。'],
        }),
        V('问疗程', '你想知道要谈几次。', {
          6: ['How many sessions do people usually need?', '一般人需要几次？'],
        }),
        V('问费用', '你想确认价格和保密。', {
          6: ['Is this covered, and who sees the notes?', '这个能报销吗？谁能看到记录？'],
        }),
      ],
      phrases: [
        P('What brings you here?', '是什么让你来这儿？', '咨询师的开场问法。'),
        P('I have not been sleeping well.', '我一直睡不好。', '描述状态比说 I am stressed 更具体。'),
        P('That is a lot to carry on your own.', '这些一个人扛很重。', '被共情时的常见回应句。'),
      ],
    },
  ],
};
