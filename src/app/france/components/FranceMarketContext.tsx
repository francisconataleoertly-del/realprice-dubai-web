"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type AddressSuggestion,
  dvfFullInseeCode,
} from "./franceBANService";
import {
  lookupDpeByAddress,
  pickPrimaryDpeClass,
  type DpeLookupResult,
} from "./franceADEMEService";
import type { DpeClass } from "./franceDPE";

// Types for the DVF commune record (kept loose to avoid coupling to FranceMarketClient)
type CommuneRecord = {
  commune: string;
  commune_code?: string;
  department_code: string;
  property_type: string;
  transactions: number;
  median_price_per_m2: number;
  median_value_eur: number;
  avg_area_m2: number;
};

type FranceMarketState = {
  // Address state
  addressLabel: string;
  inseeCode: string | null;
  postcode: string | null;
  banId: string | null;
  lat: number | null;
  lon: number | null;
  // DPE state
  dpeClass: DpeClass;
  dpeLookup: DpeLookupResult | null;
  dpeLookupLoading: boolean;
  dpeUserOverride: boolean;
  // DVF match
  matchedRecord: CommuneRecord | undefined;
  // Setters
  setAddressLabel: (s: string) => void;
  selectAddress: (addr: AddressSuggestion) => void;
  setDpeClass: (cls: DpeClass) => void;
};

const FranceMarketContext = createContext<FranceMarketState | null>(null);

export function useFranceMarket(): FranceMarketState | null {
  return useContext(FranceMarketContext);
}

type ProviderProps = {
  children: ReactNode;
  initialAddress?: string;
  // The DVF commune list to match against — passed by the host page so the provider
  // doesn't need to import the JSON itself.
  communeRows: CommuneRecord[];
  propertyType: string;
};

function normalize(s: string) {
  let n = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  n = n
    .replace(/(\d+)(?:er|e|eme|ème)?\s*arrondissement/g, "$1")
    .replace(/(\d+)(?:er|e|eme|ème)\b/g, "$1");
  return n;
}

export function FranceMarketProvider({
  children,
  initialAddress = "Paris 15e Arrondissement",
  communeRows,
  propertyType,
}: ProviderProps) {
  const [addressLabel, setAddressLabel] = useState(initialAddress);
  const [inseeCode, setInseeCode] = useState<string | null>(null);
  const [postcode, setPostcode] = useState<string | null>(null);
  const [banId, setBanId] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [dpeClass, setDpeClassRaw] = useState<DpeClass>("D");
  const [dpeLookup, setDpeLookup] = useState<DpeLookupResult | null>(null);
  const [dpeLookupLoading, setDpeLookupLoading] = useState(false);
  const [dpeUserOverride, setDpeUserOverride] = useState(false);

  // Auto-fetch ADEME DPE when address changes.
  useEffect(() => {
    if (!postcode && !banId) return;
    const controller = new AbortController();
    setDpeLookupLoading(true);
    lookupDpeByAddress(postcode ?? undefined, banId ?? undefined, controller.signal)
      .then((result) => {
        setDpeLookup(result);
        if (!dpeUserOverride) {
          const suggested = pickPrimaryDpeClass(result);
          if (suggested && /^[A-G]$/.test(suggested)) {
            setDpeClassRaw(suggested as DpeClass);
          }
        }
      })
      .finally(() => setDpeLookupLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcode, banId]);

  const matchedRecord = useMemo(() => {
    // 1) Try INSEE code
    if (inseeCode) {
      const found = communeRows.find(
        (row) =>
          row.property_type === propertyType &&
          dvfFullInseeCode(row.department_code, row.commune_code) === inseeCode,
      );
      if (found) return found;
    }
    // 2) Fall back to commune-name match
    const target = normalize(addressLabel);
    return communeRows.find(
      (row) => row.property_type === propertyType && normalize(row.commune) === target,
    );
  }, [communeRows, propertyType, inseeCode, addressLabel]);

  const selectAddress = (addr: AddressSuggestion) => {
    setAddressLabel(addr.label);
    setInseeCode(addr.citycode || null);
    setPostcode(addr.postcode || null);
    setBanId(addr.id || null);
    setLat(addr.lat || null);
    setLon(addr.lon || null);
    setDpeUserOverride(false);
  };

  const setDpeClass = (cls: DpeClass) => {
    setDpeClassRaw(cls);
    setDpeUserOverride(true);
  };

  const value: FranceMarketState = {
    addressLabel,
    inseeCode,
    postcode,
    banId,
    lat,
    lon,
    dpeClass,
    dpeLookup,
    dpeLookupLoading,
    dpeUserOverride,
    matchedRecord,
    setAddressLabel,
    selectAddress,
    setDpeClass,
  };

  return (
    <FranceMarketContext.Provider value={value}>
      {children}
    </FranceMarketContext.Provider>
  );
}
