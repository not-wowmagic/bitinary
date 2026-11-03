import { img } from './format'

/** Media can be an Unsplash photo id, a full URL, or a data URL from an upload. */
export const src = (m: string, w = 900, h?: number) => (/^(data:|https?:|blob:)/.test(m) ? m : img(m, w, h))
