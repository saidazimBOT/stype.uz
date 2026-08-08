import type { TextPool, LanguageInfo, LanguageGroup } from "../types";

// 20+ languages for typing practice
export const TEXTS: TextPool = {
  en: [
    "Precision is the engine of speed. The master typist does not rush, but moves with a rhythmic elegance that defies the boundaries of thought and execution.",
    "In the zone, there is no keyboard, only the direct translation of intent into light. Every keystroke is a heartbeat, every word a breath.",
    "Speed without accuracy is noise. True mastery is when your fingers know the path before your mind has finished the thought.",
    "The keyboard is your instrument. Play it with conviction, with rhythm, with the quiet confidence of someone who has practiced ten thousand hours.",
    "Every great typist was once a beginner. The difference is they never stopped. One word at a time, one keystroke at a time, until the hands remember.",
    "Technology is best when it brings people together. The real power of the digital age is connection, not computation.",
    "In the middle of difficulty lies opportunity. The harder the challenge, the greater the growth that follows.",
    "Code is poetry written in logic. Every function tells a story, every variable holds a memory.",
  ],
  ru: [
    "Точность — двигатель скорости. Мастер-машинист не спешит, но движется с ритмичной элегантностью, которая бросает вызов границам мысли и исполнения.",
    "В потоке нет клавиатуры, есть лишь прямой перевод намерения в свет. Каждое нажатие — удар сердца, каждое слово — дыхание.",
    "Скорость без точности — это шум. Истинное мастерство — когда пальцы знают путь раньше, чем разум завершил мысль.",
    "Клавиатура — твой инструмент. Играй на ней с убеждённостью, ритмом и тихой уверенностью того, кто практиковался тысячи часов.",
    "Каждый великий машинист когда-то был новичком. Разница в том, что они никогда не останавливались. Слово за словом, нажатие за нажатием.",
    "Программирование — это искусство говорить компьютеру, что делать, прежде чем он сам поймёт, что вы от него хотите.",
    "Лучший способ предсказать будущее — создать его. Каждая строка кода — это шаг в завтрашний день.",
  ],
  uz: [
    "Aniqlik tezlikning dvigateli. Usta kotib shoshilmaydi, balki fikr va ijro chegaralarini yengib o'tadigan ritmik nafosatda harakat qiladi.",
    "O'sha holatda klaviatura yo'q, faqat niyatni nurga to'g'ridan-to'g'ri tarjima qilish bor. Har bir tugma bosish yurak urishi, har bir so'z nafasdir.",
    "Aniqliksiz tezlik — bu shovqin. Haqiqiy mahorat — barmoqlar fikr tugashidan oldin yo'lni bilganidadir.",
    "Klaviatura sizning asbobingiz. Uni e'tiqod bilan, ritm bilan, ming soat mashq qilgan kishining xotirjam ishonchi bilan chaling.",
    "Har bir buyuk kotib bir vaqtlar yangi boshlovchi edi. Farqi shundaki, ular hech qachon to'xtamadi. Bir so'z, bir tugma bosish bilan.",
    "Texnologiya insonlarni birlashtirganda eng yaxshi natija beradi. Raqamli asrning haqiqiy kuchi aloqada, hisoblashda emas.",
    "O'zbekiston — buyuk kelajak sari intilayotgan yurt. Har bir yosh avlod bu yo'lda muhim qadamlarni qo'ymoqda.",
  ],
  de: [
    "Präzision ist der Motor der Geschwindigkeit. Der Meistertastschreiber hetzt nicht, sondern bewegt sich mit einer rhythmischen Eleganz.",
    "Geschwindigkeit ohne Genauigkeit ist Lärm. Wahre Meisterschaft ist, wenn die Finger den Weg kennen, bevor der Gedanke zu Ende ist.",
    "Die Tastatur ist dein Instrument. Spiele mit Überzeugung, mit Rhythmus und der stillen Zuversicht eines Meisters.",
    "Jeder großartige Tastenschreiber war einmal ein Anfänger. Der Unterschied ist, dass sie nie aufgehört haben.",
    "Technologie ist am besten, wenn sie Menschen zusammenbringt. Die wahre Stärke des digitalen Zeitalters ist Verbindung.",
  ],
  fr: [
    "La précision est le moteur de la vitesse. Le maître dactylographe ne se précipite pas, mais se déplace avec une élégance rythmique.",
    "La vitesse sans précision n'est que du bruit. La vraie maîtrise est lorsque les doigts connaissent le chemin avant la pensée.",
    "Le clavier est votre instrument. Jouez avec conviction, avec rythme, avec la confiance tranquille d'un expert.",
    "Chaque grand dactylographe a été un débutant. La différence est qu'ils n'ont jamais abandonné.",
    "La technologie est à son meilleur quand elle rassemble les gens. La vraie puissance de l'ère numérique est la connexion.",
  ],
  es: [
    "La precisión es el motor de la velocidad. El maestro mecanógrafo no se apresura, sino que se mueve con una elegancia rítmica.",
    "La velocidad sin precisión es ruido. El verdadero dominio es cuando los dedos conocen el camino antes que el pensamiento.",
    "El teclado es tu instrumento. Toca con convicción, con ritmo, con la confianza silenciosa de un experto.",
    "Cada gran mecanógrafo fue una vez un principiante. La diferencia es que nunca se rindieron.",
    "La tecnología es mejor cuando une a las personas. El verdadero poder de la era digital es la conexión.",
  ],
  it: [
    "La precisione è il motore della velocità. Il maestro dattilografo non si affretta, ma si muove con un'eleganza ritmica.",
    "La velocità senza precisione è rumore. La vera maestria è quando le dita conoscono la strada prima del pensiero.",
    "La tastiera è il tuo strumento. Suona con convinzione, con ritmo, con la silenziosa fiducia di un esperto.",
    "Ogni grande dattilografo è stato un principiante. La differenza è che non si sono mai fermati.",
    "La tecnologia è al suo meglio quando unisce le persone. Il vero potere dell'era digitale è la connessione.",
  ],
  pt: [
    "A precisão é o motor da velocidade. O mestre datilógrafo não se apressa, mas se move com uma elegância rítmica.",
    "Velocidade sem precisão é ruído. O verdadeiro domínio é quando os dedos conhecem o caminho antes do pensamento.",
    "O teclado é seu instrumento. Toque com convicção, com ritmo, com a confiança silenciosa de um especialista.",
    "Cada grande datilógrafo foi um iniciante. A diferença é que eles nunca pararam.",
    "A tecnologia é melhor quando une as pessoas. O verdadeiro poder da era digital é a conexão.",
  ],
  nl: [
    "Nauwkeurigheid is de motor van snelheid. De meester-typist haast zich niet, maar beweegt met ritmische elegantie.",
    "Snelheid zonder nauwkeurigheid is lawaai. Ware meesterschap is wanneer vingers de weg kennen voordat de gedachte voltooid is.",
    "Het toetsenbord is je instrument. Speel met overtuiging, met ritme, met het stille vertrouwen van een expert.",
    "Elke grote typist was ooit een beginner. Het verschil is dat ze nooit zijn gestopt.",
  ],
  pl: [
    "Precyzja jest silnikiem prędkości. Mistrz klawiatury nie spieszy się, ale porusza się z rytmiczną elegancją.",
    "Prędkość bez precyzji to hałas. Prawdziwe mistrzostwo to moment, gdy palce znają drogę zanim myśl się zakończy.",
    "Klawiatura to twój instrument. Graj z przekonaniem, z rytmem, z cichą pewnością eksperta.",
    "Każdy wielki mistrz klawiatury był kiedyś początkującym. Różnica polega na tym, że nigdy nie przestali.",
  ],
  tr: [
    "Hassasiyet hızın motorudur. Usta daktilograf acele etmez, ritmik bir zarafetle hareket eder.",
    "Hassasiyetsiz hız gürültüdür. Gerçek ustalık, parmakların düşünce bitmeden yolu bildiği zamandır.",
    "Klavye sizin enstrümanınızdır. İnançla, ritimle, bir ustanın sessiz güveniyle çalın.",
    "Her büyük daktilograf bir zamanlar acemiydi. Fark, asla durmamış olmalarıdır.",
  ],
  ar: [
    "الدقة هي محرك السرعة. سيد الطباعة لا يتعجل، بل يتحرك بأناقة إيقاعية.",
    "السرعة بدون دقة هي ضوضاء. الإتقان الحقيقي هو عندما تعرف الأصابع الطريق قبل أن يكتمل الفكر.",
    "لوحة المفاتيح هي آلتك الموسيقية. اعزف عليها باقتناع، بإيقاع، بثقة الخبير الهادئة.",
    "كل عظيم في الطباعة كان مبتدئاً يوماً ما. الفرق هو أنهم لم يتوقفوا أبداً.",
  ],
  ja: [
    "正確さはスピードの原動力です。達人は急がず、リズミカルな優雅さで動きます。",
    "正確さのないスピードはノイズです。指が思考よりも先に道を知っているとき、それが真の熟達です。",
    "キーボードはあなたの楽器です。確信を持って、リズムよく、専門家の静かな自信を持って演奏してください。",
    "すべての偉大なタイピストは初心者でした。違いは、彼らが決して止まらなかったことです。",
  ],
  zh: [
    "精准是速度的引擎。打字大师不会匆忙，而是以节奏优雅的方式移动。",
    "没有精准的速度就是噪音。真正的精通是指尖在思维完成之前就知道路径。",
    "键盘是你的乐器。带着信念、节奏和专家般的静默自信去演奏。",
    "每个伟大的打字员都曾是初学者。区别在于他们从未停止。",
  ],
  ko: [
    "정확성은 속도의 엔진입니다. 타자의 대가는 서두르지 않고 리드미컬한 우아함으로 움직입니다.",
    "정확성 없는 속도는 소음일 뿐입니다. 손가락이 생각보다 먼저 길을 알 때가 진정한 숙달입니다.",
    "키보드는 당신의 악기입니다. 확신을 가지고, 리듬을 타고, 전문가의 조용한 자신감으로 연주하세요.",
  ],
  hi: [
    "सटीकता गति का इंजन है। मास्टर टाइपिस्ट जल्दबाजी नहीं करता, बल्कि लयबद्ध शालीनता से चलता है।",
    "सटीकता के बिना गति शोर है। सच्ची महारत तब है जब उंगलियां विचार से पहले रास्ता जानती हों।",
    "कीबोर्ड आपका वाद्य यंत्र है। इसे विश्वास के साथ, लय के साथ, एक विशेषज्ञ के शांत आत्मविश्वास के साथ बजाएं।",
  ],
  th: [
    "ความแม่นยำคือเครื่องยนต์ของความเร็ว นักพิมพ์ดีดผู้เชี่ยวชาญไม่รีบร้อน แต่เคลื่อนไหวอย่างสง่างามเป็นจังหวะ",
    "ความเร็วโดยปราศจากความแม่นยำคือเสียงรบกวน ความเชี่ยวชาญที่แท้จริงคือนิ้วที่รู้เส้นทางก่อนที่ความคิดจะเสร็จสมบูรณ์",
    "คีย์บอร์ดคือเครื่องดนตรีของคุณ เล่นด้วยความเชื่อมั่น ด้วยจังหวะ ด้วยความมั่นใจเงียบๆของผู้เชี่ยวชาญ",
  ],
  vi: [
    "Sự chính xác là động cơ của tốc độ. Bậc thầy đánh máy không vội vã, mà di chuyển với sự thanh lịch nhịp nhàng.",
    "Tốc độ mà không có độ chính xác chỉ là tiếng ồn. Sự thành thạo thực sự là khi những ngón tay biết đường đi trước khi suy nghĩ kết thúc.",
    "Bàn phím là nhạc cụ của bạn. Hãy chơi với niềm tin, với nhịp điệu, với sự tự tin thầm lặng của một chuyên gia.",
  ],
  id: [
    "Ketepatan adalah mesin kecepatan. Master pengetik tidak terburu-buru, tetapi bergerak dengan keanggunan berirama.",
    "Kecepatan tanpa ketepatan adalah kebisingan. Penguasaan sejati adalah ketika jari tahu jalan sebelum pikiran selesai.",
    "Keyboard adalah instrumen Anda. Mainkan dengan keyakinan, dengan ritme, dengan kepercayaan diri seorang ahli.",
  ],
  sv: [
    "Precision är motorn i hastighet. Mästerskrivaren stressar inte utan rör sig med rytmisk elegans.",
    "Hastighet utan precision är bara buller. Sann mästerskap är när fingrarna känner vägen innan tanken är klar.",
    "Tangentbordet är ditt instrument. Spela med övertygelse, med rytm, med en experts tysta självförtroende.",
  ],
  fi: [
    "Tarkkuus on nopeuden moottori. Mestarikirjoittaja ei kiirehdi, vaan liikkuu rytmisellä eleganssilla.",
    "Nopeus ilman tarkkuutta on melua. Todellinen mestaruus on silloin, kun sormet tietävät tien ennen ajatuksen valmistumista.",
    "Näppäimistö on instrumenttisi. Soita vakaumuksella, rytmillä, asiantuntijan hiljaisella itseluottamuksella.",
  ],
  no: [
    "Presisjon er motoren i hastighet. Mesterskriveren stresser ikke, men beveger seg med rytmisk eleganse.",
    "Hastighet uten presisjon er støy. Sann mestring er når fingrene kjenner veien før tanken er ferdig.",
    "Tastaturet er ditt instrument. Spill med overbevisning, med rytme, med en experts stille selvtillit.",
  ],
  da: [
    "Præcision er motoren i hastighed. Mesterskriveren skynder sig ikke, men bevæger sig med rytmisk elegance.",
    "Hastighed uden præcision er støj. Sand mesterskab er når fingrene kender vejen før tanken er færdig.",
    "Tastaturet er dit instrument. Spil med overbevisning, med rytme, med en experts stille selvtillid.",
  ],
  cs: [
    "Přesnost je motor rychlosti. Mistr klávesnice nespěchá, ale pohybuje se s rytmickou elegancí.",
    "Rychlost bez přesnosti je hluk. Skutečné mistrovství je, když prsty znají cestu dříve, než myšlenka skončí.",
    "Klávesnice je váš nástroj. Hrajte s přesvědčením, s rytmem, s tichým sebevědomím experta.",
  ],
  ro: [
    "Precizia este motorul vitezei. Maestrul dactilograf nu se grăbește, ci se mișcă cu o eleganță ritmică.",
    "Viteza fără precizie este zgomot. Adevărata măiestrie este atunci când degetele cunosc drumul înainte ca gândul să se termine.",
    "Tastatura este instrumentul tău. Cântă cu convingere, cu ritm, cu încrederea tăcută a unui expert.",
  ],
  hu: [
    "A pontosság a sebesség motorja. A mestergépíró nem siet, hanem ritmikus eleganciával mozog.",
    "A sebesség pontosság nélkül csak zaj. Az igazi mesterség az, amikor az ujjak ismerik az utat, mielőtt a gondolat befejeződne.",
    "A billentyűzet a hangszered. Játssz meggyőződéssel, ritmussal, egy szakember csendes magabiztosságával.",
  ],
  uk: [
    "Точність — двигун швидкості. Мастер-машиніст не поспішає, а рухається з ритмічною елегантністю.",
    "Швидкість без точності — це шум. Справжня майстерність — коли пальці знають шлях раніше, ніж закінчилася думка.",
    "Клавіатура — твій інструмент. Грай з переконанням, з ритмом, з тихою впевненістю експерта.",
  ],
};

