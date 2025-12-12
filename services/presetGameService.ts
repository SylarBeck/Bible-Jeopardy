import { GameBoardData, Category, FinalJeopardyQuestion, PresetMetadata, FullGameData } from "../types";

// --- CUSTOM STORAGE LOGIC ---
const STORAGE_KEY = 'bible_jeopardy_custom_presets';

export const saveCustomPreset = (data: GameBoardData, final: FinalJeopardyQuestion, meta: { title: string, description: string }) => {
  const id = `custom-${Date.now()}`;
  const newPreset = {
    meta: {
      id,
      title: meta.title,
      description: meta.description,
      icon: '✨',
      isCustom: true,
      hasTwoRounds: false // Custom creator currently only supports 1 round for simplicity
    },
    round1: data.categories.map(c => ({
      name: c.name,
      questions: c.questions.map(q => ({ value: q.value, q: q.question, a: q.answer, s: q.scripture }))
    })),
    final
  };

  const existing = getCustomPresetsRaw();
  existing.push(newPreset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const deleteCustomPreset = (id: string) => {
  const existing = getCustomPresetsRaw();
  const filtered = existing.filter((p: any) => p.meta.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

const getCustomPresetsRaw = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// --- HARDCODED PRESETS ---
const PRESETS: any = {
  'miracles': {
    meta: { id: 'miracles', title: 'Miracles of the Bible', description: 'Two full rounds of astonishing works of power.', icon: '✨', hasTwoRounds: true },
    round1: [
      { name: "Jesus' Healings", questions: [
        { value: 200, q: "He healed this man's mother-in-law.", a: "Who is Peter?", s: "Mark 1:30, 31" },
        { value: 400, q: "Jesus healed ten men with this disease, but only one returned to thank him.", a: "What is Leprosy?", s: "Luke 17:12-16" },
        { value: 600, q: "Jesus healed a man born blind using this substance mixed with saliva.", a: "What is Clay (or mud)?", s: "John 9:6" },
        { value: 800, q: "He was raised from the dead after four days.", a: "Who is Lazarus?", s: "John 11:43, 44" },
        { value: 1000, q: "Jesus healed the ear of this slave of the high priest.", a: "Who is Malchus?", s: "Luke 22:50, 51" }
      ]},
      { name: "Power Over Nature", questions: [
        { value: 200, q: "Moses parted this body of water.", a: "What is the Red Sea?", s: "Exodus 14:21" },
        { value: 400, q: "Jesus walked on this body of water.", a: "What is the Sea of Galilee?", s: "Matthew 14:25" },
        { value: 600, q: "Elijah prayed, and this ceased for three and a half years.", a: "What is Rain?", s: "James 5:17" },
        { value: 800, q: "Joshua commanded this celestial body to stand still.", a: "What is the Sun?", s: "Joshua 10:12" },
        { value: 1000, q: "Elisha made this iron tool float.", a: "What is an axe head?", s: "2 Kings 6:6" }
      ]},
      { name: "Prophets' Miracles", questions: [
        { value: 200, q: "Daniel was saved from these animals.", a: "What are Lions?", s: "Daniel 6:22" },
        { value: 400, q: "Jonah survived in the belly of this creature.", a: "What is a Big Fish?", s: "Jonah 1:17" },
        { value: 600, q: "The three Hebrews survived this execution method.", a: "What is the Fiery Furnace?", s: "Daniel 3:27" },
        { value: 800, q: "Elijah was fed by these birds.", a: "What are Ravens?", s: "1 Kings 17:6" },
        { value: 1000, q: "He cured Naaman of leprosy.", a: "Who is Elisha?", s: "2 Kings 5:14" }
      ]},
      { name: "Resurrections", questions: [
        { value: 200, q: "Jesus raised this 12-year-old girl.", a: "Who is Jairus' daughter?", s: "Mark 5:41, 42" },
        { value: 400, q: "Peter raised this woman known for her kindness.", a: "Who is Dorcas (Tabitha)?", s: "Acts 9:40" },
        { value: 600, q: "Paul raised this young man who fell out of a window.", a: "Who is Eutychus?", s: "Acts 20:9, 10" },
        { value: 800, q: "Elijah raised the son of a widow from this city.", a: "What is Zarephath?", s: "1 Kings 17:22" },
        { value: 1000, q: "Elisha's bones brought a dead man to life when he touched them.", a: "Who is the unnamed man?", s: "2 Kings 13:21" }
      ]},
      { name: "Food & Drink", questions: [
        { value: 200, q: "Jesus turned water into this at a wedding.", a: "What is Wine?", s: "John 2:9" },
        { value: 400, q: "God provided this food from heaven for the Israelites.", a: "What is Manna?", s: "Exodus 16:15" },
        { value: 600, q: "Jesus fed 5,000 men with 5 loaves and this many fish.", a: "What is Two?", s: "Matthew 14:17" },
        { value: 800, q: "This woman's flour and oil did not run out during the drought.", a: "Who is the Widow of Zarephath?", s: "1 Kings 17:16" },
        { value: 1000, q: "Samson found honey in the carcass of this animal.", a: "What is a Lion?", s: "Judges 14:8" }
      ]},
      { name: "Apostolic Works", questions: [
        { value: 200, q: "Peter and John healed a lame man at this temple gate.", a: "What is the Beautiful Gate?", s: "Acts 3:2" },
        { value: 400, q: "Paul was bitten by this animal but suffered no harm.", a: "What is a Viper (Snake)?", s: "Acts 28:3-5" },
        { value: 600, q: "Peter's shadow was believed to heal people in this city.", a: "What is Jerusalem?", s: "Acts 5:15" },
        { value: 800, q: "Paul blinded this sorcerer.", a: "Who is Elymas (Bar-Jesus)?", s: "Acts 13:11" },
        { value: 1000, q: "This couple fell dead after lying to the holy spirit.", a: "Who are Ananias and Sapphira?", s: "Acts 5:1-10" }
      ]}
    ],
    round2: [
      { name: "Old Testament Wonders", questions: [
        { value: 400, q: "Aaron's rod did this to prove his selection by God.", a: "What is Budded (or produced almonds)?", s: "Numbers 17:8" },
        { value: 800, q: "This was the first plague upon Egypt.", a: "What is Water turned to Blood?", s: "Exodus 7:20" },
        { value: 1200, q: "Hezekiah was given a sign where the shadow went backward on this device.", a: "What is the Steps (Stairway) of Ahaz?", s: "2 Kings 20:11" },
        { value: 1600, q: "The earth opened and swallowed these rebels.", a: "Who are Korah, Dathan, and Abiram?", s: "Numbers 16:31, 32" },
        { value: 2000, q: "Gideon's fleece was dry while the ground was wet with this.", a: "What is Dew?", s: "Judges 6:40" }
      ]},
      { name: "New Testament Powers", questions: [
        { value: 400, q: "Jesus withered this tree because it had no fruit.", a: "What is a Fig Tree?", s: "Matthew 21:19" },
        { value: 800, q: "Philip was transported by the spirit to this place after baptizing the Ethiopian.", a: "What is Ashdod?", s: "Acts 8:40" },
        { value: 1200, q: "This earthquake opened prison doors for Paul and Silas.", a: "What is the Philippian Earthquake?", s: "Acts 16:26" },
        { value: 1600, q: "A viper fastened on his hand in Malta, but he shook it off.", a: "Who is Paul?", s: "Acts 28:3-5" },
        { value: 2000, q: "The handkerchiefs touched by him cured diseases.", a: "Who is Paul?", s: "Acts 19:11, 12" }
      ]},
      { name: "Visions", questions: [
        { value: 400, q: "Peter saw a vision of a sheet containing these.", a: "What are Unclean Animals?", s: "Acts 10:11, 12" },
        { value: 800, q: "Stephen saw Jesus standing at this position.", a: "What is the Right Hand of God?", s: "Acts 7:55" },
        { value: 1200, q: "Isaiah saw Jehovah sitting on a throne, with the train of his robe filling this.", a: "What is the Temple?", s: "Isaiah 6:1" },
        { value: 1600, q: "Ezekiel saw a vision of a celestial chariot with wheels within...", a: "What are Wheels?", s: "Ezekiel 1:16" },
        { value: 2000, q: "Paul was caught away to this 'heaven'.", a: "What is the Third Heaven?", s: "2 Corinthians 12:2" }
      ]},
      { name: "Divine Protection", questions: [
        { value: 400, q: "This baby was hidden in a basket among reeds.", a: "Who is Moses?", s: "Exodus 2:3" },
        { value: 800, q: "David was saved from this king's spear multiple times.", a: "Who is Saul?", s: "1 Samuel 18:11" },
        { value: 1200, q: "The Israelites were protected from the 10th plague by this on their doorposts.", a: "What is Lamb's Blood?", s: "Exodus 12:13" },
        { value: 1600, q: "Elisha's servant saw the mountain full of these surrounding Elisha.", a: "What are Horses and Chariots of Fire?", s: "2 Kings 6:17" },
        { value: 2000, q: "This nephew of Paul saved him from a Jewish plot.", a: "Who is Paul's sister's son?", s: "Acts 23:16" }
      ]},
      { name: "Judgments", questions: [
        { value: 400, q: "Lot's wife turned into this.", a: "What is a Pillar of Salt?", s: "Genesis 19:26" },
        { value: 800, q: "This king was struck by an angel and eaten by worms.", a: "Who is Herod (Agrippa I)?", s: "Acts 12:23" },
        { value: 1200, q: "Miriam was struck with leprosy for criticizing him.", a: "Who is Moses?", s: "Numbers 12:10" },
        { value: 1600, q: "He was struck dead for touching the Ark of the Covenant.", a: "Who is Uzzah?", s: "2 Samuel 6:7" },
        { value: 2000, q: "Gehazi was struck with Naaman's leprosy because of this sin.", a: "What is Greed?", s: "2 Kings 5:27" }
      ]},
      { name: "Resurrections II", questions: [
        { value: 400, q: "Jesus said 'Lazarus, come out!' and he came out bound in these.", a: "What are Bandages (Wrappings)?", s: "John 11:44" },
        { value: 800, q: "At the time of Jesus' death, many of these were opened.", a: "What are Tombs?", s: "Matthew 27:52" },
        { value: 1200, q: "The 'two witnesses' in Revelation come to life after this many days.", a: "What is Three and a half?", s: "Revelation 11:11" },
        { value: 1600, q: "Elijah stretched himself upon the widow's son this many times.", a: "What is Three?", s: "1 Kings 17:21" },
        { value: 2000, q: "Those who do good things will have a resurrection of life, those who practice vile things a resurrection of...", a: "What is Judgment?", s: "John 5:29" }
      ]}
    ],
    final: {
      category: "Greatest Miracle",
      question: "Paul calls this event the guarantee that God will judge the inhabited earth in righteousness.",
      answer: "What is the Resurrection of Jesus?",
      scripture: "Acts 17:31"
    }
  },
  'fruitage': {
    meta: { id: 'fruitage', title: 'Fruitage of the Spirit', description: 'Questions about qualities that please God.', icon: '🍇', hasTwoRounds: false },
    round1: [
      { name: "Love", questions: [
        { value: 200, q: "God is this quality.", a: "What is Love?", s: "1 John 4:8" },
        { value: 400, q: "Love covers a multitude of these.", a: "What are Sins?", s: "1 Peter 4:8" },
        { value: 600, q: "Jesus said the greatest love is to surrender this for one's friends.", a: "What is one's Soul (Life)?", s: "John 15:13" },
        { value: 800, q: "This chapter in Corinthians is known as the 'Love Chapter'.", a: "What is 1 Corinthians 13?", s: "1 Corinthians 13" },
        { value: 1000, q: "This quality is the perfect bond of union.", a: "What is Love?", s: "Colossians 3:14" }
      ]},
      { name: "Joy & Peace", questions: [
        { value: 200, q: "The joy of Jehovah is your...", a: "What is Stronghold (or Strength)?", s: "Nehemiah 8:10" },
        { value: 400, q: "Jesus said 'Peace I leave with you, my ____ I give to you'.", a: "What is Peace?", s: "John 14:27" },
        { value: 600, q: "The peace of God excels all of this.", a: "What is Thought (Understanding)?", s: "Philippians 4:7" },
        { value: 800, q: "There is more happiness in giving than in this.", a: "What is Receiving?", s: "Acts 20:35" },
        { value: 1000, q: "Prophecy says the mountains and hills will cry out with this.", a: "What is Joy?", s: "Isaiah 55:12" }
      ]},
      { name: "Patience", questions: [
        { value: 200, q: "Love is this and kind.", a: "What is Patient (Long-suffering)?", s: "1 Corinthians 13:4" },
        { value: 400, q: "Jehovah is not slow, but is this with you.", a: "What is Patient?", s: "2 Peter 3:9" },
        { value: 600, q: "We should be patient like this worker who waits for the earth's fruit.", a: "Who is the Farmer?", s: "James 5:7" },
        { value: 800, q: "A mild answer turns away this.", a: "What is Rage (Wrath)?", s: "Proverbs 15:1" },
        { value: 1000, q: "He waited 120 years for the flood.", a: "Who is Noah?", s: "Genesis 6:3" }
      ]},
      { name: "Kindness & Goodness", questions: [
        { value: 200, q: "Be kind to one another, tenderly...", a: "What is Compassionate?", s: "Ephesians 4:32" },
        { value: 400, q: "She showed kindness to the spies.", a: "Who is Rahab?", s: "Joshua 2:12" },
        { value: 600, q: "Goodness is a fruit of this.", a: "What is the Spirit (Light)?", s: "Ephesians 5:9" },
        { value: 800, q: "David showed loyal love to this son of Jonathan.", a: "Who is Mephibosheth?", s: "2 Samuel 9:7" },
        { value: 1000, q: "Jehovah is good to all, and his mercies are over all his...", a: "What are Works?", s: "Psalm 145:9" }
      ]},
      { name: "Faith", questions: [
        { value: 200, q: "Faith is the assured expectation of things...", a: "What is Hoped For?", s: "Hebrews 11:1" },
        { value: 400, q: "Without faith it is impossible to please him.", a: "Who is God?", s: "Hebrews 11:6" },
        { value: 600, q: "Faith without works is this.", a: "What is Dead?", s: "James 2:26" },
        { value: 800, q: "Abraham was called the father of all those having this.", a: "What is Faith?", s: "Romans 4:11" },
        { value: 1000, q: "This is the victory that has conquered the world.", a: "What is our Faith?", s: "1 John 5:4" }
      ]},
      { name: "Mildness & Self-Control", questions: [
        { value: 200, q: "Happy are the mild-tempered, for they will inherit this.", a: "What is the Earth?", s: "Matthew 5:5" },
        { value: 400, q: "He was the meekest man on earth.", a: "Who is Moses?", s: "Numbers 12:3" },
        { value: 600, q: "A man without self-control is like a city without this.", a: "What is a Wall?", s: "Proverbs 25:28" },
        { value: 800, q: "Paul exercised self-control like an athlete in a...", a: "What is a Race?", s: "1 Corinthians 9:25" },
        { value: 1000, q: "Clothe yourselves with the tender affections of compassion, kindness, humility, mildness, and...", a: "What is Patience?", s: "Colossians 3:12" }
      ]}
    ],
    final: {
      category: "Cultivating Qualities",
      question: "According to Galatians 6:8, he who sows with a view to the spirit will reap this.",
      answer: "What is Everlasting Life?",
      scripture: "Galatians 6:8"
    }
  },
  'women_faith': {
    meta: { id: 'women_faith', title: 'Women of Faith', description: 'Celebrating the faithful women of the Bible.', icon: '👑', hasTwoRounds: false },
    round1: [
      { name: "Mothers", questions: [
        { value: 200, q: "She was called the 'Mother of Everyone Living'.", a: "Who is Eve?", s: "Genesis 3:20" },
        { value: 400, q: "She laughed when told she would have a son in her old age.", a: "Who is Sarah?", s: "Genesis 18:12" },
        { value: 600, q: "She prayed for a son and 'lent him to Jehovah' all his days.", a: "Who is Hannah?", s: "1 Samuel 1:27, 28" },
        { value: 800, q: "She hid her baby in a papyrus basket among the reeds.", a: "Who is Jochebed (Moses' Mother)?", s: "Exodus 2:3" },
        { value: 1000, q: "In her old age, she became the mother of John the Baptist.", a: "Who is Elizabeth?", s: "Luke 1:57" }
      ]},
      { name: "Courageous Acts", questions: [
        { value: 200, q: "She hid two spies on her roof in Jericho.", a: "Who is Rahab?", s: "Joshua 2:4" },
        { value: 400, q: "She drove a tent pin through the temple of Sisera.", a: "Who is Jael?", s: "Judges 4:21" },
        { value: 600, q: "She risked her life to save the Jews, saying 'If I perish, I perish.'", a: "Who is Esther?", s: "Esther 4:16" },
        { value: 800, q: "She brought food to David to stop him from killing her foolish husband.", a: "Who is Abigail?", s: "1 Samuel 25:32, 33" },
        { value: 1000, q: "These midwives refused Pharaoh's order to kill Hebrew baby boys.", a: "Who are Shiphrah and Puah?", s: "Exodus 1:15-17" }
      ]},
      { name: "Early Christians", questions: [
        { value: 200, q: "A seller of purple who opened her home to Paul.", a: "Who is Lydia?", s: "Acts 16:14" },
        { value: 400, q: "She and her husband Aquila were tentmakers with Paul.", a: "Who is Priscilla?", s: "Acts 18:2, 3" },
        { value: 600, q: "She was known for her many gifts of mercy and making coats.", a: "Who is Dorcas (Tabitha)?", s: "Acts 9:36" },
        { value: 800, q: "Paul commended her as a 'defender of many' in the congregation at Cenchreae.", a: "Who is Phoebe?", s: "Romans 16:1" },
        { value: 1000, q: "She taught her son Timothy the holy writings from infancy.", a: "Who is Eunice?", s: "2 Timothy 1:5" }
      ]},
      { name: "Wives", questions: [
        { value: 200, q: "She agreed to leave her home to marry Isaac.", a: "Who is Rebekah?", s: "Genesis 24:58" },
        { value: 400, q: "She was Jacob's beloved wife for whom he worked 14 years.", a: "Who is Rachel?", s: "Genesis 29:20" },
        { value: 600, q: "This Moabitess married Boaz.", a: "Who is Ruth?", s: "Ruth 4:13" },
        { value: 800, q: "She saved Moses' life by circumcising their son.", a: "Who is Zipporah?", s: "Exodus 4:25" },
        { value: 1000, q: "She was the wife of Uriah before becoming the wife of David.", a: "Who is Bathsheba?", s: "2 Samuel 11:27" }
      ]},
      { name: "Prophetesses", questions: [
        { value: 200, q: "She led the women in song after crossing the Red Sea.", a: "Who is Miriam?", s: "Exodus 15:20" },
        { value: 400, q: "She judged Israel under a palm tree.", a: "Who is Deborah?", s: "Judges 4:4" },
        { value: 600, q: "This elderly widow saw Jesus at the temple and spoke about him.", a: "Who is Anna?", s: "Luke 2:36-38" },
        { value: 800, q: "King Josiah sent men to inquire of Jehovah through this woman.", a: "Who is Huldah?", s: "2 Kings 22:14" },
        { value: 1000, q: "The evangelist Philip had four unmarried daughters who did this.", a: "What is Prophesied?", s: "Acts 21:9" }
      ]},
      { name: "Royalty", questions: [
        { value: 200, q: "She traveled a long distance to test Solomon with questions.", a: "Who is the Queen of Sheba?", s: "1 Kings 10:1" },
        { value: 400, q: "This wicked queen painted her eyes before Jehu arrived.", a: "Who is Jezebel?", s: "2 Kings 9:30" },
        { value: 600, q: "She refused to display her beauty to the king's guests.", a: "Who is Vashti?", s: "Esther 1:12" },
        { value: 800, q: "This daughter of Jezebel seized the throne of Judah and killed the royal offspring.", a: "Who is Athaliah?", s: "2 Kings 11:1" },
        { value: 1000, q: "Esther became queen of this world power.", a: "What is Persia?", s: "Esther 2:17" }
      ]}
    ],
    final: {
      category: "Loyal Women",
      question: "She said to Naomi: 'Where you go I shall go, and where you spend the night I shall spend the night.'",
      answer: "Who is Ruth?",
      scripture: "Ruth 1:16"
    }
  },
  'geography': {
    meta: { id: 'geography', title: 'Bible Geography', description: 'Explore the lands, cities, and mountains of the scriptures.', icon: '🌍', hasTwoRounds: false },
    round1: [
      { name: "Mountains", questions: [
        { value: 200, q: "Noah's ark came to rest on the mountains of this region.", a: "What is Ararat?", s: "Genesis 8:4" },
        { value: 400, q: "Moses received the Ten Commandments on this mountain.", a: "What is Sinai (or Horeb)?", s: "Exodus 19:20" },
        { value: 600, q: "Elijah challenged the prophets of Baal on this mountain.", a: "What is Carmel?", s: "1 Kings 18:19" },
        { value: 800, q: "Jesus ascended to heaven from this mountain near Jerusalem.", a: "What is the Mount of Olives?", s: "Acts 1:12" },
        { value: 1000, q: "Aaron died on this mountain.", a: "What is Mount Hor?", s: "Numbers 20:28" }
      ]},
      { name: "Cities", questions: [
        { value: 200, q: "Jesus was born in this 'City of David'.", a: "What is Bethlehem?", s: "Luke 2:4" },
        { value: 400, q: "The walls of this city fell down after the Israelites marched around it.", a: "What is Jericho?", s: "Joshua 6:20" },
        { value: 600, q: "Jonah was sent to warn this great city of Assyria.", a: "What is Nineveh?", s: "Jonah 3:2" },
        { value: 800, q: "This city's name means 'Confusion'.", a: "What is Babel (Babylon)?", s: "Genesis 11:9" },
        { value: 1000, q: "Paul was born in this city of Cilicia.", a: "What is Tarsus?", s: "Acts 22:3" }
      ]},
      { name: "Rivers & Seas", questions: [
        { value: 200, q: "Naaman had to bathe seven times in this river.", a: "What is the Jordan River?", s: "2 Kings 5:10" },
        { value: 400, q: "Jesus calmed a storm on this sea.", a: "What is the Sea of Galilee?", s: "Mark 4:39" },
        { value: 600, q: "The Israelites crossed this sea on dry land.", a: "What is the Red Sea?", s: "Exodus 14:21" },
        { value: 800, q: "This was one of the four rivers flowing out of Eden.", a: "What is the Euphrates (or Tigris/Pishon/Gihon)?", s: "Genesis 2:14" },
        { value: 1000, q: "Jesus sent a blind man to wash in this pool.", a: "What is the Pool of Siloam?", s: "John 9:7" }
      ]},
      { name: "Paul's Travels", questions: [
        { value: 200, q: "Paul was traveling to this city when he saw a blinding light.", a: "What is Damascus?", s: "Acts 9:3" },
        { value: 400, q: "Disciples were first called Christians in this city.", a: "What is Antioch?", s: "Acts 11:26" },
        { value: 600, q: "Paul preached about the 'Unknown God' in this Greek city.", a: "What is Athens?", s: "Acts 17:22" },
        { value: 800, q: "Paul was shipwrecked on this island.", a: "What is Malta?", s: "Acts 28:1" },
        { value: 1000, q: "Paul was imprisoned for two years in this capital of the empire.", a: "What is Rome?", s: "Acts 28:30" }
      ]},
      { name: "Ancient Nations", questions: [
        { value: 200, q: "The Israelites were slaves in this land for 400 years.", a: "What is Egypt?", s: "Genesis 15:13" },
        { value: 400, q: "Goliath was a champion from this nation.", a: "What is Philistia?", s: "1 Samuel 17:4" },
        { value: 600, q: "This world power destroyed Jerusalem in 607 B.C.E.", a: "What is Babylon?", s: "2 Kings 25:8" },
        { value: 800, q: "King Cyrus of this nation released the Jews.", a: "What is Persia?", s: "Ezra 1:1" },
        { value: 1000, q: "Sennacherib was king of this aggressive empire.", a: "What is Assyria?", s: "2 Kings 19:36" }
      ]},
      { name: "Key Locations", questions: [
        { value: 200, q: "God placed Adam and Eve in this garden.", a: "What is Eden?", s: "Genesis 2:8" },
        { value: 400, q: "Abraham moved from this city of the Chaldeans.", a: "What is Ur?", s: "Genesis 11:31" },
        { value: 600, q: "Lot fled from this city before fire rained down.", a: "What is Sodom?", s: "Genesis 19:24" },
        { value: 800, q: "John wrote Revelation while exiled on this island.", a: "What is Patmos?", s: "Revelation 1:9" },
        { value: 1000, q: "Jesus was executed at this place, meaning 'Skull'.", a: "What is Golgotha?", s: "Matthew 27:33" }
      ]}
    ],
    final: {
      category: "Prophetic Locations",
      question: "The Hebrew term 'Har-Magedon' (Armageddon) refers to the mountain of this ancient city.",
      answer: "What is Megiddo?",
      scripture: "Revelation 16:16"
    }
  },
  'animals': {
    meta: { id: 'animals', title: 'Creatures of the Bible', description: 'From lions to locusts, animals play a big part in Bible accounts.', icon: '🦁', hasTwoRounds: false },
    round1: [
      { name: "Birds", questions: [
        { value: 200, q: "Noah sent this bird out first from the ark.", a: "What is a Raven?", s: "Genesis 8:7" },
        { value: 400, q: "The spirit descended on Jesus like this bird.", a: "What is a Dove?", s: "Matthew 3:16" },
        { value: 600, q: "Jehovah provided these birds for meat in the wilderness.", a: "What are Quail?", s: "Exodus 16:13" },
        { value: 800, q: "Those hoping in Jehovah will soar on wings like...", a: "What are Eagles?", s: "Isaiah 40:31" },
        { value: 1000, q: "Jesus said not one of these small birds falls without God knowing.", a: "What is a Sparrow?", s: "Matthew 10:29" }
      ]},
      { name: "Beasts of Burden", questions: [
        { value: 200, q: "Jesus rode into Jerusalem on the colt of this animal.", a: "What is a Donkey?", s: "Matthew 21:5" },
        { value: 400, q: "Rebekah watered ten of these animals for Abraham's servant.", a: "What are Camels?", s: "Genesis 24:19" },
        { value: 600, q: "Absalom was caught by his hair while riding this animal.", a: "What is a Mule?", s: "2 Samuel 18:9" },
        { value: 800, q: "Samson used the jawbone of this animal to defeat the Philistines.", a: "What is a Donkey (Ass)?", s: "Judges 15:15" },
        { value: 1000, q: "The Law forbade plowing with an ox and this animal together.", a: "What is a Donkey?", s: "Deuteronomy 22:10" }
      ]},
      { name: "Dangerous Beasts", questions: [
        { value: 200, q: "Samson tore this animal in two with his bare hands.", a: "What is a Lion?", s: "Judges 14:6" },
        { value: 400, q: "David killed a lion and this animal to protect his sheep.", a: "What is a Bear?", s: "1 Samuel 17:34" },
        { value: 600, q: "Paul shook this creature off his hand into the fire.", a: "What is a Viper (Snake)?", s: "Acts 28:3-5" },
        { value: 800, q: "Two of these animals came out of the woods to maul 42 children.", a: "What are Bears?", s: "2 Kings 2:24" },
        { value: 1000, q: "In the new world, this animal will reside with the lamb.", a: "What is a Wolf?", s: "Isaiah 11:6" }
      ]},
      { name: "Insects", questions: [
        { value: 200, q: "John the Baptist ate honey and these insects.", a: "What are Locusts?", s: "Matthew 3:4" },
        { value: 400, q: "Go to this insect, you lazy one, and become wise.", a: "What is the Ant?", s: "Proverbs 6:6" },
        { value: 600, q: "Samson found honey made by these in a lion's carcass.", a: "What are Bees?", s: "Judges 14:8" },
        { value: 800, q: "This was the fourth plague on Egypt.", a: "What are Gadflies (or Flies)?", s: "Exodus 8:21" },
        { value: 1000, q: "Jesus said the Pharisees strain out this tiny insect but swallow a camel.", a: "What is a Gnat?", s: "Matthew 23:24" }
      ]},
      { name: "Specific Stories", questions: [
        { value: 200, q: "This animal spoke to Balaam.", a: "What is a Donkey?", s: "Numbers 22:28" },
        { value: 400, q: "This animal swallowed Jonah.", a: "What is a Big Fish?", s: "Jonah 1:17" },
        { value: 600, q: "This animal crowed after Peter denied Jesus.", a: "What is a Rooster?", s: "Luke 22:60" },
        { value: 800, q: "Jesus cast demons into a herd of these animals.", a: "What are Pigs (Swine)?", s: "Matthew 8:32" },
        { value: 1000, q: "Aaron built a golden statue of this animal.", a: "What is a Calf?", s: "Exodus 32:4" }
      ]},
      { name: "Symbolic", questions: [
        { value: 200, q: "Satan spoke through this animal in Eden.", a: "What is a Serpent?", s: "Genesis 3:1" },
        { value: 400, q: "Jesus is called the ____ of God who takes away the sin of the world.", a: "What is the Lamb?", s: "John 1:29" },
        { value: 600, q: "Jesus is called the ____ of the tribe of Judah.", a: "What is the Lion?", s: "Revelation 5:5" },
        { value: 800, q: "Satan is described as a great fiery-colored...", a: "What is a Dragon?", s: "Revelation 12:3" },
        { value: 1000, q: "In Daniel's vision, the King of Greece is represented by this animal.", a: "What is a Goat?", s: "Daniel 8:21" }
      ]}
    ],
    final: {
      category: "Creation",
      question: "In Job 40, Jehovah describes this massive grass-eating creature with a tail like a cedar.",
      answer: "What is Behemoth (Hippopotamus)?",
      scripture: "Job 40:15"
    }
  }
};

export const getAvailablePresets = (): PresetMetadata[] => {
  const defaults = Object.values(PRESETS).map((p: any) => p.meta);
  const customs = getCustomPresetsRaw().map((p: any) => p.meta);
  return [...defaults, ...customs];
};

export const getPresetGameById = (id: string): FullGameData | null => {
  let preset = PRESETS[id];
  
  // Check Custom
  if (!preset) {
    const customs = getCustomPresetsRaw();
    preset = customs.find((p: any) => p.meta.id === id);
  }

  if (!preset) return null;

  const processCategories = (rawCats: any[], round: 1 | 2): Category[] => {
    return rawCats.map((cat: any, catIndex: number) => ({
      id: `preset-${id}-r${round}-cat-${catIndex}`,
      name: cat.name,
      questions: cat.questions.map((q: any, qIndex: number) => ({
        id: `preset-${id}-r${round}-q-${catIndex}-${qIndex}`,
        value: q.value,
        question: q.q,
        answer: q.a,
        scripture: q.s,
        isAnswered: false
      }))
    }));
  };

  const round1: GameBoardData = {
    categories: processCategories(preset.round1 || preset.categories, 1),
    round: 1
  };
  
  let round2: GameBoardData | undefined;
  if (preset.round2) {
    round2 = {
      categories: processCategories(preset.round2, 2),
      round: 2
    };
  }

  return {
    round1,
    round2,
    final: preset.final
  };
};