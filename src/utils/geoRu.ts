import ruLocales from 'react-phone-number-input/locale/ru.json'

export type CountryOption = {
  code: string
  name: string
  emoji: string
}

export type RegionOption = {
  id: string
  name: string
  cities: string[]
}

export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  KZ: 'Казахстан',
  RU: 'Россия',
  BY: 'Беларусь',
  UZ: 'Узбекистан',
  KG: 'Кыргызстан',
  MD: 'Молдова',
  TM: 'Туркменистан',
  US: 'США',
  GB: 'Великобритания',
  AE: 'ОАЭ',
  TR: 'Турция',
  CN: 'Китай',
  KR: 'Южная Корея',
}

const TOP_COUNTRY_CODES = ['KZ', 'RU', 'BY', 'UZ', 'KG', 'AM', 'AZ', 'GE', 'MD', 'TJ', 'TM']

export const KZ_REGIONS: RegionOption[] = [
  { id: 'AST', name: 'город Астана', cities: ['Астана'] },
  { id: 'ALA', name: 'город Алматы', cities: ['Алматы'] },
  { id: 'SHY', name: 'город Шымкент', cities: ['Шымкент'] },
  {
    id: 'AKM',
    name: 'Акмолинская область',
    cities: [
      'Кокшетау',
      'Степногорск',
      'Щучинск',
      'Атбасар',
      'Акколь',
      'Макинск',
      'Ерейментау',
      'Есиль',
      'Зеренда',
      'Бурабай',
      'Аршалы',
      'Шортанды',
    ],
  },
  {
    id: 'AKT',
    name: 'Актюбинская область',
    cities: ['Актобе', 'Хромтау', 'Кандыагаш', 'Шалкар', 'Эмба', 'Алга', 'Бадамша', 'Мартук'],
  },
  {
    id: 'ALM',
    name: 'Алматинская область',
    cities: [
      'Конаев',
      'Каскелен',
      'Талгар',
      'Есик',
      'Шамалган',
      'Отеген-Батыр',
      'Боралдай',
      'Узынагаш',
      'Шелек',
      'Баканас',
    ],
  },
  {
    id: 'ABA',
    name: 'Абайская область',
    cities: ['Семей', 'Аягоз', 'Курчатов', 'Шар', 'Бородулиха', 'Урджар'],
  },
  {
    id: 'ATY',
    name: 'Атырауская область',
    cities: ['Атырау', 'Кульсары', 'Махамбет', 'Доссор', 'Макат', 'Балыкши', 'Индерборский'],
  },
  {
    id: 'VOS',
    name: 'Восточно-Казахстанская область',
    cities: ['Усть-Каменогорск', 'Риддер', 'Алтай', 'Шемонаиха', 'Глубокое', 'Серебрянск', 'Зайсан'],
  },
  {
    id: 'ZHA',
    name: 'Жамбылская область',
    cities: ['Тараз', 'Шу', 'Каратау', 'Жанатас', 'Кордай', 'Мерке', 'Байзак', 'Кулан', 'Сарыкемер'],
  },
  {
    id: 'ZHE',
    name: 'Жетысуская область',
    cities: ['Талдыкорган', 'Текели', 'Ушарал', 'Сарканд', 'Жаркент', 'Карабулак'],
  },
  {
    id: 'ZAP',
    name: 'Западно-Казахстанская область',
    cities: ['Уральск', 'Аксай', 'Зачаганск', 'Деркул', 'Чапаев', 'Перемётное'],
  },
  {
    id: 'KAR',
    name: 'Карагандинская область',
    cities: [
      'Караганда',
      'Темиртау',
      'Шахтинск',
      'Сарань',
      'Абай',
      'Балхаш',
      'Осакаровка',
      'Актас',
      'Атасу',
      'Приозёрск',
    ],
  },
  {
    id: 'KUS',
    name: 'Костанайская область',
    cities: [
      'Костанай',
      'Рудный',
      'Лисаковск',
      'Житикара',
      'Аркалык',
      'Тобыл',
      'Федоровка',
      'Кушмурун',
      'Карабалык',
    ],
  },
  {
    id: 'KZY',
    name: 'Кызылординская область',
    cities: ['Кызылорда', 'Аральск', 'Казалинск', 'Жанакорган', 'Шиели', 'Теренозек', 'Жосалы'],
  },
  {
    id: 'MAN',
    name: 'Мангистауская область',
    cities: [
      'Актау',
      'Жанаозен',
      'Бейнеу',
      'Мангистау',
      'Форт-Шевченко',
      'Баутино',
      'Шетпе',
      'Курык',
    ],
  },
  {
    id: 'PAV',
    name: 'Павлодарская область',
    cities: ['Павлодар', 'Экибастуз', 'Аксу', 'Баянаул', 'Иртышск', 'Теренколь', 'Железинка', 'Майкаин'],
  },
  {
    id: 'SEV',
    name: 'Северо-Казахстанская область',
    cities: [
      'Петропавловск',
      'Тайынша',
      'Булаево',
      'Мамлютка',
      'Сергеевка',
      'Саумалколь',
      'Бишкуль',
      'Смирново',
    ],
  },
  {
    id: 'YUZ',
    name: 'Туркестанская область',
    cities: [
      'Туркестан',
      'Кентау',
      'Арысь',
      'Сарыагаш',
      'Жетысай',
      'Ленгер',
      'Шардара',
      'Аксукент',
      'Тюлькубас',
    ],
  },
  {
    id: 'ULY',
    name: 'Улытауская область',
    cities: ['Жезказган', 'Сатпаев', 'Каражал', 'Жайрем', 'Улытау'],
  },
  { id: 'BAY', name: 'город Байконур', cities: ['Байконур'] },
]

