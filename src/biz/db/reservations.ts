import { createBusinessRow, deleteBusinessRow, loadBusinessRows, updateBusinessRow } from './entity'
export type ReservationRow = { id: string; business_id: string; requester_id: string | null; guest_name: string; party_size: number; requested_at: string; status: 'new' | 'accepted' | 'declined'; note: string | null }
export const loadReservations = (businessId: string) => loadBusinessRows<ReservationRow>('reservation_requests', businessId)
export const createReservation = (businessId: string, values: Omit<ReservationRow, 'id' | 'business_id'>) => createBusinessRow<ReservationRow>('reservation_requests', businessId, values)
export const updateReservation = (businessId: string, id: string, patch: Partial<ReservationRow>) => updateBusinessRow<ReservationRow>('reservation_requests', businessId, id, patch)
export const deleteReservation = (businessId: string, id: string) => deleteBusinessRow('reservation_requests', businessId, id)
