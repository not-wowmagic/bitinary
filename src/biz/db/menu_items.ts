import type { MenuItem } from '@/app/account'
import { createBusinessRow, deleteBusinessRow, loadBusinessRows, updateBusinessRow } from './entity'
export type MenuItemRow = { id: string; business_id: string; name: string; price: number; category: string; sort_order: number }
export const loadMenuItems = (businessId: string) => loadBusinessRows<MenuItemRow>('menu_items', businessId)
export const createMenuItem = (businessId: string, item: Omit<MenuItemRow, 'id' | 'business_id'>) => createBusinessRow<MenuItemRow>('menu_items', businessId, item)
export const updateMenuItem = (businessId: string, id: string, patch: Partial<MenuItem>) => updateBusinessRow<MenuItemRow>('menu_items', businessId, id, { ...patch, price: patch.price === undefined ? undefined : Number(patch.price) })
export const deleteMenuItem = (businessId: string, id: string) => deleteBusinessRow('menu_items', businessId, id)
