class MemorialGame {
  constructor(options = {}) {
    this.onClose = options.onClose || (() => {});
    this.onFinish = options.onFinish || this.onClose;
    this.onReward = options.onReward || (() => {});
    this.duration = 180;
    this.hosts = this.createHosts();
    this.memorials = this.createMemorials();
    this.categoryIcons = {
      軍事: "⚔️", 民生: "🏘️", 稅收: "🪙", 刑獄: "⚖️",
      吏治: "🏛️", 工造: "🔨", 外交: "🌍", 禮制: "🎎",
    };
    this.cosmetics = {
      stamps: [
        { id: "wood", name: "木質印章 · 批", score: 0, purpose: "基礎的日常批閱" },
        { id: "white-jade", name: "白玉印章 · 閱", score: 1500, purpose: "需再議、詳查的批閱" },
        { id: "green-jade", name: "青玉印章 · 准", score: 3500, purpose: "准奏、允許執行的批閱" },
        { id: "gold-dragon", name: "金龍玉璽 · 御筆", score: 6500, purpose: "皇帝御批，最高權限" },
        { id: "tiger-tally", name: "虎符印章 · 虎符", score: 10000, purpose: "軍務專用的批閱外觀" },
      ],
      papers: [
        { id: "plain", name: "御用素箋", score: 0 },
        { id: "spring", name: "春日桃箋", score: 2500 },
        { id: "summer", name: "夏荷青箋", score: 4500 },
        { id: "autumn", name: "秋楓金箋", score: 7000 },
        { id: "winter", name: "冬雪銀箋", score: 10000 },
      ],
    };
    this.collection = this.loadCollection();
    this.host = this.pick(this.hosts);
    this.activeStampSkin = this.getHostStampSkin(this.host.id);
    this.reason = this.pick(this.host.reasons);
    this.eraDate = this.createEraDate();
    this.boundEscape = (event) => { if (event.key === "Escape") this.close(); };
    this.boundPointerMove = (event) => this.moveStamp(event);
    this.boundPointerUp = (event) => this.dropStamp(event);
    this.audioContext = null;
    this.resetState();
  }

  createHosts() {
    return [
      {
        id: "huang-yize", name: "黃奕澤", ancientName: "魏諍", image: "./assets/images/taskgame/memorial/ch_魏諍(黃奕澤前世).webp",
        reasons: [
          "御案上的奏章堆得比昨夜更高。替我分擔片刻，我便欠妳一份人情。",
          "邊關與州府同時遞本，字字都等著裁決。妳心細，來替我看第一遍。",
          "今日群臣像約好似的遞了百餘道摺子，我只信妳能替我守住其中輕重。",
          "司禮監催得急，我卻不願草率落印。坐到我身側，我們一起批。",
          "百姓的事不能拖，軍情也不能誤。妳替我掌印，我替妳研朱砂。",
          "昨夜只睡了一個時辰，眼前的字都快重影了。借我一雙可靠的眼睛，可好？",
          "這幾道摺子藏著官員的小心思，旁人未必看得出來，妳一定可以。",
          "朝會前必須批完這批急件。若妳肯幫忙，散朝後我陪妳去看燈。",
          "有人把荒唐請求寫得冠冕堂皇。替我駁回它，也替我消消氣。",
          "玉璽太重，奏章太多。妳只需作出判斷，落印的責任由我與妳同擔。",
        ],
      },
      {
        id: "chu-yanshi", name: "褚晏時", ancientName: "上官映雪", image: "./assets/images/taskgame/memorial/ch_上官映雪(褚晏時前世).webp",
        reasons: [
          "摺上的墨色濃淡不一，有些話也真真假假。陪我讀，別讓謊言混過去。",
          "我本想畫完庭前那株梅，卻被這些急奏困住。妳若幫我，梅花留一枝給妳。",
          "同一場雨，在地方官筆下竟有三種災情。妳來判斷，哪一道值得准奏。",
          "御史的字太小，我看得眼疼。妳坐近些，正好替我念，也替我選印。",
          "這些奏章像一幅未乾的長卷，落錯一印便壞了全局。我想把硃筆交給妳。",
          "有幾份摺子寫得漂亮，內容卻空洞。妳別被辭藻騙了，我也不會被妳的眼神騙走。",
          "今夜風大，案上的奏章總不安分。幫我按住它們，也幫我穩住朝局。",
          "內閣送來一批疑案，人人看法不同。我想知道，妳會如何落印。",
          "若批完得早，我便為妳畫一枚專屬小印。現在先讓我看看妳的手有多穩。",
          "他們說代批不可假手於人。可妳不是旁人，所以這方印，我願意交給妳。",
        ],
      },
      {
        id: "bai-ji", name: "白霽", ancientName: "魏猙", image: "./assets/images/taskgame/memorial/ch_魏猙(白霽前世).webp",
        reasons: [
          "小美人，敢不敢替我批幾道奏章？批錯了算我的，批對了功勞全給妳。",
          "這群官員把一句話繞成十頁，我看得都想罰酒了。妳來替我乾脆落印。",
          "案前缺個聰明人，我左右看了一圈，最後還是只能來請妳。",
          "軍餉、稅銀、民情，哪一件都急。別怕，我會在旁邊提醒妳——也可能故意逗妳。",
          "有人參我玩忽政務。為了證明清白，只好請妳陪我把這一山奏章清掉。",
          "硃砂已磨好，香也剛點上。這麼適合並肩做事的時辰，妳不會拒絕吧？",
          "有份密奏說朝中有人貪墨。我若信錯人會很麻煩，所以想信妳一次。",
          "准奏、駁回、詳查，三枚印都聽妳的。至於我……大概也差不多。",
          "批完這些，我允妳向我討一件賞賜。先別急著想，手上的印可別蓋歪。",
          "奏章送得太快，我一個人忙不過來。靠近些，我教妳怎樣看穿官話。",
        ],
      },
      {
        id: "qi-lie", name: "祁烈", ancientName: "霍驍", image: "./assets/images/taskgame/memorial/ch_霍驍(祁烈前世).webp",
        reasons: [
          "我寧願去校場打十場，也不想再看這些彎彎繞繞的字。妳幫我。",
          "邊關急報不能拖。軍事的歸我，其餘的……咳，妳替我看一眼。",
          "有人請修三座華麗行宮，百姓卻還缺糧。這種摺子，妳知道該蓋哪枚印。",
          "我手勁太大，剛才差點把印泥盒按裂。妳手穩，還是妳來。",
          "今日必須批完，否則不能離開御書房。妳留下陪我，我就不覺得難熬。",
          "別看我，我不是不識字，只是討厭官腔。妳念內容，我來聽妳的判斷。",
          "急件一份接一份，像敵軍輪番衝陣。跟我守住這張御案，行不行？",
          "我信妳比信那群互相推責的官員多。印給妳，出了事我擋在前面。",
          "有幾道賑災奏請等著救命，快一些，但別慌。我就在妳身後。",
          "批完我帶妳去吃熱的。現在先把這些冷冰冰的奏章處理掉。",
        ],
      },
      {
        id: "ma-weiji", name: "馬唯冀", ancientName: "疾風", image: "./assets/images/taskgame/memorial/ch_馬唯冀(疾風現代).webp",
        reasons: [
          "奏章比軍報還會追人，我躲到這裡仍被塞了一桌。來比比誰批得快？",
          "今天風好，本該出城騎馬，偏偏被百餘份摺子拴住。妳救我出去。",
          "別被那些官話嚇到，抓住要點就像抓住韁繩。妳一定學得比我快。",
          "急奏來得像箭雨，我需要一個能跟上我的人。想來想去，只有妳。",
          "我已把印分好了：該准的准，該駁的駁，可疑的就查。簡單吧？大概。",
          "他們說我批得太快容易出錯。妳在旁邊盯著，我就不會把目光放錯地方。",
          "這裡悶得很，早點批完我帶妳上城樓吹風。現在的風只會吹亂奏章。",
          "軍營催糧，州府報災，戶部又算不清帳。來，陪我打一場紙上的仗。",
          "妳若連續落十次好印，我就認輸，承認妳比我更適合坐這張御案。",
          "最後一批了——至少內侍是這麼說的。幫我批完，剩下的時間全歸妳。",
        ],
      },
    ];
  }

