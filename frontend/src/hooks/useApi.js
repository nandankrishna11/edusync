/**
 * Generic API hook
 */
import { useState, useEffect } from 'react';
import api from '../api/client';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic API call function
  const apiCall = async (endpoint, requestOptions = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const { method = 'GET', body, headers = {} } = requestOptions;
      
      let response;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      switch (method.toUpperCase()) {
        case 'POST':
          response = await api.post(endpoint, body, config);
          break;
        case 'PUT':
          response = await api.put(endpoint, body, config);
          break;
        case 'DELETE':
          response = await api.delete(endpoint, config);
          break;
        case 'GET':
        default:
          response = await api.get(endpoint, config);
          break;
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url) {
      const fetchData = async () => {
        try {
          const response = await apiCall(url, options);
          setData(response);
        } catch (err) {
          // Error is already handled in apiCall
        }
      };

      fetchData();
    }
  }, [url]);

  const refetch = async () => {
    if (url) {
      try {
        const response = await apiCall(url, options);
        setData(response);
        return response;
      } catch (err) {
        throw err;
      }
    }
  };

  return { data, loading, error, refetch, apiCall };
};

export const useMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (method, url, data = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api[method](url, data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};