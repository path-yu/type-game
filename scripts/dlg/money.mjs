import { L, V, S, O, B, P } from './_dsl.mjs';

export default {
  cat: '财务',
  items: [
    {
      id: 'payslip', name: '工资条看不懂', lv: 5, cefr: 'B2',
      roles: ['你', '人事'],
      lines: [
        L(0, 'Could you explain my payslip? The net pay is lower than last month.', '能解释一下我的工资条吗？实发比上月少。'),
        L(1, 'You had two days of unpaid leave. That is the difference.', '你请了两天无薪假。差额就在这儿。'),
        L(0, 'I thought leave was paid.', '我以为请假是带薪的。'),
        L(1, 'Only statutory leave. The rest is unpaid.', '只有法定假带薪。其余没有。'),
        L(0, 'And what is this deduction here?', '这一项扣的是什么？'),
        L(1, 'National insurance. It goes up when you earn more.', '国民保险。收入高了扣得也多。'),
        L(0, 'Can I get a breakdown in writing?', '能给我一份书面明细吗？'),
        L(1, 'I will email it today.', '我今天发邮件。'),
      ],
      variants: [
        { tag: '实发变少', setting: '你发现这个月实发比上月少了一百多。' },
        V('加班费没算', '你上个月加了三个夜班。', {
          0: ['I worked three night shifts and they are not on here.', '我上了三个夜班，这里没算。'],
          1: ['Night shifts are paid in the following month. Check next payslip.', '夜班费下个月发。看下个月工资条。'],
        }),
        V('税号填错', '你的税号被填错了。', {
          2: ['My tax code looks wrong. It says the basic rate.', '我的税号好像错了。写的是基本税率。'],
          3: ['Send me your P45 and I will correct it.', '把你的 P45 发我，我改过来。'],
        }),
        V('奖金', '你拿到一笔奖金，想知道扣了多少。', {
          4: ['How much tax was taken from the bonus?', '奖金扣了多少税？'],
          5: ['Forty percent, because it is treated as a one-off.', '四成，因为按一次性收入处理。'],
        }),
        V('离职结算', '你离职了，想知道最后一笔。', {
          0: ['I am leaving on Friday. What will the final payslip include?', '我周五离职。最后一笔工资条包括什么？'],
        }, 1),
        V('问年假', '你想知道还剩多少天年假。', {
          6: ['How many holiday days do I have left?', '我还剩多少天年假？'],
        }, 1),
        V('工资没到', '发薪日钱没到账。', {
          0: ['My pay has not arrived and it was due yesterday.', '工资没到，昨天就该发了。'],
        }, 1),
      ],
      branches: [
        B(6, 'probe', '人事要你确认一个数字，你要能对得上',
          S('Before I send it, what figure did you expect for net pay?', '发之前先确认，你预计实发多少？'),
          [O(S('About two thousand one hundred, based on last month.', '大概两千一，按上月算的。'), S('That matches my calculation. I will send it now.', '跟我算的一样。我现在发。')),
           O(S('I do not know. That is why I am asking.', '我不知道。所以才来问。'), S('Fair. I will walk you through line by line.', '行。我一行一行讲。'))]),
        // 你要的东西（书面明细）拿不到 —— 这类意外的正确动作不是争，是退一步换个能拿到手的。
        B(6, 'short', '你要的东西给不了，换个能拿到手的办法',
          S('I cannot send a full breakdown, but I can read the lines out to you now.', '完整明细我不能发，不过现在可以逐项念给你听。'),
          [O(S('Go ahead, I will take notes.', '你念，我记。'), S('Gross, then tax, then pension. What is left is net.', '先应发，再税，再养老金。剩下就是实发。')),
           O(S('Then could I have it as a screenshot?', '那能给我截图吗？'), S('Let me ask payroll. I will email it if they agree.', '我问下薪酬组，同意就邮件发你。'))]),
      ],
      phrases: [
        P('Could you explain my payslip?', '能解释一下我的工资条吗？', 'payslip 是工资条，不是工资。'),
        P('Unpaid leave', '无薪假', '和 statutory leave（法定带薪假）相对。'),
        P('Can I get a breakdown in writing?', '能给我一份书面明细吗？', '口头解释过后容易忘。'),
      ],
    },

    {
      id: 'tax-return', name: '第一次报税', lv: 5, cefr: 'B2',
      roles: ['你', '税务顾问'],
      lines: [
        L(0, 'I need help filing my tax return. It is my first year.', '我需要帮忙报税。这是我第一年。'),
        L(1, 'Are you employed or self-employed?', '你是雇员还是自雇？'),
        L(0, 'Employed, but I also sold some shares.', '雇员，但我也卖了一些股票。'),
        L(1, 'Then you need to declare the gains.', '那你要申报这部分收益。'),
        L(0, 'Is there an allowance?', '有免税额吗？'),
        L(1, 'Three thousand a year before tax is due.', '一年三千以内不征税。'),
        L(0, 'Do I need to file if I am under that?', '不到这个数还要报吗？'),
        L(1, 'Not usually, but keep the records for five years.', '一般不用，但记录要留五年。'),
      ],
      variants: [
        { tag: '第一次报税', setting: '你工作第一年，卖了点股票，不确定要不要报。' },
        V('自雇', '你接私活赚了钱。', {
          1: ['Self-employed. I do freelance work on the side.', '自雇。我业余接私活。'],
          2: ['Then you file a different form, and you can claim expenses.', '那要填另一张表，而且可以抵扣开支。'],
        }),
        V('海外收入', '你有国外账户。', {
          0: ['I have an account abroad. Do I need to declare it?', '我在国外有账户。要申报吗？'],
        }),
        V('迟交', '你错过了截止日。', {
          6: ['I missed the deadline. What is the penalty?', '我错过截止日了。罚多少？'],
          7: ['A hundred, and it grows after three months.', '一百，三个月后还会增加。'],
        }),
        V('问抵扣', '你想知道什么能抵。', {
          4: ['Can I claim the laptop and the desk?', '笔记本和桌子能抵扣吗？'],
        }),
        V('更正', '你报错了。', {
          0: ['I filed last week and I made a mistake on the total.', '我上周报了，总额填错了。'],
        }),
        V('问退税', '你多交了税。', {
          6: ['How long does a refund take?', '退税要多久？'],
        }),
      ],
      branches: [
        B(4, 'probe', '顾问问你要证据，你没有全部',
          S('Do you have the contract notes for the share sales?', '股票交易有成交单吗？'),
          [O(S('The platform keeps them. I can download the year summary.', '平台有记录。我能下载年度汇总。'), S('That is enough for the return.', '申报用这个够。')),
           O(S('I only have screenshots of the app.', '我只有 app 截图。'), S('It will do, but request the official statement too.', '也能用，但最好再要一份正式对账单。'))]),
      ],
      phrases: [
        P('File a tax return', '报税', 'file 是提交申报表。'),
        P('Is there an allowance?', '有免税额吗？', 'allowance 是免税额度。'),
        P('Keep the records for five years.', '记录留五年。', '报税后留档的常规要求。'),
      ],
    },

    {
      id: 'expense', name: '报销差旅费', lv: 4, cefr: 'B1',
      roles: ['你', '财务'],
      lines: [
        L(0, 'I would like to claim back a train ticket.', '我想报销一张火车票。'),
        L(1, 'Was it booked through the company account?', '是用公司账户订的吗？'),
        L(0, 'No, I paid myself. Here is the receipt.', '不是，我自己付的。这是收据。'),
        L(1, 'Anything over fifty needs manager approval.', '超过五十要经理批。'),
        L(0, 'It was eighty. Should I get approval first?', '八十。要先批吗？'),
        L(1, 'Send it to him and copy me.', '发给他，抄送我。'),
        L(0, 'How long does the refund take?', '多久能报下来？'),
        L(1, 'Two payroll cycles, so about a month.', '两个发薪周期，大概一个月。'),
      ],
      variants: [
        { tag: '报销火车票', setting: '你出差回来，垫了八十块车票。' },
        V('餐费', '你出差请客户吃饭。', {
          0: ['I am claiming a client dinner, ninety-two pounds.', '我要报销客户晚餐，九十二镑。'],
          1: ['Alcohol is not covered. Take that line off.', '酒水不报。把那行去掉。'],
        }),
        V('酒店', '你住了两晚。', {
          3: ['Is there a nightly limit on hotels?', '酒店有每晚上限吗？'],
          4: ['A hundred and forty, in this city.', '这个城市一百四。'],
        }),
        V('打车', '你打了车去机场。', {
          2: ['I took a taxi because the train was cancelled. Is that allowed?', '火车取消了我打车。能报吗？'],
        }),
        V('超期提交', '你三个月后才交。', {
          6: ['I am late submitting. Is there a cut-off?', '我交晚了。有截止期吗？'],
        }),
        V('外币', '你在国外刷卡。', {
          5: ['The receipt is in euros. Which rate do you use?', '收据是欧元。你们用哪个汇率？'],
        }),
        V('被退回', '你的报销被退了。', {
          0: ['My claim came back rejected. It says no cost centre.', '我的报销被退了。说没填成本中心。'],
        }),
      ],
      branches: [
        B(4, 'change', '财务说流程要走另一条路，你要问清',
          S('Over fifty also needs a purchase order. Did you raise one?', '超过五十还要采购单。你提了吗？'),
          [O(S('No. Can I raise one after the trip?', '没有。出差后能补吗？'), S('You can, but mark it retrospective.', '能，但要标注为事后补。')),
           O(S('Who raises it, me or my manager?', '谁提，我还是经理？'), S('You raise it, he approves it.', '你提，他批。'))]),
      ],
      phrases: [
        P('I would like to claim back a train ticket.', '我想报销一张火车票。', 'claim back 是报销。'),
        P('Needs manager approval.', '要经理批。', '金额门槛各公司不同，先问。'),
        P('Two payroll cycles.', '两个发薪周期。', '报销到账的实际节奏。'),
      ],
    },

    {
      id: 'invoice', name: '催一张逾期发票', lv: 5, cefr: 'B2',
      roles: ['你', '对方财务'],
      lines: [
        L(0, 'Invoice 2214 is now thirty days overdue.', '2214 号发票逾期三十天了。'),
        L(1, 'I will check with accounts.', '我跟财务查一下。'),
        L(0, 'We agreed thirty days, and it is day forty-five.', '约定三十天，现在已经四十五天。'),
        L(1, 'I see it. It was held for a purchase order number.', '看到了。因为缺采购单号被搁置。'),
        L(0, 'The PO is on the invoice, line two.', '采购单号在发票上，第二行。'),
        L(1, 'Then it is our mistake. I will push it through this week.', '那是我们的问题。我这周推一下。'),
        L(0, 'Could you confirm the payment date in writing?', '能书面确认付款日期吗？'),
        L(1, 'I will email you today with a date.', '我今天发邮件给你一个日期。'),
      ],
      variants: [
        { tag: '逾期三十天', setting: '你是小供应商，这笔钱关系到这个月发工资。' },
        V('第一次提醒', '刚过期几天，不想把关系搞僵。', {
          0: ['Just a gentle reminder that invoice 2214 was due on Friday.', '友情提醒一下，2214 号发票周五到期。'],
          1: ['Thanks. It is in the next run.', '谢谢。在下一批付款里。'],
        }),
        V('要利息', '合同里有逾期利息条款。', {
          2: ['The contract allows interest on late payment. I would rather not use it.', '合同允许收逾期利息。我不太想走到那一步。'],
        }),
        V('对方说没收到', '对方说没收到发票。', {
          0: ['You say it never arrived. I sent it on the third, with a read receipt.', '你说没收到。我三号发的，有已读回执。'],
        }),
        V('部分付款', '对方只付了一半。', {
          4: ['You paid half. Was the rest disputed?', '你付了一半。剩下的有争议吗？'],
        }),
        V('威胁停服务', '你准备停服务。', {
          6: ['If it is not paid by Friday, we will have to pause the service.', '周五还没付，我们只能暂停服务。'],
        }),
        V('内部升级', '你要找对方上级。', {
          5: ['Could you put me through to your finance manager?', '能帮我转财务经理吗？'],
        }),
      ],
      branches: [
        B(2, 'probe', '对方把责任推给流程，你要拿出证据',
          S('We never received a valid purchase order.', '我们没收到有效的采购单。'),
          [O(S('It is on the invoice, and your colleague approved it by email.', '在发票上，你的同事邮件里批过。'), S('Send me that email and I will release it today.', '把那封邮件发我，我今天就放款。')),
           O(S('Then tell me what a valid PO looks like and we will fix it.', '那告诉我合规的采购单长什么样，我们改。'), S('Fair. I will send the template.', '合理。我把模板发你。'))]),
      ],
      phrases: [
        P('Invoice 2214 is thirty days overdue.', '2214 号发票逾期三十天。', 'overdue 是逾期。'),
        P('I will push it through.', '我去推一下。', '财务口语，意思是加快处理。'),
        P('Could you confirm the payment date in writing?', '能书面确认付款日期吗？', '口头承诺不算数。'),
      ],
    },

    {
      id: 'loan', name: '咨询个人贷款', lv: 5, cefr: 'B2',
      roles: ['你', '银行顾问'],
      lines: [
        L(0, 'I would like to ask about a personal loan.', '我想咨询个人贷款。'),
        L(1, 'How much do you need, and for how long?', '要多少，多久还？'),
        L(0, 'Five thousand, over two years.', '五千，两年。'),
        L(1, 'The rate would be six percent, fixed.', '利率六个点，固定。'),
        L(0, 'Are there early repayment charges?', '提前还款有罚金吗？', 'early repayment charge 是提前还款罚金，很多贷款前几年都有。'),
        L(1, 'None after the first year.', '一年后没有。'),
        L(0, 'What do you need from me?', '需要我提供什么？'),
        L(1, 'Three months of statements and your ID.', '三个月流水和证件。'),
      ],
      variants: [
        { tag: '借五千两年', setting: '你要换车，差五千块。' },
        V('房贷预批', '你想知道自己能贷多少。', {
          0: ['I would like an agreement in principle for a mortgage.', '我想做房贷预批。'],
          1: ['Then we look at income and deposit. How much do you have saved?', '那要看收入和首付。你存了多少？'],
        }),
        V('信用不好', '你之前有逾期记录。', {
          2: ['My credit file has one missed payment from last year.', '我的信用记录去年有一次逾期。'],
          3: ['That may raise the rate. We can still look.', '可能会提高利率。但还是可以看。'],
        }),
        V('问月供', '你想知道每月还多少。', {
          4: ['What would the monthly payment be?', '每月还多少？'],
          5: ['Two hundred and twenty, over twenty-four months.', '二十四个月，每月两百二。'],
        }),
        V('被拒', '申请被拒了。', {
          6: ['The application was declined. Can you tell me why?', '申请被拒了。能说原因吗？'],
        }),
        V('提前还清', '你想一年内还完。', {
          4: ['If I pay it off in a year, what does that cost?', '我一年内还清，要付多少？'],
        }),
        V('比价', '你在比较几家银行。', {
          7: ['Another bank offered five point five. Can you match it?', '另一家给五点五。你们能匹配吗？'],
        }),
      ],
      branches: [
        B(4, 'cost', '顾问报了个附加成本，你要判断值不值',
          S('There is a ninety pound arrangement fee, added to the loan.', '有九十镑手续费，算进贷款里。'),
          [O(S('So I borrow five thousand and ninety?', '那我是借五千零九十？'), S('Exactly, and you repay that plus interest.', '对，本金加利息一起还。')),
           O(S('Can I pay the fee upfront instead?', '能单独先付手续费吗？'), S('You can, and it lowers the total interest.', '可以，总利息会少一些。'))]),
      ],
      phrases: [
        P('Are there early repayment charges?', '提前还款有罚金吗？', '想早还清必问。'),
        P('Fixed or variable?', '固定还是浮动？', 'fixed 锁定，variable 随市场动。'),
        P('Can you match it?', '你们能匹配吗？', '比价时的标准问法。'),
      ],
    },

    {
      id: 'remittance', name: '跨境汇款', lv: 4, cefr: 'B1',
      roles: ['你', '柜员'],
      lines: [
        L(0, 'I need to send money to China.', '我要往中国汇款。'),
        L(1, 'How much, and to whom?', '多少，给谁？'),
        L(0, 'Two thousand, to my parents.', '两千，给我父母。'),
        L(1, 'The fee is eight pounds, and the rate is on the screen.', '手续费八镑，汇率在屏幕上。'),
        L(0, 'When will it arrive?', '什么时候到？'),
        L(1, 'One working day, sometimes same day.', '一个工作日，有时当天。'),
        L(0, 'Do they need to do anything at their end?', '他们那边要做什么吗？'),
        L(1, 'They may need to confirm the purpose of the payment.', '可能需要确认款项用途。'),
      ],
      variants: [
        { tag: '给父母汇两千', setting: '你每月给家里汇钱，这次想换家更便宜的。' },
        V('要更快', '你急用，想当天到。', {
          4: ['Can it arrive today? It is urgent.', '今天能到吗？急用。'],
          5: ['Same day costs twenty-two and must be in by eleven.', '当天到二十二镑，十一点前办。'],
        }),
        V('学费', '你要交学费。', {
          0: ['I am paying university fees abroad. Is there a cheaper route?', '我要交国外学费。有更便宜的方式吗？'],
          1: ['For large amounts, a transfer is cheaper than a card.', '大额的话转账比刷卡便宜。'],
        }),
        V('被问用途', '柜员问汇款用途。', {
          2: ['It is for family support. Do you need proof?', '是给家里的生活费。需要证明吗？'],
        }),
        V('汇率', '你觉得汇率不划算。', {
          3: ['The rate seems low compared with the app.', '这个汇率比 app 上低。'],
          4: ['We charge no commission, so the rate carries the cost.', '我们不收佣金，成本在汇率里。'],
        }),
        V('限额', '你想知道一年能汇多少。', {
          6: ['Is there an annual limit on transfers?', '一年有汇款限额吗？'],
        }),
        V('汇错', '你填错了账号。', {
          0: ['I sent money to the wrong account yesterday. Can it be recalled?', '我昨天汇错账户了。能追回吗？'],
        }),
      ],
      branches: [
        B(4, 'cost', '对方提示还有一笔费用，你要算总成本',
          S('The receiving bank may charge a fee at their end as well.', '收款行那边可能也收费。'),
          [O(S('Then the total could be twenty pounds. Is there a cheaper option?', '那总共可能二十镑。有更便宜的吗？'), S('The online service is six, but takes two days.', '线上六镑，但要两天。')),
           O(S('Do you know how much they charge?', '你知道他们收多少吗？'), S('Usually the equivalent of two or three pounds.', '一般折合两三镑。'))]),
      ],
      phrases: [
        P('The fee is eight pounds.', '手续费八镑。', '汇款要问 fee 和 rate 两件事。'),
        P('One working day.', '一个工作日。', 'working day 不含周末。'),
        P('Confirm the purpose of the payment.', '确认款项用途。', '反洗钱要求，收款方常被问。'),
      ],
    },

    {
      id: 'card-dispute', name: '信用卡争议款', lv: 4, cefr: 'B1',
      roles: ['你', '银行客服'],
      lines: [
        L(0, 'There is a charge on my card I do not recognise.', '我卡上有一笔我不认识的消费。'),
        L(1, 'How much, and when?', '多少，什么时候？'),
        L(0, 'Sixty pounds, on Tuesday. I was at work all day.', '六十镑，周二。我那天一直在上班。'),
        L(1, 'Did you lend your card to anyone?', '卡借给别人用过吗？'),
        L(0, 'No. It is still in my wallet.', '没有。还在我钱包里。'),
        L(1, 'Then we will freeze it and raise a dispute.', '那我们冻结这张卡并发起争议。'),
        L(0, 'Will I get the money back while you investigate?', '调查期间钱能先退吗？'),
        L(1, 'Usually within ten days, as a temporary credit.', '一般十天内，作为临时入账。'),
      ],
      variants: [
        { tag: '不认识的六十镑', setting: '你查账单，发现一笔从没去过的店的消费。' },
        V('订阅忘记取消', '其实是试用期转正。', {
          0: ['I think I know this one. It is a trial that rolled over.', '这笔我大概知道。是试用期转正了。'],
          1: ['Then it is not fraud, but I can ask them to cancel it.', '那不算盗刷，但我可以让他们取消。'],
        }),
        V('重复扣款', '同一笔扣了两次。', {
          0: ['The same payment went through twice on Monday.', '周一同一笔付了两次。'],
        }),
        V('境外盗刷', '一笔在国外刷的。', {
          0: ['There is a charge from a shop in another country.', '有一笔是国外某家店的消费。'],
        }),
        V('商家不退', '商家答应退款但没退。', {
          6: ['The shop promised a refund three weeks ago and nothing came.', '商家三周前答应退款，没到账。'],
        }),
        V('新卡', '你想要一张新卡。', {
          7: ['Will the replacement have a new number?', '补的卡号会变吗？'],
        }),
        V('影响信用', '你担心影响信用记录。', {
          5: ['Will a dispute affect my credit score?', '发起争议会影响我的信用分吗？'],
        }),
      ],
      branches: [
        B(4, 'probe', '客服要确认卡在你手上，你要配合',
          S('Can you confirm the last three transactions on the card?', '能确认一下这张卡最近三笔消费吗？'),
          [O(S('Groceries on Monday, a bus ticket, and coffee this morning.', '周一超市、一张车票、今早咖啡。'), S('That matches. Freezing it now.', '对上了。现在冻结。')),
           O(S('I do not remember the exact amounts.', '我不记得具体金额。'), S('Then I will ask you to check the app while I wait.', '那请你看一下 app，我等着。'))]),
      ],
      phrases: [
        P('A charge I do not recognise.', '一笔我不认识的消费。', '争议款的固定说法。'),
        P('Raise a dispute.', '发起争议。', 'dispute 是向银行申诉。'),
        P('As a temporary credit.', '作为临时入账。', '调查期间的先行退款。'),
      ],
    },
  ],
};
