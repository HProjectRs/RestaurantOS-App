import httpClient from './base/httpClient';
import { handleError, mapResponse } from './base/serviceBase';

export async function getSuppliers(params) {
  try {
    const response = await httpClient.get('/suppliers', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createSupplier(data) {
  try {
    const response = await httpClient.post('/suppliers', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function updateSupplier(id, data) {
  try {
    const response = await httpClient.put(`/suppliers/${id}`, data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getPurchaseOrders(params) {
  try {
    const response = await httpClient.get('/suppliers/purchase-orders', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createPO(data) {
  try {
    const response = await httpClient.post('/suppliers/purchase-orders', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function receivePO(id, receivingData) {
  try {
    const response = await httpClient.post(`/suppliers/purchase-orders/${id}/receive`, receivingData);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function verifyThreeWayMatch(poId, receivingId, invoiceId) {
  try {
    const response = await httpClient.post('/suppliers/three-way-match', { poId, receivingId, invoiceId });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function comparePrices(supplierId, items) {
  try {
    const response = await httpClient.post(`/suppliers/${supplierId}/compare-prices`, { items });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export const suppliersService = { getSuppliers, createSupplier, updateSupplier, getPurchaseOrders, createPO, receivePO, verifyThreeWayMatch, comparePrices }
