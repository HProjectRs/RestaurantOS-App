import httpClient from './base/httpClient';
import { handleError, mapResponse } from './base/serviceBase';

export async function getJournalEntries(params) {
  try {
    const response = await httpClient.get('/accounting/journal', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createJournalEntry(data) {
  try {
    const response = await httpClient.post('/accounting/journal', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getChartOfAccounts() {
  try {
    const response = await httpClient.get('/accounting/chart-of-accounts');
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createAccount(data) {
  try {
    const response = await httpClient.post('/accounting/chart-of-accounts', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getPLStatement(params) {
  try {
    const response = await httpClient.get('/accounting/pl-statement', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getBalanceSheet(params) {
  try {
    const response = await httpClient.get('/accounting/balance-sheet', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getCashFlow(params) {
  try {
    const response = await httpClient.get('/accounting/cash-flow', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getTaxReport(params) {
  try {
    const response = await httpClient.get('/accounting/tax-report', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export const accountingService = { getJournalEntries, createJournalEntry, getChartOfAccounts, createAccount, getPLStatement, getBalanceSheet, getCashFlow, getTaxReport }
