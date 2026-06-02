import httpClient from './base/httpClient';
import { handleError, mapResponse } from './base/serviceBase';

export async function getRecipes(params) {
  try {
    const response = await httpClient.get('/recipes', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getRecipeById(id) {
  try {
    const response = await httpClient.get(`/recipes/${id}`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function createRecipe(data) {
  try {
    const response = await httpClient.post('/recipes', data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function updateRecipe(id, data) {
  try {
    const response = await httpClient.put(`/recipes/${id}`, data);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function deleteRecipe(id) {
  try {
    const response = await httpClient.delete(`/recipes/${id}`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function calculateCost(recipeId) {
  try {
    const response = await httpClient.get(`/recipes/${recipeId}/cost`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getMenuEngineering(params) {
  try {
    const response = await httpClient.get('/recipes/menu-engineering', { params });
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export async function getSubRecipes(recipeId) {
  try {
    const response = await httpClient.get(`/recipes/${recipeId}/sub-recipes`);
    return mapResponse(response);
  } catch (error) {
    throw handleError(error);
  }
}

export const recipesService = { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, calculateCost, getMenuEngineering, getSubRecipes }
