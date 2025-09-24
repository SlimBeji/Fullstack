import type { AxiosInstance } from "axios";
import axios from "axios";

import type { HeaderContent } from "../../types";
import { getToken } from "./storage";

export const getClient = (
    contentType: HeaderContent = "application/json"
): AxiosInstance => {
    const token = getToken();
    const headers = {
        "Content-Type": contentType,
        ...(token && { Authorization: token }),
    };

    return axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_URL}`,
        headers,
    });
};

export const backendApi = getClient();
