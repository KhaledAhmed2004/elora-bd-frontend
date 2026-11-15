import data from "@/data/bd-locations.json"

export interface Upazila {
  name: string
  bn?: string
}
export interface District {
  name: string
  bn: string
  upazilas: Upazila[]
}
export interface Division {
  name: string
  bn: string
  districts: District[]
}

/** 8 divisions → 64 districts → upazilas/thanas (incl. Dhaka city thanas) */
export const divisions = data as Division[]

export function getDistricts(division: string | undefined): District[] {
  return divisions.find((d) => d.name === division)?.districts ?? []
}

export function getUpazilas(division: string | undefined, district: string | undefined) {
  return getDistricts(division).find((d) => d.name === district)?.upazilas ?? []
}

/** "Dhaka (ঢাকা)" */
export const withBangla = (item: { name: string; bn?: string }) =>
  item.bn ? `${item.name} (${item.bn})` : item.name
