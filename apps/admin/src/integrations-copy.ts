export type IntegrationLocale = "en" | "ka" | "ru" | "he";
export type IntegrationId = "email" | "translation" | "storage" | "sms" | "fx";

const en = {
  fieldKey: "API key",
  fieldSender: "Sender email address",
  fieldUrl: "Service URL",
  fieldAccount: "Cloudflare account ID",
  fieldAccess: "Access key ID",
  fieldSecret: "Secret access key",
  fieldBucket: "Bucket name",
  needs: "What you’ll need",
  needsNote:
    "Access to the provider account and help from the person who manages Aura’s server.",
  settingNames: "Server setting names",
  afterSetup: "After setup: use this service",
  useEmail:
    "Open People & leave → Invite teammate. Your colleague receives an activation link to set their password. For an existing account, use Forgot password on the sign-in screen.",
  useTranslation:
    "Open Website, choose a section and the target content language, then select Translate section for review. Review the suggestions, apply the ones you want, and save the section.",
  useStorage:
    "Use Upload image in Website or the upload controls in Projects and team profiles. In a lead, add private supporting documents using its attachment controls.",
  useSms:
    "Verification codes are sent automatically when a website inquiry needs phone verification. The visitor enters the code on the website; there is no manual send button in the CRM.",
  useFx:
    "Open Settings → USD to GEL exchange rate to enter a verified rate for a signing date. Sales use that date’s rate and keep the saved conversion after signing.",
  title: "Integrations",
  intro:
    "Review the services behind your workspace and follow the steps to finish their setup.",
  refresh: "Refresh status",
  loading: "Loading integrations…",
  unavailable:
    "Integration status could not be loaded. Check your connection and try again.",
  retry: "Try again",
  configured: "Configured",
  missing: "Setup needed",
  incomplete: "Missing or invalid fields",
  development: "Local demo",
  checkError: "Check failed",
  configuredNote:
    "Server settings are present. Provider access is not yet verified.",
  missingNote: "Add the required server settings to enable this service.",
  incompleteNote: "Review the missing or invalid server settings.",
  developmentNote:
    "A local demo adapter is active. A live provider is not connected.",
  checkErrorNote:
    "The latest check could not finish. Open the setup guide to retry.",
  summary: "Service setup",
  attention: "Need setup",
  managed: "Managed on server",
  managedNote:
    "Your technical administrator manages credentials on the server. This page shows setting names and status only.",
  review: "Review setup",
  provider: "Provider",
  guide: "Setup guide",
  instructions: "Prepare your provider",
  requirements: "Add server settings",
  requirementsNote:
    "Ask your technical administrator to configure these environment settings and restart the API. Their values are never shown here.",
  present: "Present",
  notSet: "Missing",
  optional: "Optional",
  checkHeading: "Check the configuration",
  checkNote:
    "This checks the required server settings. It does not verify provider access, billing or live delivery, and sends no messages or files.",
  check: "Check configuration",
  checking: "Checking…",
  checkPassed: "Configuration looks complete",
  checkIncomplete: "Some settings need attention",
  checkMissing: "The service is not configured yet",
  checkDevelopment: "Local demo mode is active",
  checkFailed:
    "The check could not finish. Check your connection, then try again.",
  checkDenied:
    "Only the owner can review integration settings. Sign in with the owner account.",
  checkLimited: "Too many checks. Wait a minute and try again.",
  lastChecked: "Checked",
  unverified: "Live connection unverified",
  valid: "Valid",
  fix: "Needs attention",
  docs: "Official guides",
  docsDomain: "Verify a sending domain",
  docsKey: "Create an API key",
  docsAuth: "API authentication",
  docsBucket: "Create an R2 bucket",
  docsToken: "Create an R2 access token",
  docsProvider: "Provider documentation",
  future: "Planned services",
  futureNote:
    "Messaging channels and calling will be added in a later phase. They are not connected to this workspace yet.",
  futureChannels:
    "WhatsApp · Gmail · Facebook · Instagram · Telegram · Calling",
  fxManual:
    "You can also enter verified exchange rates for each signing date in Settings.",
  settings: "Open Settings",
  webhookInstruction:
    "Ask your technical administrator to prepare a compatible relay for this service and confirm its request format and authentication.",
  senderRule:
    "Use a valid sending email address and verify its domain in Resend.",
  keyRule: "Add a valid server API key without hidden control characters.",
  urlRule:
    "Use an HTTP(S) relay URL without a username or password in the URL.",
  accountRule: "Use the 32-character Cloudflare account ID.",
  bucketRule: "Use a valid S3-compatible bucket name.",
  r2Rule: "Complete this R2 setting without hidden control characters.",
  serviceEmail: "Staff email",
  purposeEmail: "Account invitations and password recovery.",
  prepareEmail:
    "Verify your sending domain in Resend. Create an API key with permission to send from that domain.",
  serviceTranslation: "AI translation",
  purposeTranslation:
    "Translate website content into the four supported languages.",
  prepareTranslation:
    "Create an OpenRouter API key and set a spending limit in the provider account. Review translated content before publishing.",
  prepareOpenai:
    "Create an OpenAI API key in the account that will handle translations. Set usage limits and review translations before publishing.",
  serviceStorage: "Media & documents",
  purposeStorage: "Store website images and private CRM attachments.",
  prepareStorage:
    "Create a private Cloudflare R2 bucket and an access token scoped to that bucket. Keep CRM documents private.",
  serviceSms: "Phone verification",
  purposeSms:
    "Send verification codes for website inquiries that require them.",
  prepareSms:
    "Choose an SMS provider with your technical administrator and connect it through a compatible server relay. Confirm sender rules and delivery coverage.",
  serviceFx: "Exchange rates",
  purposeFx:
    "Supply verified exchange rates for currency conversion and sales.",
  prepareFx:
    "Ask your technical administrator to connect a compatible exchange-rate source that supports the required currencies and signing dates.",
  relay: "Server relay",
  smsProvider: "SMS relay",
  fxProvider: "Exchange-rate relay",
};
type Copy = typeof en;
const ka: Copy = {
  fieldKey: "API გასაღები",
  fieldSender: "გამგზავნის ელფოსტა",
  fieldUrl: "სერვისის ბმული",
  fieldAccount: "Cloudflare-ის ანგარიშის ID",
  fieldAccess: "წვდომის გასაღების ID",
  fieldSecret: "საიდუმლო წვდომის გასაღები",
  fieldBucket: "საცავის სახელი",
  needs: "რა დაგჭირდებათ",
  needsNote:
    "წვდომა პროვაიდერის ანგარიშზე და იმ პირის დახმარება, რომელიც Aura-ს სერვერს მართავს.",
  settingNames: "სერვერის პარამეტრების სახელები",
  afterSetup: "გამართვის შემდეგ: სერვისის გამოყენება",
  useEmail:
    "გახსენით „გუნდი და შვებულება“ → „თანამშრომლის მოწვევა“. თანამშრომელი მიიღებს აქტივაციის ბმულს პაროლის შესაქმნელად. არსებული ანგარიშისთვის გამოიყენეთ პაროლის აღდგენა შესვლის ეკრანზე.",
  useTranslation:
    "გახსენით „ვებსაიტი“, აირჩიეთ სექცია და სამიზნე ენა, შემდეგ სექციის თარგმნა გადასახედად. შეამოწმეთ შემოთავაზებები, გამოიყენეთ სასურველი ტექსტები და შეინახეთ სექცია.",
  useStorage:
    "გამოიყენეთ სურათის ატვირთვა „ვებსაიტში“ ან ატვირთვის ღილაკები „პროექტებსა“ და გუნდის პროფილებში. ლიდში პირადი დოკუმენტები დაამატეთ დანართების საშუალებით.",
  useSms:
    "კოდები ავტომატურად იგზავნება, როცა ვებსაიტის მოთხოვნა ტელეფონის დადასტურებას საჭიროებს. ვიზიტორი კოდს საიტზე შეიყვანს; CRM-იდან ხელით გაგზავნა არ არის საჭირო.",
  useFx:
    "გახსენით „პარამეტრები“ → „USD / GEL გაცვლითი კურსი“ და შეიყვანეთ დადასტურებული კურსი ხელმოწერის თარიღისთვის. გაყიდვა იყენებს ამ თარიღის კურსს და ინარჩუნებს შენახულ კონვერტაციას.",
  title: "ინტეგრაციები",
  intro:
    "შეამოწმეთ სამუშაო სივრცის სერვისები და მიჰყევით მათი გამართვის ნაბიჯებს.",
  refresh: "სტატუსის განახლება",
  loading: "ინტეგრაციები იტვირთება…",
  unavailable:
    "ინტეგრაციების სტატუსი ვერ ჩაიტვირთა. შეამოწმეთ კავშირი და სცადეთ ხელახლა.",
  retry: "ხელახლა ცდა",
  configured: "გამართულია",
  missing: "საჭიროა გამართვა",
  incomplete: "აკლია ან არასწორია პარამეტრები",
  development: "ლოკალური დემო",
  checkError: "შემოწმება ვერ დასრულდა",
  configuredNote:
    "სერვერის პარამეტრები შევსებულია. პროვაიდერთან წვდომა ჯერ არ შემოწმებულა.",
  missingNote: "სერვისის ჩასართავად დაამატეთ სერვერის აუცილებელი პარამეტრები.",
  incompleteNote: "შეამოწმეთ გამოტოვებული ან არასწორი პარამეტრები.",
  developmentNote:
    "აქტიურია ლოკალური დემო ადაპტერი. რეალური პროვაიდერი არ არის დაკავშირებული.",
  checkErrorNote:
    "ბოლო შემოწმება ვერ დასრულდა. გასამეორებლად გახსენით გამართვის გზამკვლევი.",
  summary: "სერვისების გამართვა",
  attention: "საჭიროებს გამართვას",
  managed: "იმართება სერვერზე",
  managedNote:
    "წვდომის მონაცემებს სერვერზე ტექნიკური ადმინისტრატორი მართავს. აქ ჩანს მხოლოდ პარამეტრების სახელები და სტატუსი.",
  review: "გამართვის ნახვა",
  provider: "პროვაიდერი",
  guide: "გამართვის გზამკვლევი",
  instructions: "მოამზადეთ პროვაიდერი",
  requirements: "დაამატეთ სერვერის პარამეტრები",
  requirementsNote:
    "სთხოვეთ ტექნიკურ ადმინისტრატორს ამ გარემოს პარამეტრების შევსება და API-ის გადატვირთვა. მათი მნიშვნელობები აქ არასდროს ჩანს.",
  present: "შევსებულია",
  notSet: "აკლია",
  optional: "არასავალდებულო",
  checkHeading: "შეამოწმეთ კონფიგურაცია",
  checkNote:
    "მოწმდება სერვერის აუცილებელი პარამეტრები. პროვაიდერთან წვდომა, ბილინგი და რეალური მიწოდება არ მოწმდება; წერილები და ფაილები არ იგზავნება.",
  check: "კონფიგურაციის შემოწმება",
  checking: "მოწმდება…",
  checkPassed: "კონფიგურაცია სრულად გამოიყურება",
  checkIncomplete: "ზოგი პარამეტრი საჭიროებს ყურადღებას",
  checkMissing: "სერვისი ჯერ არ არის გამართული",
  checkDevelopment: "აქტიურია ლოკალური დემო რეჟიმი",
  checkFailed: "შემოწმება ვერ დასრულდა. შეამოწმეთ კავშირი და სცადეთ ხელახლა.",
  checkDenied:
    "ინტეგრაციების პარამეტრების ნახვა მხოლოდ მფლობელს შეუძლია. შედით მფლობელის ანგარიშით.",
  checkLimited:
    "ძალიან ბევრი შემოწმებაა. მოიცადეთ ერთი წუთი და სცადეთ ხელახლა.",
  lastChecked: "შემოწმდა",
  unverified: "რეალური კავშირი არ შემოწმებულა",
  valid: "სწორია",
  fix: "საჭიროებს ყურადღებას",
  docs: "ოფიციალური გზამკვლევები",
  docsDomain: "გამგზავნი დომენის დადასტურება",
  docsKey: "API გასაღების შექმნა",
  docsAuth: "API ავთენტიფიკაცია",
  docsBucket: "R2 საცავის შექმნა",
  docsToken: "R2 წვდომის ტოკენის შექმნა",
  docsProvider: "პროვაიდერის დოკუმენტაცია",
  future: "დაგეგმილი სერვისები",
  futureNote:
    "მიმოწერის არხები და ზარები დაემატება შემდეგ ეტაპზე. ისინი ჯერ არ არის დაკავშირებული ამ სამუშაო სივრცესთან.",
  futureChannels: "WhatsApp · Gmail · Facebook · Instagram · Telegram · ზარები",
  fxManual:
    "ხელმოწერის თითოეული თარიღისთვის დადასტურებული კურსის შეყვანა პარამეტრებშიც შეგიძლიათ.",
  settings: "პარამეტრების გახსნა",
  webhookInstruction:
    "სთხოვეთ ტექნიკურ ადმინისტრატორს ამ სერვისისთვის თავსებადი შუამავალი სერვისის მომზადება და მოთხოვნის ფორმატისა და ავთენტიფიკაციის შემოწმება.",
  senderRule:
    "გამოიყენეთ სწორი გამგზავნის ელფოსტა და დაადასტურეთ მისი დომენი Resend-ში.",
  keyRule:
    "დაამატეთ სერვერის სწორი API გასაღები ფარული საკონტროლო სიმბოლოების გარეშე.",
  urlRule:
    "გამოიყენეთ HTTP(S) ბმული, რომელშიც მომხმარებლის სახელი ან პაროლი არ არის ჩასმული.",
  accountRule: "გამოიყენეთ Cloudflare-ის ანგარიშის 32-სიმბოლოიანი ID.",
  bucketRule: "გამოიყენეთ S3-თან თავსებადი საცავის სწორი სახელი.",
  r2Rule: "შეავსეთ R2-ის ეს პარამეტრი ფარული საკონტროლო სიმბოლოების გარეშე.",
  serviceEmail: "გუნდის ელფოსტა",
  purposeEmail: "ანგარიშის მოწვევები და პაროლის აღდგენა.",
  prepareEmail:
    "დაადასტურეთ გამგზავნი დომენი Resend-ში. შექმენით API გასაღები ამ დომენიდან გაგზავნის უფლებით.",
  serviceTranslation: "AI თარგმანი",
  purposeTranslation: "ვებსაიტის ტექსტების თარგმნა ოთხ მხარდაჭერილ ენაზე.",
  prepareTranslation:
    "შექმენით OpenRouter-ის API გასაღები და დააყენეთ ხარჯვის ლიმიტი პროვაიდერის ანგარიშში. გამოქვეყნებამდე გადახედეთ თარგმანებს.",
  prepareOpenai:
    "შექმენით OpenAI-ის API გასაღები თარგმანისთვის განკუთვნილ ანგარიშში. დააყენეთ გამოყენების ლიმიტები და გამოქვეყნებამდე გადახედეთ თარგმანებს.",
  serviceStorage: "მედია და დოკუმენტები",
  purposeStorage: "ვებსაიტის სურათებისა და CRM-ის პირადი დანართების შენახვა.",
  prepareStorage:
    "შექმენით პირადი Cloudflare R2 საცავი და მხოლოდ ამ საცავზე წვდომის ტოკენი. CRM-ის დოკუმენტები პირადი უნდა დარჩეს.",
  serviceSms: "ტელეფონის დადასტურება",
  purposeSms:
    "ვებსაიტის მოთხოვნებისთვის საჭირო დამადასტურებელი კოდების გაგზავნა.",
  prepareSms:
    "ტექნიკურ ადმინისტრატორთან ერთად აირჩიეთ SMS პროვაიდერი და დააკავშირეთ თავსებადი შუამავალი სერვისით. შეამოწმეთ გამგზავნის წესები და დაფარვა.",
  serviceFx: "ვალუტის კურსები",
  purposeFx: "დადასტურებული კურსები კონვერტაციისა და გაყიდვებისთვის.",
  prepareFx:
    "სთხოვეთ ტექნიკურ ადმინისტრატორს თავსებადი კურსების წყაროს დაკავშირება, რომელიც საჭირო ვალუტებსა და ხელმოწერის თარიღებს მხარს უჭერს.",
  relay: "შუამავალი სერვისი",
  smsProvider: "SMS შუამავალი",
  fxProvider: "კურსების შუამავალი",
};
const ru: Copy = {
  fieldKey: "API-ключ",
  fieldSender: "Адрес отправителя",
  fieldUrl: "Адрес сервиса",
  fieldAccount: "ID аккаунта Cloudflare",
  fieldAccess: "ID ключа доступа",
  fieldSecret: "Секретный ключ доступа",
  fieldBucket: "Название бакета",
  needs: "Что понадобится",
  needsNote:
    "Доступ к аккаунту провайдера и помощь человека, который управляет сервером Aura.",
  settingNames: "Названия настроек сервера",
  afterSetup: "После настройки: использование сервиса",
  useEmail:
    "Откройте «Команда и отпуск» → «Пригласить сотрудника». Коллега получит ссылку активации для создания пароля. Для существующего аккаунта используйте восстановление пароля на экране входа.",
  useTranslation:
    "Откройте «Веб-сайт», выберите раздел и язык перевода, затем «Перевести раздел для проверки». Проверьте предложения, примените нужные и сохраните раздел.",
  useStorage:
    "Используйте загрузку изображений в разделе «Веб-сайт» или элементы загрузки в «Проектах» и профилях команды. В карточке лида добавляйте приватные документы через вложения.",
  useSms:
    "Коды отправляются автоматически, когда заявка сайта требует подтверждения телефона. Посетитель вводит код на сайте; вручную отправлять его из CRM не нужно.",
  useFx:
    "Откройте «Настройки» → «Курс USD к GEL» и введите проверенный курс для даты подписания. Продажи используют курс этой даты и сохраняют рассчитанную конвертацию.",
  title: "Интеграции",
  intro:
    "Проверьте сервисы рабочего пространства и выполните шаги для завершения настройки.",
  refresh: "Обновить статус",
  loading: "Загрузка интеграций…",
  unavailable:
    "Не удалось загрузить статус интеграций. Проверьте соединение и повторите попытку.",
  retry: "Повторить",
  configured: "Настроено",
  missing: "Нужна настройка",
  incomplete: "Пропущены или неверны поля",
  development: "Локальное демо",
  checkError: "Ошибка проверки",
  configuredNote:
    "Настройки сервера заполнены. Доступ к провайдеру ещё не проверен.",
  missingNote: "Добавьте обязательные настройки сервера для включения сервиса.",
  incompleteNote: "Проверьте пропущенные или неверные настройки сервера.",
  developmentNote:
    "Активен локальный демоадаптер. Реальный провайдер не подключён.",
  checkErrorNote:
    "Последняя проверка не завершилась. Откройте руководство для повторной попытки.",
  summary: "Настройка сервисов",
  attention: "Нужна настройка",
  managed: "Управляется на сервере",
  managedNote:
    "Учётными данными на сервере управляет технический администратор. Здесь видны только названия настроек и статус.",
  review: "Проверить настройку",
  provider: "Провайдер",
  guide: "Руководство по настройке",
  instructions: "Подготовьте провайдера",
  requirements: "Добавьте настройки сервера",
  requirementsNote:
    "Попросите технического администратора задать эти переменные окружения и перезапустить API. Их значения здесь не отображаются.",
  present: "Заполнено",
  notSet: "Отсутствует",
  optional: "Необязательно",
  checkHeading: "Проверьте конфигурацию",
  checkNote:
    "Проверяются обязательные настройки сервера. Доступ к провайдеру, оплата и реальная доставка не проверяются. Сообщения и файлы не отправляются.",
  check: "Проверить конфигурацию",
  checking: "Проверка…",
  checkPassed: "Конфигурация выглядит полной",
  checkIncomplete: "Некоторые настройки требуют внимания",
  checkMissing: "Сервис ещё не настроен",
  checkDevelopment: "Активен локальный деморежим",
  checkFailed:
    "Проверка не завершилась. Проверьте соединение и повторите попытку.",
  checkDenied:
    "Настройки интеграций доступны только владельцу. Войдите под учётной записью владельца.",
  checkLimited: "Слишком много проверок. Подождите минуту и повторите попытку.",
  lastChecked: "Проверено",
  unverified: "Рабочее подключение не проверено",
  valid: "Верно",
  fix: "Требует внимания",
  docs: "Официальные руководства",
  docsDomain: "Подтверждение домена отправителя",
  docsKey: "Создание API-ключа",
  docsAuth: "Аутентификация API",
  docsBucket: "Создание бакета R2",
  docsToken: "Создание токена доступа R2",
  docsProvider: "Документация провайдера",
  future: "Запланированные сервисы",
  futureNote:
    "Каналы переписки и звонки появятся на следующем этапе. Они ещё не подключены к этому рабочему пространству.",
  futureChannels: "WhatsApp · Gmail · Facebook · Instagram · Telegram · Звонки",
  fxManual:
    "Проверенные курсы для каждой даты подписания также можно ввести в Настройках.",
  settings: "Открыть Настройки",
  webhookInstruction:
    "Попросите технического администратора подготовить совместимый промежуточный сервис и проверить формат запросов и аутентификацию.",
  senderRule:
    "Укажите корректный адрес отправителя и подтвердите его домен в Resend.",
  keyRule:
    "Добавьте корректный серверный API-ключ без скрытых управляющих символов.",
  urlRule:
    "Используйте HTTP(S)-адрес без имени пользователя или пароля внутри URL.",
  accountRule: "Используйте 32-значный идентификатор аккаунта Cloudflare.",
  bucketRule: "Используйте корректное имя бакета, совместимое с S3.",
  r2Rule: "Заполните эту настройку R2 без скрытых управляющих символов.",
  serviceEmail: "Почта сотрудников",
  purposeEmail: "Приглашения в аккаунт и восстановление пароля.",
  prepareEmail:
    "Подтвердите домен отправителя в Resend. Создайте API-ключ с правом отправки с этого домена.",
  serviceTranslation: "ИИ-перевод",
  purposeTranslation: "Перевод контента сайта на четыре поддерживаемых языка.",
  prepareTranslation:
    "Создайте API-ключ OpenRouter и задайте лимит расходов в аккаунте провайдера. Проверяйте переводы перед публикацией.",
  prepareOpenai:
    "Создайте API-ключ OpenAI в аккаунте для переводов. Установите лимиты использования и проверяйте переводы перед публикацией.",
  serviceStorage: "Медиа и документы",
  purposeStorage: "Хранение изображений сайта и приватных вложений CRM.",
  prepareStorage:
    "Создайте приватный бакет Cloudflare R2 и токен доступа только к нему. Документы CRM должны оставаться приватными.",
  serviceSms: "Подтверждение телефона",
  purposeSms: "Коды подтверждения для заявок сайта, где они необходимы.",
  prepareSms:
    "Выберите SMS-провайдера с техническим администратором и подключите совместимый промежуточный сервис. Проверьте правила отправителя и покрытие доставки.",
  serviceFx: "Курсы валют",
  purposeFx: "Проверенные курсы для конвертации валют и продаж.",
  prepareFx:
    "Попросите технического администратора подключить совместимый источник курсов с поддержкой нужных валют и дат подписания.",
  relay: "Промежуточный сервис",
  smsProvider: "SMS-сервис",
  fxProvider: "Источник курсов",
};
const he: Copy = {
  fieldKey: "מפתח API",
  fieldSender: "כתובת הדוא״ל של השולח",
  fieldUrl: "כתובת השירות",
  fieldAccount: "מזהה חשבון Cloudflare",
  fieldAccess: "מזהה מפתח גישה",
  fieldSecret: "מפתח גישה סודי",
  fieldBucket: "שם המאגר",
  needs: "מה נדרש",
  needsNote: "גישה לחשבון הספק ועזרה מהאדם שמנהל את השרת של Aura.",
  settingNames: "שמות הגדרות השרת",
  afterSetup: "לאחר ההגדרה: שימוש בשירות",
  useEmail:
    "פתחו צוות וחופשות ← הזמנת חבר צוות. העמית יקבל קישור הפעלה ליצירת סיסמה. לחשבון קיים, השתמשו בשחזור סיסמה במסך הכניסה.",
  useTranslation:
    "פתחו אתר, בחרו מקטע ושפת יעד, ואז תרגום מקטע לבדיקה. בדקו את ההצעות, החילו את הרצויות ושמרו את המקטע.",
  useStorage:
    "השתמשו בהעלאת תמונה באתר או בבקרות ההעלאה בפרויקטים ובפרופילי הצוות. בכרטיס ליד, הוסיפו מסמכים פרטיים באמצעות בקרות הקבצים המצורפים.",
  useSms:
    "קודים נשלחים אוטומטית כאשר פניית אתר דורשת אימות טלפון. המבקר מזין את הקוד באתר; אין צורך לשלוח אותו ידנית מה-CRM.",
  useFx:
    "פתחו הגדרות ← שער דולר ללאירי והזינו שער מאומת לתאריך החתימה. המכירות משתמשות בשער של אותו תאריך ושומרות את ההמרה שנרשמה.",
  title: "אינטגרציות",
  intro: "בדקו את שירותי סביבת העבודה ובצעו את השלבים להשלמת ההגדרה.",
  refresh: "רענון מצב",
  loading: "טוען אינטגרציות…",
  unavailable: "לא ניתן לטעון את מצב האינטגרציות. בדקו את החיבור ונסו שוב.",
  retry: "ניסיון נוסף",
  configured: "מוגדר",
  missing: "נדרשת הגדרה",
  incomplete: "שדות חסרים או שגויים",
  development: "הדגמה מקומית",
  checkError: "הבדיקה נכשלה",
  configuredNote: "הגדרות השרת קיימות. הגישה לספק עדיין לא אומתה.",
  missingNote: "הוסיפו את הגדרות השרת הנדרשות להפעלת השירות.",
  incompleteNote: "בדקו את הגדרות השרת החסרות או השגויות.",
  developmentNote: "מתאם הדגמה מקומי פעיל. אין חיבור לספק אמיתי.",
  checkErrorNote:
    "הבדיקה האחרונה לא הסתיימה. פתחו את מדריך ההגדרה כדי לנסות שוב.",
  summary: "הגדרת שירותים",
  attention: "דורשים הגדרה",
  managed: "מנוהל בשרת",
  managedNote:
    "מנהל המערכת הטכני מנהל את פרטי הגישה בשרת. כאן מוצגים רק שמות ההגדרות והמצב.",
  review: "סקירת ההגדרה",
  provider: "ספק",
  guide: "מדריך הגדרה",
  instructions: "הכנת הספק",
  requirements: "הוספת הגדרות שרת",
  requirementsNote:
    "בקשו ממנהל המערכת הטכני להגדיר את משתני הסביבה האלה ולהפעיל מחדש את ה-API. הערכים שלהם אינם מוצגים כאן.",
  present: "קיים",
  notSet: "חסר",
  optional: "רשות",
  checkHeading: "בדיקת התצורה",
  checkNote:
    "הבדיקה בוחנת את הגדרות השרת הנדרשות. היא אינה מאמתת גישה לספק, חיוב או מסירה בפועל, ואינה שולחת הודעות או קבצים.",
  check: "בדיקת תצורה",
  checking: "בודק…",
  checkPassed: "התצורה נראית מלאה",
  checkIncomplete: "חלק מההגדרות דורשות טיפול",
  checkMissing: "השירות עדיין אינו מוגדר",
  checkDevelopment: "מצב הדגמה מקומית פעיל",
  checkFailed: "הבדיקה לא הסתיימה. בדקו את החיבור ונסו שוב.",
  checkDenied:
    "רק הבעלים יכולים לסקור הגדרות אינטגרציה. התחברו עם חשבון הבעלים.",
  checkLimited: "בוצעו יותר מדי בדיקות. המתינו דקה ונסו שוב.",
  lastChecked: "נבדק",
  unverified: "החיבור בפועל טרם אומת",
  valid: "תקין",
  fix: "דורש טיפול",
  docs: "מדריכים רשמיים",
  docsDomain: "אימות דומיין שליחה",
  docsKey: "יצירת מפתח API",
  docsAuth: "אימות API",
  docsBucket: "יצירת מאגר R2",
  docsToken: "יצירת אסימון גישה ל-R2",
  docsProvider: "תיעוד הספק",
  future: "שירותים מתוכננים",
  futureNote:
    "ערוצי הודעות ושיחות יתווספו בשלב מאוחר יותר. הם עדיין אינם מחוברים לסביבת העבודה.",
  futureChannels: "WhatsApp · Gmail · Facebook · Instagram · Telegram · שיחות",
  fxManual: "ניתן גם להזין בהגדרות שערי חליפין מאומתים לכל תאריך חתימה.",
  settings: "פתיחת הגדרות",
  webhookInstruction:
    "בקשו ממנהל המערכת הטכני להכין שירות מתווך תואם ולוודא את פורמט הבקשות ואת האימות.",
  senderRule: "השתמשו בכתובת דוא״ל תקינה לשולח ואמתו את הדומיין שלה ב-Resend.",
  keyRule: "הוסיפו מפתח API תקין בשרת ללא תווי בקרה נסתרים.",
  urlRule: "השתמשו בכתובת HTTP(S) ללא שם משתמש או סיסמה בתוך הכתובת.",
  accountRule: "השתמשו במזהה חשבון Cloudflare בן 32 תווים.",
  bucketRule: "השתמשו בשם מאגר תקין התואם ל-S3.",
  r2Rule: "השלימו את הגדרת R2 הזאת ללא תווי בקרה נסתרים.",
  serviceEmail: "דוא״ל לצוות",
  purposeEmail: "הזמנות לחשבון ושחזור סיסמה.",
  prepareEmail:
    "אמתו את דומיין השליחה ב-Resend. צרו מפתח API עם הרשאה לשלוח מהדומיין הזה.",
  serviceTranslation: "תרגום בעזרת AI",
  purposeTranslation: "תרגום תוכן האתר לארבע השפות הנתמכות.",
  prepareTranslation:
    "צרו מפתח API של OpenRouter והגדירו מגבלת הוצאה בחשבון הספק. בדקו את התרגומים לפני הפרסום.",
  prepareOpenai:
    "צרו מפתח API של OpenAI בחשבון שישמש לתרגומים. הגדירו מגבלות שימוש ובדקו תרגומים לפני הפרסום.",
  serviceStorage: "מדיה ומסמכים",
  purposeStorage: "אחסון תמונות האתר וקבצים פרטיים של ה-CRM.",
  prepareStorage:
    "צרו מאגר פרטי ב-Cloudflare R2 ואסימון גישה המוגבל אליו. שמרו על מסמכי ה-CRM פרטיים.",
  serviceSms: "אימות טלפון",
  purposeSms: "שליחת קודי אימות לפניות אתר שדורשות אותם.",
  prepareSms:
    "בחרו ספק SMS עם מנהל המערכת הטכני וחברו אותו באמצעות שירות מתווך תואם. בדקו את כללי השולח ואת כיסוי המסירה.",
  serviceFx: "שערי חליפין",
  purposeFx: "שערי חליפין מאומתים להמרת מטבע ולמכירות.",
  prepareFx:
    "בקשו ממנהל המערכת הטכני לחבר מקור שערי חליפין תואם שתומך במטבעות ובתאריכי החתימה הנדרשים.",
  relay: "שירות מתווך",
  smsProvider: "שירות SMS מתווך",
  fxProvider: "שירות שערי חליפין",
};
export const integrationCopy: Record<IntegrationLocale, Copy> = {
  en,
  ka,
  ru,
  he,
};
export function integrationLocale(): IntegrationLocale {
  const locale = localStorage.getItem("aura-admin-locale");
  return locale === "ka" || locale === "ru" || locale === "he" ? locale : "en";
}
export function integrationText(locale: IntegrationLocale, id: IntegrationId) {
  const c = integrationCopy[locale];
  return {
    email: {
      title: c.serviceEmail,
      purpose: c.purposeEmail,
      prepare: c.prepareEmail,
      use: c.useEmail,
      provider: "Resend",
    },
    translation: {
      title: c.serviceTranslation,
      purpose: c.purposeTranslation,
      prepare: c.prepareTranslation,
      use: c.useTranslation,
      provider: "OpenRouter",
    },
    storage: {
      title: c.serviceStorage,
      purpose: c.purposeStorage,
      prepare: c.prepareStorage,
      use: c.useStorage,
      provider: "Cloudflare R2",
    },
    sms: {
      title: c.serviceSms,
      purpose: c.purposeSms,
      prepare: c.prepareSms,
      use: c.useSms,
      provider: c.smsProvider,
    },
    fx: {
      title: c.serviceFx,
      purpose: c.purposeFx,
      prepare: c.prepareFx,
      use: c.useFx,
      provider: c.fxProvider,
    },
  }[id];
}
