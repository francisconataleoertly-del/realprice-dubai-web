// France POI data: ~120 real points of interest across 6 categories
// Sources: official open data (Wikipedia, BAN, IGN, RATP, SNCF), public domain
// Future: dynamic Google Places API calls + Géorisques + Transport.data.gouv.fr

export interface POIItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
}

export interface LayerDef {
  key: string;
  label: string;
  emoji: string;
  color: string;
  items: POIItem[];
}

const tgv: POIItem[] = [
  { id: "tgv0", name: "Paris Gare de Lyon", lat: 48.8443, lng: 2.3736, category: "tgv" },
  { id: "tgv1", name: "Paris Gare du Nord", lat: 48.8809, lng: 2.3553, category: "tgv" },
  { id: "tgv2", name: "Paris Gare Montparnasse", lat: 48.8410, lng: 2.3220, category: "tgv" },
  { id: "tgv3", name: "Paris Gare de l'Est", lat: 48.8767, lng: 2.3590, category: "tgv" },
  { id: "tgv4", name: "Lyon Part-Dieu", lat: 45.7607, lng: 4.8595, category: "tgv" },
  { id: "tgv5", name: "Marseille Saint-Charles", lat: 43.3026, lng: 5.3806, category: "tgv" },
  { id: "tgv6", name: "Lille Europe", lat: 50.6386, lng: 3.0750, category: "tgv" },
  { id: "tgv7", name: "Bordeaux Saint-Jean", lat: 44.8261, lng: -0.5566, category: "tgv" },
  { id: "tgv8", name: "Nantes", lat: 47.2178, lng: -1.5419, category: "tgv" },
  { id: "tgv9", name: "Toulouse Matabiau", lat: 43.6111, lng: 1.4536, category: "tgv" },
  { id: "tgv10", name: "Strasbourg", lat: 48.5853, lng: 7.7349, category: "tgv" },
  { id: "tgv11", name: "Rennes", lat: 48.1037, lng: -1.6724, category: "tgv" },
  { id: "tgv12", name: "Nice Ville", lat: 43.7045, lng: 7.2614, category: "tgv" },
  { id: "tgv13", name: "Montpellier Sud de France", lat: 43.5814, lng: 3.9239, category: "tgv" },
  { id: "tgv14", name: "Avignon TGV", lat: 43.9209, lng: 4.7857, category: "tgv" },
  { id: "tgv15", name: "Reims", lat: 49.2599, lng: 4.0249, category: "tgv" },
  { id: "tgv16", name: "Dijon-Ville", lat: 47.3236, lng: 5.0271, category: "tgv" },
  { id: "tgv17", name: "Tours", lat: 47.3899, lng: 0.6938, category: "tgv" },
  { id: "tgv18", name: "Grenoble", lat: 45.1912, lng: 5.7141, category: "tgv" },
  { id: "tgv19", name: "Le Mans", lat: 47.9954, lng: 0.1934, category: "tgv" },
];

const metro: POIItem[] = [
  { id: "m0", name: "Châtelet", lat: 48.8584, lng: 2.3475, category: "metro" },
  { id: "m1", name: "Châtelet-Les Halles", lat: 48.8617, lng: 2.3471, category: "metro" },
  { id: "m2", name: "République", lat: 48.8676, lng: 2.3635, category: "metro" },
  { id: "m3", name: "Bastille", lat: 48.8530, lng: 2.3691, category: "metro" },
  { id: "m4", name: "Nation", lat: 48.8484, lng: 2.3960, category: "metro" },
  { id: "m5", name: "Opéra", lat: 48.8709, lng: 2.3325, category: "metro" },
  { id: "m6", name: "Concorde", lat: 48.8657, lng: 2.3211, category: "metro" },
  { id: "m7", name: "Charles de Gaulle - Étoile", lat: 48.8744, lng: 2.2950, category: "metro" },
  { id: "m8", name: "Trocadéro", lat: 48.8631, lng: 2.2868, category: "metro" },
  { id: "m9", name: "Saint-Michel", lat: 48.8536, lng: 2.3437, category: "metro" },
  { id: "m10", name: "Odéon", lat: 48.8517, lng: 2.3389, category: "metro" },
  { id: "m11", name: "Saint-Germain-des-Prés", lat: 48.8538, lng: 2.3338, category: "metro" },
  { id: "m12", name: "Pigalle", lat: 48.8826, lng: 2.3375, category: "metro" },
  { id: "m13", name: "Abbesses", lat: 48.8845, lng: 2.3387, category: "metro" },
  { id: "m14", name: "Belleville", lat: 48.8722, lng: 2.3766, category: "metro" },
  { id: "m15", name: "Père Lachaise", lat: 48.8631, lng: 2.3879, category: "metro" },
  { id: "m16", name: "Gambetta", lat: 48.8654, lng: 2.3987, category: "metro" },
  { id: "m17", name: "Place d'Italie", lat: 48.8313, lng: 2.3556, category: "metro" },
  { id: "m18", name: "Montparnasse-Bienvenüe", lat: 48.8425, lng: 2.3219, category: "metro" },
  { id: "m19", name: "Invalides", lat: 48.8597, lng: 2.3144, category: "metro" },
  { id: "m20", name: "École Militaire", lat: 48.8550, lng: 2.3066, category: "metro" },
  { id: "m21", name: "La Défense", lat: 48.8918, lng: 2.2381, category: "metro" },
  { id: "m22", name: "Bibliothèque François Mitterrand", lat: 48.8298, lng: 2.3760, category: "metro" },
  { id: "m23", name: "Stalingrad", lat: 48.8843, lng: 2.3680, category: "metro" },
  { id: "m24", name: "Jaurès", lat: 48.8830, lng: 2.3713, category: "metro" },
];

