"""Generate dubaiPOIs.ts with ~960 POIs from DB + Google Places."""
import json, os

DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(DIR, "extraPOIs.json")) as f:
    extra = json.load(f)

def s(name):
    return ''.join(c if ord(c) < 128 else '' for c in name).replace('"', '\\"').strip() or "POI"

out = open(os.path.join(DIR, "dubaiPOIs.ts"), "w", encoding="utf-8")

out.write('// Dubai POI data: ~960 POIs across 24 categories\n')
out.write('// Sources: PostgreSQL DB (real coords) + Google Places API\n\n')
out.write('export interface POIItem {\n  id: string;\n  name: string;\n  lat: number;\n  lng: number;\n  category: string;\n}\n\n')
out.write('export interface LayerDef {\n  key: string;\n  label: string;\n  emoji: string;\n  color: string;\n  items: POIItem[];\n}\n\n')

def w_tuple(name, data, cat):
    out.write(f"const {name}: POIItem[] = [\n")
    for i, (n, lat, lng) in enumerate(data):
        out.write(f'  {{id:"{cat[:2]}{i}",name:"{s(n)}",lat:{lat},lng:{lng},category:"{cat}"}},\n')
    out.write("];\n\n")

def w_dict(name, items, cat):
    out.write(f"const {name}: POIItem[] = [\n")
    for i, p in enumerate(items):
        out.write(f'  {{id:"{cat[:2]}{i+200}",name:"{s(p["name"])}",lat:{p["lat"]:.6f},lng:{p["lng"]:.6f},category:"{cat}"}},\n')
    out.write("];\n\n")

# Metro (52 from DB)
metro = [
("Abu Baker Al Siddique",25.270903,55.332983),("Abu Hail",25.275241,55.346267),("ADCB",25.244493,55.298195),
("Airport Terminal 1",25.248427,55.352474),("Airport Terminal 3",25.245012,55.359525),("Al Fahidi",25.258301,55.297558),
("Al Furjan",25.030451,55.152194),("Al Ghubaiba",25.265085,55.288953),("Al Jadaf",25.224977,55.333674),
("Al Jafiliya",25.233496,55.292131),("Al Nahda",25.273273,55.369340),("Al Qiyadah",25.277667,55.352764),
("Al Qusais",25.262659,55.387476),("Al Ras",25.268862,55.293727),("Al Rigga",25.263261,55.324122),
("Baniyas Square",25.269415,55.307602),("Burj Khalifa/Dubai Mall",25.201400,55.269518),("BurJuman",25.254855,55.304252),
("Business Bay",25.191274,55.260418),("Creek",25.218948,55.338952),("DAMAC Properties",25.079929,55.147522),
("Danube",25.001291,55.095697),("Deira City Centre",25.254303,55.330077),("Discovery Gardens",25.035224,55.145318),
("DMCC",25.070824,55.138672),("Dubai Healthcare City",25.230903,55.322866),("Dubai Internet City",25.102095,55.173781),
("Dubai Investment Park",25.005796,55.155841),("Emirates",25.241059,55.365726),("Emirates Towers",25.217214,55.279820),
("Energy",25.026290,55.101247),("Etisalat",25.254805,55.401007),("EXPO",24.963368,55.146201),
("Financial Centre",25.211030,55.275586),("First Abu Dhabi Bank",25.126721,55.207898),("GGICO",25.249497,55.340033),
("Gold Souq",25.276195,55.301777),("Ibn Battuta",25.046725,55.117527),("Jabal Ali",25.057853,55.127173),
("Jumeirah Golf Estates",25.017796,55.163351),("Mall of the Emirates",25.121231,55.200443),("Mashreq",25.114809,55.190931),
("Nakheel",25.088916,55.158026),("Noor Bank",25.155727,55.228508),("Oud Metha",25.243667,55.315956),
("Rashidiya",25.230222,55.391198),("Salah Al Din",25.270345,55.320668),("Stadium",25.277802,55.361579),
("The Gardens",25.043438,55.135050),("UAE Exchange",24.977524,55.091040),("Union",25.266335,55.313902),
("World Trade Centre",25.224828,55.285060),
]

tram = [
("Al Sufouh",25.108091,55.165147),("Dubai Marina",25.080803,55.146909),("Dubai Marina Mall",25.076300,55.141974),
("JBR 1",25.079737,55.138232),("JBR 2",25.073813,55.132232),("JLT",25.071480,55.137763),
("Knowledge Village",25.104251,55.161580),("Marina Towers",25.086641,55.150052),("Media City",25.094499,55.151983),
("Mina Seyahi",25.091058,55.148605),("Palm Jumeirah",25.098284,55.155742),
]

w_tuple("metro", metro, "metro")
w_tuple("tram", tram, "tram")

