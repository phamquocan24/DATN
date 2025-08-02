import apiClient from "./api.ts";

export const getHealth = async () => {
    // @todo: Sau thay any thành type phù hợp với phản hồi của API
    return apiClient.get<any>(`/health`);
};