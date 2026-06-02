import httpClient from './base/httpClient';
import { handleError, mapResponse } from './base/serviceBase';

export async function createOrder(orderData) {
  try {
    const response = await httpClient.post('/pos/orders', orderData);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getOrders(params) {
  try {
    const response = await httpClient.get('/pos/orders', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getOrderById(id) {
  try {
    const response = await httpClient.get(`/pos/orders/${id}`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function updateOrderStatus(id, status) {
  try {
    const response = await httpClient.patch(`/pos/orders/${id}/status`, { status });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function voidOrder(id, reason) {
  try {
    const response = await httpClient.post(`/pos/orders/${id}/void`, { reason });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function holdOrder(id) {
  try {
    const response = await httpClient.post(`/pos/orders/${id}/hold`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getHoldOrders() {
  try {
    const response = await httpClient.get('/pos/orders/holds');
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function processPayment(orderId, paymentData) {
  try {
    const response = await httpClient.post(`/pos/orders/${orderId}/payment`, paymentData);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function splitBill(orderId, splits) {
  try {
    const response = await httpClient.post(`/pos/orders/${orderId}/split`, { splits });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function applyDiscount(orderId, discountData) {
  try {
    const response = await httpClient.post(`/pos/orders/${orderId}/discount`, discountData);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export const posService = { createOrder, getOrders, getOrderById, updateOrderStatus, voidOrder, holdOrder, getHoldOrders, processPayment, splitBill, applyDiscount }