# Static bases
bases = {
    "malls": [("The Dubai Mall",25.1972,55.2796),("Mall of the Emirates",25.1181,55.2004),("Ibn Battuta Mall",25.0443,55.1175),("City Centre Deira",25.2530,55.3310),("City Centre Mirdif",25.2153,55.4085),("Dubai Marina Mall",25.0765,55.1408),("BurJuman Centre",25.2529,55.3023),("The Beach JBR",25.0795,55.1312),("Mercato Mall",25.2162,55.2522),("Nakheel Mall",25.1153,55.1390),("Dubai Festival City",25.2247,55.3530),("Dragon Mart",25.1706,55.4085),("Wafi Mall",25.2306,55.3174)],
    "hotels": [("Atlantis The Royal",25.1386,55.1278),("Bvlgari Resort",25.2107,55.2364),("Atlantis The Palm",25.1304,55.1171),("Four Seasons Jumeirah",25.2023,55.2402),("Banyan Tree",25.0806,55.1207),("Mandarin Oriental Jumeira",25.2169,55.2513),("One&Only Za'abeel",25.2282,55.2907),("Waldorf Astoria Palm",25.1346,55.1511),("Raffles The Palm",25.1104,55.1098),("One&Only Royal Mirage",25.0990,55.1544),("Jumeirah Al Qasr",25.1318,55.1845),("Ritz-Carlton Dubai",25.0825,55.1378),("Palace Downtown",25.1937,55.2757),("FIVE Palm",25.1043,55.1488),("Palazzo Versace",25.2272,55.3419),("Burj Al Arab",25.1412,55.1853)],
    "golf": [("Emirates Golf Club",25.0853,55.1598),("Topgolf Dubai",25.0819,55.1612),("The Track Meydan",25.1668,55.3129),("Dubai Hills Golf",25.1214,55.2642),("Dubai Creek Golf",25.2417,55.3335),("The Els Club",25.0313,55.2180),("Jumeirah Golf Estates",25.0209,55.2002),("Trump Intl Golf",25.0245,55.2541),("Arabian Ranches Golf",25.0515,55.2687),("Montgomerie Golf",25.0674,55.1642)],
    "cinemas": [("Reel Cinemas Dubai Mall",25.1966,55.2811),("Roxy City Walk",25.2072,55.2629),("VOX Mercato",25.2168,55.2524),("Megaplex Grand Hyatt",25.2269,55.3261),("Roxy Dubai Hills",25.1031,55.2380),("VOX Festival City",25.2230,55.3528),("VOX Wafi",25.2306,55.3174),("VOX Mall of Emirates",25.1197,55.2002),("VOX Burjuman",25.2533,55.3025),("VOX City Centre Deira",25.2538,55.3306)],
    "museums": [("Museum of the Future",25.2192,55.2819),("Infinity des Lumieres",25.1976,55.2803),("Al Shindagha Museum",25.2664,55.2894),("Etihad Museum",25.2413,55.2693),("Museum of Illusions",25.2645,55.3038),("ARTE Museum",25.1975,55.2790),("OliOli Children's Museum",25.1706,55.2433),("Coffee Museum",25.2637,55.3001),("Saruq Al Hadid",25.2668,55.2897),("Children's City",25.2361,55.3285)],
    "base_parks": [("Creek Park",25.2247,55.3352),("Safa Park",25.1847,55.2381),("Zabeel Park",25.2280,55.2960),("Al Mamzar Beach",25.2916,55.3470),("Kite Beach",25.1636,55.2040),("La Mer Beach",25.2327,55.2620),("JBR Beach",25.0780,55.1310),("Miracle Garden",25.0637,55.2448),("Mushrif Park",25.2350,55.4200),("Ras Al Khor Wildlife",25.1844,55.3310),("Jumeirah Beach Park",25.2060,55.2354)],
    "base_restaurants": [("CE LA VI",25.2020,55.2707),("Tresind",25.0990,55.1543),("GIA",25.1971,55.2760),("Carnival by Tresind",25.2117,55.2819),("COYA Dubai",25.2024,55.2402),("Pierchic",25.1344,55.1811),("Atmosphere Burj Khalifa",25.1972,55.2746),("Zuma DIFC",25.2101,55.2789),("La Petite Maison",25.2110,55.2780),("Nobu Dubai",25.2150,55.2530),("Hutong",25.2158,55.2807),("Billionaire",25.2034,55.2686)],
    "base_schools": [("Citizens School",25.2092,55.2668),("American Intl School",25.2835,55.3689),("Hartland Intl",25.1785,55.3035),("Nord Anglia",25.0619,55.2269),("JESS Jumeirah",25.1799,55.2436),("Emirates Intl",25.0649,55.1559),("American School",25.0997,55.1829),("GEMS Wellington",25.1181,55.2139),("Dubai College",25.1263,55.2184),("Repton School",25.0482,55.2583)],
    "base_hospitals": [("Aster Hospital",25.2523,55.2887),("King's College",25.1128,55.2550),("American Hospital",25.2354,55.3132),("Mediclinic City",25.2304,55.3227),("Zulekha Hospital",25.2911,55.3844),("Dubai Hospital",25.2854,55.3216),("Rashid Hospital",25.2382,55.3120),("Mediclinic Parkview",25.0654,55.2489),("Iranian Hospital",25.2300,55.2692)],
    "base_mosques": [("DIFC Grand Mosque",25.2084,55.2778),("Grand Zabeel Mosque",25.2237,55.2995),("Al Farooq Omar",25.1716,55.2329),("Jumeirah Mosque",25.2338,55.2655),("Grand Bur Dubai Masjid",25.2642,55.2967),("City Walk Mosque",25.2061,55.2635)],
    "base_attractions": [("Burj Khalifa",25.1972,55.2744),("Ain Dubai",25.0796,55.1189),("Dubai Frame",25.2353,55.3003),("Atlantis The Palm",25.1304,55.1171),("Burj Al Arab",25.1412,55.1853),("Global Village",25.0718,55.3100),("Dubai Aquarium",25.1972,55.2796),("IMG Worlds",25.0493,55.3100),("Ski Dubai",25.1181,55.2004),("Dubai Fountain",25.1956,55.2749),("Atlantis Royal",25.1386,55.1278)],
    "base_supermarkets": [("Waitrose Downtown",25.1970,55.2792),("Carrefour DIFC",25.2088,55.2770),("LuLu Dubai Mall",25.1994,55.2836),("Spinneys Jumeirah",25.2165,55.2523),("Spinneys Downtown",25.2048,55.2756),("Baqer Mohebi Rolla",25.2572,55.2902)],
}

