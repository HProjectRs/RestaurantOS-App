import httpClient from './base/httpClient';
import { handleError, mapResponse } from './base/serviceBase';

export async function getSettings() {
  try {
    const response = await httpClient.get('/settings');
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function updateSettings(data) {
  try {
    const response = await httpClient.put('/settings', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getUsers(params) {
  try {
    const response = await httpClient.get('/settings/users', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createUser(data) {
  try {
    const response = await httpClient.post('/settings/users', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function updateUser(id, data) {
  try {
    const response = await httpClient.put(`/settings/users/${id}`, data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function deleteUser(id) {
  try {
    const response = await httpClient.delete(`/settings/users/${id}`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getRoles() {
  try {
    const response = await httpClient.get('/settings/roles');
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createRole(data) {
  try {
    const response = await httpClient.post('/settings/roles', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getBackups() {
  try {
    const response = await httpClient.get('/settings/backups');
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createBackup() {
  try {
    const response = await httpClient.post('/settings/backups');
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function restoreBackup(backupId) {
  try {
    const response = await httpClient.post(`/settings/backups/${backupId}/restore`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export const settingsService = { getSettings, updateSettings, getUsers, createUser, updateUser, deleteUser, getRoles, createRole, getBackups, createBackup, restoreBackup }