export const RU_REGIONS: RegionOption[] = [
  { id: 'MOW', name: 'город Москва', cities: ['Москва'] },
  { id: 'SPE', name: 'город Санкт-Петербург', cities: ['Санкт-Петербург'] },
  {
    id: 'MOS',
    name: 'Московская область',
    cities: [
      'Балашиха',
      'Подольск',
      'Химки',
      'Мытищи',
      'Королёв',
      'Люберцы',
      'Красногорск',
      'Электросталь',
      'Коломна',
      'Одинцово',
      'Домодедово',
      'Серпухов',
    ],
  },
  {
    id: 'LEN',
    name: 'Ленинградская область',
    cities: ['Гатчина', 'Выборг', 'Всеволожск', 'Сосновый Бор', 'Тихвин', 'Кириши'],
  },
  {
    id: 'NVS',
    name: 'Новосибирская область',
    cities: ['Новосибирск', 'Бердск', 'Искитим'],
  },
  {
    id: 'SVE',
    name: 'Свердловская область',
    cities: ['Екатеринбург', 'Нижний Тагил', 'Каменск-Уральский', 'Первоуральск'],
  },
  {
    id: 'TAT',
    name: 'Республика Татарстан',
    cities: ['Казань', 'Набережные Челны', 'Нижнекамск', 'Альметьевск'],
  },
  {
    id: 'KDA',
    name: 'Краснодарский край',
    cities: ['Краснодар', 'Сочи', 'Новороссийск', 'Армавир', 'Анапа'],
  },
  {
    id: 'NIZ',
    name: 'Нижегородская область',
    cities: ['Нижний Новгород', 'Дзержинск', 'Арзамас'],
  },
  {
    id: 'SAM',
    name: 'Самарская область',
    cities: ['Самара', 'Тольятти', 'Сызрань'],
  },
  {
    id: 'CHE',
    name: 'Челябинская область',
    cities: ['Челябинск', 'Магнитогорск', 'Златоуст', 'Миасс'],
  },
  {
    id: 'ROS',
    name: 'Ростовская область',
    cities: ['Ростов-на-Дону', 'Таганрог', 'Шахты', 'Батайск'],
  },
  {
    id: 'BAS',
    name: 'Республика Башкортостан',
    cities: ['Уфа', 'Стерлитамак', 'Салават', 'Нефтекамск'],
  },
  { id: 'OMS', name: 'Омская область', cities: ['Омск', 'Тара'] },
  { id: 'VOR', name: 'Воронежская область', cities: ['Воронеж', 'Россошь'] },
  { id: 'PER', name: 'Пермский край', cities: ['Пермь', 'Березники', 'Соликамск'] },
  { id: 'VGG', name: 'Волгоградская область', cities: ['Волгоград', 'Волжский', 'Камышин'] },
  { id: 'KYA', name: 'Красноярский край', cities: ['Красноярск', 'Норильск', 'Ачинск'] },
  { id: 'TYU', name: 'Тюменская область', cities: ['Тюмень', 'Тобольск', 'Ишим'] },
  { id: 'SAR', name: 'Саратовская область', cities: ['Саратов', 'Энгельс', 'Балаково'] },
]

