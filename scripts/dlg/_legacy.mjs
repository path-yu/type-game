// 早期手写的 10 场（原样保留，作为骨架的主线；变体见各文件的 variants）
// 这段由 scripts/dlg/_legacy.mjs 生成，内容与原 dialogues.json 完全一致。
export const LEGACY = [
 {
  "id": "cafe",
  "name": "咖啡店点单",
  "lv": 2,
  "cefr": "A2",
  "roles": [
   "你",
   "店员"
  ],
  "lines": [
   {
    "r": 1,
    "en": "Hi there! What can I get started for you?",
    "zh": "你好！想喝点什么？",
    "note": "get started for you 是美国咖啡店的固定问法，字面是「开始给你做」。不是问你要不要开始。"
   },
   {
    "r": 0,
    "en": "Could I get a large latte, please?",
    "zh": "我要一杯大杯拿铁，谢谢。",
    "note": "点单说 Could I get… 比 I want… 礼貌得多，也不用想 Would you… 后面接什么。"
   },
   {
    "r": 1,
    "en": "Sure. Hot or iced?",
    "zh": "好的。热的还是冰的？"
   },
   {
    "r": 0,
    "en": "Iced, please. And could you make it with oat milk?",
    "zh": "冰的。能换成燕麦奶吗？"
   },
   {
    "r": 1,
    "en": "We can. That'll be fifty cents extra, is that okay?",
    "zh": "可以。要加五毛钱，行吗？",
    "note": "That'll be + 金额，是店员报价格式，听到就知道该掏钱了。"
   },
   {
    "r": 0,
    "en": "That's fine. Oh, and could I get a blueberry muffin too?",
    "zh": "没问题。对了，再来一个蓝莓麦芬。"
   },
   {
    "r": 1,
    "en": "For here or to go?",
    "zh": "在这儿喝还是带走？",
    "note": "英式说 eat in or takeaway，意思一样。"
   },
   {
    "r": 0,
    "en": "To go, please. Can I pay by card?",
    "zh": "带走。可以刷卡吗？"
   },
   {
    "r": 1,
    "en": "Of course. What name should I put on the cup?",
    "zh": "当然。杯子上写什么名字？"
   },
   {
    "r": 0,
    "en": "Wen. W-E-N. Thanks a lot.",
    "zh": "Wen，W-E-N。多谢。"
   }
  ],
  "variants": [
   {
    "setting": "工作日的早晨，街角咖啡店排着队。你只想快点拿到咖啡，别迟到。"
   }
  ],
  "branches": [
   {
    "at": 7,
    "kind": "change",
    "task": "收银台出了状况，给出一个能继续走下去的解决方案",
    "prompt": {
     "en": "So sorry, the card machine is down. It's cash only today.",
     "zh": "抱歉，刷卡机坏了，今天只收现金。",
     "note": "down 在这里是「坏掉、不能用」，不是「往下」。"
    },
    "options": [
     {
      "say": {
       "en": "That's fine, I've got cash.",
       "zh": "没事，我有现金。"
      },
      "react": {
       "en": "Perfect. And what name should I put on the cup?",
       "zh": "好的。杯子上写什么名字？"
      }
     },
     {
      "say": {
       "en": "Could I pay by phone instead?",
       "zh": "我能用手机付吗？"
      },
      "react": {
       "en": "Sure, just tap here. Name for the cup?",
       "zh": "可以，在这儿碰一下。杯子上写什么名字？"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "Could I get a large latte, please?",
    "zh": "我要一杯大杯拿铁。",
    "tip": "点单万能句，换掉最后的名词就能点任何东西。"
   },
   {
    "en": "For here or to go?",
    "zh": "堂食还是外带？",
    "tip": "店员必问的一句，听不懂就卡在这儿。"
   },
   {
    "en": "That'll be five dollars.",
    "zh": "一共五块。",
    "tip": "报价格式，后面接金额。"
   },
   {
    "en": "Could you make it with oat milk?",
    "zh": "能换成燕麦奶吗？",
    "tip": "make it with… 换配料，餐厅里同样能用。"
   }
  ]
 },
 {
  "id": "directions",
  "name": "街头问路",
  "lv": 1,
  "cefr": "A1",
  "roles": [
   "你",
   "路人"
  ],
  "lines": [
   {
    "r": 0,
    "en": "Excuse me, sorry to bother you. Is there a pharmacy near here?",
    "zh": "打扰一下，不好意思。附近有药店吗？",
    "note": "sorry to bother you 是开口第一句的缓冲垫，不说这句直接问会显得突兀。"
   },
   {
    "r": 1,
    "en": "Sure. Go straight down this street and take the second left.",
    "zh": "有。沿这条街一直走，第二个路口左转。"
   },
   {
    "r": 0,
    "en": "The second left. Is it far?",
    "zh": "第二个路口左转。远吗？"
   },
   {
    "r": 1,
    "en": "Not at all, about five minutes on foot. It's next to the bank.",
    "zh": "不远，走路大概五分钟。就在银行旁边。",
    "note": "on foot＝步行。走路五分钟说 five minutes on foot，不说 by walk。"
   },
   {
    "r": 0,
    "en": "Great. Is it open on Sundays?",
    "zh": "好。周日开门吗？"
   },
   {
    "r": 1,
    "en": "I think so, until six. If it's closed, there's another one by the station.",
    "zh": "应该开，到六点。要是关了，车站那边还有一家。"
   },
   {
    "r": 0,
    "en": "That's really helpful. Thank you so much.",
    "zh": "帮了大忙，太谢谢了。"
   },
   {
    "r": 1,
    "en": "No problem. Have a good one!",
    "zh": "不客气，过得愉快！",
    "note": "Have a good one 是美式口语告别，比 Have a nice day 更随意。"
   }
  ],
  "variants": [
   {
    "setting": "你在陌生城市找一家药店，手机没电了，只能问人。"
   }
  ],
  "branches": [
   {
    "at": 2,
    "kind": "short",
    "task": "对方说药店可能关了，把方向问清楚",
    "prompt": {
     "en": "Actually, I think that one closed down last month.",
     "zh": "其实那家上个月好像关了。"
    },
    "options": [
     {
      "say": {
       "en": "Is there another one nearby?",
       "zh": "附近还有别的药店吗？"
      },
      "react": {
       "en": "There's one by the station, about ten minutes that way.",
       "zh": "车站那边有一家，往那边走十分钟左右。"
      }
     },
     {
      "say": {
       "en": "Then I'll try the one by the station.",
       "zh": "那我试试车站那家。"
      },
      "react": {
       "en": "Good idea. It's about ten minutes that way.",
       "zh": "好主意。往那边走十分钟左右。"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "Sorry to bother you, but…",
    "zh": "不好意思打扰一下……",
    "tip": "向陌生人开口的标准开头。"
   },
   {
    "en": "Is there a pharmacy near here?",
    "zh": "附近有药店吗？",
    "tip": "near here 结尾比 nearby 更自然。"
   },
   {
    "en": "Take the second left.",
    "zh": "第二个路口左转。",
    "tip": "路口用 take，不用 turn at。"
   },
   {
    "en": "It's about five minutes on foot.",
    "zh": "走路大概五分钟。",
    "tip": "距离用 on foot 计时。"
   }
  ]
 },
 {
  "id": "smalltalk",
  "name": "电梯里的寒暄",
  "lv": 2,
  "cefr": "A2",
  "roles": [
   "你",
   "邻居"
  ],
  "lines": [
   {
    "r": 1,
    "en": "Morning! Nasty weather today, isn't it?",
    "zh": "早啊！今天天气真糟糕，是吧？",
    "note": "用反义疑问句开启闲聊是英语世界的通用做法，对方只需应一声。"
   },
   {
    "r": 0,
    "en": "Tell me about it. I got soaked walking here.",
    "zh": "可不是嘛，我走过来全身都湿了。",
    "note": "Tell me about it 不是「跟我说说」，而是强烈赞同＝「太对了」。"
   },
   {
    "r": 1,
    "en": "Are you new to the building? I don't think we've met.",
    "zh": "你是新搬来的吧？我们好像没见过。"
   },
   {
    "r": 0,
    "en": "I moved in last month, unit 302. I'm Wen.",
    "zh": "我上个月搬来的，302。我叫 Wen。"
   },
   {
    "r": 1,
    "en": "Nice to meet you, Wen. I'm Dan, 405. How's the flat working out?",
    "zh": "幸会，Wen。我是 Dan，405。房子住着怎么样？",
    "note": "How's … working out 是问「结果如何／顺不顺利」，比 How is it 更自然。"
   },
   {
    "r": 0,
    "en": "So far so good, apart from the noise from the street.",
    "zh": "到目前还好，就是街上有点吵。",
    "note": "apart from＝除了。这个短语一出，抱怨也显得客气。"
   },
   {
    "r": 1,
    "en": "Yeah, that takes some getting used to. I'm on the fourth floor if you ever need anything.",
    "zh": "是啊，这得适应一阵。有需要就上四楼找我。",
    "note": "take some getting used to＝需要时间适应，固定搭配。"
   },
   {
    "r": 0,
    "en": "That's kind of you. See you around!",
    "zh": "你人真好。回头见！"
   }
  ],
  "variants": [
   {
    "setting": "你搬进新公寓一个月，今天在电梯里撞见了邻居。"
   }
  ],
  "branches": [
   {
    "at": 5,
    "kind": "offer",
    "task": "邻居提出一件具体的邀请，答应或婉拒，别让话掉在地上",
    "prompt": {
     "en": "If the noise gets too much, we've got a group chat about it. Want me to add you?",
     "zh": "要是吵得受不了，我们有个群在说这事儿。要加你进来吗？"
    },
    "options": [
     {
      "say": {
       "en": "That'd be handy, thanks.",
       "zh": "那挺方便，谢谢。"
      },
      "react": {
       "en": "Great, I'll send you the link. I'm on the fourth floor too.",
       "zh": "好，我把链接发你。我也住四楼。"
      }
     },
     {
      "say": {
       "en": "Maybe later. I'm still settling in.",
       "zh": "以后吧，我还在安顿。"
      },
      "react": {
       "en": "No rush. I'm on the fourth floor if you change your mind.",
       "zh": "不着急，改主意了就上四楼找我。"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "Nasty weather, isn't it?",
    "zh": "天气真糟，是吧？",
    "tip": "闲聊开场，说完把话头递给对方。"
   },
   {
    "en": "Tell me about it.",
    "zh": "可不是嘛。",
    "tip": "表示强烈同意，不是字面的「跟我说说」。"
   },
   {
    "en": "So far so good.",
    "zh": "到目前还好。",
    "tip": "被问近况时最省力的回答。"
   },
   {
    "en": "That takes some getting used to.",
    "zh": "这得适应一阵。",
    "tip": "评价任何新鲜事物都能用。"
   }
  ]
 },
 {
  "id": "airport",
  "name": "机场值机",
  "lv": 3,
  "cefr": "A2",
  "roles": [
   "你",
   "地勤"
  ],
  "lines": [
   {
    "r": 1,
    "en": "Good morning. May I see your passport and booking reference?",
    "zh": "早上好。请出示护照和订票号。"
   },
   {
    "r": 0,
    "en": "Here you go. I'm checking in for the flight to Seattle.",
    "zh": "给你。我要办去西雅图那班的值机。",
    "note": "Here you go 是递东西时最自然的说法，比 Give you 强得多。"
   },
   {
    "r": 1,
    "en": "Would you like a window or an aisle seat?",
    "zh": "您要靠窗还是靠走廊？",
    "note": "aisle 读 /aɪl/，s 不发音。"
   },
   {
    "r": 0,
    "en": "An aisle, please. I like to stretch my legs.",
    "zh": "靠走廊吧，我喜欢伸伸腿。"
   },
   {
    "r": 1,
    "en": "How many bags are you checking in today?",
    "zh": "今天托运几件行李？"
   },
   {
    "r": 0,
    "en": "Just the one. Is it within the weight limit?",
    "zh": "就一件。没超重吧？"
   },
   {
    "r": 1,
    "en": "It's fine. Any liquids or electronics in there?",
    "zh": "没问题。里面有液体或电子产品吗？"
   },
   {
    "r": 0,
    "en": "No, just clothes. What time does boarding start?",
    "zh": "没有，只有衣服。几点开始登机？"
   },
   {
    "r": 1,
    "en": "Boarding begins at 9:20 at gate B14. Please be there thirty minutes before departure.",
    "zh": "9:20 在 B14 登机口开始登机。请提前三十分钟到。"
   },
   {
    "r": 0,
    "en": "Got it. Thank you for your help.",
    "zh": "明白了，谢谢。"
   }
  ],
  "variants": [
   {
    "setting": "国际航班起飞前两小时，你在值机柜台前，行李有点多。"
   }
  ],
  "branches": [
   {
    "at": 5,
    "kind": "cost",
    "task": "行李超重了，选一种解决方式",
    "prompt": {
     "en": "I'm afraid this one's two kilos over.",
     "zh": "这件超重两公斤。"
    },
    "options": [
     {
      "say": {
       "en": "Can I move a few things into my carry-on?",
       "zh": "我能挪几件到随身行李里吗？"
      },
      "react": {
       "en": "Of course. There's a table just behind you. Any liquids in the bag?",
       "zh": "当然，你身后就有台子。包里有液体吗？"
      }
     },
     {
      "say": {
       "en": "How much is the excess fee?",
       "zh": "超重费多少钱？"
      },
      "react": {
       "en": "Forty dollars. No liquids in there, I hope?",
       "zh": "四十块。里面没有液体吧？"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "Here you go.",
    "zh": "给你。",
    "tip": "递护照、递钱、递手机都用这句。"
   },
   {
    "en": "I'm checking in for the flight to Seattle.",
    "zh": "我要办去西雅图那班的值机。",
    "tip": "check in for + 航班，动词短语别拆开。"
   },
   {
    "en": "Is it within the weight limit?",
    "zh": "在限重之内吗？",
    "tip": "行李、快递都能用。"
   },
   {
    "en": "What time does boarding start?",
    "zh": "几点开始登机？",
    "tip": "问时间用 What time does…start，比 When 更具体。"
   }
  ]
 },
 {
  "id": "hotel",
  "name": "酒店入住",
  "lv": 3,
  "cefr": "A2",
  "roles": [
   "你",
   "前台"
  ],
  "lines": [
   {
    "r": 1,
    "en": "Good evening. Do you have a reservation with us?",
    "zh": "晚上好。您有预订吗？"
   },
   {
    "r": 0,
    "en": "Yes, under the name Chen, for three nights.",
    "zh": "有，姓陈，住三晚。",
    "note": "订房、订位都用 under the name…，即「登记在这个名字下」。"
   },
   {
    "r": 1,
    "en": "Let me check. Yes, a double room, checking out on Friday. Could I see your ID?",
    "zh": "我查一下。对，一间大床房，周五退房。可以看一下您的证件吗？"
   },
   {
    "r": 0,
    "en": "Sure. Is breakfast included?",
    "zh": "可以。含早餐吗？"
   },
   {
    "r": 1,
    "en": "It is, served from seven to ten on the second floor. Here's your key card, room 508.",
    "zh": "含，二楼，七点到十点。这是您的房卡，508。"
   },
   {
    "r": 0,
    "en": "Great. Is there Wi-Fi in the room?",
    "zh": "好。房间里有 Wi-Fi 吗？"
   },
   {
    "r": 1,
    "en": "Yes, the password is on the back of the key card. The lift is just around the corner.",
    "zh": "有，密码在房卡背面。电梯就在拐角。"
   },
   {
    "r": 0,
    "en": "One more thing, could I get a late checkout tomorrow?",
    "zh": "还有件事，明天能晚点退房吗？"
   },
   {
    "r": 1,
    "en": "We can do one o'clock for a small fee. I'll put a note on your booking.",
    "zh": "一点退房可以，收一点费用。我在您订单上备注一下。"
   },
   {
    "r": 0,
    "en": "Perfect, thanks a lot.",
    "zh": "太好了，多谢。"
   }
  ],
  "variants": [
   {
    "setting": "晚上九点，你拖着行李箱走进预订好的酒店大堂。"
   }
  ],
  "branches": [
   {
    "at": 3,
    "kind": "cost",
    "task": "早餐不含在房价里，决定加还是不加",
    "prompt": {
     "en": "I'm afraid breakfast isn't included in your rate.",
     "zh": "抱歉，您的房价不含早餐。"
    },
    "options": [
     {
      "say": {
       "en": "Could I add it for the three mornings?",
       "zh": "能加三天的早餐吗？"
      },
      "react": {
       "en": "Certainly, that's twelve a day. Here's your key card, room 508.",
       "zh": "可以，一天十二。这是您的房卡，508。"
      }
     },
     {
      "say": {
       "en": "No problem, I'll get something nearby.",
       "zh": "没事，我在附近吃。"
      },
      "react": {
       "en": "There's a good bakery two doors down. Here's your key card, room 508.",
       "zh": "隔壁两家就有家不错的面包房。这是您的房卡，508。"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "Under the name Chen.",
    "zh": "登记在陈先生名下。",
    "tip": "订房、取包裹、餐厅订位通用。"
   },
   {
    "en": "Is breakfast included?",
    "zh": "含早餐吗？",
    "tip": "订房必问，价格常常不含早餐。"
   },
   {
    "en": "Could I get a late checkout?",
    "zh": "能晚点退房吗？",
    "tip": "late checkout 是固定说法，别说 leave later。"
   },
   {
    "en": "One more thing, …",
    "zh": "还有件事……",
    "tip": "追加要求前的过渡，比 and also 自然。"
   }
  ]
 },
 {
  "id": "restaurant",
  "name": "餐厅点菜",
  "lv": 3,
  "cefr": "A2",
  "roles": [
   "你",
   "服务生"
  ],
  "lines": [
   {
    "r": 1,
    "en": "Are you ready to order, or would you like a few more minutes?",
    "zh": "可以点菜了吗，还是再看一会儿？"
   },
   {
    "r": 0,
    "en": "A few more minutes, please. What do you recommend?",
    "zh": "再看一会儿。有什么推荐吗？"
   },
   {
    "r": 1,
    "en": "The grilled salmon is very popular tonight, and the mushroom soup is a house special.",
    "zh": "今晚烤三文鱼很受欢迎，蘑菇汤是本店招牌。"
   },
   {
    "r": 0,
    "en": "I'll have the salmon. Could I get the sauce on the side?",
    "zh": "那我要三文鱼。酱汁能单独放吗？",
    "note": "on the side＝另装在小碟里，不加在菜上。点菜高频。"
   },
   {
    "r": 1,
    "en": "Of course. And to drink?",
    "zh": "当然。喝点什么？"
   },
   {
    "r": 0,
    "en": "Just still water, thanks. Oh, I'm allergic to nuts, does this dish contain any?",
    "zh": "白水就行。对了，我对坚果过敏，这道菜里有吗？",
    "note": "allergic to + 名词。过敏在国外餐厅是必须能说清的一句。"
   },
   {
    "r": 1,
    "en": "Let me check with the kitchen and I'll let you know.",
    "zh": "我去问问后厨，然后告诉您。"
   },
   {
    "r": 0,
    "en": "Thank you. Excuse me, could we get the bill? And could we split it?",
    "zh": "谢谢。不好意思，麻烦结账。可以分开付吗？"
   },
   {
    "r": 1,
    "en": "Certainly. Card or cash?",
    "zh": "可以。刷卡还是现金？"
   },
   {
    "r": 0,
    "en": "Card. Everything was delicious, thank you.",
    "zh": "刷卡。菜很好吃，谢谢。"
   }
  ],
  "variants": [
   {
    "setting": "你和朋友坐在餐厅里，菜还没点，你有坚果过敏。"
   }
  ],
  "branches": [
   {
    "at": 3,
    "kind": "short",
    "task": "点的菜没了，换一个说法继续点",
    "prompt": {
     "en": "I'm sorry, the salmon's just sold out.",
     "zh": "抱歉，三文鱼刚卖完了。"
    },
    "options": [
     {
      "say": {
       "en": "What else would you recommend?",
       "zh": "那您还推荐什么？"
      },
      "react": {
       "en": "The lamb is very good tonight. And to drink?",
       "zh": "今晚的羊排很不错。喝点什么？"
      }
     },
     {
      "say": {
       "en": "Then I'll have the mushroom soup and a salad.",
       "zh": "那我要蘑菇汤和一份沙拉。"
      },
      "react": {
       "en": "Good choice. And to drink?",
       "zh": "好选择。喝点什么？"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "What do you recommend?",
    "zh": "有什么推荐？",
    "tip": "看不懂菜单时的救命句。"
   },
   {
    "en": "Could I get the sauce on the side?",
    "zh": "酱汁能另放吗？",
    "tip": "on the side 适用于任何配料。"
   },
   {
    "en": "I'm allergic to nuts.",
    "zh": "我对坚果过敏。",
    "tip": "allergic to，介词固定用 to。"
   },
   {
    "en": "Could we get the bill, please?",
    "zh": "麻烦结账。",
    "tip": "美式 the check，英式 the bill，都能听懂。"
   }
  ]
 },
 {
  "id": "shopping",
  "name": "退换货",
  "lv": 4,
  "cefr": "B1",
  "roles": [
   "你",
   "店员"
  ],
  "lines": [
   {
    "r": 1,
    "en": "Hi, how can I help you today?",
    "zh": "你好，需要什么帮助？"
   },
   {
    "r": 0,
    "en": "I bought this jacket last week, but the zip is broken. I'd like to return it.",
    "zh": "我上周买了这件外套，拉链坏了。我想退掉。"
   },
   {
    "r": 1,
    "en": "Do you have the receipt with you?",
    "zh": "您带收据了吗？"
   },
   {
    "r": 0,
    "en": "I have it on my phone. Will that do?",
    "zh": "手机里有电子收据。这样可以吗？",
    "note": "Will that do? ＝这个行不行？口语里极常用，比 Is that okay 更地道。"
   },
   {
    "r": 1,
    "en": "That's fine. Would you like a refund or an exchange?",
    "zh": "可以。您想退款还是换货？"
   },
   {
    "r": 0,
    "en": "An exchange, if you have it in a medium.",
    "zh": "换一件吧，有 M 码吗？"
   },
   {
    "r": 1,
    "en": "Let me check the stock. We have one in navy. Would you like to try it on?",
    "zh": "我查一下库存。有一件藏青色的。要试一下吗？"
   },
   {
    "r": 0,
    "en": "Yes, please. Where's the fitting room?",
    "zh": "好的。试衣间在哪？"
   },
   {
    "r": 1,
    "en": "Just over there. Take your time.",
    "zh": "就在那边。慢慢试。"
   },
   {
    "r": 0,
    "en": "It fits well. I'll take this one, thanks for your help.",
    "zh": "挺合身，就这件吧，谢谢。"
   }
  ],
  "variants": [
   {
    "setting": "上周买的外套拉链坏了，你带着电子收据回到店里。"
   }
  ],
  "branches": [
   {
    "at": 5,
    "kind": "short",
    "task": "没有你要的尺码，选一个退路",
    "prompt": {
     "en": "We don't have it in a medium, only large.",
     "zh": "没有 M 码了，只剩大号。"
    },
    "options": [
     {
      "say": {
       "en": "Could you order one in for me?",
       "zh": "能帮我订一件吗？"
      },
      "react": {
       "en": "It'd be here by Thursday. We do have one in navy, if you want to try the large.",
       "zh": "周四能到。不过我们有件藏青的，您可以先试试大号。"
      }
     },
     {
      "say": {
       "en": "I'll take the large, then, if it fits.",
       "zh": "那就要大号吧，如果合身的话。"
      },
      "react": {
       "en": "There's one in navy. Go ahead and try it.",
       "zh": "有件藏青的，您去试试。"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "Will that do?",
    "zh": "这样可以吗？",
    "tip": "口语里替代 Is that acceptable，短而自然。"
   },
   {
    "en": "I'd like to return it.",
    "zh": "我想退掉。",
    "tip": "退货 return，换货 exchange，退款 refund，别混。"
   },
   {
    "en": "Do you have it in a medium?",
    "zh": "有 M 码吗？",
    "tip": "in + 尺码／颜色，是问库存的固定搭配。"
   },
   {
    "en": "Would you like to try it on?",
    "zh": "要试穿吗？",
    "tip": "try on 的宾语是衣服，代词要放中间：try it on。"
   }
  ]
 },
 {
  "id": "doctor",
  "name": "看医生",
  "lv": 4,
  "cefr": "B1",
  "roles": [
   "你",
   "医生"
  ],
  "lines": [
   {
    "r": 1,
    "en": "Come on in and have a seat. What brings you in today?",
    "zh": "进来坐吧。今天哪里不舒服？",
    "note": "What brings you in 是医生的标准开场，字面是「什么把你带来的」。"
   },
   {
    "r": 0,
    "en": "I've had a sore throat for about four days, and it's getting worse.",
    "zh": "我喉咙痛了四天左右，越来越严重。",
    "note": "病程用现在完成时：I've had … for four days。说 I have 会被理解为刚开始。"
   },
   {
    "r": 1,
    "en": "Any fever or cough?",
    "zh": "发烧或咳嗽吗？"
   },
   {
    "r": 0,
    "en": "A slight fever last night, thirty-eight degrees. No cough.",
    "zh": "昨晚有点低烧，三十八度。没咳嗽。"
   },
   {
    "r": 1,
    "en": "Let me take a look. It's quite red. Are you allergic to penicillin?",
    "zh": "我看一下。挺红的。你对青霉素过敏吗？"
   },
   {
    "r": 0,
    "en": "I don't think so, but I'm not completely sure.",
    "zh": "应该不过敏，但我不太确定。"
   },
   {
    "r": 1,
    "en": "Then I'll prescribe something milder. Take it three times a day after meals.",
    "zh": "那我开点温和的。一天三次，饭后吃。"
   },
   {
    "r": 0,
    "en": "How long will it take to feel better?",
    "zh": "多久能好？"
   },
   {
    "r": 1,
    "en": "You should see a difference in two or three days. If the fever comes back, come straight back in.",
    "zh": "两三天就该有起色。要是又发烧，直接回来找我。"
   },
   {
    "r": 0,
    "en": "Thank you, doctor. I really appreciate it.",
    "zh": "谢谢医生，太感谢了。"
   }
  ],
  "variants": [
   {
    "setting": "喉咙痛了四天，越来越严重，你去了社区诊所。"
   }
  ],
  "branches": [
   {
    "at": 3,
    "kind": "change",
    "task": "医生要先做检查，问清楚你真正关心的那件事",
    "prompt": {
     "en": "Before I take a look, I'd like to run a quick test. Is that all right?",
     "zh": "在检查之前，我想先做个快速化验，可以吗？"
    },
    "options": [
     {
      "say": {
       "en": "Is it covered by my insurance?",
       "zh": "这个医保能报吗？"
      },
      "react": {
       "en": "It is, don't worry. Now, are you allergic to penicillin?",
       "zh": "能报，别担心。你对青霉素过敏吗？"
      }
     },
     {
      "say": {
       "en": "Sure. How long will the results take?",
       "zh": "可以。结果多久出来？"
      },
      "react": {
       "en": "About twenty minutes. Meanwhile, are you allergic to penicillin?",
       "zh": "大概二十分钟。对了，你对青霉素过敏吗？"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "What brings you in today?",
    "zh": "今天哪儿不舒服？",
    "tip": "医生开场白，听懂就不用慌。"
   },
   {
    "en": "I've had a sore throat for four days.",
    "zh": "我喉咙痛了四天。",
    "tip": "描述病程用现在完成时 + for。"
   },
   {
    "en": "I'm allergic to penicillin.",
    "zh": "我对青霉素过敏。",
    "tip": "看病必须能说的一句。"
   },
   {
    "en": "Three times a day after meals.",
    "zh": "一天三次，饭后。",
    "tip": "医嘱固定表达，听到就知道怎么吃药。"
   }
  ]
 },
 {
  "id": "interview",
  "name": "求职面试",
  "lv": 5,
  "cefr": "B1+",
  "roles": [
   "你",
   "面试官"
  ],
  "lines": [
   {
    "r": 1,
    "en": "Thanks for coming in. Tell me a little about yourself.",
    "zh": "谢谢你来。简单介绍一下自己吧。"
   },
   {
    "r": 0,
    "en": "I've been working as a front-end developer for three years, mostly on internal tools.",
    "zh": "我做前端开发三年了，主要做内部工具。",
    "note": "「做了三年」用 I've been working，不用 I work，否则听起来像一直在同一状态。"
   },
   {
    "r": 1,
    "en": "What made you want to apply here?",
    "zh": "为什么想来我们这儿？"
   },
   {
    "r": 0,
    "en": "I've followed your product for a while, and I'd like to work on something more user-facing.",
    "zh": "我关注你们产品有一阵了，想做一些更贴近用户的东西。"
   },
   {
    "r": 1,
    "en": "What would you say is your biggest weakness?",
    "zh": "你觉得你最大的不足是什么？"
   },
   {
    "r": 0,
    "en": "I tend to take on too much on my own. I've started asking for help earlier, but it's still a work in progress.",
    "zh": "我容易一个人扛太多。现在会早点开口求助，但还在改。",
    "note": "a work in progress＝还在改进中。谈缺点时的体面收尾，不等于是借口。"
   },
   {
    "r": 1,
    "en": "And how do you handle tight deadlines?",
    "zh": "遇到很紧的截止日期怎么处理？"
   },
   {
    "r": 0,
    "en": "I break the work down and flag risks early, rather than hoping it'll be fine.",
    "zh": "我会把活拆开、尽早把风险讲出来，而不是指望最后没事。"
   },
   {
    "r": 1,
    "en": "Good. Do you have any questions for us?",
    "zh": "好。你有什么想问我们的吗？"
   },
   {
    "r": 0,
    "en": "Yes, what does success look like in this role in the first six months?",
    "zh": "有，这个岗位头半年做到什么样算成功？",
    "note": "反问环节最加分的一句：What does success look like…"
   }
  ],
  "variants": [
   {
    "setting": "你面试一家做产品的公司，岗位是前端工程师，聊到第三轮。"
   }
  ],
  "branches": [
   {
    "at": 5,
    "kind": "probe",
    "task": "对方说你的回答太笼统，要给一个具体例子",
    "prompt": {
     "en": "That's a bit vague. Could you give me an example?",
     "zh": "这有点笼统。能举个例子吗？"
    },
    "options": [
     {
      "say": {
       "en": "Sure. Last quarter I took on two projects and missed a deadline.",
       "zh": "好。上季度我同时接了两个项目，结果误了一个期限。"
      },
      "react": {
       "en": "Thanks for being specific. And how do you handle tight deadlines?",
       "zh": "谢谢，很具体。那你怎么应对很紧的期限？"
      }
     },
     {
      "say": {
       "en": "Honestly, that's the hardest question. Let me think for a second.",
       "zh": "说实话这个最难答，让我想一下。"
      },
      "react": {
       "en": "No problem. Whenever you're ready. And how do you handle tight deadlines?",
       "zh": "没关系，想好了再说。那你怎么应对很紧的期限？"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "Tell me a little about yourself.",
    "zh": "简单介绍一下自己。",
    "tip": "面试第一句，等于「两分钟自我介绍」。"
   },
   {
    "en": "I've been working as a … for three years.",
    "zh": "我做……三年了。",
    "tip": "现在完成进行时，强调持续到现在。"
   },
   {
    "en": "It's still a work in progress.",
    "zh": "还在改进中。",
    "tip": "承认不足但不自毁的说法。"
   },
   {
    "en": "What does success look like in this role?",
    "zh": "这个岗位做到什么样算成功？",
    "tip": "反问环节的万能句。"
   }
  ]
 },
 {
  "id": "phone",
  "name": "客服电话",
  "lv": 5,
  "cefr": "B1+",
  "roles": [
   "你",
   "客服"
  ],
  "lines": [
   {
    "r": 1,
    "en": "Thank you for calling. How may I assist you today?",
    "zh": "感谢来电，请问有什么可以帮您？"
   },
   {
    "r": 0,
    "en": "Hi, I ordered a monitor ten days ago and it still hasn't arrived.",
    "zh": "你好，我十天前订了一台显示器，到现在还没到。"
   },
   {
    "r": 1,
    "en": "I'm sorry about that. Could I have your order number?",
    "zh": "很抱歉。可以给我订单号吗？"
   },
   {
    "r": 0,
    "en": "It's 88214. The tracking page hasn't updated since last Thursday.",
    "zh": "88214。物流页面从上周四就没更新过。",
    "note": "since + 时间点，配现在完成时。这是电话里说清问题的关键结构。"
   },
   {
    "r": 1,
    "en": "I see the parcel is stuck at the depot. I'll open a claim with the courier.",
    "zh": "我看到包裹卡在站点。我向快递公司提个查件。"
   },
   {
    "r": 0,
    "en": "How long will that take? I need it for work.",
    "zh": "要多久？我工作要用。"
   },
   {
    "r": 1,
    "en": "Two to three business days. If it isn't found by then, we'll send a replacement.",
    "zh": "两到三个工作日。如果那时还没找到，我们补发一台。"
   },
   {
    "r": 0,
    "en": "Could you email me once there's an update?",
    "zh": "有进展能发邮件告诉我吗？"
   },
   {
    "r": 1,
    "en": "Of course. I've noted that on your account. Is there anything else?",
    "zh": "当然，我在您账户上备注了。还有其他事吗？"
   },
   {
    "r": 0,
    "en": "No, that's all. Thanks for your help.",
    "zh": "没有了，谢谢。"
   }
  ],
  "variants": [
   {
    "setting": "你十天前订的显示器还没到，物流页面停在上周四。你打了客服。"
   }
  ],
  "branches": [
   {
    "at": 3,
    "kind": "change",
    "task": "订单被取消了，问清原因或者直接要求重下",
    "prompt": {
     "en": "I'm afraid that order was cancelled by the system.",
     "zh": "抱歉，那笔订单被系统取消了。"
    },
    "options": [
     {
      "say": {
       "en": "Could you tell me why it was cancelled?",
       "zh": "能告诉我为什么取消吗？"
      },
      "react": {
       "en": "It looks like a payment issue. I'll open a claim with that team.",
       "zh": "看起来是支付问题。我向那边提个查件。"
      }
     },
     {
      "say": {
       "en": "Could you place the order again for me?",
       "zh": "能帮我重新下单吗？"
      },
      "react": {
       "en": "I can do that now, at the same price. I'll mark it urgent.",
       "zh": "现在就能下，价格不变。我标成加急。"
      }
     }
    ]
   }
  ],
  "phrases": [
   {
    "en": "How may I assist you?",
    "zh": "有什么可以帮您？",
    "tip": "客服开场，听到就知道接通了人工。"
   },
   {
    "en": "It hasn't updated since last Thursday.",
    "zh": "从上周四就没更新过。",
    "tip": "since + 时间点，句子用现在完成时。"
   },
   {
    "en": "Two to three business days.",
    "zh": "两到三个工作日。",
    "tip": "business days 不含周末，问清这点能少等两天。"
   },
   {
    "en": "Could you email me once there's an update?",
    "zh": "有进展能发邮件告诉我吗？",
    "tip": "once＝一……就，比 when 更紧。"
   }
  ]
 }
];
