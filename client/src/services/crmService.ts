import httpClient from './base/httpClient';
import { handleError, mapResponse } from './base/serviceBase';

export async function getCustomers(params) {
  try {
    const response = await httpClient.get('/crm/customers', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getCustomerById(id) {
  try {
    const response = await httpClient.get(`/crm/customers/${id}`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createCustomer(data) {
  try {
    const response = await httpClient.post('/crm/customers', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function addLoyaltyPoints(customerId, points, reason) {
  try {
    const response = await httpClient.post(`/crm/customers/${customerId}/loyalty/add`, { points, reason });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function redeemPoints(customerId, points, orderId) {
  try {
    const response = await httpClient.post(`/crm/customers/${customerId}/loyalty/redeem`, { points, orderId });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getLoyaltyHistory(customerId) {
  try {
    const response = await httpClient.get(`/crm/customers/${customerId}/loyalty/history`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function sendCampaign(campaignData) {
  try {
    const response = await httpClient.post('/crm/campaigns', campaignData);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getCampaigns(params) {
  try {
    const response = await httpClient.get('/crm/campaigns', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getSegments() {
  try {
    const response = await httpClient.get('/crm/segments');
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export const crmService = { getCustomers, getCustomerById, createCustomer, addLoyaltyPoints, redeemPoints, getLoyaltyHistory, sendCampaign, getCampaigns, getSegments }