  createMemorials() {
    const groups = {
      軍事: [
        ["北塞請增冬糧", "北塞大雪封道，守軍存糧僅餘十日，請速撥軍糧八千石。", "准奏", "軍糧急援"],
        ["東營擅離駐地", "東營副將未奉軍令率眾離營，稱追擊流寇，戰果與簿冊不符。", "詳查", "軍紀疑案"],
        ["重建邊關行宮", "守將請耗銀萬兩重建迎駕行宮，以彰天威，並無軍務所需。", "駁回", "奢費軍資"],
        ["河西戰馬染疫", "河西馬場疫病蔓延，請調獸醫與藥材，即刻隔離病馬。", "准奏", "軍情急件"],
        ["軍械數目短缺", "庫冊記弓弩三千，實點僅二千四百，歷任庫官互相推諉。", "詳查", "軍械虧空"],
        ["增設私家親衛", "鎮將請以官帑擴充府中親衛五百，稱便於維持威儀。", "駁回", "逾制請求"],
        ["烽燧毀於暴雨", "沿邊七座烽燧遭暴雨沖毀，若不修復恐誤傳敵情。", "准奏", "邊防修繕"],
        ["俘虜口供相悖", "三名敵探供詞互異，皆指稱京中有人接應，請移交會審。", "詳查", "敵情未明"],
        ["以戰功蔭全族", "某將請憑一役小勝，使族中二十七人同授官爵。", "駁回", "冒功求賞"],
        ["沿海倭患求援", "海寇突襲三縣，水師兵船不足，請鄰港即日馳援。", "准奏", "海防急報"],
        ["糧道屢遭截斷", "押運官三度更改路線仍遇伏，疑有內應洩露行程。", "詳查", "疑有內應"],
        ["校場改建花園", "都督稱將士需怡情養性，請拆半數校場改植奇花。", "駁回", "荒廢武備"],
        ["傷兵撫恤請款", "前線傷兵二百餘人尚未得藥，亡者家眷亦待撫恤。", "准奏", "撫恤急辦"],
        ["戰報誇功十倍", "首級數與敵軍總數不合，報功名冊又多出百餘人。", "詳查", "戰功存疑"],
        ["徵民夫築獵臺", "守將欲在邊城築高臺秋獵，請徵民夫三千無償服役。", "駁回", "濫役百姓"],
        ["雪崩阻斷關道", "雪崩封關，軍民受困，請撥工銀招募民夫疏通道路。", "准奏", "救援通道"],
        ["新兵名冊重複", "五營新兵名冊多有同名同籍，餉銀卻已全數支領。", "詳查", "冒領軍餉"],
        ["為愛馬封將軍", "藩將稱坐騎救主有功，請賜將軍號並建祠享俸。", "駁回", "荒唐封賞"],
        ["火藥庫防雷修繕", "雨季將至，火藥庫避雷木朽壞，請限期更換。", "准奏", "軍庫安全"],
        ["邊市兵器走私", "商隊貨箱查得制式箭鏃，關吏稱不知情，出入文牒疑遭塗改。", "詳查", "走私疑案"],
      ],
      民生: [
        ["江南水患賑糧", "連日暴雨決堤，十三鄉受災，請開常平倉賑濟並安置災民。", "准奏", "水患急賑"],
        ["鄉紳侵佔義田", "三村百姓聯名控告鄉紳改動田契，縣令卻稱查無此事。", "詳查", "田契疑案"],
        ["為賀壽增徭役", "知府欲修十里彩棚賀壽，請每戶加派一人服役半月。", "駁回", "擾民徭役"],
        ["疫病增設醫棚", "城南時疫初起，醫館已滿，請速設醫棚並免費施藥。", "准奏", "疫病防治"],
        ["失蹤孩童連案", "月內已有七名孩童失蹤，地方衙役皆以走失草草結案。", "詳查", "重大疑案"],
        ["拆民居建牌坊", "縣令請拆二十戶民居建德政牌坊，稱可教化鄉里。", "駁回", "沽名擾民"],
        ["旱災鑿井引水", "西北三縣井泉乾涸，請撥銀鑿深井並開渠引水。", "准奏", "旱情急辦"],
        ["米價一夜暴漲", "城中米價一夜翻倍，數家糧行同時閉倉，疑有人囤積。", "詳查", "囤糧疑案"],
        ["禁民夜間點燈", "地方官以節省燈油為名，欲禁百姓入夜後點燈，違者杖責。", "駁回", "苛令擾民"],
        ["修復山洪橋梁", "山洪沖毀官道三橋，商旅與藥材皆無法通行。", "准奏", "道路修復"],
        ["孤老口糧失發", "養濟院名冊列百人，實住僅六十，口糧仍按百人支領。", "詳查", "善款去向"],
        ["捕雀換取政績", "縣官命每戶繳麻雀百隻，稱可除害增產，已致農事停擺。", "駁回", "荒政害民"],
        ["寒潮添置棉衣", "北地寒潮驟至，流民缺衣，請發庫布趕製棉衣。", "准奏", "寒災救助"],
        ["河工偷減石料", "新築河堤未滿一月即崩裂，承辦商與河道官互稱無責。", "詳查", "河工疑弊"],
        ["強遷百姓養鶴", "郡守欲圈湖養鶴供觀賞，請強遷湖畔漁戶三百家。", "駁回", "奪民生計"],
        ["增設夜巡保坊", "近日火災頻仍，坊民請增夜巡與公共水缸，願共同協力。", "准奏", "坊市安全"],
        ["義倉穀物霉壞", "義倉帳上滿倉，開倉卻多為霉穀，主管稱皆因天候。", "詳查", "倉儲疑弊"],
        ["百姓獻地造園", "縣令稱百姓自願獻地造園，聯名冊上卻多為指印且有人喊冤。", "駁回", "疑似強奪"],
        ["安置戰亂流民", "邊地流民千餘抵城，請撥空屋、口糧並登記安置。", "准奏", "流民安置"],
        ["寺產爭訟多年", "兩寺各持不同年代敕書爭奪山林，地方官久拖不決。", "詳查", "舊案待核"],
      ],
      稅收: [
        ["災區減免田賦", "蝗災毀田七成，州府請免今歲田賦並緩徵舊欠。", "准奏", "災年蠲免"],
        ["鹽課帳冊缺頁", "鹽運司三月帳冊缺失二十頁，實收與入庫相差萬兩。", "詳查", "稅銀疑失"],
        ["加徵賞花捐", "知州欲辦牡丹會，請向每戶加收賞花銀二錢。", "駁回", "巧立名目"],
        ["商路降稅復市", "戰後商路凋敝，請半年內減半關稅，以招商旅回流。", "准奏", "休養商市"],
        ["稅吏家產暴增", "小吏歲俸微薄，半年內卻購田百頃、宅院三座。", "詳查", "貪墨疑案"],
        ["婚嫁加收喜稅", "縣衙請凡婚嫁者另納喜稅，稱可補修衙門屋瓦。", "駁回", "苛捐雜稅"],
        ["漁戶風災緩徵", "颶風毀船百艘，漁戶無以生計，請緩徵魚課一年。", "准奏", "風災緩稅"],
        ["關卡重複收稅", "商旅控訴同一道路三處設卡，收據印記卻出自同一衙門。", "詳查", "重卡疑弊"],
        ["入城收取腳印錢", "守門吏提議按行人腳印收費，稱人多則城門磨損更快。", "駁回", "荒唐稅目"],
        ["新墾地三年免稅", "流民願開墾荒地，請前三年免田賦以資安家。", "准奏", "鼓勵墾荒"],
        ["庫銀成色不足", "戶部抽驗各地解銀，發現數批成色不足且封條完好。", "詳查", "官銀摻假"],
        ["冬衣徵收暖身稅", "北州稱官差巡查寒冷，請百姓另納暖身銀供其置衣。", "駁回", "濫徵供官"],
        ["減免邊民商稅", "邊市初復，百姓貨少利薄，請減商稅以穩定生計。", "准奏", "邊市復甦"],
        ["漕糧途中短少", "百船漕糧抵京短少一成，押運官皆稱沿途鼠耗。", "詳查", "漕運疑弊"],
        ["修塔徵收祈福銀", "府衙欲修九層高塔，強令百姓按丁繳納祈福銀。", "駁回", "借福斂財"],
        ["小商販免攤稅", "大火後市集重建，請免小販三月攤稅以助復業。", "准奏", "災後復市"],
        ["礦課產量矛盾", "礦監報產量下降，運出礦車數卻較去年增加一倍。", "詳查", "礦課疑案"],
        ["過橋另收觀景錢", "縣令稱河景秀美，欲向過橋百姓加收觀景費。", "駁回", "無理加派"],
        ["歉收延後納糧", "連月陰雨致稻穀歉收，請准秋糧延至來春補納。", "准奏", "歉收緩徵"],
        ["商稅私印混用", "市舶司查獲兩套稅印，官印與私印所記銀數相差甚大。", "詳查", "私印逃稅"],
      ],
      刑獄: [
        ["雨夜客棧命案", "客商死於密室，三名證人口供互異，縣令卻已催請定罪。", "詳查", "命案疑點"],
        ["跨州緝捕要犯", "連環劫案主犯逃往鄰州，刑部請發海捕文書並准兩地會緝。", "准奏", "緝捕要犯"],
        ["全村連坐流放", "地方官因一人抗稅，請將其全村男女老幼一併流放三千里。", "駁回", "濫施連坐"],
        ["冤囚新證出現", "十年前命案忽有新證人投案，所述凶器與舊卷記載相合。", "詳查", "舊案重審"],
        ["山寨劫囚急報", "悍匪將於押解途中劫囚，州府請增派捕快護送並封鎖渡口。", "准奏", "緝捕急件"],
        ["未審先行杖斃", "知縣請准對尚未開審的嫌犯先施重杖，以迫其自行招供。", "駁回", "刑訊逾制"],
        ["仵作驗傷矛盾", "兩次驗屍所記傷口方向相反，案卷又有數頁遭人抽換。", "詳查", "驗屍存疑"],
        ["增設夜巡捕班", "京郊盜案頻發，府尹請增夜巡捕班並設百姓報案鼓。", "准奏", "治安整頓"],
        ["竊果判流三千里", "少年偷取園中三枚果子，縣令請依大盜例判流放三千里。", "駁回", "量刑失當"],
        ["牢獄囚犯失蹤", "獄冊記載在押三十二人，晨點僅餘二十九人，牢門封條完整。", "詳查", "獄政疑案"],
        ["河盜招安分化", "河盜副首願供出巢穴換取減刑，巡撫請准其協助緝拿主犯。", "准奏", "招安緝捕"],
        ["以夢兆判人有罪", "縣令夢見赤蛇入宅，遂認定鄰戶為凶徒，請即沒產治罪。", "駁回", "荒謬斷案"],
      ],
      吏治: [
        ["清官三年考滿", "某縣令治水有成、倉糧充足，百姓聯名請留任並薦升知州。", "准奏", "考績優等"],
        ["巡撫受賄密奏", "御史密奏巡撫收受鹽商重禮，所列日期與巡撫行程相合。", "詳查", "彈劾貪墨"],
        ["一門八子同官", "尚書請將八名子侄同授京官，稱自家家學深厚可免考核。", "駁回", "任人唯親"],
        ["邊縣缺官補任", "邊縣連月無主官，政務停滯，吏部請選有邊務經驗者即日赴任。", "准奏", "官員任免"],
        ["考績簿冊塗改", "某府原列下等，送吏部後忽改上等，墨色與官印皆有異樣。", "詳查", "考績舞弊"],
        ["因獻奇石升官", "地方官進獻巨石一座，請以祥瑞之功由七品連升至二品。", "駁回", "諂媚求遷"],
        ["能吏調任災區", "災區官員病故，吏部薦曾辦賑務有成者接任，以穩定民情。", "准奏", "急缺補任"],
        ["同僚互相彈劾", "兩名御史互奏貪墨，所附證據卻出自同一名已革書吏。", "詳查", "彈劾疑案"],
        ["百日三度升遷", "新任主簿未有政績，卻因權臣薦舉百日內連升三級。", "駁回", "升遷失序"],
        ["老臣乞休歸里", "老臣年逾七旬且舊疾復發，請准致仕並依例給予歸鄉俸。", "准奏", "致仕申請"],
        ["空名領俸十年", "吏冊列有六名官員領俸十年，各衙門卻無人見過其到任。", "詳查", "冒名領俸"],
        ["考績按送禮高低", "知府請以屬官年節送禮多寡作為考績標準，稱最能顯示忠敬。", "駁回", "考法荒謬"],
      ],
      工造: [
        ["洪水沖毀石橋", "官道石橋遭洪水沖斷，糧車受阻，工部請即撥銀修復。", "准奏", "橋梁急修"],
        ["城牆磚數短缺", "帳冊列磚百萬，工地實點少二十萬，監工稱皆為運送損耗。", "詳查", "工程虧空"],
        ["重修百里御道", "地方官欲拆除完好民居拓寬御道，只為迎接一次巡幸。", "駁回", "勞民工程"],
        ["河道淤塞疏浚", "漕河泥沙淤積，已有三十艘糧船擱淺，請即募工疏浚。", "准奏", "河道急辦"],
        ["新堤未成先裂", "河堤完工不足十日即現裂縫，承造商卻已領清全部工銀。", "詳查", "河工疑弊"],
        ["拆糧倉建戲臺", "府衙請拆常平倉改建豪華戲臺，稱可供官民同樂。", "駁回", "本末倒置"],
        ["邊城加固箭樓", "敵情漸緊，北門箭樓木柱腐朽，請限期加固並更換防火瓦。", "准奏", "城防修繕"],
        ["宮殿木料調包", "原定楠木入場後變為松木，採買價卻仍按楠木列支。", "詳查", "宮造舞弊"],
        ["築金池養錦鯉", "行宮請耗金萬兩築池，以便御駕未至時由官員賞魚。", "駁回", "奢華宮造"],
        ["地震重建民居", "地震毀屋千間，工部請撥木石並召匠人分區重建。", "准奏", "災後重建"],
        ["石料價格暴增", "同批石料較市價高出五倍，採辦官稱因石頭花紋吉祥。", "詳查", "採買疑價"],
        ["徵萬民築私園", "王府請徵民夫萬人營建私園，工錢與食糧皆由州縣自籌。", "駁回", "私役民力"],
      ],
      外交: [
        ["西域使團來朝", "西域使團攜國書與方物抵關，請依禮接待並安排入京覲見。", "准奏", "使臣來訪"],
        ["盟約文字有異", "兩國所持盟約在邊界條款上相差一字，雙方各稱己本為真。", "詳查", "盟約疑義"],
        ["割讓三州求和", "使臣未經廷議便許諾割讓三州，請朝廷追認其私下承諾。", "駁回", "擅讓疆土"],
        ["鄰國請開互市", "鄰國請於邊境重開互市，願設共同巡防以保商旅安全。", "准奏", "邊境互市"],
        ["朝貢數目不符", "貢冊記良馬百匹，實到僅六十，陪臣稱途中皆因病死亡。", "詳查", "朝貢疑案"],
        ["強令小國跪行", "禮官請使鄰國使臣自城門跪行至宮門，以顯天朝威勢。", "駁回", "有辱邦交"],
        ["邊境停火談判", "兩軍已對峙數月，對方遣使請停火十日交換俘虜。", "准奏", "邊談急件"],
        ["使臣私售國書", "驛館發現副使將密封國書內容抄售商人，正使稱毫不知情。", "詳查", "使團疑案"],
        ["以國庫替使還債", "外使在京賭輸巨款，請由國庫代償以免其顏面受損。", "駁回", "無理外請"],
        ["海國救援遇風船", "異國商船遭風漂至沿海，請准供水修船並護送離境。", "准奏", "海上救援"],
        ["邊界石碑移位", "兩國界碑一夜向南移三里，守軍與牧民說法完全相反。", "詳查", "邊界爭議"],
        ["禁止一切外語", "官員請禁使臣與商旅使用本國語言，違者沒收全部貨物。", "駁回", "苛刻邦令"],
      ],
      禮制: [
        ["皇子冠禮擇期", "欽天監與禮部已核定吉日，請依制備辦皇子冠禮。", "准奏", "大典籌辦"],
        ["祭器銘文錯漏", "太廟新鑄祭器將先帝廟號刻錯，監造官稱不必重鑄。", "詳查", "祭祀失儀"],
        ["婚典金轎百里", "宗室請造純金大轎並鋪錦百里，所需銀兩由民間攤派。", "駁回", "婚典逾制"],
        ["冊封功臣之女", "功臣之女品行端正且儀制齊備，禮部請依例冊封郡君。", "准奏", "冊封依例"],
        ["科場座號洩露", "考前已有商人出售座號與考官名冊，內容多與實際相符。", "詳查", "科舉舞弊"],
        ["為寵犬行冊封禮", "王府請按親王儀制冊封愛犬，並命百官著朝服觀禮。", "駁回", "禮制荒唐"],
        ["國喪減免宴樂", "國喪期間地方仍辦大型宴樂，禮部請重申禁令並從簡公宴。", "准奏", "國喪禮制"],
        ["貢院試卷失封", "會試試卷封條多處破損，謄錄官與監試官互指對方失責。", "詳查", "科場疑案"],
        ["祭天徵萬兩香油", "地方官請向每戶強徵香油銀，以鑄與人等高的純金香爐。", "駁回", "借祭斂財"],
        ["先農壇親耕禮", "春耕將至，禮部請依舊典舉行親耕禮並勸課農桑。", "准奏", "農事典禮"],
        ["冊書印文顛倒", "送往藩國的冊書印文上下顛倒，經手官員皆稱交付時無誤。", "詳查", "冊封疑失"],
        ["落第者禁止再考", "主考請將本次所有落第士子終身禁考，以減少來年閱卷負擔。", "駁回", "科舉苛令"],
      ],
    };
    const extraGroups = {
      軍事: [
        ["邊堡水井乾涸", "西北邊堡三口水井皆已乾涸，守軍與附近百姓缺水，請調工匠尋泉鑿井。", "准奏", "邊防急援"],
        ["軍糧流入黑市", "京郊黑市查獲印有軍倉火漆的米袋，守倉官稱封條可能遭人仿造。", "詳查", "軍糧外流"],
        ["徵童子充新軍", "守將以成年壯丁不足為由，請徵十二歲以上童子入營操練。", "駁回", "徵兵逾制"],
        ["海角燈塔修復", "沿海引航燈塔遭雷火焚毀，商船與水師夜間屢有觸礁之險。", "准奏", "海防修繕"],
        ["軍餉印信重疊", "兩批軍餉文書使用同一編號官印，領銀日期卻相隔三百里。", "詳查", "軍餉疑案"],
        ["為常勝將軍建生祠", "地方將領請各營按月捐餉，為其修建九進生祠並塑金身。", "駁回", "冒功斂財"],
        ["戍卒冬衣告缺", "塞外提早降雪，三營戍卒仍著單衣，請急運棉甲與炭薪。", "准奏", "寒地軍需"],
        ["軍馬一馬兩籍", "東西兩營馬冊出現三百匹相同毛色與烙印編號，餉草卻各自支領。", "詳查", "馬政疑弊"],
        ["借演武毀農田", "都督欲在秋收前借民田萬畝操演騎兵，並禁止農戶入內收割。", "駁回", "演武擾民"],
        ["敵營疫情報降", "敵軍使者稱營中疫病失控願意投降，但斥候回報其主力仍在集結。", "詳查", "詐降疑雲"],
      ],
      民生: [
        ["山村藥材斷供", "山路崩塌使六村藥材斷絕，已有病患危急，請派工搶修便道。", "准奏", "醫路急援"],
        ["善堂嬰孩失蹤", "育嬰堂名冊記收養四十名嬰孩，實際僅有二十七名，主管拒交領養文書。", "詳查", "善堂疑案"],
        ["強收百姓屋瓦", "知縣為翻修私宅，命每戶繳交青瓦百片，無瓦者折銀繳納。", "駁回", "侵民建宅"],
        ["漁村重建碼頭", "海潮沖毀漁港木棧，漁船無法靠岸卸糧，請撥木料協力重建。", "准奏", "漁港復建"],
        ["義診藥方造假", "官設義診所稱施藥千人，藥鋪卻僅出庫百份，處方筆跡又全然相同。", "詳查", "醫藥疑弊"],
        ["封山供官員狩獵", "太守請禁山民採薪半年，以免驚擾其春日圍獵的禽獸。", "駁回", "奪民薪山"],
        ["火災搭建安置棚", "城西大火燒毀民居三百間，請開空地搭棚並發放米糧木料。", "准奏", "火災安置"],
        ["賑粥名冊冒名", "粥廠每日報稱施粥萬碗，暗訪所見不到千人，領糧名冊多有亡者姓名。", "詳查", "賑務貪墨"],
        ["禁寡婦經營商鋪", "地方官稱婦人不宜拋頭露面，請查封全城寡婦所營店鋪。", "駁回", "苛令害生"],
        ["偏鄉增設學舍", "五處山村距縣學百里，鄉民願獻木石，請派教諭設立蒙學。", "准奏", "興學惠民"],
      ],
      稅收: [
        ["茶農霜害免課", "晚霜毀去茶芽八成，茶農無貨可售，請免本季茶課並貸種復園。", "准奏", "霜害蠲免"],
        ["錢糧收據雙號", "兩縣上繳稅銀收據號碼完全相同，其中一筆在國庫查無入帳。", "詳查", "稅票疑案"],
        ["新設開門稅", "縣衙請百姓每日首次開啟家門時繳納一文，稱可補夜巡燈油。", "駁回", "荒唐稅目"],
        ["洪災商戶緩稅", "河水淹沒市街，商戶貨物盡毀，請緩徵半年商稅以助復業。", "准奏", "災後緩徵"],
        ["銅礦產冊倒退", "礦場增添礦工五百，申報產銅反降一半，私運車隊卻日夜不絕。", "詳查", "礦稅疑失"],
        ["收取進衙門檻費", "知府稱衙門門檻磨損，請向每名報案百姓收取修檻銀。", "駁回", "阻民申訴"],
        ["船戶沉船免稅", "暴風沉沒漕外民船七十艘，倖存船戶請免一年船課以重置舟具。", "准奏", "風災免課"],
        ["糧稅斗斛偏大", "百姓控訴官倉收糧所用量斗比市斗大兩成，倉官拒絕當眾校驗。", "詳查", "斗斛舞弊"],
        ["添收賞月銀", "府尹欲辦中秋宴，請各坊按人口繳賞月銀並供應酒肉。", "駁回", "節慶攤派"],
        ["旱地改徵薄賦", "新丈量發現數縣旱地多年按水田徵稅，請改依地力核定田賦。", "准奏", "核減田賦"],
      ],
      刑獄: [
        ["拐賣人口聯州緝捕", "三州接連發現相同牙行文契，刑部請合併卷宗並跨境追捕首犯。", "准奏", "聯州緝捕"],
        ["血衣來源不明", "命案凶嫌家中搜出血衣，但染血時日早於死者遇害，捕快拒絕重驗。", "詳查", "物證疑點"],
        ["以貌醜判為盜", "縣令稱嫌犯面相凶惡，雖無贓物證人仍請依大盜定罪。", "駁回", "荒謬定罪"],
        ["女囚臨產保外", "待審女囚即將臨產，獄中無穩婆醫藥，請依法移至醫舍看守。", "准奏", "獄政人命"],
        ["證人一夜改供", "五名證人同夜翻供且措辭一字不差，翻供前皆曾被同一書吏傳見。", "詳查", "串供疑案"],
        ["欠債者代代為奴", "富戶請將無力還債的農戶全家及後代永列奴籍，以抵利息。", "駁回", "私刑逼債"],
        ["追捕山道連環盜", "山道三月發生十餘起劫案，商隊傷亡嚴重，請增捕役封鎖銷贓市集。", "准奏", "盜案急緝"],
        ["死囚姓名錯置", "秋決名冊中的姓名與原審卷宗相反，兩名囚犯籍貫亦被互換。", "詳查", "死刑疑卷"],
        ["偷聽官員談話割耳", "主簿請將無意聽見衙內談話的茶役割耳示眾，以儆效尤。", "駁回", "濫刑逞威"],
        ["海港增設巡檢", "港口走私與鬥毆頻仍，州府請設常駐巡檢並公開報案處。", "准奏", "港埠治安"],
      ],
      吏治: [
        ["廉吏請調邊郡", "任滿縣令考績連優，自請赴缺官多年的邊郡任職，吏部核其資歷相符。", "准奏", "能吏補缺"],
        ["知府親族包辦工程", "知府到任後所有官造皆交其妻族承攬，報價高於鄰府三倍。", "詳查", "親族牟利"],
        ["以詩好壞定升遷", "巡撫請以官員賀壽詩是否工整作為年度考績與升遷依據。", "駁回", "考績失當"],
        ["病故官員補缺", "河道同知病故，汛期將至，吏部請由熟悉水務的通判署理。", "准奏", "急務補任"],
        ["縣令離任封庫", "縣令聲稱回鄉奔喪已半年，官庫封閉、印信不知所蹤，地方政務停擺。", "詳查", "擅離職守"],
        ["買官者請補實缺", "商人稱已向權臣繳納十萬兩，請朝廷依承諾授予知府實缺。", "駁回", "公然買官"],
        ["女官考績晉等", "尚儀局女官整飭宮冊有功且考核無誤，請依例晉等加俸。", "准奏", "考績晉升"],
        ["同日兩份任命", "同一州牧缺額出現兩份任命詔抄，皆蓋吏部真印但筆跡不同。", "詳查", "任命疑案"],
        ["權臣家僕任御史", "大臣請免除考選，直接任命不識律令的家僕為巡按御史。", "駁回", "私相授受"],
        ["增設偏遠驛丞", "山區驛路新開百里而無主事官，吏部請擇熟悉道路者充任驛丞。", "准奏", "驛務設官"],
      ],
      工造: [
        ["山洪預修堤壩", "欽天監預警雨勢，舊堤已有滲水，工部請先備石料加高險段。", "准奏", "防洪急修"],
        ["官窯瓷磚失竊", "宮殿修繕所需琉璃磚短少千片，城中私宅卻出現同批官窯印記。", "詳查", "官料外流"],
        ["拆古橋建迎賓門", "地方官請拆除仍可通行的百年石橋，改建只供觀賞的迎賓牌樓。", "駁回", "華而不實"],
        ["地裂修補官道", "地震造成官道多處裂陷，賑糧車無法通行，請分段架設便橋。", "准奏", "震後搶修"],
        ["木料尺寸縮水", "驗收木柱比圖樣短一尺，工頭稱入庫後因天熱自然收縮。", "詳查", "工程偷料"],
        ["築高臺觀看雲彩", "郡王請徵工匠五千築百丈觀雲臺，費用由災區州縣分攤。", "駁回", "奢造擾民"],
        ["疏通城中暗渠", "雨季積水湧入民宅，舊暗渠淤塞多年，請清淤並增設排水口。", "准奏", "城渠修繕"],
        ["城門鐵料摻渣", "新鑄城門鉸鏈三次斷裂，鐵料成色遠低於採買文書所載。", "詳查", "鐵料疑弊"],
        ["毀農渠造水榭", "知州請截斷灌溉渠水引入後園，以建避暑水榭。", "駁回", "侵農造景"],
        ["驛站屋頂倒塌", "官道驛站遭暴雪壓塌，旅客與公文無處安置，請急調木瓦重建。", "准奏", "驛站急修"],
      ],
      外交: [
        ["北國王子入學", "北國遣王子來京求學並願遵守國學規制，鴻臚寺請依禮安置。", "准奏", "質子來學"],
        ["使團夾帶軍圖", "入境使團行囊中發現邊關地圖，副使稱只是商旅購得的紀念物。", "詳查", "使團疑情"],
        ["索取傳國玉璽", "鄰國使臣稱兩國交好，請將傳國玉璽借回本國展示十年。", "駁回", "無理索寶"],
        ["旱國求購糧種", "鄰國大旱，請以馬匹交換耐旱糧種，並承諾不轉售第三國。", "准奏", "賑鄰互市"],
        ["譯官私改國書", "兩名譯官對同一句盟文譯法完全相反，其中一人近日獲外使重金。", "詳查", "國書疑譯"],
        ["扣押全體外商", "市舶官因一名外商欠稅，請扣押同國所有商人與貨船抵債。", "駁回", "濫扣外商"],
        ["海盜共防盟約", "沿海諸國皆受海盜侵擾，對方提議交換警訊並聯合巡航。", "准奏", "海防盟議"],
        ["國境密道新現", "牧民發現跨越兩國邊界的密道，沿途留有官軍制式蹄鐵。", "詳查", "邊境密道"],
        ["逼使臣獻妻求和", "禮官稱可命外國使臣獻出妻女，作為議和誠意的證明。", "駁回", "辱使亂禮"],
        ["護送朝貢象隊", "南國象隊入境後水土不服，請派獸醫並改走水草充足的驛道。", "准奏", "朝貢護送"],
      ],
      禮制: [
        ["重陽敬老賜宴", "禮部請於重陽依例宴請京中高壽老人，所需費用已有定額。", "准奏", "敬老典禮"],
        ["宗廟祭酒遭換", "太廟封存祭酒開壇後變為清水，值守內官與禮官說法不一。", "詳查", "祭品疑換"],
        ["以活人殉葬", "宗室請恢復古俗，命府中侍女百人隨亡者殉葬以彰尊榮。", "駁回", "殉葬惡俗"],
        ["鄉試增設考棚", "應試士子倍增，舊考棚擁擠易生火患，禮部請增建臨時號舍。", "准奏", "科場籌備"],
        ["玉牒生辰塗改", "宗室玉牒中某王生辰遭刮改，改後恰可使其取得長幼順位。", "詳查", "宗牒疑改"],
        ["命百姓跪迎花車", "府衙辦花神祭，請沿街百姓自凌晨跪至花車通過方可起身。", "駁回", "祭典擾民"],
        ["冊立誥命依例", "功臣母親年高德厚，相關品秩與文書均已核實，請依例頒授誥命。", "准奏", "誥命冊授"],
        ["會試墨卷同筆", "十份高中文卷字跡與錯字完全一致，閱卷官卻稱只是巧合。", "詳查", "科場舞弊"],
        ["為祥石行郊天禮", "地方獻上一塊形似龍首的石頭，請動用國庫舉行三月郊天大典。", "駁回", "借瑞鋪張"],
        ["冬至祭天修儀", "冬至將近，祭壇石階破損且樂工缺額，禮部請按舊制補修演練。", "准奏", "冬至大典"],
      ],
    };
    Object.entries(extraGroups).forEach(([category, entries]) => groups[category].push(...entries));
    return Object.entries(groups).flatMap(([category, entries], categoryIndex) => entries.map((entry, index) => {
      const memorial = {
        id: `${categoryIndex + 1}-${index + 1}`,
        category,
        title: entry[0],
        content: entry[1],
        stamp: entry[2],
        tag: entry[3],
      };
      memorial.intel = this.createIntel(memorial, categoryIndex + index);
      return memorial;
    }));
  }

