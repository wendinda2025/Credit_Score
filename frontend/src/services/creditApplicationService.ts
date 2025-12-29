/**
 * Service de gestion des demandes de crédit
 */
import api from './api'
import { CreditApplication, PaginationParams } from '@/types'

export const creditApplicationService = {
  async getAll(
    params?: PaginationParams & { client_id?: number; status?: string }
  ): Promise<CreditApplication[]> {
    const response = await api.get<CreditApplication[]>('/credit-applications/', { params })
    return response.data
  },

  async getById(id: number): Promise<CreditApplication> {
    const response = await api.get<CreditApplication>(`/credit-applications/${id}`)
    return response.data
  },

  async create(data: Partial<CreditApplication>): Promise<CreditApplication> {
    const response = await api.post<CreditApplication>('/credit-applications/', data)
    return response.data
  },

  async update(id: number, data: Partial<CreditApplication>): Promise<CreditApplication> {
    const response = await api.put<CreditApplication>(`/credit-applications/${id}`, data)
    return response.data
  },

  async submit(id: number): Promise<CreditApplication> {
    const response = await api.post<CreditApplication>(`/credit-applications/${id}/submit`)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/credit-applications/${id}`)
  },
}
