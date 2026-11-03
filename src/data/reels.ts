export type Reel = {
  id: string
  placeId: string
  poster: string
  /** optional real vertical clip; posters animate as a moving preview when absent or when Data saver is on */
  video?: string
  caption: string
  hashtags: string[]
  subtitle: string
  views: number
  likes: number
  comments: number
  sponsored?: boolean
  isNew?: boolean
}

export const reels: Reel[] = [
  {
    id: 'r1',
    placeId: 'p5',
    poster: 'photo-1688084398814-8926f7d56ebe',
    caption: 'Ang lutong ng balat! Bagong labas na lechon tuwing 11 AM',
    hashtags: ['#LechonNiKuyaBen', '#Intramuros', '#FoodTrip'],
    subtitle: '"Pakinggan n\'yo ’yung lutong… grabe!"',
    views: 12400,
    likes: 2310,
    comments: 184,
    isNew: true,
  },
  {
    id: 'r2',
    placeId: 'p2',
    poster: 'photo-1593443320739-77f74939d0da',
    caption: 'Kapeng barako sa lumang bahay na bato. Tara, kape tayo!',
    hashtags: ['#KapihanPH', '#Barako'],
    subtitle: '"Ito ’yung barako na galing pa sa Lipa."',
    views: 8700,
    likes: 1290,
    comments: 76,
  },
  {
    id: 'r3',
    placeId: 'p11',
    poster: 'photo-1605537964076-3cb0ea2ff329',
    caption: 'Weekend escape 2.5 oras lang mula Maynila',
    hashtags: ['#Batangas', '#BeachPH'],
    subtitle: '"Ang linaw ng tubig, promise!"',
    views: 30100,
    likes: 5420,
    comments: 402,
    sponsored: true,
  },
  {
    id: 'r4',
    placeId: 'p4',
    poster: 'photo-1717988241394-48c24220d13d',
    caption: 'Isaw run pagkatapos ng trabaho, ₱50 lang ang 5 sticks',
    hashtags: ['#StreetFoodPH', '#Binondo'],
    subtitle: '"Sawsaw mo sa sukang pinakurat."',
    views: 5200,
    likes: 840,
    comments: 51,
  },
  {
    id: 'r5',
    placeId: 'p6',
    poster: 'photo-1653196941420-f83464498bd6',
    caption: 'Ikot sa Intramuros sakay ng kalesa',
    hashtags: ['#Kalesa', '#Kasaysayan'],
    subtitle: '"Dito dumaan si Rizal noong 1896."',
    views: 3900,
    likes: 610,
    comments: 33,
  },
]

export const reelComments = [
  { name: 'Mika R.', text: 'Grabe ang lutong!! Pupunta kami bukas.', time: '2h' },
  { name: 'Jun D.', text: 'Magkano po ang ¼ kilo?', time: '3h' },
  { name: 'Lechon ni Kuya Ben', text: '₱320 po ang ¼ kilo. Kita-kits!', time: '3h', owner: true },
  { name: 'Carla M.', text: 'Sulit talaga, mahaba lang pila tuwing tanghali.', time: '1d' },
]
