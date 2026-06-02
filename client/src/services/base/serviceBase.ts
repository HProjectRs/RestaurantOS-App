import httpClient from './httpClient';
import { AxiosError, AxiosResponse } from 'axios';

export interface ServiceError {
  type: string
  message: string
  original?: unknown
}

export const ErrorType = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  BUSINESS: 'BUSINESS',
  UNKNOWN: 'UNKNOWN',
}

export function handleError(error: unknown): ServiceError {
  const axiosError = error as AxiosError<{ message?: string }>
  if (!axiosError.response) {
    return { type: ErrorType.NETWORK, message: 'Network error. Please check your connection.', original: error }
  }
  const { status } = axiosError.response
  if (status === 401 || status === 403) {
    return { type: ErrorType.AUTH, message: axiosError.response.data?.message || 'Authentication failed.', original: error }
  }
  if (status >= 400 && status < 500) {
    return { type: ErrorType.BUSINESS, message: axiosError.response.data?.message || 'Request failed.', original: error }
  }
  return { type: ErrorType.UNKNOWN, message: axiosError.message || 'An unexpected error occurred.', original: error }
}

export function mapResponse<T = unknown>(response: AxiosResponse<T>): T {
  return response.data
}

export function createService(endpoint: string) {
  return {
    async get<T = unknown>(params?: Record<string, unknown>): Promise<T> {
      try {
        const response = await httpClient.get(endpoint, { params })
        return mapResponse<T>(response)
      } catch (error) {
        throw handleError(error)
      }
    },

    async getById<T = unknown>(id: string | number): Promise<T> {
      try {
        const response = await httpClient.get(`${endpoint}/${id}`)
        return mapResponse<T>(response)
      } catch (error) {
        throw handleError(error)
      }
    },

    async create<T = unknown, D = unknown>(data: D): Promise<T> {
      try {
        const response = await httpClient.post(endpoint, data)
        return mapResponse<T>(response)
      } catch (error) {
        throw handleError(error)
      }
    },

    async update<T = unknown, D = unknown>(id: string | number, data: D): Promise<T> {
      try {
        const response = await httpClient.put(`${endpoint}/${id}`, data)
        return mapResponse<T>(response)
      } catch (error) {
        throw handleError(error)
      }
    },

    async delete<T = unknown>(id: string | number): Promise<T> {
      try {
        const response = await httpClient.delete(`${endpoint}/${id}`)
        return mapResponse<T>(response)
      } catch (error) {
        throw handleError(error)
      }
    },
  }
}

export const serviceBase = { ErrorType, handleError, mapResponse, createService }
