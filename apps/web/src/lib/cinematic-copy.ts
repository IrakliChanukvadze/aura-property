import type { Locale } from "./i18n";

export const cinematicCopy: Record<
  Locale,
  {
    navigation: string;
    welcome: string;
    collectionIntro: string;
    collectionSubline: string;
    exploreCollection: string;
    agencyTitle: string;
    agencyLink: string;
    agencyImage: string;
    together: string;
    approach: string;
    location: string;
  }
> = {
  en: {
    navigation: "Page chapters",
    welcome: "Welcome to Aura",
    collectionIntro: "Exceptional locations",
    collectionSubline: "Curated for a brighter tomorrow",
    exploreCollection: "Explore the collection",
    agencyTitle: "People before\nproperty.",
    agencyLink: "About our agency",
    agencyImage: "A quiet moment overlooking Tbilisi at sunset",
    together: "A brighter\ntomorrow,\ntogether.",
    approach: "From possibility to your place",
    location: "Tbilisi · Georgia",
  },
  ka: {
    navigation: "გვერდის სექციები",
    welcome: "კეთილი იყოს თქვენი მობრძანება აურაში",
    collectionIntro: "გამორჩეული ადგილები",
    collectionSubline: "არჩეული უკეთესი მომავლისთვის",
    exploreCollection: "კოლექციის დათვალიერება",
    agencyTitle: "პირველ რიგში —\nადამიანები.",
    agencyLink: "ჩვენი სააგენტოს შესახებ",
    agencyImage: "მშვიდი საღამო თბილისის ხედით",
    together: "უკეთესი\nმომავალი,\nერთად.",
    approach: "შესაძლებლობიდან საკუთარ სახლამდე",
    location: "თბილისი · საქართველო",
  },
  ru: {
    navigation: "Разделы страницы",
    welcome: "Добро пожаловать в Aura",
    collectionIntro: "Исключительные места",
    collectionSubline: "Выбраны для лучшего будущего",
    exploreCollection: "Открыть коллекцию",
    agencyTitle: "Люди важнее\nнедвижимости.",
    agencyLink: "О нашем агентстве",
    agencyImage: "Тихий вечер с видом на Тбилиси",
    together: "Лучшее\nбудущее,\nвместе.",
    approach: "От возможности к своему дому",
    location: "Тбилиси · Грузия",
  },
  he: {
    navigation: "פרקי העמוד",
    welcome: "ברוכים הבאים לאורה",
    collectionIntro: "מיקומים יוצאי דופן",
    collectionSubline: "נבחרו למחר טוב יותר",
    exploreCollection: "לגלות את הקולקציה",
    agencyTitle: "אנשים לפני\nנכסים.",
    agencyLink: "על הסוכנות שלנו",
    agencyImage: "רגע שקט מול הנוף של טביליסי בשקיעה",
    together: "עתיד\nבהיר יותר,\nיחד.",
    approach: "מאפשרות למקום משלכם",
    location: "טביליסי · גאורגיה",
  },
};