  resetState() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.completed = 0;
    this.perfects = 0;
    this.goods = 0;
    this.misses = 0;
    this.specialTotal = 0;
    this.specialCompleted = 0;
    this.timeLeft = this.duration;
    this.current = null;
    this.currentSteps = [];
    this.stepIndex = 0;
    this.drag = null;
    this.selectedStamp = null;
    this.running = false;
    this.locked = false;
    this.caseTimer = 0;
    this.caseTimeLeft = 0;
    this.timerId = 0;
    this.nextTimer = 0;
    this.startedAt = 0;
    this.deck = [];
  }

  pick(items) { return items[Math.floor(Math.random() * items.length)]; }

  getHostStampSkin(hostId) {
    return {
      "ma-weiji": "wood",
      "bai-ji": "white-jade",
      "chu-yanshi": "green-jade",
      "huang-yize": "gold-dragon",
      "qi-lie": "tiger-tally",
    }[hostId] || "wood";
  }

  getStampStartLabel(stampSkin) {
    return {
      wood: "初執印信",
      "white-jade": "得閱百章",
      "green-jade": "奉旨代批",
      "gold-dragon": "接過硃筆",
      "tiger-tally": "執掌兵符",
    }[stampSkin] || "接過硃筆";
  }

  createEraDate() {
    const year = 1 + Math.floor(Math.random() * 10);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 30);
    const monthNames = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
    const dayNames = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];
    const season = month <= 3 ? "春" : month <= 6 ? "夏" : month <= 9 ? "秋" : "冬";
    const skin = { 春: "spring", 夏: "summer", 秋: "autumn", 冬: "winter" }[season];
    return { year, month, day, season, skin, label: `大封第${year === 1 ? "一" : ["", "", "二", "三", "四", "五", "六", "七", "八", "九", "十"][year]}年 · ${season} · ${monthNames[month - 1]}${dayNames[day - 1]}` };
  }

  createIntel(memorial, seed = 0) {
    const sources = {
      軍事: ["皇上隱衛", "邊關斥候", "兵部內線"],
      民生: ["地方暗樁", "京中世家耳目", "巡按密使"],
      稅收: ["戶部書吏", "皇商內線", "御史暗訪"],
      刑獄: ["刑部密探", "大理寺暗線", "皇上隱衛"],
      吏治: ["都察院耳目", "太監總管", "宮中內線"],
      工造: ["工部匠首", "內廷採辦暗樁", "御史暗訪"],
      外交: ["驛館密探", "鴻臚寺內線", "皇上隱衛"],
      禮制: ["太監總管", "禮部老吏", "宮中內線"],
    };
    const sourceList = sources[memorial.category] || ["皇上隱衛", "宮中內線", "太監總管"];
    const source = sourceList[seed % sourceList.length];
    const messages = {
      准奏: [
        `暗查所報與奏文相符，「${memorial.tag}」確有其事，未見夾帶私請。`,
        `沿途回報皆能互證，${memorial.title}並非虛報，若再拖延恐使情勢加重。`,
        `密訪百姓與經手官吏後，所請確為當務之急，款項與人數暫無異常。`,
      ],
      駁回: [
        `線報稱「${memorial.tag}」只是名目，實為涉事者借公帑牟私，地方怨聲已起。`,
        `暗樁查得${memorial.title}並無實際急需，所列開支多流向私人府邸。`,
        `奏文避重就輕，地方父老與差役所述相反，此請若准恐成擾民先例。`,
      ],
      詳查: [
        `密報指出「${memorial.tag}」另有隱情，帳冊、口供與實物至少兩處不能相合。`,
        `查訪所得與${memorial.title}的奏文互有矛盾，涉事官員近日曾私下串供。`,
        `現有證據不足定論，但經手人行蹤與卷宗記載不符，宜封存原冊續查。`,
      ],
    };
    const variants = messages[memorial.stamp] || messages.詳查;
    return { source, text: variants[seed % variants.length] };
  }

  selectPaperSkin(memorial) {
    const text = `${memorial.title}${memorial.content}${memorial.tag}`;
    const seasonalKeywords = [
      ["winter", /雪|寒|冬|冰|棉衣|封關/],
      ["summer", /雨|洪|水患|河道|決堤|颶風|疫病/],
      ["autumn", /秋|糧|收成|歉收|漕糧|田賦|穀|倉/],
      ["spring", /春|花|農|墾荒|親耕|桃|新兵/],
    ];
    return seasonalKeywords.find(([, pattern]) => pattern.test(text))?.[0] || this.eraDate.skin;
  }

  renderEraDate() {
    const date = this.root?.querySelector(".memorial-era-date");
    if (date) date.textContent = this.eraDate.label;
  }

  mount() {
    this.root = document.createElement("div");
    this.root.className = "memorial-modal";
    this.root.innerHTML = `
      <section class="memorial-game" role="dialog" aria-modal="true" aria-labelledby="memorial-title">
        <button class="memorial-close" type="button" aria-label="關閉批奏摺遊戲">×</button>
        <header class="memorial-header">
          <div><p>御前代批 · 限時試煉</p><h2 id="memorial-title">批 奏 摺</h2></div>
          <div class="memorial-hud">
            <span>剩餘時間<b class="memorial-time">180.0</b></span>
            <span>批閱<b class="memorial-count">0</b></span>
            <span>得分<b class="memorial-score">0</b></span>
            <span>連擊<b class="memorial-combo">0</b></span>
          </div>
        </header>
        <main class="memorial-desk">
          <aside class="memorial-rules" aria-label="批示規則">
            <time class="memorial-era-date"></time>
            <aside class="memorial-intel"><span>密報 · <b class="memorial-intel-source"></b></span><p class="memorial-intel-text"></p></aside>
            <h3>批示例則</h3>
            <dl>
              <div><dt>准奏</dt><dd>急援、賑災、撫恤、合理減免</dd></div>
              <div><dt>駁回</dt><dd>奢費、苛捐、濫役、逾制請求</dd></div>
              <div><dt>詳查</dt><dd>帳目矛盾、貪墨、疑案、責任未明</dd></div>
            </dl>
            <div class="memorial-level"><span>案情壓力</span><i><b></b></i><em>從容</em></div>
          </aside>
          <section class="memorial-paper-wrap" aria-live="polite">
            <div class="memorial-conveyor"><i></i></div>
            <article class="memorial-paper">
              <div class="memorial-paper-top"><span class="memorial-category">軍事</span><span class="memorial-tag">急件</span></div>
              <p class="memorial-number">奏字第〇〇一號</p>
              <h3 class="memorial-case-title"></h3>
              <p class="memorial-case-content"></p>
              <div class="memorial-request"><span>所請批示</span><b class="memorial-request-text"></b></div>
              <div class="memorial-step" hidden></div>
              <button class="memorial-target" type="button" aria-label="指定蓋印區"><span>御批於此</span></button>
              <div class="memorial-placed-stamps" aria-hidden="true"></div>
            </article>
            <div class="memorial-case-clock"><i></i></div>
            <div class="memorial-feedback" aria-live="assertive"></div>
            <div class="memorial-burst" aria-hidden="true"></div>
            <div class="memorial-wind-leaves" aria-hidden="true"></div>
          </section>
          <aside class="memorial-stamp-rack" aria-label="印章選擇">
            <h3>御前印匣</h3>
            <p>拖曳印章至朱框內</p>
            <div class="memorial-stamps">
              ${["准奏", "駁回", "詳查"].map((stamp) => `<button class="memorial-stamp is-${stamp}" type="button" data-stamp="${stamp}" aria-label="${stamp}印"><i></i><b>${stamp}</b></button>`).join("")}
            </div>
          </aside>
        </main>
        <div class="memorial-intro">
          <figure class="memorial-host"><span class="memorial-host-fallback"></span><img alt=""><figcaption><b></b><small></small></figcaption></figure>
          <div class="memorial-dialogue">
            <p>御前有請</p><blockquote></blockquote>
            <div class="memorial-brief"><span>軍民急援 → 准奏</span><span>奢費苛令 → 駁回</span><span>帳目疑案 → 詳查</span></div>
            <button class="memorial-start" type="button">接過硃筆</button>
            <small>限時三分鐘 · 拖印入框 · Perfect 可累積連擊</small>
          </div>
        </div>
        <div class="memorial-result" hidden>
          <div class="memorial-result-card">
            <p>御前評定</p><h3></h3><strong class="memorial-grade">甲</strong>
            <dl>
              <div><dt>完成奏章</dt><dd class="result-completed">0</dd></div>
              <div><dt>上諭嘉許</dt><dd class="result-perfect">0</dd></div>
              <div><dt>最高連擊</dt><dd class="result-combo">0</dd></div>
              <div><dt>特殊奏章</dt><dd class="result-special">0 / 0</dd></div>
              <div><dt>最終總分</dt><dd class="result-score">0</dd></div>
            </dl>
            <em>獲得燈盞 × <b class="result-reward">0</b></em>
            <p class="memorial-unlocks"></p>
            <div><button class="memorial-retry" type="button">再批一局</button><button class="memorial-finish" type="button">領旨復命</button></div>
          </div>
        </div>
      </section>`;
    document.body.appendChild(this.root);
    this.cacheElements();
    this.bindEvents();
    this.renderCosmeticOptions();
    this.renderHost();
    this.renderEraDate();
    this.startButton.focus({ preventScroll: true });
  }

  cacheElements() {
    this.game = this.root.querySelector(".memorial-game");
    this.paper = this.root.querySelector(".memorial-paper");
    this.target = this.root.querySelector(".memorial-target");
    this.feedback = this.root.querySelector(".memorial-feedback");
    this.burst = this.root.querySelector(".memorial-burst");
    this.stampRack = this.root.querySelector(".memorial-stamp-rack");
    this.result = this.root.querySelector(".memorial-result");
    this.intro = this.root.querySelector(".memorial-intro");
    this.startButton = this.root.querySelector(".memorial-start");
  }

  bindEvents() {
    this.root.querySelector(".memorial-close").addEventListener("click", () => this.close());
    this.startButton.addEventListener("click", () => this.start());
    this.root.querySelector(".memorial-retry").addEventListener("click", () => this.restart());
    this.root.querySelector(".memorial-finish").addEventListener("click", () => this.finish());
    this.root.querySelectorAll(".memorial-stamp").forEach((stamp) => {
      stamp.addEventListener("pointerdown", (event) => this.beginStampDrag(event, stamp));
      stamp.addEventListener("click", () => this.selectStamp(stamp.dataset.stamp));
    });
    this.target.addEventListener("click", () => {
      if (!this.selectedStamp || !this.running || this.locked) return;
      const bounds = this.target.getBoundingClientRect();
      this.judgeStamp(this.selectedStamp, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    });
    window.addEventListener("keydown", this.boundEscape);
  }

  renderHost() {
    const image = this.root.querySelector(".memorial-host img");
    image.hidden = false;
    image.src = this.host.image;
    image.alt = `${this.host.name}立繪`;
    image.addEventListener("error", () => { image.hidden = true; }, { once: true });
    this.root.querySelector(".memorial-host-fallback").textContent = this.host.ancientName;
    this.root.querySelector(".memorial-host figcaption b").textContent = this.host.name;
    this.root.querySelector(".memorial-host figcaption small").textContent = `前世 · ${this.host.ancientName}`;
    this.root.querySelector(".memorial-dialogue blockquote").textContent = this.reason;
  }

  loadCollection() {
    const fallback = { totalScore: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem("memorialCollection") || "null");
      return saved && typeof saved === "object" ? { ...fallback, ...saved } : fallback;
    } catch (_) { return fallback; }
  }

  saveCollection() {
    try { localStorage.setItem("memorialCollection", JSON.stringify(this.collection)); } catch (_) { /* 儲存不可用時仍可遊玩。 */ }
  }

  renderCosmeticOptions() {
    this.applyCosmetics();
  }

  applyCosmetics() {
    this.game.dataset.stampSkin = this.activeStampSkin;
    this.startButton.textContent = this.getStampStartLabel(this.activeStampSkin);
  }

  start() {
    this.intro.hidden = true;
    this.running = true;
    this.startedAt = performance.now();
    this.deck = this.shuffle([...this.memorials]);
    this.renderNextMemorial();
    let previous = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      const delta = Math.min(.1, (now - previous) / 1000);
      previous = now;
      this.timeLeft = Math.max(0, this.timeLeft - delta);
      if (!this.locked) {
        this.caseTimeLeft = Math.max(0, this.caseTimeLeft - delta);
        this.updateCaseClock();
        if (this.caseTimeLeft <= 0) this.handleTimeout();
      }
      this.updateHud();
      if (this.timeLeft <= 0) return this.endGame();
      this.timerId = requestAnimationFrame(tick);
    };
    this.timerId = requestAnimationFrame(tick);
  }

  shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
  }

  renderNextMemorial() {
    if (!this.running) return;
    window.clearTimeout(this.nextTimer);
    this.nextTimer = 0;
    if (!this.deck.length) this.deck = this.shuffle([...this.memorials]);
    const base = this.deck.pop();
    const elapsed = this.duration - this.timeLeft;
    const difficulty = Math.min(1, elapsed / this.duration);
    const specialChance = elapsed > 12 ? .12 + difficulty * .18 : 0;
    const special = Math.random() < specialChance;
    const urgent = !special && (base.tag.includes("急") || (elapsed > 25 && Math.random() < .3));
    this.game.dataset.paperSkin = this.selectPaperSkin(base);
    this.current = { ...base, special, urgent };
    this.currentSteps = special ? this.createSpecialSteps(base.stamp) : [base.stamp];
    this.stepIndex = 0;
    if (special) this.specialTotal += 1;
    this.locked = false;
    this.selectedStamp = null;
    const baseCaseTime = Math.max(3.8, 9 - difficulty * 4.6 - (special ? .4 : 0));
    this.caseTimeLeft = baseCaseTime * 2;
    this.caseDuration = this.caseTimeLeft;
    this.paper.className = `memorial-paper is-entering${special ? " is-special-paper" : urgent ? " is-urgent-paper" : ""}`;
    if (elapsed > 18 && Math.random() < .35) this.paper.classList.add("is-windy");
    if (elapsed > 30 && Math.random() < .28) this.paper.classList.add("is-tilted");
    this.renderWindLeaves(this.paper.classList.contains("is-windy"));
    this.target.classList.toggle("is-small", elapsed > 35 && Math.random() < .34);
    this.root.querySelector(".memorial-category").textContent = `${this.categoryIcons[base.category] || "📜"} ${base.category}`;
    this.root.querySelector(".memorial-tag").textContent = special ? `特奏 · ${base.tag}` : urgent ? `十萬火急 · ${base.tag}` : base.tag;
    this.root.querySelector(".memorial-number").textContent = `奏字第${String(this.completed + 1).padStart(3, "0")}號`;
    this.root.querySelector(".memorial-case-title").textContent = base.title;
    this.root.querySelector(".memorial-case-content").textContent = base.content;
    this.root.querySelector(".memorial-intel-source").textContent = base.intel.source;
    this.root.querySelector(".memorial-intel-text").textContent = base.intel.text;
    this.root.querySelector(".memorial-request-text").textContent = special ? "依序完成多重批示" : "擇印裁決，蓋於朱框";
    this.root.querySelector(".memorial-placed-stamps").innerHTML = "";
    this.feedback.className = "memorial-feedback";
    this.feedback.textContent = "";
    this.burst.className = "memorial-burst";
    this.renderSteps();
    this.updateDifficulty(difficulty);
    this.updateStampSelection();
    requestAnimationFrame(() => this.paper.classList.remove("is-entering"));
  }

  createSpecialSteps(correctStamp) {
    const followups = {
      准奏: ["詳查", "准奏"],
      駁回: ["駁回", "詳查"],
      詳查: ["詳查", "准奏"],
    };
    return followups[correctStamp];
  }

  renderSteps() {
    const element = this.root.querySelector(".memorial-step");
    element.hidden = this.currentSteps.length === 1;
    element.innerHTML = this.currentSteps.map((stamp, index) => `<span class="${index < this.stepIndex ? "is-done" : index === this.stepIndex ? "is-current" : ""}">${index + 1}. ${stamp}</span>`).join("");
  }

  renderWindLeaves(active) {
    const layer = this.root.querySelector(".memorial-wind-leaves");
    layer.innerHTML = "";
    layer.classList.toggle("is-active", active);
    if (!active) return;
    const count = 6 + Math.floor(Math.random() * 4);
    for (let index = 0; index < count; index += 1) {
      const leaf = document.createElement("i");
      const variant = 1 + Math.floor(Math.random() * 5);
      leaf.style.setProperty("--leaf-image", `url(../../assets/images/taskgame/memorial/wind_leaf0${variant}.webp)`);
      leaf.style.setProperty("--leaf-y", `${5 + Math.random() * 74}%`);
      leaf.style.setProperty("--leaf-size", `${24 + Math.random() * 32}px`);
      leaf.style.setProperty("--leaf-duration", `${3.8 + Math.random() * 3.4}s`);
      leaf.style.setProperty("--leaf-delay", `${-Math.random() * 5}s`);
      leaf.style.setProperty("--leaf-drop", `${40 + Math.random() * 150}px`);
      layer.appendChild(leaf);
    }
  }

  updateDifficulty(difficulty) {
    const label = difficulty < .34 ? "從容" : difficulty < .7 ? "催辦" : "十萬火急";
    this.root.querySelector(".memorial-level b").style.width = `${Math.max(8, difficulty * 100)}%`;
    this.root.querySelector(".memorial-level em").textContent = label;
  }

  updateHud() {
    this.root.querySelector(".memorial-time").textContent = this.timeLeft.toFixed(1);
    this.root.querySelector(".memorial-count").textContent = this.completed;
    this.root.querySelector(".memorial-score").textContent = Math.max(0, Math.round(this.score));
    this.root.querySelector(".memorial-combo").textContent = this.combo;
    this.root.classList.toggle("is-final-seconds", this.timeLeft <= 10);
  }

  updateCaseClock() {
    const ratio = Math.max(0, this.caseTimeLeft / this.caseDuration);
    this.root.querySelector(".memorial-case-clock i").style.transform = `scaleX(${ratio})`;
  }

  selectStamp(type) {
    if (!this.running || this.locked) return;
    this.selectedStamp = type;
    this.updateStampSelection();
  }

  updateStampSelection() {
    this.root.querySelectorAll(".memorial-stamp").forEach((stamp) => stamp.classList.toggle("is-selected", stamp.dataset.stamp === this.selectedStamp));
  }

  beginStampDrag(event, source) {
    if (!this.running || this.locked || event.button > 0) return;
    this.selectedStamp = source.dataset.stamp;
    this.updateStampSelection();
    const ghost = source.cloneNode(true);
    ghost.classList.add("memorial-stamp-ghost");
    ghost.dataset.stampSkin = this.activeStampSkin;
    ghost.removeAttribute("aria-label");
    document.body.appendChild(ghost);
    const sourceBounds = source.getBoundingClientRect();
    this.drag = { pointerId: event.pointerId, type: source.dataset.stamp, ghost, sourceBounds, startX: event.clientX, startY: event.clientY, moved: false };
    this.positionGhost(event.clientX, event.clientY);
    window.addEventListener("pointermove", this.boundPointerMove, { passive: false });
    window.addEventListener("pointerup", this.boundPointerUp, { once: true });
    window.addEventListener("pointercancel", this.boundPointerUp, { once: true });
  }

  moveStamp(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    event.preventDefault();
    if (Math.hypot(event.clientX - this.drag.startX, event.clientY - this.drag.startY) > 6) this.drag.moved = true;
    this.positionGhost(event.clientX, event.clientY);
    const bounds = this.target.getBoundingClientRect();
    this.target.classList.toggle("is-hovered", event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom);
  }

  positionGhost(x, y) {
    if (!this.drag) return;
    this.drag.ghost.style.left = `${x}px`;
    this.drag.ghost.style.top = `${y}px`;
  }

  dropStamp(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const { type, ghost, moved, sourceBounds } = this.drag;
    ghost.remove();
    this.drag = null;
    this.target.classList.remove("is-hovered");
    window.removeEventListener("pointermove", this.boundPointerMove);
    window.removeEventListener("pointerup", this.boundPointerUp);
    window.removeEventListener("pointercancel", this.boundPointerUp);
    if (!this.running || this.locked) return;
    if (event.type === "pointercancel") return;

    const elementAtRelease = document.elementFromPoint(event.clientX, event.clientY);
    const alternateStamp = elementAtRelease?.closest(".memorial-stamp");
    if (alternateStamp && this.root.contains(alternateStamp)) {
      this.selectStamp(alternateStamp.dataset.stamp);
      return;
    }

    const releasedOnSource = event.clientX >= sourceBounds.left && event.clientX <= sourceBounds.right && event.clientY >= sourceBounds.top && event.clientY <= sourceBounds.bottom;
    if (!moved || releasedOnSource) return;

    const paperBounds = this.paper.getBoundingClientRect();
    const releasedOnPaper = event.clientX >= paperBounds.left && event.clientX <= paperBounds.right
      && event.clientY >= paperBounds.top && event.clientY <= paperBounds.bottom;
    if (!releasedOnPaper) return;

    this.judgeStamp(type, event.clientX, event.clientY);
  }

  judgeStamp(type, clientX, clientY) {
    const bounds = this.target.getBoundingClientRect();
    const dx = (clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2);
    const dy = (clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2);
    const distance = Math.hypot(dx, dy);
    const inside = Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
    const expected = this.currentSteps[this.stepIndex];
    if (!inside || type !== expected) return this.resolveAttempt("miss", type, clientX, clientY);
    const quality = distance <= .42 ? "perfect" : "good";
    this.placeStamp(type, clientX, clientY, quality);
    if (this.stepIndex < this.currentSteps.length - 1) {
      this.applyScore(quality, true);
      this.stepIndex += 1;
      this.renderSteps();
      this.showFeedback(quality, quality === "perfect" ? "上諭嘉許" : "准予存案");
      this.caseTimeLeft = Math.min(this.caseDuration, this.caseTimeLeft + 3.2);
      return;
    }
    this.resolveAttempt(quality, type, clientX, clientY, true);
  }

  placeStamp(type, clientX, clientY, quality) {
    const paperBounds = this.paper.getBoundingClientRect();
    const stamp = document.createElement("i");
    stamp.className = `memorial-placed-stamp is-${type} is-${quality}`;
    const seals = { 准奏: "seal_approve.webp", 駁回: "seal_reject.webp", 詳查: "seal_investigate.webp" };
    const sealImage = quality === "perfect" ? seals[type] : "seal_misaligned.webp";
    stamp.style.setProperty("--seal-image", `url(../../assets/images/taskgame/memorial/${sealImage})`);
    stamp.style.left = `${clientX - paperBounds.left}px`;
    stamp.style.top = `${clientY - paperBounds.top}px`;
    this.root.querySelector(".memorial-placed-stamps").appendChild(stamp);
    if (quality !== "miss") this.playStampSound(quality);
  }

  resolveAttempt(quality, type, clientX, clientY, alreadyPlaced = false) {
    if (this.locked) return;
    this.locked = true;
    if (!alreadyPlaced && quality !== "miss") this.placeStamp(type, clientX, clientY, quality);
    if (!alreadyPlaced && quality === "miss") {
      const paperBounds = this.paper.getBoundingClientRect();
      const onPaper = clientX >= paperBounds.left && clientX <= paperBounds.right && clientY >= paperBounds.top && clientY <= paperBounds.bottom;
      if (onPaper) this.placeStamp(type, clientX, clientY, "miss");
    }
    this.applyScore(quality, false);
    if (quality === "perfect") {
      this.perfects += 1;
      this.showFeedback("perfect", "上諭嘉許");
      void this.burst.offsetWidth;
      this.burst.className = "memorial-burst is-gold";
    } else if (quality === "good") {
      this.goods += 1;
      this.showFeedback("good", "准予存案");
      void this.burst.offsetWidth;
      this.burst.className = "memorial-burst is-ink";
    } else {
      this.misses += 1;
      this.showFeedback("miss", "發還重議");
      void this.burst.offsetWidth;
      this.burst.className = "memorial-burst is-miss";
      this.playStampSound("miss");
    }
    this.completed += quality === "miss" ? 0 : 1;
    if (this.current.special && quality !== "miss") {
      this.specialCompleted += 1;
      this.score += 260;
      this.timeLeft = Math.min(this.duration, this.timeLeft + 3);
    }
    this.updateHud();
    this.queueNextMemorial(quality === "miss" ? 1100 : 650);
  }

  queueNextMemorial(delay) {
    window.clearTimeout(this.nextTimer);
    this.nextTimer = window.setTimeout(() => {
      this.nextTimer = 0;
      this.renderNextMemorial();
    }, delay);
  }

  applyScore(quality, partialStep) {
    if (quality === "perfect") {
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      const multiplier = Math.min(3, 1 + Math.floor(this.combo / 5) * .25);
      this.score += 120 * multiplier * (partialStep ? .55 : 1);
    } else if (quality === "good") {
      this.combo = 0;
      this.score += 70 * (partialStep ? .55 : 1);
    } else {
      this.combo = 0;
      this.score = Math.max(0, this.score - 20);
    }
  }

  showFeedback(quality, text) {
    this.feedback.className = `memorial-feedback is-${quality}`;
    const images = {
      perfect: "perfect_text.webp",
      good: "good_text.webp",
      miss: "miss_text.webp",
      timeout: "timeout_text.webp",
    };
    const combo = quality === "perfect" && this.combo >= 3
      ? `<img class="memorial-combo-image" src="./assets/images/taskgame/memorial/combo_text.webp" alt="連批如流">`
      : "";
    const detail = quality === "perfect" ? `Perfect · Combo ${this.combo}` : quality === "good" ? "Good" : quality === "timeout" ? "Timeout" : "Miss";
    this.feedback.innerHTML = `<img class="memorial-feedback-image" src="./assets/images/taskgame/memorial/${images[quality] || images.miss}" alt="${text}">${combo}<span>${detail}</span>`;
  }

  handleTimeout() {
    if (this.locked) return;
    this.locked = true;
    this.misses += 1;
    this.combo = 0;
    this.score = Math.max(0, this.score - 20);
    this.showFeedback("timeout", "逾時未批");
    this.queueNextMemorial(1000);
  }

  playStampSound(quality) {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      this.audioContext ||= new Context();
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(quality === "miss" ? 105 : 155, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(55, this.audioContext.currentTime + .11);
      gain.gain.setValueAtTime(.12, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, this.audioContext.currentTime + .13);
      oscillator.connect(gain).connect(this.audioContext.destination);
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + .14);
    } catch (_) { /* 音效不可用時不影響遊戲。 */ }
  }

  endGame() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.timerId);
    window.clearTimeout(this.nextTimer);
    if (this.drag) {
      this.drag.ghost.remove();
      this.drag = null;
    }
    const specialRate = this.specialTotal ? this.specialCompleted / this.specialTotal : 0;
    const finalScore = Math.max(0, Math.round(this.score + this.completed * 30 + this.perfects * 20 + this.maxCombo * 15 + specialRate * 300));
    this.score = finalScore;
    const grade = finalScore >= 4200 ? "御筆" : finalScore >= 2800 ? "甲" : finalScore >= 1600 ? "乙" : finalScore >= 700 ? "丙" : "丁";
    const reward = finalScore >= 4200 ? 10 : finalScore >= 2800 ? 8 : finalScore >= 1600 ? 6 : finalScore >= 700 ? 4 : 2;
    this.reward = reward;
    const beforeTotal = this.collection.totalScore || 0;
    this.collection.totalScore = beforeTotal + finalScore;
    this.saveCollection();
    this.result.querySelector("h3").textContent = grade === "御筆" ? "聖心大悅 · 可代朕執筆" : grade === "甲" ? "決斷明快 · 百官咸服" : grade === "乙" ? "批示穩妥 · 可堪任事" : "尚需熟習批示例則";
    this.root.querySelector(".memorial-grade").textContent = grade;
    this.root.querySelector(".result-completed").textContent = this.completed;
    this.root.querySelector(".result-perfect").textContent = this.perfects;
    this.root.querySelector(".result-combo").textContent = this.maxCombo;
    this.root.querySelector(".result-special").textContent = `${this.specialCompleted} / ${this.specialTotal}`;
    this.root.querySelector(".result-score").textContent = finalScore;
    this.root.querySelector(".result-reward").textContent = reward;
    this.root.querySelector(".memorial-unlocks").textContent = `累積御前評分 ${this.collection.totalScore}`;
    this.result.hidden = false;
    this.root.querySelector(".memorial-finish").focus({ preventScroll: true });
  }

  restart() {
    cancelAnimationFrame(this.timerId);
    window.clearTimeout(this.nextTimer);
    this.resetState();
    this.host = this.pick(this.hosts);
    this.activeStampSkin = this.getHostStampSkin(this.host.id);
    this.reason = this.pick(this.host.reasons);
    this.eraDate = this.createEraDate();
    this.result.hidden = true;
    this.intro.hidden = false;
    this.renderHost();
    this.applyCosmetics();
    this.renderEraDate();
    this.updateHud();
    this.startButton.focus({ preventScroll: true });
  }

  finish() {
    if (this.reward) this.onReward(this.reward, this.score);
    this.reward = 0;
    this.close(this.onFinish);
  }

  close(onClosed = this.onClose) {
    this.running = false;
    cancelAnimationFrame(this.timerId);
    window.clearTimeout(this.nextTimer);
    window.removeEventListener("keydown", this.boundEscape);
    window.removeEventListener("pointermove", this.boundPointerMove);
    window.removeEventListener("pointerup", this.boundPointerUp);
    window.removeEventListener("pointercancel", this.boundPointerUp);
    this.drag?.ghost.remove();
    this.audioContext?.close?.();
    this.root?.remove();
    onClosed();
  }
}

window.MemorialGame = MemorialGame;
