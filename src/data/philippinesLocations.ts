import locations from "./philippinesLocations.json"

// PSGC locality and province data is vendored from its public API.
type ProvinceRecord = { code: string; name: string; regionCode: string }

type LocalityRecord = {
  code: string
  name: string
  provinceCode: string | null
  regionCode: string
  isCity: boolean
  isMunicipality: boolean
}

type RegionRecord = { code: string; name: string }

const provinces = locations.provinces as ProvinceRecord[]

const localities = locations.localities as LocalityRecord[]

const regions = locations.regions as RegionRecord[]

const provinceNames = new Map(
  provinces.map((province) => [province.code, province.name]),
)

const regionNames = new Map(regions.map((region) => [region.code, region.name]))

export type PHLocality = {
  code: string
  name: string
  province: string
  isCity: boolean
}

export const PH_LOCALITIES: PHLocality[] = localities.map((locality) => ({
  code: locality.code,

  name: locality.name
    .replace(/^City of (.+)$/i, (_, name: string) =>
      name.toLowerCase() === "manila" ? name : `${name} City`,
    )
    .replace(/^Municipality of /i, ""),

  province:
    (locality.provinceCode && provinceNames.get(locality.provinceCode)) ||
    (locality.regionCode === "130000000"
      ? "Metro Manila"
      : `Independent cities — ${regionNames.get(locality.regionCode) ?? "Philippines"}`),

  isCity: locality.isCity,
}))

export const PH_PROVINCES = [
  ...new Set([
    ...provinces.map((province) => province.name),
    "Metro Manila",
    ...PH_LOCALITIES.filter((locality) =>
      locality.province.startsWith("Independent cities"),
    ).map((locality) => locality.province),
  ]),
].sort((a, b) => a.localeCompare(b))

export function formatPHLocality(locality: PHLocality) {
  return `${locality.name}, ${locality.province}`
}

export function findPHLocality(value: string) {
  const normalized = value.trim().toLocaleLowerCase()

  if (
    PH_PROVINCES.some((province) => province.toLocaleLowerCase() === normalized)
  )
    return undefined

  return PH_LOCALITIES.find((locality) => {
    const name = locality.name.toLocaleLowerCase()

    return (
      formatPHLocality(locality).toLocaleLowerCase() === normalized ||
      name === normalized ||
      name.replace(/ city$/, "") === normalized
    )
  })
}