export const BY_REGIONS: RegionOption[] = [
  { id: 'MIN_CITY', name: 'город Минск', cities: ['Минск'] },
  {
    id: 'BRE',
    name: 'Брестская область',
    cities: ['Брест', 'Барановичи', 'Пинск', 'Кобрин'],
  },
  {
    id: 'VIT',
    name: 'Витебская область',
    cities: ['Витебск', 'Орша', 'Новополоцк', 'Полоцк'],
  },
  {
    id: 'GOM',
    name: 'Гомельская область',
    cities: ['Гомель', 'Мозырь', 'Жлобин', 'Светлогорск'],
  },
  {
    id: 'GRO',
    name: 'Гродненская область',
    cities: ['Гродно', 'Лида', 'Слоним', 'Волковыск'],
  },
  {
    id: 'MIN',
    name: 'Минская область',
    cities: ['Борисов', 'Солигорск', 'Молодечно', 'Жодино'],
  },
  {
    id: 'MOG',
    name: 'Могилёвская область',
    cities: ['Могилёв', 'Бобруйск', 'Горки'],
  },
]

export const UZ_REGIONS: RegionOption[] = [
  { id: 'TAS_CITY', name: 'город Ташкент', cities: ['Ташкент'] },
  { id: 'SAM', name: 'Самаркандская область', cities: ['Самарканд', 'Каттакурган'] },
  { id: 'BUK', name: 'Бухарская область', cities: ['Бухара', 'Гиждуван'] },
  { id: 'FER', name: 'Ферганская область', cities: ['Фергана', 'Коканд', 'Маргилан'] },
  { id: 'AND', name: 'Андижанская область', cities: ['Андижан', 'Асака'] },
  { id: 'NAM', name: 'Наманганская область', cities: ['Наманган', 'Чуст'] },
  { id: 'TAS', name: 'Ташкентская область', cities: ['Чирчик', 'Ангрен', 'Алмалык'] },
  { id: 'KHO', name: 'Хорезмская область', cities: ['Ургенч', 'Хива'] },
  { id: 'QR', name: 'Республика Каракалпакстан', cities: ['Нукус'] },
]

export const KG_REGIONS: RegionOption[] = [
  { id: 'BIS_CITY', name: 'город Бишкек', cities: ['Бишкек'] },
  { id: 'OSH_CITY', name: 'город Ош', cities: ['Ош'] },
  { id: 'CHUY', name: 'Чуйская область', cities: ['Токмок', 'Кант', 'Кара-Балта'] },
  { id: 'ISS', name: 'Иссык-Кульская область', cities: ['Каракол', 'Балыкчы', 'Чолпон-Ата'] },
  { id: 'JAL', name: 'Джалал-Абадская область', cities: ['Джалал-Абад', 'Таш-Кумыр'] },
  { id: 'OSH', name: 'Ошская область', cities: ['Узген', 'Кара-Суу'] },
]

const REGIONS_BY_COUNTRY: Record<string, RegionOption[]> = {
  KZ: KZ_REGIONS,
  RU: RU_REGIONS,
  BY: BY_REGIONS,
  UZ: UZ_REGIONS,
  KG: KG_REGIONS,
}

export function normalizeCityName(cityName: string): string {
  if (!cityName) return ''
  const trimmed = cityName.trim()
  const lower = trimmed.toLowerCase()

  // Replace any variant of Nur-Sultan / Нур-Султан with Астана
  if (
    lower === 'нур-султан' ||
    lower === 'нур султан' ||
    lower === 'нурсултан' ||
    lower === 'nur-sultan' ||
    lower === 'nur sultan' ||
    lower === 'nursultan' ||
    lower === 'astana'
  ) {
    return 'Астана'
  }

  return trimmed
}

