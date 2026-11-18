export interface InventoryQuestion {
  id: string;
  type: 'boolean' | 'text' | 'boolean_with_followup';
  questionAr: string;
  questionEn: string;
  followUpAr?: string;
  followUpEn?: string;
  placeholderAr?: string;
  placeholderEn?: string;
}

export interface InventorySection {
  id: number;
  headerAr: string;
  headerEn: string;
  shortTitleAr: string;
  shortTitleEn: string;
  questions: InventoryQuestion[];
}

export const INVENTORY_INTRO = {
  titleAr: 'معايشة البرنامج',
  titleEn: 'Living the Program',
  subTitleAr: 'ما نجح معنا: نشرة زمالة المدمنين المجهولين اليومية',
  subTitleEn: 'What Worked for Us: NA Daily Journal',
  literatureNoticeAr: 'هذه ترجمة للأدبيات الموافق عليها من قبل زمالة المدمنين المجهولين (IP No 9-AR)',
  literatureNoticeEn: 'This is NA Fellowship-approved literature (IP No 9)',
  purposeAr: 'الهدف من هذا الجرد اليومي هو متابعة أنفسنا وأفعالنا اليوم.',
  purposeEn: 'The purpose of this daily inventory is to keep track of who we are and what we are doing today.',
  instructionsAr: [
    'حاولوا إجابة كل سؤال، كل يوم. اجعلوا أجوبتكم بسيطة وأمينة بقدر الإمكان. إن فاتكم يوم، فلا تعوضوه لاحقاً.',
    'لتقتصر أجوبتكم ومخاوفكم على الساعات الأربع والعشرين الماضية وأكملوا الأسئلة في نهاية اليوم.',
    'إن رغبتم في مشاركة بعض ما في هذه النشرة، فنقترح أن تفعلوا ذلك شفاهاً.',
    'تذكروا أن الجرد اليومي ليس اختباراً؛ لا توجد أجوبة صحيحة وأجوبة خاطئة. لا تنزعجوا إن كان بإمكانكم أن تبلوا بلاءً أفضل ولم تفعلوا أو إن فشلتم في الوصول إلى ما تتوقعونه من أنفسكم. تذكروا، هذا برنامج للنمو والتعافي وإن كنتم ممتنعين اليوم، فإنكم تفعلون شيئاً صحيحاً.',
  ],
  instructionsEn: [
    'Try to answer every question, every day. Keep your answers as simple and as honest as you can. If you miss a day, do not make it up later.',
    'Limit your answers and concerns to the past twenty-four hours and complete the questions at the end of the day.',
    'If you wish to share some of this journal, we suggest that you do so verbally.',
    'Remember that a daily inventory is not a test; there are no right or wrong answers. Do not get upset if you could have done better or if you fail to live up to your expectations of yourself. Remember, this is a program of growth and recovery and if you are clean today, you are doing something right.',
  ],
};

export const CLOSING_PRAYER = {
  prayerAr: 'إلهي، أرني ما أصبت وما أخطأت فيه اليوم. أرني كيف أعيش وأخدم وفقاً لمشيئتك بشكل أفضل غداً.',
  prayerEn: 'Dear God, show me what I have done right and wrong today. Show me how I can better live and serve your will tomorrow.',
  notesHeaderAr: 'ملاحظات',
  notesHeaderEn: 'NOTES',
  verbalSharingReminderAr: 'إن رغبتم في مشاركة بعض ما في هذه النشرة، فنقترح أن تفعلوا ذلك شفاهاً.',
  verbalSharingReminderEn: 'If you wish to share some of this journal, we suggest that you do so verbally.',
};

