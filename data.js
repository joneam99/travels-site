const trips = [
  {
    id: 'taipei',
    city: 'TAIPEI',
    country: 'TAIWAN',
    date: '2026.04',
    period: '2026.04.10 – 04.14',
    cover: 'images/Taipei_2026_4/index_main_image/R0005329_Original.jpg',
    hero:  'images/Taipei_2026_4/index_main_image/R0005329_Original.jpg',
    photos: [
      'images/Taipei_2026_4/page_photostrip/DSC_1281.jpg',
      'images/Taipei_2026_4/page_photostrip/DSC_1282.jpg',
      'images/Taipei_2026_4/page_photostrip/DSC_1285.jpg',
      'images/Taipei_2026_4/page_photostrip/DSC_1296.jpg',
      'images/Taipei_2026_4/page_photostrip/DSC_1311.jpg',
      'images/Taipei_2026_4/page_photostrip/DSC_1318.jpg',
      'images/Taipei_2026_4/page_photostrip/IMG_0235.jpg',
      'images/Taipei_2026_4/page_photostrip/R0005064.jpg',
      'images/Taipei_2026_4/page_photostrip/R0005093.jpg',
      'images/Taipei_2026_4/page_photostrip/R0005136.jpg',
      'images/Taipei_2026_4/page_photostrip/R0005308.jpg',
      'images/Taipei_2026_4/page_photostrip/R0005329_Original.jpg',
      'images/Taipei_2026_4/page_photostrip/R0005341.jpg',
    ],
    days: [
      {
        day: 'DAY 1', date: '2026.04.10',
        places: [
          { name: '路易士早餐吧', label: '아침식사', category: 'FOOD',     photo: 'https://picsum.photos/seed/tp-p1/400/300',  desc: '', maps: 'https://maps.app.goo.gl/BvTwp5a8dJ6M66KQ7' },
          { name: 'Lungshan Temple',          label: '용산사',   category: 'CULTURE',  photo: 'https://picsum.photos/seed/tp-p2/400/300',  desc: '', maps: 'https://maps.app.goo.gl/EztSG62n2Qt3PGwX8' },
          { name: '萬華煙酒',                  label: '바틀샵',   category: 'SHOPPING', photo: 'https://picsum.photos/seed/tp-p3/400/300',  desc: '', maps: 'https://maps.app.goo.gl/uHZZLbHfSmcYbhrE7' },
          { name: '正豪季水餃（忠孝西路店）',     label: '만두집',   category: 'FOOD',     photo: 'https://picsum.photos/seed/tp-p4/400/300',  desc: '', maps: 'https://maps.app.goo.gl/kPrrmiFDFsxR9dcp7' },
          { name: '朋丁 Pon Ding',            label: '폰딩',     category: 'ART',      photo: 'https://picsum.photos/seed/tp-p5/400/300',  desc: '', maps: 'https://maps.app.goo.gl/izLhdyUT1FvcpoCL7' },
          { name: 'Pharos Coffee',            label: '',         category: 'CAFE',     photo: 'https://picsum.photos/seed/tp-p6/400/300',  desc: '', maps: 'https://maps.app.goo.gl/izeB8T2nhD1k68oD6' },
          { name: 'Oasis Coffee Roasters',    label: '오아시스 커피', category: 'CAFE', photo: 'https://picsum.photos/seed/tp-p7/400/300',  desc: '', maps: 'https://maps.app.goo.gl/JQJcLmVpPYgz235b8' },
          { name: 'Haritts Donuts & Coffee',  label: '하리츠 도넛', category: 'CAFE',  photo: 'https://picsum.photos/seed/tp-p8/400/300',  desc: '', maps: 'https://maps.app.goo.gl/hVwfCWxx1oDjPEnn8' },
          { name: 'Simple Kaffa',             label: '심플 카파', category: 'CAFE',    photo: 'https://picsum.photos/seed/tp-p9/400/300',  desc: '', maps: 'https://maps.app.goo.gl/pKAWRep7EymdEGiXA' },
          { name: 'Din Tai Fung 101',         label: '',         category: 'FOOD',     photo: 'https://picsum.photos/seed/tp-p10/400/300', desc: '', maps: 'https://maps.app.goo.gl/6EP9bYdftkTBfy2f9' },
        ]
      },
      { day: 'DAY 2', date: '2026.04.11', places: [] },
      { day: 'DAY 3', date: '2026.04.12', places: [] },
    ],
    instagram: Array.from({length: 9}, (_, i) => `https://picsum.photos/seed/tpi${i+1}/600/600`)
  },
  {
    id: 'tokyo',
    city: 'TOKYO',
    country: 'JAPAN',
    date: '2025.11',
    period: '2025.11.03 – 11.09',
    cover: 'https://picsum.photos/seed/tokyo-cov/600/800',
    hero: 'https://picsum.photos/seed/tokyo-hero/1600/900',
    photos: [
      'https://picsum.photos/seed/tk1/900/700',
      'https://picsum.photos/seed/tk2/600/900',
      'https://picsum.photos/seed/tk3/1100/700',
      'https://picsum.photos/seed/tk4/700/900',
      'https://picsum.photos/seed/tk5/900/700',
      'https://picsum.photos/seed/tk6/550/900',
    ],
    days: [
      {
        day: 'DAY 1', date: '2025.11.03',
        places: [
          { name: 'Yanaka Ginza', category: 'CULTURE', photo: 'https://picsum.photos/seed/tk-p1/400/300', desc: 'A nostalgic shotengai that survived WWII bombing with its pre-war character intact.' },
          { name: 'Koenji Antique Market', category: 'SHOPPING', photo: 'https://picsum.photos/seed/tk-p2/400/300', desc: "Tokyo's most alternative neighborhood, packed with vintage clothing and record shops." },
          { name: 'Onigiri Bongo', category: 'FOOD', photo: 'https://picsum.photos/seed/tk-p3/400/300', desc: "A cult rice ball shop with a two-hour queue that moves faster than you'd think." },
        ]
      },
      {
        day: 'DAY 2', date: '2025.11.04',
        places: [
          { name: '21_21 Design Sight', category: 'ART', photo: 'https://picsum.photos/seed/tk-p4/400/300', desc: "Tadao Ando's sunken design museum in Roppongi Midtown — always a surprising exhibition." },
          { name: 'Fuglen Tokyo', category: 'CAFE', photo: 'https://picsum.photos/seed/tk-p5/400/300', desc: 'Norwegian coffee culture meets Japanese precision in a beautifully designed Tomigaya café.' },
          { name: 'Shibuya Crossing at Dusk', category: 'NATURE', photo: 'https://picsum.photos/seed/tk-p6/400/300', desc: 'Stand in the scramble as the city shifts from afternoon light to neon.' },
        ]
      }
    ],
    instagram: Array.from({length: 9}, (_, i) => `https://picsum.photos/seed/tki${i+1}/600/600`)
  },
  {
    id: 'berlin',
    city: 'BERLIN',
    country: 'GERMANY',
    date: '2025.08',
    period: '2025.08.14 – 08.20',
    cover: 'https://picsum.photos/seed/berlin-cov/600/800',
    hero: 'https://picsum.photos/seed/berlin-hero/1600/900',
    photos: [
      'https://picsum.photos/seed/bl1/900/700',
      'https://picsum.photos/seed/bl2/600/900',
      'https://picsum.photos/seed/bl3/1100/700',
      'https://picsum.photos/seed/bl4/700/900',
      'https://picsum.photos/seed/bl5/900/700',
    ],
    days: [
      {
        day: 'DAY 1', date: '2025.08.14',
        places: [
          { name: 'Neue Nationalgalerie', category: 'ART', photo: 'https://picsum.photos/seed/bl-p1/400/300', desc: "Mies van der Rohe's glass temple, finally re-opened after years of renovation." },
          { name: 'Markthalle Neun', category: 'FOOD', photo: 'https://picsum.photos/seed/bl-p2/400/300', desc: 'A 19th-century market hall in Kreuzberg, home to the beloved Thursday Street Food Market.' },
          { name: 'Tempelhof Field', category: 'NATURE', photo: 'https://picsum.photos/seed/bl-p3/400/300', desc: 'The former airport converted into a vast public park — Berliners cycle, grill, and kite here.' },
        ]
      },
      {
        day: 'DAY 2', date: '2025.08.15',
        places: [
          { name: 'König Galerie', category: 'ART', photo: 'https://picsum.photos/seed/bl-p4/400/300', desc: 'Contemporary art in a brutalist church in St. Agnes, Kreuzberg.' },
          { name: 'Bonanza Coffee', category: 'CAFE', photo: 'https://picsum.photos/seed/bl-p5/400/300', desc: "Berlin's original specialty coffee roaster, still leading the scene in Prenzlauer Berg." },
        ]
      }
    ],
    instagram: Array.from({length: 9}, (_, i) => `https://picsum.photos/seed/bli${i+1}/600/600`)
  },
  {
    id: 'sydney',
    city: 'SYDNEY',
    country: 'AUSTRALIA',
    date: '2025.06',
    period: '2025.06.01 – 06.07',
    cover: 'https://picsum.photos/seed/sydney-cov/600/800',
    hero: 'https://picsum.photos/seed/sydney-hero/1600/900',
    photos: [
      'https://picsum.photos/seed/sy1/900/700',
      'https://picsum.photos/seed/sy2/600/900',
      'https://picsum.photos/seed/sy3/1100/700',
      'https://picsum.photos/seed/sy4/700/900',
    ],
    days: [
      {
        day: 'DAY 1', date: '2025.06.01',
        places: [
          { name: 'Barangaroo Reserve', category: 'NATURE', photo: 'https://picsum.photos/seed/sy-p1/400/300', desc: 'A sandstone headland restored to pre-colonial bushland on the western edge of the CBD.' },
          { name: 'Flour & Stone', category: 'CAFE', photo: 'https://picsum.photos/seed/sy-p2/400/300', desc: 'Tiny Woolloomooloo bakery with the best lamingtons and orange cakes in the city.' },
          { name: 'White Rabbit Gallery', category: 'ART', photo: 'https://picsum.photos/seed/sy-p3/400/300', desc: 'Four floors of contemporary Chinese art from the 21st century. Free entry.' },
        ]
      }
    ],
    instagram: Array.from({length: 9}, (_, i) => `https://picsum.photos/seed/syi${i+1}/600/600`)
  },
  {
    id: 'ulaanbaatar',
    city: 'ULAANBAATAR',
    country: 'MONGOLIA',
    date: '2025.03',
    period: '2025.03.15 – 03.21',
    cover: 'https://picsum.photos/seed/ub-cov/600/800',
    hero: 'https://picsum.photos/seed/ub-hero/1600/900',
    photos: [
      'https://picsum.photos/seed/ub1/900/700',
      'https://picsum.photos/seed/ub2/600/900',
      'https://picsum.photos/seed/ub3/1100/700',
      'https://picsum.photos/seed/ub4/700/900',
    ],
    days: [
      {
        day: 'DAY 1', date: '2025.03.15',
        places: [
          { name: 'Gandan Monastery', category: 'CULTURE', photo: 'https://picsum.photos/seed/ub-p1/400/300', desc: "Mongolia's most important Buddhist monastery, still active amid Soviet-era apartment blocks." },
          { name: 'Narantuul Black Market', category: 'SHOPPING', photo: 'https://picsum.photos/seed/ub-p2/400/300', desc: 'A sprawling outdoor bazaar selling everything from cashmere to saddles to Soviet memorabilia.' },
          { name: 'Modern Nomads Restaurant', category: 'FOOD', photo: 'https://picsum.photos/seed/ub-p3/400/300', desc: 'Traditional khorkhog and airag in a beautifully designed ger-inspired restaurant.' },
        ]
      }
    ],
    instagram: Array.from({length: 9}, (_, i) => `https://picsum.photos/seed/ubi${i+1}/600/600`)
  },
  {
    id: 'copenhagen',
    city: 'COPENHAGEN',
    country: 'DENMARK',
    date: '2024.09',
    period: '2024.09.05 – 09.10',
    cover: 'https://picsum.photos/seed/cph-cov/600/800',
    hero: 'https://picsum.photos/seed/cph-hero/1600/900',
    photos: [
      'https://picsum.photos/seed/cph1/900/700',
      'https://picsum.photos/seed/cph2/600/900',
      'https://picsum.photos/seed/cph3/1100/700',
    ],
    days: [
      {
        day: 'DAY 1', date: '2024.09.05',
        places: [
          { name: 'Louisiana Museum of Modern Art', category: 'ART', photo: 'https://picsum.photos/seed/cph-p1/400/300', desc: 'Sculpture garden, coastal views, and world-class exhibitions 35km north of the city.' },
          { name: 'Torvehallerne Food Market', category: 'FOOD', photo: 'https://picsum.photos/seed/cph-p2/400/300', desc: 'Two glass market halls with the best smørrebrød, pastries, and coffee in Copenhagen.' },
          { name: 'Designmuseum Danmark', category: 'CULTURE', photo: 'https://picsum.photos/seed/cph-p3/400/300', desc: 'Danish design and applied arts in an 18th-century hospital building in the city center.' },
        ]
      }
    ],
    instagram: Array.from({length: 9}, (_, i) => `https://picsum.photos/seed/cphi${i+1}/600/600`)
  },
  {
    id: 'bangkok',
    city: 'BANGKOK',
    country: 'THAILAND',
    date: '2024.05',
    period: '2024.05.10 – 05.16',
    cover: 'https://picsum.photos/seed/bkk-cov/600/800',
    hero: 'https://picsum.photos/seed/bkk-hero/1600/900',
    photos: [
      'https://picsum.photos/seed/bkk1/900/700',
      'https://picsum.photos/seed/bkk2/600/900',
      'https://picsum.photos/seed/bkk3/1100/700',
      'https://picsum.photos/seed/bkk4/700/900',
    ],
    days: [
      {
        day: 'DAY 1', date: '2024.05.10',
        places: [
          { name: 'Wat Pho', category: 'CULTURE', photo: 'https://picsum.photos/seed/bkk-p1/400/300', desc: 'Home to the giant reclining Buddha and the birthplace of traditional Thai massage.' },
          { name: 'Or Tor Kor Market', category: 'FOOD', photo: 'https://picsum.photos/seed/bkk-p2/400/300', desc: "Bangkok's most upscale fresh market — fruit arrangements that look like architecture." },
          { name: 'MOCA Bangkok', category: 'ART', photo: 'https://picsum.photos/seed/bkk-p3/400/300', desc: 'A private museum showcasing Thai contemporary and classical painting over five floors.' },
        ]
      }
    ],
    instagram: Array.from({length: 9}, (_, i) => `https://picsum.photos/seed/bkki${i+1}/600/600`)
  },
  {
    id: 'frankfurt',
    city: 'FRANKFURT',
    country: 'GERMANY',
    date: '2023.12',
    period: '2023.12.18 – 12.23',
    cover: 'https://picsum.photos/seed/frf-cov/600/800',
    hero: 'https://picsum.photos/seed/frf-hero/1600/900',
    photos: [
      'https://picsum.photos/seed/frf1/900/700',
      'https://picsum.photos/seed/frf2/600/900',
      'https://picsum.photos/seed/frf3/1100/700',
    ],
    days: [
      {
        day: 'DAY 1', date: '2023.12.18',
        places: [
          { name: 'Städel Museum', category: 'ART', photo: 'https://picsum.photos/seed/frf-p1/400/300', desc: "One of Germany's finest art museums, 700 years of European painting in a riverfront building." },
          { name: 'Frankfurt Christmas Market', category: 'CULTURE', photo: 'https://picsum.photos/seed/frf-p2/400/300', desc: "One of Germany's oldest Christmas markets, glühwein and lebkuchen under the Römer." },
          { name: 'Kleinmarkthalle', category: 'FOOD', photo: 'https://picsum.photos/seed/frf-p3/400/300', desc: 'A beloved indoor market hall with over 150 stalls selling regional and international produce.' },
        ]
      }
    ],
    instagram: Array.from({length: 9}, (_, i) => `https://picsum.photos/seed/frfi${i+1}/600/600`)
  }
];