const airport: POIItem[] = [
  { id: "a0", name: "Paris CDG", lat: 49.0097, lng: 2.5479, category: "airport" },
  { id: "a1", name: "Paris Orly", lat: 48.7233, lng: 2.3794, category: "airport" },
  { id: "a2", name: "Paris-Beauvais", lat: 49.4544, lng: 2.1128, category: "airport" },
  { id: "a3", name: "Lyon Saint-Exupéry", lat: 45.7256, lng: 5.0811, category: "airport" },
  { id: "a4", name: "Marseille Provence", lat: 43.4393, lng: 5.2214, category: "airport" },
  { id: "a5", name: "Nice Côte d'Azur", lat: 43.6584, lng: 7.2158, category: "airport" },
  { id: "a6", name: "Toulouse-Blagnac", lat: 43.6293, lng: 1.3638, category: "airport" },
  { id: "a7", name: "Bordeaux-Mérignac", lat: 44.8283, lng: -0.7156, category: "airport" },
  { id: "a8", name: "Nantes Atlantique", lat: 47.1532, lng: -1.6107, category: "airport" },
  { id: "a9", name: "Strasbourg-Entzheim", lat: 48.5383, lng: 7.6280, category: "airport" },
  { id: "a10", name: "Lille-Lesquin", lat: 50.5633, lng: 3.0894, category: "airport" },
  { id: "a11", name: "Montpellier-Méditerranée", lat: 43.5762, lng: 3.9630, category: "airport" },
  { id: "a12", name: "Rennes Saint-Jacques", lat: 48.0695, lng: -1.7348, category: "airport" },
  { id: "a13", name: "Biarritz Pays Basque", lat: 43.4684, lng: -1.5311, category: "airport" },
  { id: "a14", name: "Ajaccio Napoléon Bonaparte", lat: 41.9236, lng: 8.8029, category: "airport" },
];

const university: POIItem[] = [
  { id: "u0", name: "Sorbonne Université", lat: 48.8467, lng: 2.3441, category: "university" },
  { id: "u1", name: "École Polytechnique", lat: 48.7144, lng: 2.2125, category: "university" },
  { id: "u2", name: "HEC Paris", lat: 48.7569, lng: 2.1693, category: "university" },
  { id: "u3", name: "Sciences Po Paris", lat: 48.8540, lng: 2.3286, category: "university" },
  { id: "u4", name: "École Normale Supérieure", lat: 48.8420, lng: 2.3445, category: "university" },
  { id: "u5", name: "Université Paris-Saclay", lat: 48.7106, lng: 2.1656, category: "university" },
  { id: "u6", name: "Université Paris Cité", lat: 48.8270, lng: 2.3818, category: "university" },
  { id: "u7", name: "Sciences Po Lyon", lat: 45.7506, lng: 4.8358, category: "university" },
  { id: "u8", name: "ENS Lyon", lat: 45.7286, lng: 4.8275, category: "university" },
  { id: "u9", name: "INSA Lyon", lat: 45.7833, lng: 4.8758, category: "university" },
  { id: "u10", name: "Aix-Marseille Université", lat: 43.5247, lng: 5.4400, category: "university" },
  { id: "u11", name: "Université de Toulouse", lat: 43.6044, lng: 1.4377, category: "university" },
  { id: "u12", name: "Université de Bordeaux", lat: 44.8049, lng: -0.5965, category: "university" },
  { id: "u13", name: "Université de Strasbourg", lat: 48.5797, lng: 7.7656, category: "university" },
  { id: "u14", name: "EM Lyon Business School", lat: 45.7811, lng: 4.7724, category: "university" },
  { id: "u15", name: "ESSEC Business School", lat: 49.0341, lng: 2.0747, category: "university" },
];

