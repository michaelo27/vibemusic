/**
 * Demo-mode fixtures — REAL Audius tracks (fetched from the public API), with
 * sample Tip Jars so the whole product is clickable without a Worker, a wallet
 * or a funded agent. Only used when NEXT_PUBLIC_API_BASE is empty.
 *
 * ⚠️ The wallets here are deterministic placeholders (sha256 of the handle).
 * They are NOT real artist wallets — demo mode never touches the chain.
 */
import type { AgentMission, AudiusTrack, Tip, TipJar } from './types';

export const DEMO_AGENT_ADDRESS = '0x9A7c4bE2F3f1D6b8C05aE4d2B71f3c8D9e6A0b42';
export const DEMO_RELAYER_ADDRESS = '0x2d4F6aB0c93E17f5D8b21A4c7e60B3d9F8a1C5e7';
export const DEMO_AGENT_BALANCE = '1840';
export const DEMO_ALLOWANCE = '100000';

/** Tracks the demo agent can "discover" (linked + unlinked artists). */
export const DEMO_CATALOGUE: AudiusTrack[] = [
  {
    "id": "2RlV2",
    "trackId": 1028378,
    "title": "lofi Instrumental Hip Hop Chill Beat",
    "artist": "Lofi Army",
    "artistHandle": "LofiArmy",
    "artwork": "https://v.monophonic.digital/content/QmUaZHeW38c99zhLtR3oMdUuDnSwUmC2EGV8NhwNhcwi79/480x480.jpg",
    "duration": 196,
    "genre": "Hip-Hop/Rap",
    "mood": "Upbeat",
    "playCount": 12536,
    "favoriteCount": 85,
    "repostCount": 63,
    "tags": "lofi,hiphop,chill,beat",
    "description": "Download",
    "releaseDate": "2022-06-01T07:01:00Z",
    "permalink": "/LofiArmy/lofi-instrumental-hip-hop-chill-beat",
    "streamEndpoint": "https://api.audius.co/v1/tracks/2RlV2/stream?app_name=VibeMusic"
  },
  {
    "id": "9OoxA",
    "trackId": 983399,
    "title": "chill lofi set",
    "artist": "Lofi Army",
    "artistHandle": "LofiArmy",
    "artwork": "https://v.monophonic.digital/content/Qme5SuvPs3sU2LkHhsEJ2BPm2ju97foFEZwApt59fvpgHz/480x480.jpg",
    "duration": 2330,
    "genre": "Hip-Hop/Rap",
    "mood": "Peaceful",
    "playCount": 10701,
    "favoriteCount": 148,
    "repostCount": 75,
    "tags": "chill,lofi",
    "description": "set",
    "releaseDate": "2022-04-07T06:05:00Z",
    "permalink": "/LofiArmy/chill-lofi-set",
    "streamEndpoint": "https://api.audius.co/v1/tracks/9OoxA/stream?app_name=VibeMusic"
  },
  {
    "id": "5dMbx",
    "trackId": 763846,
    "title": "un chill Lofi diferente",
    "artist": "Lofi Army",
    "artistHandle": "LofiArmy",
    "artwork": "https://v.monophonic.digital/content/QmP7HNXQZgcW8voyhzq5mrgvh6u55cqrcDbG96hTit3TtL/480x480.jpg",
    "duration": 2386,
    "genre": "Hip-Hop/Rap",
    "mood": "Upbeat",
    "playCount": 1898,
    "favoriteCount": 75,
    "repostCount": 42,
    "tags": "chill,lofi",
    "description": "set",
    "releaseDate": "2022-02-10T18:00:00Z",
    "permalink": "/LofiArmy/un-chill-lofi-diferente",
    "streamEndpoint": "https://api.audius.co/v1/tracks/5dMbx/stream?app_name=VibeMusic"
  },
  {
    "id": "87GrbyW",
    "trackId": 610735376,
    "title": "Elastic Illusions",
    "artist": "ShrivL",
    "artistHandle": "ShrivL",
    "artwork": "https://audius-02.staked.cloud/content/baeaaaiqsedfcwrasripxf5oypr7xaj72neg5lv64e4pqqcvsiw4nb2mmmu4iq/480x480.jpg",
    "duration": 231,
    "genre": "Electronic",
    "mood": "Fiery",
    "playCount": 2034,
    "favoriteCount": 43,
    "repostCount": 28,
    "tags": "shrivl",
    "description": "",
    "releaseDate": "2026-10-28T22:32:43.338276Z",
    "permalink": "/ShrivL/elastic-illusions",
    "streamEndpoint": "https://api.audius.co/v1/tracks/87GrbyW/stream?app_name=VibeMusic"
  },
  {
    "id": "Z4MO8z6",
    "trackId": 806075512,
    "title": "Konzyk - Chamber (FREE DL)",
    "artist": "Konzyk",
    "artistHandle": "Konzyk",
    "artwork": "https://v.monophonic.digital/content/baeaaaiqsecq27lckifp3362vgbzftaa4x56wo4tzxuklwu7qnrpaetfjddmwe/480x480.jpg",
    "duration": 419,
    "genre": "Tech House",
    "mood": "Cool",
    "playCount": 487,
    "favoriteCount": 28,
    "repostCount": 22,
    "tags": null,
    "description": "Contact: konprodsoundz@gmail.com\nFree download : www.toneden.io/kon-2563-3464/post/unlock-for-free",
    "releaseDate": "2026-11-05T16:13:23.199644Z",
    "permalink": "/Konzyk/konzyk-chamber-free-dl",
    "streamEndpoint": "https://api.audius.co/v1/tracks/Z4MO8z6/stream?app_name=VibeMusic"
  },
  {
    "id": "31ZqXZ",
    "trackId": 36752267,
    "title": "Loving You Is So Easy",
    "artist": "Angelina Alexon ",
    "artistHandle": "angelina_alexon",
    "artwork": "https://val003.open-audio-validator.com/content/QmaeYRffotyauWtGWsdEemDSzkC1bpGi6smyvEKo6rXzsJ/480x480.jpg",
    "duration": 215,
    "genre": "R&B/Soul",
    "mood": "Sensual",
    "playCount": 25948,
    "favoriteCount": 128,
    "repostCount": 67,
    "tags": "romantic,sensual,chill,rnb",
    "description": "Chill vibes, sensual , romantic. ",
    "releaseDate": "2023-02-14T04:02:00Z",
    "permalink": "/angelina_alexon/loving-you-is-so-easy",
    "streamEndpoint": "https://api.audius.co/v1/tracks/31ZqXZ/stream?app_name=VibeMusic"
  },
  {
    "id": "mWB22",
    "trackId": 823520,
    "title": "Ambient Snow",
    "artist": "Blop",
    "artistHandle": "blopin",
    "artwork": "https://audius-content-13.figment.io/content/QmSYSwNmLdfRNtNcUXPX8xqFNFAH3K9ubrVFLshpQt38Bd/480x480.jpg",
    "duration": 509,
    "genre": "Experimental",
    "mood": "Peaceful",
    "playCount": 12692,
    "favoriteCount": 341,
    "repostCount": 296,
    "tags": null,
    "description": "",
    "releaseDate": "2022-02-22T18:41:50Z",
    "permalink": "/blopin/ambient-snow",
    "streamEndpoint": "https://api.audius.co/v1/tracks/mWB22/stream?app_name=VibeMusic"
  },
  {
    "id": "E2yjEo",
    "trackId": 5530471,
    "title": "1999 [Indie Pop]",
    "artist": " \u2660 \ud835\udd6e\ud835\udd94\ud835\udd92\ud835\udd99\ud835\udd8a \ud835\udd89\ud835\udd8a \ud835\udd77\ud835\udd9a\ud835\udd95\ud835\udd86\ud835\udd88 \ud835\udd7b\ud835\udd97\ud835\udd94\ud835\udd8f\ud835\udd8a\ud835\udd88\ud835\udd99 \u2660",
    "artistHandle": "Comte",
    "artwork": "https://v.monophonic.digital/content/01HZ0NP5THJNW9TPNQMHE26X22/480x480.jpg",
    "duration": 196,
    "genre": "Pop",
    "mood": "Romantic",
    "playCount": 1628,
    "favoriteCount": 38,
    "repostCount": 28,
    "tags": null,
    "description": "",
    "releaseDate": "2024-05-05T14:42:44Z",
    "permalink": "/Comte/1999-indie-pop-2",
    "streamEndpoint": "https://api.audius.co/v1/tracks/E2yjEo/stream?app_name=VibeMusic"
  },
  {
    "id": "B586M6Q",
    "trackId": 2083747686,
    "title": "GET//NASTY (Final)",
    "artist": "NXDVL",
    "artistHandle": "NXDVL",
    "artwork": "https://val012.open-audio-validator.com/content/baeaaaiqsea2mffv7tizjhola2dmt6matdzw2x5y4wqhs7oiw26qyfzo2cfukg/480x480.jpg",
    "duration": 206,
    "genre": "Dubstep",
    "mood": "Defiant",
    "playCount": 283,
    "favoriteCount": 28,
    "repostCount": 24,
    "tags": "dubstep,nxdvl,grimey,trap",
    "description": "Final version! Thank you all for the love!",
    "releaseDate": "2026-10-31T14:28:58Z",
    "permalink": "/NXDVL/getnasty-final",
    "streamEndpoint": "https://api.audius.co/v1/tracks/B586M6Q/stream?app_name=VibeMusic"
  },
  {
    "id": "g6Vd7k",
    "trackId": 4900915,
    "title": "Let's Groove (Funky Jazz Soul Type Beat) by Ljazz Beats",
    "artist": "CollabHaven",
    "artistHandle": "collabhavenrec",
    "artwork": "https://v.monophonic.digital/content/QmNnpXzmbvqftkxiioqB1x2Lp3SWkj92q8wPSdobSyop2Y/480x480.jpg",
    "duration": 172,
    "genre": "Funk",
    "mood": "Cool",
    "playCount": 8499,
    "favoriteCount": 45,
    "repostCount": 31,
    "tags": "ljazz,beats",
    "description": "",
    "releaseDate": "2023-04-06T20:58:18Z",
    "permalink": "/collabhavenrec/lets-groove-funky-jazz-soul-type-beat-by-ljazz-beats",
    "streamEndpoint": "https://api.audius.co/v1/tracks/g6Vd7k/stream?app_name=VibeMusic"
  },
  {
    "id": "oYZ9qda",
    "trackId": 818138783,
    "title": "Earth, Wind & Fire - September (Jazcardan Edit)",
    "artist": "Jazcardan",
    "artistHandle": "Jazcardan",
    "artwork": "https://v.monophonic.digital/content/01K4TECNM4WK0V2CFERARS0ZRF/480x480.jpg",
    "duration": 236,
    "genre": "Disco",
    "mood": "Cool",
    "playCount": 4499,
    "favoriteCount": 361,
    "repostCount": 341,
    "tags": "Disco,Remix,Edit,House,September,Groove,Banger,Remember,Funky,Fun",
    "description": "Parada obligatoria de este mes con el hit universal 'September' en una versi\u00f3n fresca para 2025 \ud83e\udea9\nBRING BACK DISCO ! ENJOY <3",
    "releaseDate": "2025-09-11T19:32:30.968271Z",
    "permalink": "/Jazcardan/earth-wind-fire-september-jazcardan-edit",
    "streamEndpoint": "https://api.audius.co/v1/tracks/oYZ9qda/stream?app_name=VibeMusic"
  },
  {
    "id": "2z4aZ",
    "trackId": 386878,
    "title": "Fifi Rong - Only Man",
    "artist": "Fifi Rong",
    "artistHandle": "fifirong",
    "artwork": "https://audius-creator-11.theblueprint.xyz/content/QmYFygt3eqYEqGncnU71zs2R7w4e2spjkyxtDvrS9oNocn/480x480.jpg",
    "duration": 254,
    "genre": "Alternative",
    "mood": "Romantic",
    "playCount": 16717,
    "favoriteCount": 130,
    "repostCount": 72,
    "tags": "avantpop,avantgarde,altrnb,rnb,downtempo,darkpop,melancholic,chill,zen,emotional",
    "description": "Song taken from Fifi Rong's forthcoming album 'There's A Funeral In My Heart, For Every Man I Loved'\nWritten, produced and performed by Fifi Rong\nMix and master by Oskar Vizan\n\n",
    "releaseDate": "2021-04-29T10:56:25Z",
    "permalink": "/fifirong/fifi-rong-only-man-386878",
    "streamEndpoint": "https://api.audius.co/v1/tracks/2z4aZ/stream?app_name=VibeMusic"
  },
  {
    "id": "8PJXK1a",
    "trackId": 661275576,
    "title": "SOFT ECLECTIC AMBIENT [DJ SET #1] - by Jan Larz Dj",
    "artist": "Jan Larz",
    "artistHandle": "jan_larz",
    "artwork": "https://v.monophonic.digital/content/QmdmMaM1upVg9CkQ2bfvTVWjWxXNV8TgFE3QfEWeuPFKbg/480x480.jpg",
    "duration": 5596,
    "genre": "Ambient",
    "mood": "Peaceful",
    "playCount": 1095,
    "favoriteCount": 69,
    "repostCount": 47,
    "tags": "janlarz,djset,dj,ambient,chillout,downtempo,chillhop,dub,blues,sunset",
    "description": "Electronic DownTempo, ChillOut, Lofi, ChillHop, Dub, Soul, R&B, WorldMusic...\n\nHere another piece of 1hour & 33minutes DJ SESSION which I have rescued from 2018 when I entertained the afternoons in be",
    "releaseDate": "2022-12-01T18:05:00Z",
    "permalink": "/jan_larz/soft-eclectic-ambient-dj-set-1-by-jan-larz-dj",
    "streamEndpoint": "https://api.audius.co/v1/tracks/8PJXK1a/stream?app_name=VibeMusic"
  },
  {
    "id": "kP4Z8JN",
    "trackId": 1818280143,
    "title": "Gigi Perez - Sailor Song (Jyye Remix)",
    "artist": "Jyye",
    "artistHandle": "jyye",
    "artwork": "https://audius-content-9.figment.io/content/baeaaaiqsedfnqynwwc36dtwbjii6rghnxuvyhhqcbezh774uqpkmoobc4cix2/480x480.jpg",
    "duration": 153,
    "genre": "House",
    "mood": "Upbeat",
    "playCount": 928,
    "favoriteCount": 23,
    "repostCount": 21,
    "tags": "gigi,perez,sailor,song,jyye,remix,house,deephouse,melodichouse",
    "description": "Went for a bit of a different remix this week.. I've been hearing this song a lot and always loved the intro. Now it's perfect for a beach party \ud83e\udd42\ud83c\udfd6\ufe0f\n\nComment \"SAILOR\" and I'll send you a copy \ud83d\udcbd\ud83d\udc47\ud83c\udffc",
    "releaseDate": "2026-11-01T04:31:58.405675Z",
    "permalink": "/jyye/gigi-perez-sailor-song-jyye-remix",
    "streamEndpoint": "https://api.audius.co/v1/tracks/kP4Z8JN/stream?app_name=VibeMusic"
  },
  {
    "id": "Zlx2Wya",
    "trackId": 1879754456,
    "title": "THIRTY-FOUR",
    "artist": "DARK VELVET",
    "artistHandle": "darkvelvetbass",
    "artwork": "https://validator.soundmaxx.xyz/content/baeaaaiqsebdomxcu2rfvfdypwzbdv4mw6bytjyxykxb3pi44w45ch3b6euvsq/480x480.jpg",
    "duration": 187,
    "genre": "Electronic",
    "mood": "Gritty",
    "playCount": 668,
    "favoriteCount": 22,
    "repostCount": 18,
    "tags": "dark,crunchy,bass,westcoastbass,westcoastbeats,spooky,distorted",
    "description": "HAPPY HALLOWEEN! 34 CHANNELS.",
    "releaseDate": "2026-11-01T05:23:55.212079Z",
    "permalink": "/darkvelvetbass/thirty-four",
    "streamEndpoint": "https://api.audius.co/v1/tracks/Zlx2Wya/stream?app_name=VibeMusic"
  },
  {
    "id": "J55W3vk",
    "trackId": 171902251,
    "title": "Nature Ambient Sounds ",
    "artist": "SAHARA SUNFLOWER DJ",
    "artistHandle": "SaharaDj",
    "artwork": "https://audius-discovery-1.altego.net/content/01K3BT63X4NJBPB960HEEB6NZ0/480x480.jpg",
    "duration": 20,
    "genre": "Ambient",
    "mood": null,
    "playCount": 1167,
    "favoriteCount": 63,
    "repostCount": 55,
    "tags": "",
    "description": "",
    "releaseDate": "2025-08-23T15:54:12Z",
    "permalink": "/SaharaDj/nature-ambient-sounds",
    "streamEndpoint": "https://api.audius.co/v1/tracks/J55W3vk/stream?app_name=VibeMusic"
  },
  {
    "id": "qpm3bjM",
    "trackId": 2044349773,
    "title": "RIXXTAPE #7 (F1 2026 CDMX)",
    "artist": "RIXX",
    "artistHandle": "mishelrisk",
    "artwork": "https://val018.open-audio-validator.com/content/baeaaaiqsecm367xkjty46apn44zop73zdij4bqgfn5gvypccvufcckkhpjcaq/480x480.jpg",
    "duration": 2771,
    "genre": "Electronic",
    "mood": "Fiery",
    "playCount": 376,
    "favoriteCount": 23,
    "repostCount": 25,
    "tags": "djset,mix,dj,edm,electronic,techhouse,dance,bass,live",
    "description": "",
    "releaseDate": "2026-11-03T22:04:35Z",
    "permalink": "/mishelrisk/rixxtape-7-f1-2026-cdmx",
    "streamEndpoint": "https://api.audius.co/v1/tracks/qpm3bjM/stream?app_name=VibeMusic"
  }
];