export function getRussianCountries(): CountryOption[] {
  const ruMap = ruLocales as unknown as Record<string, string>
  const allCodes = Object.keys(ruMap).filter((c) => c.length === 2)

  const topCountries: CountryOption[] = TOP_COUNTRY_CODES.map((code) => {
    const name = COUNTRY_NAME_OVERRIDES[code] || ruMap[code] || code
    return {
      code,
      name,
      emoji: getFlagEmoji(code),
    }
  })

  const remainingCodes = allCodes.filter((code) => !TOP_COUNTRY_CODES.includes(code))
  const otherCountries: CountryOption[] = remainingCodes.map((code) => {
    const name = COUNTRY_NAME_OVERRIDES[code] || ruMap[code] || code
    return {
      code,
      name,
      emoji: getFlagEmoji(code),
    }
  })

  otherCountries.sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  return [...topCountries, ...otherCountries]
}

export function resolveCountryCode(input?: string): string {
  if (!input) return 'KZ'
  const trimmed = input.trim()
  if (trimmed.length === 2) return trimmed.toUpperCase()

  const lower = trimmed.toLowerCase()
  if (lower === 'kazakhstan' || lower === 'казахстан' || lower === 'kz' || lower === 'kaz') return 'KZ'
  if (lower === 'russia' || lower === 'россия' || lower === 'ru' || lower === 'rus') return 'RU'
  if (lower === 'belarus' || lower === 'беларусь' || lower === 'by' || lower === 'blr') return 'BY'
  if (lower === 'uzbekistan' || lower === 'узбекистан' || lower === 'uz' || lower === 'uzb') return 'UZ'
  if (lower === 'kyrgyzstan' || lower === 'киргизия' || lower === 'кыргызстан' || lower === 'kg' || lower === 'kgz') return 'KG'

  const ruMap = ruLocales as unknown as Record<string, string>
  for (const [code, name] of Object.entries(ruMap)) {
    if (name.toLowerCase() === lower || code.toLowerCase() === lower) {
      return code.toUpperCase()
    }
  }

  return 'KZ'
}

export function getRussianRegions(countryCode: string): RegionOption[] {
  const code = resolveCountryCode(countryCode)
  return REGIONS_BY_COUNTRY[code] || []
}

export function getCitiesForRegion(countryCode: string, regionIdOrName: string): string[] {
  if (!regionIdOrName) return []
  const regions = getRussianRegions(countryCode)
  const norm = regionIdOrName.trim().toLowerCase()
  const found = regions.find(
    (r) => r.id.toLowerCase() === norm || r.name.toLowerCase() === norm
  )
  return found ? [...found.cities] : []
}

export function findRegionForCity(countryCode: string, city: string): RegionOption | undefined {
  const normCity = normalizeCityName(city).toLowerCase()
  if (!normCity) return undefined

  const regions = getRussianRegions(countryCode)

  // Direct special cases for federal / republican cities
  if (normCity === 'астана') {
    return regions.find((r) => r.id === 'AST' || r.name.toLowerCase().includes('астана'))
  }
  if (normCity === 'алматы') {
    return regions.find((r) => r.id === 'ALA' || r.name.toLowerCase().includes('алматы'))
  }
  if (normCity === 'шымкент') {
    return regions.find((r) => r.id === 'SHY' || r.name.toLowerCase().includes('шымкент'))
  }
  if (normCity === 'байконур') {
    return regions.find((r) => r.id === 'BAY' || r.name.toLowerCase().includes('байконур'))
  }
  if (normCity === 'москва') {
    return regions.find((r) => r.id === 'MOW')
  }
  if (normCity === 'санкт-петербург') {
    return regions.find((r) => r.id === 'SPE')
  }
  if (normCity === 'минск') {
    return regions.find((r) => r.id === 'MIN_CITY')
  }
  if (normCity === 'ташкент') {
    return regions.find((r) => r.id === 'TAS_CITY')
  }
  if (normCity === 'бишкек') {
    return regions.find((r) => r.id === 'BIS_CITY')
  }

  // Search inside region cities list
  return regions.find((r) =>
    r.cities.some((c) => c.toLowerCase() === normCity || normCity.includes(c.toLowerCase()))
  )
}

