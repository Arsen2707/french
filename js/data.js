const DICTIONARY = [
  {
    id: 'bonjour',
    word: 'bonjour',
    translation: 'здравствуйте',
    phonetic: '[bon-zhur]',
    category: 'greetings',
    categoryLabel: 'Приветствия',
    example: 'Bonjour! Comment allez-vous?',
    context: 'Универсальное приветствие днём'
  },
  {
    id: 'salut',
    word: 'salut',
    translation: 'привет',
    phonetic: '[sa-lyu]',
    category: 'greetings',
    categoryLabel: 'Приветствия',
    example: 'Salut, ca va?',
    context: 'Неформальное приветствие друзьям'
  },
  {
    id: 'bonsoir',
    word: 'bonsoir',
    translation: 'добрый вечер',
    phonetic: '[bon-swar]',
    category: 'greetings',
    categoryLabel: 'Приветствия',
    example: 'Bonsoir, madame.',
    context: 'Приветствие после заката'
  },
  {
    id: 'merci',
    word: 'merci',
    translation: 'спасибо',
    phonetic: '[mer-si]',
    category: 'greetings',
    categoryLabel: 'Приветствия',
    example: 'Merci beaucoup!',
    context: 'Базовая благодарность'
  },
  {
    id: 'au-revoir',
    word: 'au revoir',
    translation: 'до свидания',
    phonetic: '[o re-vwar]',
    category: 'greetings',
    categoryLabel: 'Приветствия',
    example: 'Au revoir, a demain!',
    context: 'Прощание до следующей встречи'
  },
  {
    id: 'oui',
    word: 'oui',
    translation: 'да',
    phonetic: '[wi]',
    category: 'basics',
    categoryLabel: 'Основы',
    example: 'Oui, bien sur.',
    context: 'Утвердительный ответ'
  },
  {
    id: 'non',
    word: 'non',
    translation: 'нет',
    phonetic: '[non]',
    category: 'basics',
    categoryLabel: 'Основы',
    example: 'Non, merci.',
    context: 'Отрицательный ответ'
  },
  {
    id: 'sil-vous-plait',
    word: "s'il vous plait",
    translation: 'пожалуйста',
    phonetic: '[sil vu ple]',
    category: 'basics',
    categoryLabel: 'Основы',
    example: "Un cafe, s'il vous plait.",
    context: 'Вежливая просьба'
  },
  {
    id: 'excusez-moi',
    word: 'excusez-moi',
    translation: 'извините',
    phonetic: '[ek-sku-ze mwa]',
    category: 'basics',
    categoryLabel: 'Основы',
    example: 'Excusez-moi, ou est la gare?',
    context: 'Извинение или привлечение внимания'
  },
  {
    id: 'comment',
    word: 'comment',
    translation: 'как',
    phonetic: '[ko-man]',
    category: 'basics',
    categoryLabel: 'Основы',
    example: "Comment ca s'appelle?",
    context: 'Вопросительное слово'
  },
  {
    id: 'eau',
    word: 'eau',
    translation: 'вода',
    phonetic: '[o]',
    category: 'food',
    categoryLabel: 'Еда и напитки',
    example: "Une bouteille d'eau, s'il vous plait.",
    context: 'Самый частый напиток в кафе'
  },
  {
    id: 'pain',
    word: 'pain',
    translation: 'хлеб',
    phonetic: '[pen]',
    category: 'food',
    categoryLabel: 'Еда и напитки',
    example: 'Du pain frais, merci.',
    context: 'Символ французской кухни'
  },
  {
    id: 'fromage',
    word: 'fromage',
    translation: 'сыр',
    phonetic: '[fro-mazh]',
    category: 'food',
    categoryLabel: 'Еда и напитки',
    example: "J'adore le fromage francais.",
    context: 'Во Франции сотни сортов сыра'
  },
  {
    id: 'cafe',
    word: 'cafe',
    translation: 'кофе',
    phonetic: '[ka-fe]',
    category: 'food',
    categoryLabel: 'Еда и напитки',
    example: "Un cafe au lait, s'il vous plait.",
    context: 'Утренний ритуал парижан'
  },
  {
    id: 'vin',
    word: 'vin',
    translation: 'вино',
    phonetic: '[ven]',
    category: 'food',
    categoryLabel: 'Еда и напитки',
    example: 'Un verre de vin rouge.',
    context: 'Часть культуры застолья'
  },
  {
    id: 'maison',
    word: 'maison',
    translation: 'дом',
    phonetic: '[me-zon]',
    category: 'home',
    categoryLabel: 'Дом',
    example: 'Je rentre a la maison.',
    context: 'Место жительства'
  },
  {
    id: 'porte',
    word: 'porte',
    translation: 'дверь',
    phonetic: '[port]',
    category: 'home',
    categoryLabel: 'Дом',
    example: 'Ferme la porte, s\'il te plait.',
    context: 'Часть комнаты или здания'
  },
  {
    id: 'fenetre',
    word: 'fenetre',
    translation: 'окно',
    phonetic: '[fe-netr]',
    category: 'home',
    categoryLabel: 'Дом',
    example: 'Ouvre la fenetre.',
    context: 'Окно в комнате'
  },
  {
    id: 'lit',
    word: 'lit',
    translation: 'кровать',
    phonetic: '[li]',
    category: 'home',
    categoryLabel: 'Дом',
    example: 'Je vais au lit.',
    context: 'Место для сна'
  },
  {
    id: 'table',
    word: 'table',
    translation: 'стол',
    phonetic: '[tabl]',
    category: 'home',
    categoryLabel: 'Дом',
    example: 'Mets les assiettes sur la table.',
    context: 'Мебель для еды и работы'
  },
  {
    id: 'amour',
    word: 'amour',
    translation: 'любовь',
    phonetic: '[a-mur]',
    category: 'feelings',
    categoryLabel: 'Чувства',
    example: "Je t'aime — c'est de l'amour.",
    context: 'Сильное чувство привязанности'
  },
  {
    id: 'heureux',
    word: 'heureux',
    translation: 'счастливый',
    phonetic: '[o-ro]',
    category: 'feelings',
    categoryLabel: 'Чувства',
    example: "Je suis heureux aujourd'hui.",
    context: 'Положительная эмоция'
  },
  {
    id: 'triste',
    word: 'triste',
    translation: 'грустный',
    phonetic: '[trist]',
    category: 'feelings',
    categoryLabel: 'Чувства',
    example: "Elle a l'air triste.",
    context: 'Печальное настроение'
  },
  {
    id: 'fatigue',
    word: 'fatigue',
    translation: 'уставший',
    phonetic: '[fa-ti-ge]',
    category: 'feelings',
    categoryLabel: 'Чувства',
    example: 'Je suis fatigue apres le travail.',
    context: 'Состояние усталости'
  },
  {
    id: 'content',
    word: 'content',
    translation: 'довольный',
    phonetic: '[kon-tan]',
    category: 'feelings',
    categoryLabel: 'Чувства',
    example: 'Je suis content de te voir.',
    context: 'Радость от ситуации'
  },
  {
    id: 'ville',
    word: 'ville',
    translation: 'город',
    phonetic: '[vil]',
    category: 'city',
    categoryLabel: 'Город',
    example: 'Paris est une belle ville.',
    context: 'Населённый пункт'
  },
  {
    id: 'rue',
    word: 'rue',
    translation: 'улица',
    phonetic: '[ryu]',
    category: 'city',
    categoryLabel: 'Город',
    example: "J'habite dans cette rue.",
    context: 'Городская улица'
  },
  {
    id: 'gare',
    word: 'gare',
    translation: 'вокзал',
    phonetic: '[gar]',
    category: 'city',
    categoryLabel: 'Город',
    example: "Ou est la gare, s'il vous plait?",
    context: 'Железнодорожная станция'
  },
  {
    id: 'metro',
    word: 'metro',
    translation: 'метро',
    phonetic: '[me-tro]',
    category: 'city',
    categoryLabel: 'Город',
    example: 'Prends le metro ligne 1.',
    context: 'Подземный транспорт'
  },
  {
    id: 'magasin',
    word: 'magasin',
    translation: 'магазин',
    phonetic: '[ma-ga-zen]',
    category: 'city',
    categoryLabel: 'Город',
    example: 'Le magasin ferme a 20 h.',
    context: 'Место покупок'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'greetings', label: 'Приветствия' },
  { id: 'basics', label: 'Основы' },
  { id: 'food', label: 'Еда' },
  { id: 'home', label: 'Дом' },
  { id: 'feelings', label: 'Чувства' },
  { id: 'city', label: 'Город' }
];

const DAILY_TASKS = [
  { id: 'learn', label: 'Выучить 5 слов', icon: '📚', target: 5 },
  { id: 'test', label: 'Пройти тест', icon: '✅', target: 1 },
  { id: 'tap', label: 'Набрать 100 в игре', icon: '⚡', target: 100 }
];
