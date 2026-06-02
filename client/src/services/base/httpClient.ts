import axios, { AxiosError } from 'axios'
import { BASE_URL, TIMEOUT } from '../../config/api'

interface CustomError extends AxiosError {
  isNetworkError?: boolean
}

const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem('token')
    if (token) reqConfig.headers.Authorization = `Bearer ${token}`
    return reqConfig
  },
  (error) => Promise.reject(error),
)

httpClient.interceptors.response.use(
  (response) => response,
  (error: CustomError) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    if (!error.response) error.isNetworkError = true
    return Promise.reject(error)
  },
)

export default httpClient