export const DEMO_JARS: TipJar[] = [
  {
    "wallet": "0xed2ef16810af3321e3ad66a35e8d16da3848c9e8",
    "slug": "lofi_army",
    "name": "lofi army",
    "bio": "Beats for the late shift. Made in a bedroom, mixed on headphones.",
    "x": "lofi_army",
    "image": null,
    "audiusHandles": [
      "lofiarmy"
    ],
    "tracks": [
      {
        "id": "2RlV2",
        "trackId": 1028378,
        "title": "lofi Instrumental Hip Hop Chill Beat",
        "artist": "Lofi Army",
        "artistHandle": "LofiArmy",
        "artwork": "https://v.monophonic.digital/content/QmUaZHeW38c99zhLtR3oMdUuDnSwUmC2EGV8NhwNhcwi79/480x480.jpg",
        "duration": 196,
        "genre": "Hip-Hop/Rap",
        "mood": "Upbeat",
        "playCount": 12536,
        "favoriteCount": 85,
        "repostCount": 63,
        "tags": "lofi,hiphop,chill,beat",
        "description": "Download",
        "releaseDate": "2022-06-01T07:01:00Z",
        "permalink": "/LofiArmy/lofi-instrumental-hip-hop-chill-beat",
        "streamEndpoint": "https://api.audius.co/v1/tracks/2RlV2/stream?app_name=VibeMusic"
      },
      {
        "id": "9OoxA",
        "trackId": 983399,
        "title": "chill lofi set",
        "artist": "Lofi Army",
        "artistHandle": "LofiArmy",
        "artwork": "https://v.monophonic.digital/content/Qme5SuvPs3sU2LkHhsEJ2BPm2ju97foFEZwApt59fvpgHz/480x480.jpg",
        "duration": 2330,
        "genre": "Hip-Hop/Rap",
        "mood": "Peaceful",
        "playCount": 10701,
        "favoriteCount": 148,
        "repostCount": 75,
        "tags": "chill,lofi",
        "description": "set",
        "releaseDate": "2022-04-07T06:05:00Z",
        "permalink": "/LofiArmy/chill-lofi-set",
        "streamEndpoint": "https://api.audius.co/v1/tracks/9OoxA/stream?app_name=VibeMusic"
      },
      {
        "id": "5dMbx",
        "trackId": 763846,
        "title": "un chill Lofi diferente",
        "artist": "Lofi Army",
        "artistHandle": "LofiArmy",
        "artwork": "https://v.monophonic.digital/content/QmP7HNXQZgcW8voyhzq5mrgvh6u55cqrcDbG96hTit3TtL/480x480.jpg",
        "duration": 2386,
        "genre": "Hip-Hop/Rap",
        "mood": "Upbeat",
        "playCount": 1898,
        "favoriteCount": 75,
        "repostCount": 42,
        "tags": "chill,lofi",
        "description": "set",
        "releaseDate": "2022-02-10T18:00:00Z",
        "permalink": "/LofiArmy/un-chill-lofi-diferente",
        "streamEndpoint": "https://api.audius.co/v1/tracks/5dMbx/stream?app_name=VibeMusic"
      }
    ],
    "createdAt": 1793361342320
  },
  {
    "wallet": "0x4145e5e0cd35566866c88d8bfff6503692a39ea1",
    "slug": "shrivl",
    "name": "ShrivL",
    "bio": "Bass-forward electronics from the night bus home.",
    "x": "shrivl",
    "image": null,
    "audiusHandles": [
      "shrivl"
    ],
    "tracks": [
      {
        "id": "87GrbyW",
        "trackId": 610735376,
        "title": "Elastic Illusions",
        "artist": "ShrivL",
        "artistHandle": "ShrivL",
        "artwork": "https://audius-02.staked.cloud/content/baeaaaiqsedfcwrasripxf5oypr7xaj72neg5lv64e4pqqcvsiw4nb2mmmu4iq/480x480.jpg",
        "duration": 231,
        "genre": "Electronic",
        "mood": "Fiery",
        "playCount": 2034,
        "favoriteCount": 43,
        "repostCount": 28,
        "tags": "shrivl",
        "description": "",
        "releaseDate": "2026-10-28T22:32:43.338276Z",
        "permalink": "/ShrivL/elastic-illusions",
        "streamEndpoint": "https://api.audius.co/v1/tracks/87GrbyW/stream?app_name=VibeMusic"
      }
    ],
    "createdAt": 1793447742320
  },
  {
    "wallet": "0x839fe9545e3744a8bbd2b1cb639240ffe20722fd",
    "slug": "konzyk",
    "name": "Konzyk",
    "bio": "Tech house sketches, no filler. Free downloads on every drop.",
    "x": "konzyk",
    "image": null,
    "audiusHandles": [
      "konzyk"
    ],
    "tracks": [
      {
        "id": "Z4MO8z6",
        "trackId": 806075512,
        "title": "Konzyk - Chamber (FREE DL)",
        "artist": "Konzyk",
        "artistHandle": "Konzyk",
        "artwork": "https://v.monophonic.digital/content/baeaaaiqsecq27lckifp3362vgbzftaa4x56wo4tzxuklwu7qnrpaetfjddmwe/480x480.jpg",
        "duration": 419,
        "genre": "Tech House",
        "mood": "Cool",
        "playCount": 487,
        "favoriteCount": 28,
        "repostCount": 22,
        "tags": null,
        "description": "Contact: konprodsoundz@gmail.com\nFree download : www.toneden.io/kon-2563-3464/post/unlock-for-free",
        "releaseDate": "2026-11-05T16:13:23.199644Z",
        "permalink": "/Konzyk/konzyk-chamber-free-dl",
        "streamEndpoint": "https://api.audius.co/v1/tracks/Z4MO8z6/stream?app_name=VibeMusic"
      }
    ],
    "createdAt": 1793534142320
  },
  {
    "wallet": "0xb115e935ec6baea930998a9c4bd9239adae0ad48",
    "slug": "angelinaalexon",
    "name": "Angelina Alexon",
    "bio": "R&B vocals, slow burn production.",
    "x": "angelinaalexon",
    "image": null,
    "audiusHandles": [
      "angelina_alexon"
    ],
    "tracks": [
      {
        "id": "31ZqXZ",
        "trackId": 36752267,
        "title": "Loving You Is So Easy",
        "artist": "Angelina Alexon ",
        "artistHandle": "angelina_alexon",
        "artwork": "https://val003.open-audio-validator.com/content/QmaeYRffotyauWtGWsdEemDSzkC1bpGi6smyvEKo6rXzsJ/480x480.jpg",
        "duration": 215,
        "genre": "R&B/Soul",
        "mood": "Sensual",
        "playCount": 25948,
        "favoriteCount": 128,
        "repostCount": 67,
        "tags": "romantic,sensual,chill,rnb",
        "description": "Chill vibes, sensual , romantic. ",
        "releaseDate": "2023-02-14T04:02:00Z",
        "permalink": "/angelina_alexon/loving-you-is-so-easy",
        "streamEndpoint": "https://api.audius.co/v1/tracks/31ZqXZ/stream?app_name=VibeMusic"
      }
    ],
    "createdAt": 1793620542320
  },
  {
    "wallet": "0x7599abed894a62a01e97ec93d8eade410b600722",
    "slug": "blopin",
    "name": "Blopin",
    "bio": "Ambient textures and field recordings.",
    "x": "blopin",
    "image": null,
    "audiusHandles": [
      "blopin"
    ],
    "tracks": [
      {
        "id": "mWB22",
        "trackId": 823520,
        "title": "Ambient Snow",
        "artist": "Blop",
        "artistHandle": "blopin",
        "artwork": "https://audius-content-13.figment.io/content/QmSYSwNmLdfRNtNcUXPX8xqFNFAH3K9ubrVFLshpQt38Bd/480x480.jpg",
        "duration": 509,
        "genre": "Experimental",
        "mood": "Peaceful",
        "playCount": 12692,
        "favoriteCount": 341,
        "repostCount": 296,
        "tags": null,
        "description": "",
        "releaseDate": "2022-02-22T18:41:50Z",
        "permalink": "/blopin/ambient-snow",
        "streamEndpoint": "https://api.audius.co/v1/tracks/mWB22/stream?app_name=VibeMusic"
      }
    ],
    "createdAt": 1793706942320
  },
  {
    "wallet": "0x818549a7814a6c9a1ad24eea79bf8bcf99d867d2",
    "slug": "comte",
    "name": "Comt\u00e9",
    "bio": "Indie pop with cheap synths and expensive feelings.",
    "x": "comte",
    "image": null,
    "audiusHandles": [
      "comte"
    ],
    "tracks": [
      {
        "id": "E2yjEo",
        "trackId": 5530471,
        "title": "1999 [Indie Pop]",
        "artist": " \u2660 \ud835\udd6e\ud835\udd94\ud835\udd92\ud835\udd99\ud835\udd8a \ud835\udd89\ud835\udd8a \ud835\udd77\ud835\udd9a\ud835\udd95\ud835\udd86\ud835\udd88 \ud835\udd7b\ud835\udd97\ud835\udd94\ud835\udd8f\ud835\udd8a\ud835\udd88\ud835\udd99 \u2660",
        "artistHandle": "Comte",
        "artwork": "https://v.monophonic.digital/content/01HZ0NP5THJNW9TPNQMHE26X22/480x480.jpg",
        "duration": 196,
        "genre": "Pop",
        "mood": "Romantic",
        "playCount": 1628,
        "favoriteCount": 38,
        "repostCount": 28,
        "tags": null,
        "description": "",
        "releaseDate": "2024-05-05T14:42:44Z",
        "permalink": "/Comte/1999-indie-pop-2",
        "streamEndpoint": "https://api.audius.co/v1/tracks/E2yjEo/stream?app_name=VibeMusic"
      }
    ],
    "createdAt": 1793793342320
  },
  {
    "wallet": "0x4b0ad2810d98a6c02dd72116ac96ad67480440d6",
    "slug": "nxdvl",
    "name": "NXDVL",
    "bio": "Dubstep at 140. Loud on purpose.",
    "x": "nxdvl",
    "image": null,
    "audiusHandles": [
      "nxdvl"
    ],
    "tracks": [
      {
        "id": "B586M6Q",
        "trackId": 2083747686,
        "title": "GET//NASTY (Final)",
        "artist": "NXDVL",
        "artistHandle": "NXDVL",
        "artwork": "https://val012.open-audio-validator.com/content/baeaaaiqsea2mffv7tizjhola2dmt6matdzw2x5y4wqhs7oiw26qyfzo2cfukg/480x480.jpg",
        "duration": 206,
        "genre": "Dubstep",
        "mood": "Defiant",
        "playCount": 283,
        "favoriteCount": 28,
        "repostCount": 24,
        "tags": "dubstep,nxdvl,grimey,trap",
        "description": "Final version! Thank you all for the love!",
        "releaseDate": "2026-10-31T14:28:58Z",
        "permalink": "/NXDVL/getnasty-final",
        "streamEndpoint": "https://api.audius.co/v1/tracks/B586M6Q/stream?app_name=VibeMusic"
      }
    ],
    "createdAt": 1793879742320
  },
  {
    "wallet": "0xe042a04402e85f1321697ef9fa3c9b70d3c2627c",
    "slug": "collabhaven",
    "name": "Collab Haven Rec",
    "bio": "Funk, jazz and soul-leaning sample flips.",
    "x": "collabhaven",
    "image": null,
    "audiusHandles": [
      "collabhavenrec"
    ],
    "tracks": [
      {
        "id": "g6Vd7k",
        "trackId": 4900915,
        "title": "Let's Groove (Funky Jazz Soul Type Beat) by Ljazz Beats",
        "artist": "CollabHaven",
        "artistHandle": "collabhavenrec",
        "artwork": "https://v.monophonic.digital/content/QmNnpXzmbvqftkxiioqB1x2Lp3SWkj92q8wPSdobSyop2Y/480x480.jpg",
        "duration": 172,
        "genre": "Funk",
        "mood": "Cool",
        "playCount": 8499,
        "favoriteCount": 45,
        "repostCount": 31,
        "tags": "ljazz,beats",
        "description": "",
        "releaseDate": "2023-04-06T20:58:18Z",
        "permalink": "/collabhavenrec/lets-groove-funky-jazz-soul-type-beat-by-ljazz-beats",
        "streamEndpoint": "https://api.audius.co/v1/tracks/g6Vd7k/stream?app_name=VibeMusic"
      }
    ],
    "createdAt": 1793966142320
  }
];

