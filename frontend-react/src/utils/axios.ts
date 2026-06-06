import type { AxiosInstance } from "axios";
import axios from "axios";

import { getToken } from "@/storage";
import type { HeaderContent } from "@/types";

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