export const INVENTORY_SECTIONS: InventorySection[] = [
  {
    id: 1,
    shortTitleAr: 'التعافي والامتناع',
    shortTitleEn: 'Recovery & Clean Living',
    headerAr: 'لليوم فقط سيتركز تفكيري على التعافي، أعيش وأستمتع بالحياة دون تعاطي المخدرات.',
    headerEn: 'Just for today, my thoughts will be on my recovery, living and enjoying life without the use of drugs.',
    questions: [
      {
        id: 'q1',
        type: 'boolean',
        questionAr: 'هل أنا ممتنع اليوم؟',
        questionEn: 'Am I clean today?',
      },
      {
        id: 'q2',
        type: 'text',
        questionAr: 'كيف تصرفت بشكل مختلف؟',
        questionEn: 'How have I acted differently?',
        placeholderAr: 'اكتب كيف كان تصرفك مختلفاً اليوم...',
        placeholderEn: 'Describe how you acted differently today...',
      },
      {
        id: 'q3',
        type: 'boolean_with_followup',
        questionAr: 'هل تحكم مرضي بحياتي اليوم؟',
        questionEn: 'Did my disease run my life today?',
        followUpAr: 'إن كان الأمر هكذا، فكيف؟',
        followUpEn: 'If so, how?',
        placeholderAr: 'وضح كيف ظهر المرض اليوم...',
        placeholderEn: 'Explain how your disease showed up today...',
      },
      {
        id: 'q4',
        type: 'text',
        questionAr: 'ما الذي فعلته اليوم وندمت عليه؟',
        questionEn: 'What did I do today that I wish I had not done?',
        placeholderAr: 'أفعال ندمت عليها...',
        placeholderEn: 'Things you wish you had not done...',
      },
      {
        id: 'q5',
        type: 'text',
        questionAr: 'ما الذي أهملته وندمت على عدم فعله؟',
        questionEn: 'What have I left undone that I wish I had done?',
        placeholderAr: 'أمور أهملتها وكان ينبغي فعلها...',
        placeholderEn: 'Things you left undone...',
      },
      {
        id: 'q6',
        type: 'boolean_with_followup',
        questionAr: 'هل أحسنت معاملة نفسي اليوم؟',
        questionEn: 'Was I good to myself today?',
        followUpAr: 'كيف؟',
        followUpEn: 'How?',
        placeholderAr: 'كيف اهتممت بنفسك ورعايتها؟',
        placeholderEn: 'How did you treat yourself well?',
      },
      {
        id: 'q7',
        type: 'boolean',
        questionAr: 'هل كان اليوم يوماً جيداً؟',
        questionEn: 'Was today a good day?',
      },
      {
        id: 'q8',
        type: 'boolean',
        questionAr: 'هل كنت سعيداً؟',
        questionEn: 'Was I happy?',
      },
      {
        id: 'q9',
        type: 'boolean',
        questionAr: 'هل كنت متمتعاً بالسكينة؟',
        questionEn: 'Was I serene?',
      },
    ],
  },
  {
    id: 2,
    shortTitleAr: 'الثقة بالزمالة والموجه',
    shortTitleEn: 'Fellowship & Trust',
    headerAr: 'لليوم فقط سيكون لدي ثقة بعضو في زمالة المدمنين المجهولين، عضو يؤمن بي ويود مساعدتي في تعافي.',
    headerEn: 'Just for today I will have faith in someone in NA who believes in me and wants to help me in my recovery.',
    questions: [
      {
        id: 'q10',
        type: 'boolean',
        questionAr: 'هل تحدثت إلى موجهي اليوم؟',
        questionEn: 'Did I talk to my sponsor today?',
      },
      {
        id: 'q11',
        type: 'boolean_with_followup',
        questionAr: 'هل حضرت اجتماعاً اليوم؟',
        questionEn: 'Did I attend a meeting today?',
        followUpAr: 'أين؟',
        followUpEn: 'Where?',
        placeholderAr: 'اسم أو مكان الاجتماع...',
        placeholderEn: 'Meeting name or location...',
      },
      {
        id: 'q12',
        type: 'boolean',
        questionAr: 'هل شاركت خبراتي، ومواطن قوتي، وآمالي؟',
        questionEn: 'Did I share my experiences, strengths, and hopes?',
      },
      {
        id: 'q13',
        type: 'text',
        questionAr: 'مَن هم الأشخاص الذين في حياتي وأثق بهم اليوم؟',
        questionEn: 'Who are the people in my life that I trust today?',
        placeholderAr: 'أسماء الأشخاص ومواضع الثقة...',
        placeholderEn: 'People in your life you trust today...',
      },
      {
        id: 'q14',
        type: 'text',
        questionAr: 'مَن يثق في اليوم؟',
        questionEn: 'Who has trust in me today?',
        placeholderAr: 'من يضع ثقته بك اليوم...',
        placeholderEn: 'Who places their trust in you today...',
      },
    ],
  },
  {
    id: 3,
    shortTitleAr: 'البرنامج والخطوات',
    shortTitleEn: 'Program & Steps',
    headerAr: 'لليوم فقط سيكون لدي برنامج وسأحاول الالتزام به قدر استطاعتي.',
    headerEn: 'Just for today I will have a program; I will try to follow it to the best of my ability.',
    questions: [
      {
        id: 'q15',
        type: 'boolean',
        questionAr: 'هل قرأت من أدبياتنا اليوم؟',
        questionEn: 'Did I read from our literature today?',
      },
      {
        id: 'q16',
        type: 'text',
        questionAr: 'ما الخطوات التي طبقتها عن وعي؟',
        questionEn: 'What steps did I consciously work?',
        placeholderAr: 'الخطوات التي مارستها اليوم ومواقف تطبيقها...',
        placeholderEn: 'Steps you consciously practiced today...',
      },
      {
        id: 'q17',
        type: 'boolean',
        questionAr: 'هل اعترفت بعجزي اليوم؟',
        questionEn: 'Did I admit my powerlessness today?',
      },
      {
        id: 'q18',
        type: 'boolean',
        questionAr: 'هل كنت قادراً على أن أضع ثقتي في قوتي العظمى اليوم؟',
        questionEn: 'Was I able to put my trust in my Higher Power today?',
      },
      {
        id: 'q19',
        type: 'text',
        questionAr: 'ماذا تعلمت عن نفسي اليوم؟',
        questionEn: 'What did I learn about myself today?',
        placeholderAr: 'دروس ووعي جديد عن نفسك...',
        placeholderEn: 'Insights and learnings about yourself...',
      },
      {
        id: 'q20',
        type: 'boolean_with_followup',
        questionAr: 'هل قمت بأي إصلاحات اليوم؟',
        questionEn: 'Did I make any amends today?',
        followUpAr: 'هل أدين بأي إصلاحات؟',
        followUpEn: 'Do I owe any?',
        placeholderAr: 'أي إصلاحات تدين بها أو قمت بها اليوم...',
        placeholderEn: 'Any amends made or owed...',
      },
      {
        id: 'q21',
        type: 'boolean',
        questionAr: 'هل اعترفت لأحد بخطئي اليوم؟',
        questionEn: 'Did I admit fault to anyone today?',
      },
      {
        id: 'q22',
        type: 'boolean',
        questionAr: 'هل كنت قلقاً بشأن الأمس أو الغد؟',
        questionEn: 'Did I worry about yesterday or tomorrow?',
      },
      {
        id: 'q23',
        type: 'boolean',
        questionAr: 'هل يمكنني تقبل نفسي على ما أنا عليه اليوم؟',
        questionEn: 'Can I accept myself as I am today?',
      },
    ],
  },
  {
    id: 4,
    shortTitleAr: 'رؤية أفضل للحياة',
    shortTitleEn: 'Perspective & Growth',
    headerAr: 'لليوم فقط ومن خلال برنامج زمالة المدمنين المجهولين سأحاول أن أجد لنفسي رؤية أفضل لحياتي.',
    headerEn: 'Just for today, through NA, I will try to get a better perspective on my life.',
    questions: [
      {
        id: 'q24',
        type: 'boolean',
        questionAr: 'هل شعرت أنني كنت جزءاً من الإنسانية اليوم؟',
        questionEn: 'Did I feel like I was a part of humanity today?',
      },
      {
        id: 'q25',
        type: 'boolean',
        questionAr: 'هل سمحت لنفسي بأن يسيطر على تفكيري أي شيء اليوم؟',
        questionEn: 'Did I allow myself to become obsessed by anything today?',
      },
      {
        id: 'q26',
        type: 'text',
        questionAr: 'ما الذي منحني إياه الله لأكون شاكراً اليوم؟',
        questionEn: 'What has God given me to be grateful for today?',
        placeholderAr: 'قائمة الامتنان والشكر...',
        placeholderEn: 'Things you are grateful for today...',
      },
      {
        id: 'q27',
        type: 'boolean_with_followup',
        questionAr: 'هل فعلت شيئاً يتسبب في أذى لنفسي أو لشخص آخر اليوم؟',
        questionEn: 'Have I done anything to cause harm to myself or to another today?',
        followUpAr: 'إن كان الأمر كذلك، فماذا؟',
        followUpEn: 'If so, what?',
        placeholderAr: 'وضح ما حدث...',
        placeholderEn: 'Explain what happened...',
      },
      {
        id: 'q28',
        type: 'boolean',
        questionAr: 'هل أنا راغب في التغير اليوم؟',
        questionEn: 'Am I willing to change today?',
      },
      {
        id: 'q29',
        type: 'boolean_with_followup',
        questionAr: 'هل دعوت أو تأملت اليوم؟',
        questionEn: 'Did I pray or meditate today?',
        followUpAr: 'كيف أثر ذلك في حياتي؟',
        followUpEn: 'How did this affect my life?',
        placeholderAr: 'أثر الدعاء والتأمل في يومك...',
        placeholderEn: 'How did prayer/meditation impact your day...',
      },
      {
        id: 'q30',
        type: 'text',
        questionAr: 'ما المبادئ الروحانية التي تمكنت من ممارستها في حياتي اليوم؟',
        questionEn: 'What spiritual principles have I been able to practice in my life today?',
        placeholderAr: 'الصدق، الأمل، التواضع، التسامح، الانفتاح الذهني...',
        placeholderEn: 'Honesty, hope, humility, forgiveness, open-mindedness...',
      },
      {
        id: 'q31',
        type: 'boolean',
        questionAr: 'هل كان أهم شيء في حياتي اليوم هو البقاء ممتنعاً؟',
        questionEn: 'Was the most important thing in my life today staying clean?',
      },
    ],
  },
  {
    id: 5,
    shortTitleAr: 'عدم الخوف والعطاء',
    shortTitleEn: 'Freedom from Fear & Service',
    headerAr: 'لليوم فقط لن أخاف وستتركز أفكاري على زملائي الجدد، أولئك الذين لا يتعاطون المخدرات ووجدوا أسلوباً جديداً للحياة. وطالما أتّبع هذا السبيل فليس لدي ما أخشاه.',
    headerEn: 'Just for today I will be unafraid, my thoughts will be on my new associations, people who are not using and have found a new way of life. So long as I follow that way, I have nothing to fear.',
    questions: [
      {
        id: 'q32',
        type: 'boolean',
        questionAr: 'هل أعطيت من نفسي اليوم دون توقع أي مقابل؟',
        questionEn: 'Have I given of myself today without expecting anything in return?',
      },
      {
        id: 'q33',
        type: 'boolean',
        questionAr: 'هل كان هناك خوف في حياتي اليوم؟',
        questionEn: 'Was there fear in my life today?',
      },
      {
        id: 'q34',
        type: 'boolean',
        questionAr: 'هل شعرت بفرحة أو ألم بالغين؟',
        questionEn: 'Did I feel intense joy or pain?',
      },
      {
        id: 'q35',
        type: 'boolean',
        questionAr: 'هل اتصلت بأحد الأعضاء بالبرنامج أو زرته اليوم؟',
        questionEn: 'Did I call or visit someone in the program today?',
      },
      {
        id: 'q36',
        type: 'boolean',
        questionAr: 'هل دعوت لأجل شخص آخر اليوم؟',
        questionEn: 'Did I pray for the well-being of another today?',
      },
      {
        id: 'q37',
        type: 'boolean',
        questionAr: 'هل كنت سعيداً اليوم؟',
        questionEn: 'Was I happy today?',
      },
      {
        id: 'q38',
        type: 'boolean',
        questionAr: 'هل شعرت بالطمأنينة اليوم؟',
        questionEn: 'Have I been peaceful today?',
      },
      {
        id: 'q39',
        type: 'boolean',
        questionAr: 'هل تذكرت عن وعي أن لدي خياراً اليوم؟',
        questionEn: 'Did I consciously remember that I have a choice today?',
      },
    ],
  },
];