for name, data in bases.items():
    cat = name.replace("base_","")
    if cat.endswith("s"): cat = cat[:-1]
    w_tuple(name, data, cat)

# Extra POIs from Google Places
for key in ("parks","schools","hospitals","mosques","restaurants","attractions","supermarkets"):
    if key in extra:
        w_dict(f"extra_{key}", extra[key], key)

for key in ("cafes","nightlife","gyms","pharmacies","clinics","nurseries","banks","coworking","emergency","embassies","services"):
    if key in extra:
        w_dict(key, extra[key], key)

# LAYER_DEFS
out.write("export const LAYER_DEFS: LayerDef[] = [\n")
layers = [
    ("metro", "Metro & Tram", "\U0001f687", "#ef4444", "[...metro, ...tram]"),
    ("malls", "Shopping Malls", "\U0001f6cd\ufe0f", "#f59e0b", "malls"),
    ("parks", "Parks & Beaches", "\U0001f334", "#10b981", "[...base_parks, ...extra_parks]"),
    ("schools", "Schools & Universities", "\U0001f393", "#8b5cf6", "[...base_schools, ...extra_schools]"),
    ("hospitals", "Hospitals & Clinics", "\U0001f3e5", "#ec4899", "[...base_hospitals, ...extra_hospitals]"),
    ("mosques", "Mosques", "\U0001f54c", "#14b8a6", "[...base_mosques, ...extra_mosques]"),
    ("museums", "Museums", "\U0001f3db\ufe0f", "#a855f7", "museums"),
    ("restaurants", "Restaurants", "\U0001f37d\ufe0f", "#f97316", "[...base_restaurants, ...extra_restaurants]"),
    ("hotels", "Luxury Hotels", "\U0001f3e8", "#eab308", "hotels"),
    ("attractions", "Attractions", "\U0001f3a1", "#06b6d4", "[...base_attractions, ...extra_attractions]"),
    ("golf", "Golf Courses", "\u26f3", "#22c55e", "golf"),
    ("cinemas", "Cinemas", "\U0001f3ac", "#f43f5e", "cinemas"),
    ("supermarkets", "Supermarkets", "\U0001f6d2", "#84cc16", "[...base_supermarkets, ...extra_supermarkets]"),
    ("cafes", "Cafes & Bakeries", "\u2615", "#92400e", "cafes"),
    ("nightlife", "Nightlife & Bars", "\U0001f378", "#7c3aed", "nightlife"),
    ("gyms", "Gyms & Fitness", "\U0001f4aa", "#dc2626", "gyms"),
    ("pharmacies", "Pharmacies", "\U0001f48a", "#059669", "pharmacies"),
    ("clinics", "Clinics", "\U0001fa7a", "#db2777", "clinics"),
    ("nurseries", "Nurseries", "\U0001f476", "#c084fc", "nurseries"),
    ("banks", "Banks & ATMs", "\U0001f3e6", "#0891b2", "banks"),
    ("coworking", "Coworking Spaces", "\U0001f4bb", "#6366f1", "coworking"),
    ("emergency", "Police & Fire", "\U0001f6a8", "#b91c1c", "emergency"),
    ("embassies", "Embassies", "\U0001f3db", "#1d4ed8", "embassies"),
    ("services", "Daily Services", "\U0001f527", "#737373", "services"),
]

for key, label, emoji, color, items_expr in layers:
    out.write(f'  {{ key: "{key}", label: "{label}", emoji: "{emoji}", color: "{color}", items: {items_expr} }},\n')

out.write("];\n")
out.close()

# Stats
with open(os.path.join(DIR, "dubaiPOIs.ts"), encoding="utf-8") as f:
    content = f.read()

count = content.count("id:")
print(f"Generated dubaiPOIs.ts: {count} POIs, {len(content.splitlines())} lines, 24 layers")
