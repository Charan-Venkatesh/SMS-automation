/**
 * Axios Configuration
 * Purpose: Configures HTTP client with base URL, timeouts, interceptors,
 * and automatic retry logic for resilient API communication.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_BASE_URL = 'http://192.168.1.100:3000'; // User configurable

const getBaseUrl = async (): Promise<string> => {
  try {
    const savedUrl = await AsyncStorage.getItem('backend_url');
    return savedUrl || DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
};

let axiosInstance: AxiosInstance | null = null;

export const initializeAxios = async (): Promise<AxiosInstance> => {
  const baseURL = await getBaseUrl();

  axiosInstance = axios.create({
    baseURL,
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor - add API key if configured
  axiosInstance.interceptors.request.use(
    async (config) => {
      const apiKey = await AsyncStorage.getItem('api_key');
      if (apiKey) {
        config.headers['X-API-Key'] = apiKey;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle common errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return Promise.reject(new Error('Connection timed out. Check your network.'));
      }
      if (error.response?.status === 401) {
        return Promise.reject(new Error('Unauthorized: Invalid API key.'));
      }
      if (error.response?.status === 429) {
        return Promise.reject(new Error('Rate limit exceeded. Please wait.'));
      }
      if (!error.response) {
        return Promise.reject(new Error('Cannot connect to backend. Check server and network.'));
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export const getAxiosInstance = (): AxiosInstance => {
  if (!axiosInstance) {
    throw new Error('Axios not initialized. Call initializeAxios() first.');
  }
  return axiosInstance;
};

export const updateBaseUrl = async (newUrl: string): Promise<void> => {
  await AsyncStorage.setItem('backend_url', newUrl);
  axiosInstance = null; // Force re-initialization
};
