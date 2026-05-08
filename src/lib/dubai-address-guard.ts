type AddressComponentLike = {
  types?: string[];
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
};

const BLOCKED_TEXT_RE =
  /\b(bridge|station|metro|airport|tram|bus station|train station|subway|monorail)\b/i;

const ADDRESS_HINT_RE =
  /\b(street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|circle|way|tower|residence|residences|building|villa|apartment|unit|phase|block)\b/i;

const ADDRESSLIKE_TYPES = new Set(["street_address", "premise", "subpremise", "route"]);
const PURE_POI_TYPES = new Set([
  "transit_station",
  "train_station",
  "subway_station",
  "bus_station",
  "airport",
  "plus_code",
]);
const LOCALITY_TYPES = new Set([
  "locality",
  "sublocality",
  "sublocality_level_1",
  "sublocality_level_2",
  "neighborhood",
  "administrative_area_level_2",
]);

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function flattenComponentTypes(components: AddressComponentLike[] | null | undefined) {
  return (components || []).flatMap((component) =>
    Array.isArray(component.types)
      ? component.types.map((type) => String(type || "").toLowerCase())
      : []
  );
}

export function isLikelyDubaiAddressText(value: unknown) {
  const text = String(value ?? "").trim();
  if (text.length < 6) return false;
  if (BLOCKED_TEXT_RE.test(text)) return false;
  if (/\d/.test(text)) return true;
  if (ADDRESS_HINT_RE.test(text)) return true;

  const normalized = normalizeText(text);
  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  return parts.length >= 2 && wordCount >= 4;
}

export function validateDubaiAddressSelection(input: {
  formattedAddress?: string | null;
  name?: string | null;
  placeTypes?: string[] | null;
  components?: AddressComponentLike[] | null;
}) {
  const formattedAddress = String(input.formattedAddress || "").trim();
  const name = String(input.name || "").trim();
  const sourceText = [formattedAddress, name].filter(Boolean).join(" ");
  const types = new Set((input.placeTypes || []).map((type) => String(type || "").toLowerCase()));
  const componentTypes = new Set(flattenComponentTypes(input.components));

  const hasStreetNumber = componentTypes.has("street_number");
  const hasRoute = componentTypes.has("route");
  const hasPremise = componentTypes.has("premise") || componentTypes.has("subpremise");
  const hasLocality = Array.from(componentTypes).some((type) => LOCALITY_TYPES.has(type));
  const hasAddressLikeType =
    Array.from(types).some((type) => ADDRESSLIKE_TYPES.has(type)) || hasStreetNumber || hasPremise;
  const purePoiOnly =
    Array.from(types).some((type) => PURE_POI_TYPES.has(type)) &&
    !hasAddressLikeType &&
    !hasPremise;

  if (!formattedAddress) {
    return {
      valid: false,
      reason: "Select a real Dubai property address from Google suggestions.",
    };
  }

  if (!isLikelyDubaiAddressText(sourceText || formattedAddress)) {
    return {
      valid: false,
      reason:
        "Use a real Dubai property address or residential building. Stations, bridges and generic landmarks are not supported.",
    };
  }

  if (purePoiOnly) {
    return {
      valid: false,
      reason:
        "This looks like a transit or landmark result, not a property address. Use a real Dubai address or residential building.",
    };
  }

  const looksLikeStreetAddress = hasRoute && (hasStreetNumber || /\d/.test(sourceText));
  const looksLikeBuildingAddress = hasPremise && hasLocality;

  if (!looksLikeStreetAddress && !looksLikeBuildingAddress && !types.has("street_address")) {
    return {
      valid: false,
      reason:
        "Use a precise Dubai property address or residential building name. Broad places and POIs are not accepted.",
    };
  }

  return { valid: true };
}