export const DEMO_TIPS: Tip[] = [
  {
    "id": "demo-tip-7",
    "from": "0x9A7c4bE2F3f1D6b8C05aE4d2B71f3c8D9e6A0b42",
    "to": "0x4b0ad2810d98a6c02dd72116ac96ad67480440d6",
    "amount": "8",
    "message": null,
    "txHash": "0x701b9d6a51bdcd7b6d1d9e8bf9d0288657424ee55f08b98ea45a01f033f9c4d6",
    "timestamp": 207360000.0,
    "isAgent": true,
    "reason": "hidden gem \u2014 only 283 plays \u00b7 140 BPM Dubstep in brief \u00b7 solid all-round metadata \u2014 72/100",
    "trackId": "B586M6Q",
    "trackTitle": "GET//NASTY (Final)",
    "missionId": "demo-mission-1"
  },
  {
    "id": "demo-tip-6",
    "from": "0x3F0a7D91C4b28e6A5d13F0c8B9e24a7D6c1F8b05",
    "to": "0xe042a04402e85f1321697ef9fa3c9b70d3c2627c",
    "amount": "15",
    "message": "funk forever",
    "txHash": "0x615dcae036c8bd60b518e17ef4e0c5c2da6cebda36a0ab36a61e5c0a7f7de99a",
    "timestamp": 181440000.0,
    "isAgent": false,
    "reason": null,
    "trackId": "g6Vd7k",
    "trackTitle": "Let's Groove (Funky Jazz Soul Type Beat) by Ljazz Beats",
    "missionId": null
  },
  {
    "id": "demo-tip-5",
    "from": "0x9A7c4bE2F3f1D6b8C05aE4d2B71f3c8D9e6A0b42",
    "to": "0x818549a7814a6c9a1ad24eea79bf8bcf99d867d2",
    "amount": "12",
    "message": null,
    "txHash": "0xd080a207a484669b5fdfab39207f192fe898db2bebd168be32e7529f9acb9cc3",
    "timestamp": 164160000.0,
    "isAgent": true,
    "reason": "Indie pop fits your brief \u00b7 recent (2 months ago) \u00b7 well-produced drop (art, notes, tight runtime) \u2014 77/100",
    "trackId": "E2yjEo",
    "trackTitle": "1999 [Indie Pop]",
    "missionId": "demo-mission-1"
  },
  {
    "id": "demo-tip-4",
    "from": "0x51B3c2f6E8a1D4C0b7F29e35A8d6C4b1E2f0A9d3",
    "to": "0x7599abed894a62a01e97ec93d8eade410b600722",
    "amount": "10",
    "message": "ambient snow on repeat",
    "txHash": "0x83c212c6e446fd537fd1d3916f113a40a52c4d5b826b54fbd62ca5fd167c2374",
    "timestamp": 138240000.0,
    "isAgent": false,
    "reason": null,
    "trackId": "mWB22",
    "trackTitle": "Ambient Snow",
    "missionId": null
  },
  {
    "id": "demo-tip-3",
    "from": "0x9A7c4bE2F3f1D6b8C05aE4d2B71f3c8D9e6A0b42",
    "to": "0x839fe9545e3744a8bbd2b1cb639240ffe20722fd",
    "amount": "12",
    "message": null,
    "txHash": "0x58108b3c0820099e15c29de08b5d4c7104ebac826e9c00793de00c8b55d5dd2e",
    "timestamp": 103680000.0,
    "isAgent": true,
    "reason": "hidden gem \u2014 only 487 plays \u00b7 Tech House mood match \u00b7 clean artwork and notes \u2014 79/100",
    "trackId": "Z4MO8z6",
    "trackTitle": "Konzyk - Chamber (FREE DL)",
    "missionId": "demo-mission-1"
  },
  {
    "id": "demo-tip-2",
    "from": "0x3F0a7D91C4b28e6A5d13F0c8B9e24a7D6c1F8b05",
    "to": "0xb115e935ec6baea930998a9c4bd9239adae0ad48",
    "amount": "50",
    "message": "that vocal run at 1:12 \ud83d\ude2e\u200d\ud83d\udca8",
    "txHash": "0x53ce2a1b2a64559c49f70a953d3218946c994c842cf6143ddc7006ccccd6dcb2",
    "timestamp": 86400000,
    "isAgent": false,
    "reason": null,
    "trackId": "31ZqXZ",
    "trackTitle": "Loving You Is So Easy",
    "missionId": null
  },
  {
    "id": "demo-tip-0",
    "from": "0x51B3c2f6E8a1D4C0b7F29e35A8d6C4b1E2f0A9d3",
    "to": "0xed2ef16810af3321e3ad66a35e8d16da3848c9e8",
    "amount": "25",
    "message": "study session fuel \ud83d\ude4f",
    "txHash": "0xa98689d7eff4bf6fd0a5ed13b818f7ae2ed2fbf433c78960c3f525752f54e998",
    "timestamp": 57600000,
    "isAgent": false,
    "reason": null,
    "trackId": "2RlV2",
    "trackTitle": "lofi Instrumental Hip Hop Chill Beat",
    "missionId": null
  },
  {
    "id": "demo-tip-1",
    "from": "0x9A7c4bE2F3f1D6b8C05aE4d2B71f3c8D9e6A0b42",
    "to": "0x4145e5e0cd35566866c88d8bfff6503692a39ea1",
    "amount": "18",
    "message": null,
    "txHash": "0x388478f4224133cb055e3d1b539bac9dc382544b40b17b47fcd71b876a272234",
    "timestamp": 43200000,
    "isAgent": true,
    "reason": "Electronic fits the brief \u00b7 2k plays with a strong like-rate \u00b7 fresh drop (3 days ago) \u2014 84/100",
    "trackId": "87GrbyW",
    "trackTitle": "Elastic Illusions",
    "missionId": "demo-mission-1"
  }
];

