import httpClient from './base/httpClient';
import { handleError, mapResponse } from './base/serviceBase';

export async function getSalesReport(params) {
  try {
    const response = await httpClient.get('/reports/sales', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getInventoryReport(params) {
  try {
    const response = await httpClient.get('/reports/inventory', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getHRReport(params) {
  try {
    const response = await httpClient.get('/reports/hr', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getMenuMix(params) {
  try {
    const response = await httpClient.get('/reports/menu-mix', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getVarianceReport(params) {
  try {
    const response = await httpClient.get('/reports/variance', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getReportsDashboard() {
  try {
    const response = await httpClient.get('/reports/dashboard');
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export const reportsService = { getSalesReport, getInventoryReport, getHRReport, getMenuMix, getVarianceReport, getReportsDashboard }