const monument: POIItem[] = [
  { id: "mo0", name: "Tour Eiffel", lat: 48.8584, lng: 2.2945, category: "monument" },
  { id: "mo1", name: "Notre-Dame de Paris", lat: 48.8530, lng: 2.3499, category: "monument" },
  { id: "mo2", name: "Musée du Louvre", lat: 48.8606, lng: 2.3376, category: "monument" },
  { id: "mo3", name: "Arc de Triomphe", lat: 48.8738, lng: 2.2950, category: "monument" },
  { id: "mo4", name: "Sacré-Cœur", lat: 48.8867, lng: 2.3431, category: "monument" },
  { id: "mo5", name: "Panthéon", lat: 48.8462, lng: 2.3464, category: "monument" },
  { id: "mo6", name: "Musée d'Orsay", lat: 48.8600, lng: 2.3266, category: "monument" },
  { id: "mo7", name: "Centre Pompidou", lat: 48.8607, lng: 2.3522, category: "monument" },
  { id: "mo8", name: "Château de Versailles", lat: 48.8049, lng: 2.1204, category: "monument" },
  { id: "mo9", name: "Mont Saint-Michel", lat: 48.6361, lng: -1.5115, category: "monument" },
  { id: "mo10", name: "Pont du Gard", lat: 43.9474, lng: 4.5350, category: "monument" },
  { id: "mo11", name: "Cité de Carcassonne", lat: 43.2061, lng: 2.3636, category: "monument" },
  { id: "mo12", name: "Vieux Port (Marseille)", lat: 43.2956, lng: 5.3733, category: "monument" },
  { id: "mo13", name: "Promenade des Anglais (Nice)", lat: 43.6943, lng: 7.2530, category: "monument" },
  { id: "mo14", name: "Cathédrale de Strasbourg", lat: 48.5818, lng: 7.7509, category: "monument" },
  { id: "mo15", name: "Place du Capitole (Toulouse)", lat: 43.6043, lng: 1.4437, category: "monument" },
  { id: "mo16", name: "Place de la Bourse (Bordeaux)", lat: 44.8412, lng: -0.5704, category: "monument" },
  { id: "mo17", name: "Vieux Lyon", lat: 45.7625, lng: 4.8275, category: "monument" },
];

const hospital: POIItem[] = [
  { id: "h0", name: "Hôpital Pitié-Salpêtrière", lat: 48.8389, lng: 2.3653, category: "hospital" },
  { id: "h1", name: "Hôpital Necker-Enfants Malades", lat: 48.8466, lng: 2.3169, category: "hospital" },
  { id: "h2", name: "Hôpital Cochin", lat: 48.8364, lng: 2.3404, category: "hospital" },
  { id: "h3", name: "Hôpital Saint-Louis", lat: 48.8729, lng: 2.3686, category: "hospital" },
  { id: "h4", name: "Hôpital Européen Georges-Pompidou", lat: 48.8395, lng: 2.2731, category: "hospital" },
  { id: "h5", name: "Hôpital Bichat", lat: 48.8987, lng: 2.3296, category: "hospital" },
  { id: "h6", name: "Hôpital Tenon", lat: 48.8669, lng: 2.4006, category: "hospital" },
  { id: "h7", name: "Hôpital Lariboisière", lat: 48.8836, lng: 2.3543, category: "hospital" },
  { id: "h8", name: "Hôpital Edouard-Herriot (Lyon)", lat: 45.7444, lng: 4.8523, category: "hospital" },
  { id: "h9", name: "Hôpital Lyon-Sud", lat: 45.6899, lng: 4.7929, category: "hospital" },
  { id: "h10", name: "AP-HM La Timone (Marseille)", lat: 43.2870, lng: 5.4015, category: "hospital" },
  { id: "h11", name: "CHU de Toulouse", lat: 43.5598, lng: 1.4441, category: "hospital" },
  { id: "h12", name: "CHU de Bordeaux", lat: 44.8233, lng: -0.6041, category: "hospital" },
  { id: "h13", name: "CHU de Nantes", lat: 47.2310, lng: -1.5526, category: "hospital" },
  { id: "h14", name: "CHRU de Strasbourg", lat: 48.5680, lng: 7.7298, category: "hospital" },
  { id: "h15", name: "CHU de Nice", lat: 43.7032, lng: 7.2723, category: "hospital" },
];

export const LAYER_DEFS: LayerDef[] = [
  { key: "tgv", label: "TGV Stations", emoji: "🚄", color: "#3b82f6", items: tgv },
  { key: "metro", label: "Métro Paris", emoji: "🚇", color: "#10b981", items: metro },
  { key: "airport", label: "Airports", emoji: "✈️", color: "#f59e0b", items: airport },
  { key: "university", label: "Universities", emoji: "🎓", color: "#8b5cf6", items: university },
  { key: "monument", label: "Monuments", emoji: "🏛", color: "#ec4899", items: monument },
  { key: "hospital", label: "Hospitals", emoji: "🏥", color: "#ef4444", items: hospital },
];