export const DEMO_MISSIONS: AgentMission[] = [
  {
    "id": "demo-mission-1",
    "prompt": "Tip the best chill tracks right now",
    "status": "done",
    "createdAt": 1794045332320,
    "finishedAt": 1794045340820,
    "considered": 14,
    "selected": 2,
    "tipped": 2,
    "skipped": 12,
    "totalAmount": "30",
    "steps": [
      {
        "stage": "discover",
        "text": "Audius trending + search: \u201cchill\u201d \u2014 14 candidates",
        "detail": "api.audius.co/v1/tracks/trending",
        "at": 1794045333320
      },
      {
        "stage": "evaluate",
        "text": "Scored 14 tracks with rules engine (genre \u00b7 mood \u00b7 engagement \u00b7 craft)",
        "detail": "4 passed the 70/100 bar",
        "at": 1794045335320
      },
      {
        "stage": "relay",
        "text": "Tipped @shrivl 18 $VIBES for \u201cElastic Illusions\u201d",
        "detail": "Electronic fits the brief \u00b7 2k plays with a strong like-rate \u2014 84/100",
        "at": 1794045338320,
        "txHash": "0x5904fd7ad23e9522c27dafa396bb01c34c3faced78fc42c48752f1077720448e",
        "amount": "18"
      },
      {
        "stage": "relay",
        "text": "Tipped @konzyk 12 $VIBES for \u201cKonzyk - Chamber (FREE DL)\u201d",
        "detail": "hidden gem \u2014 only 487 plays \u00b7 clean artwork and notes \u2014 79/100",
        "at": 1794045339820,
        "txHash": "0x1a1cdf750cfe09a4ef9a7ec40a2d7b5e84e985b8a30a7a5a7d239fb9a3d371c3",
        "amount": "12"
      },
      {
        "stage": "skip",
        "text": "Skipped @jyye \u2014 no VibeMusic jar linked to that Audius handle",
        "detail": "Artist needs to claim a jar first",
        "at": 1794045340320
      },
      {
        "stage": "done",
        "text": "Mission complete \u00b7 2 tips \u00b7 30 $VIBES",
        "detail": "gas sponsored by the VibeMusic relayer",
        "at": 1794045340820
      }
    ],
    "evaluator": "rules"
  }
];
