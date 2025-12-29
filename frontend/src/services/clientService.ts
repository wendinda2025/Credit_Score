/**
 * Service de gestion des clients
 */
import api from './api'
import { Client, PaginationParams } from '@/types'

export const clientService = {
  async getAll(params?: PaginationParams & { search?: string }): Promise<Client[]> {
    const response = await api.get<Client[]>('/clients/', { params })
    return response.data
  },

  async getById(id: number): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`)
    return response.data
  },

  async create(data: Partial<Client>): Promise<Client> {
    const response = await api.post<Client>('/clients/', data)
    return response.data
  },

  async update(id: number, data: Partial<Client>): Promise<Client> {
    const response = await api.put<Client>(`/clients/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/clients/${id}`)
  },
}
