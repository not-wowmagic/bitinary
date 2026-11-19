import { createBusinessRow, deleteBusinessRow, loadBusinessRows, updateBusinessRow } from './entity'
export type BusinessPhotoRow = { id: string; business_id: string; storage_path: string; is_cover: boolean; sort_order: number }
export const loadPhotos = (businessId: string) => loadBusinessRows<BusinessPhotoRow>('business_photos', businessId)
export const createPhoto = (businessId: string, photo: Omit<BusinessPhotoRow, 'id' | 'business_id'>) => createBusinessRow<BusinessPhotoRow>('business_photos', businessId, photo)
export const updatePhoto = (businessId: string, id: string, patch: Partial<BusinessPhotoRow>) => updateBusinessRow<BusinessPhotoRow>('business_photos', businessId, id, patch)
export const deletePhoto = (businessId: string, id: string) => deleteBusinessRow('business_photos', businessId, id)