export const LANG_LABELS: LanguageInfo = {
  en: "English", ru: "Русский", uz: "O'zbek", de: "Deutsch", fr: "Français",
  es: "Español", it: "Italiano", pt: "Português", nl: "Nederlands",
  pl: "Polski", tr: "Türkçe", ar: "العربية", ja: "日本語",
  zh: "中文", ko: "한국어", hi: "हिन्दी", th: "ไทย", vi: "Tiếng Việt",
  id: "Bahasa Indonesia", sv: "Svenska", fi: "Suomi", no: "Norsk",
  da: "Dansk", cs: "Čeština", ro: "Română", hu: "Magyar", uk: "Українська",
};

// Til kodlari → davlat bayrog'i emoji
// (ar uchun umumiy arab davlati bayrog'i ishlatiladi)
export const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧", ru: "🇷🇺", uz: "🇺🇿", de: "🇩🇪", fr: "🇫🇷",
  es: "🇪🇸", it: "🇮🇹", pt: "🇵🇹", nl: "🇳🇱",
  pl: "🇵🇱", tr: "🇹🇷", ar: "🇸🇦", ja: "🇯🇵",
  zh: "🇨🇳", ko: "🇰🇷", hi: "🇮🇳", th: "🇹🇭", vi: "🇻🇳",
  id: "🇮🇩", sv: "🇸🇪", fi: "🇫🇮", no: "🇳🇴",
  da: "🇩🇰", cs: "🇨🇿", ro: "🇷🇴", hu: "🇭🇺", uk: "🇺🇦",
};

export const LANG_CODES: string[] = Object.keys(TEXTS);

export const LANG_GROUPS: LanguageGroup[] = [
  { name: "Most Used", langs: ["en", "ru", "uz", "de", "fr", "es", "it", "pt", "nl", "tr", "pl", "ar"] },
  { name: "Asian", langs: ["ja", "zh", "ko", "hi", "th", "vi", "id"] },
  { name: "Nordic", langs: ["sv", "fi", "no", "da"] },
  { name: "European", langs: ["cs", "ro", "hu", "uk"] },
];
