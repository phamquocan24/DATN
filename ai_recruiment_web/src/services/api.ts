import axios, {AxiosError} from 'axios';
import {ErrorResponse} from "react-router-dom";

const apiClient = axios.create({
  baseURL: 'https://topcv.click/api-docs/#/api/v1',
  timeout: 10000,
  withCredentials: false,
});

apiClient.interceptors.request.use((config: any) => {
  // @todo: get access token
  const accessToken = '';
  return {
    ...config,
    headers: {
      Authorization: `Bearer ${accessToken || ""}`,
      ...config.headers,
    },
  };
});

apiClient.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError<ErrorResponse>) => {
      if (!error.response || !error.response?.data) {
        return Promise.reject({
          code: "Unknown",
          errors: {
            code: "Unknown",
            message: "Server error",
            status: 500,
          },
          message: "Server error",
        });
      }
      return Promise.reject({
        ...error.response?.data,
      });
    },
);

export default apiClient;