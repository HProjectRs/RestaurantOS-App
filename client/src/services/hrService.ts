import httpClient from './base/httpClient';
import { handleError, mapResponse } from './base/serviceBase';

export async function getEmployees(params) {
  try {
    const response = await httpClient.get('/hr/employees', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createEmployee(data) {
  try {
    const response = await httpClient.post('/hr/employees', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function deleteEmployee(id) {
  try {
    const response = await httpClient.delete(`/hr/employees/${id}`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function updateEmployee(id, data) {
  try {
    const response = await httpClient.put(`/hr/employees/${id}`, data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getAttendance(params) {
  try {
    const response = await httpClient.get('/hr/attendance', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function clockIn(employeeId, data) {
  try {
    const response = await httpClient.post('/hr/attendance/clock-in', { employeeId, ...data });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function clockOut(attendanceId, data) {
  try {
    const response = await httpClient.post(`/hr/attendance/${attendanceId}/clock-out`, data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getLeaves(params) {
  try {
    const response = await httpClient.get('/hr/leaves', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function requestLeave(data) {
  try {
    const response = await httpClient.post('/hr/leaves', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function approveLeave(id, status, comment) {
  try {
    const response = await httpClient.patch(`/hr/leaves/${id}`, { status, comment });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getPayroll(params) {
  try {
    const response = await httpClient.get('/hr/payroll', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function generatePayslip(employeeId, period) {
  try {
    const response = await httpClient.post('/hr/payroll/generate', { employeeId, period });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getAdvances(params) {
  try {
    const response = await httpClient.get('/hr/advances', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function requestAdvance(data) {
  try {
    const response = await httpClient.post('/hr/advances', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export const hrService = { getEmployees, createEmployee, updateEmployee, deleteEmployee, getAttendance, clockIn, clockOut, getLeaves, requestLeave, approveLeave, getPayroll, generatePayslip, getAdvances, requestAdvance }
