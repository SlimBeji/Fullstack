import axios, { AxiosInstance } from "axios";
import { HeaderContent } from "../types";

export const getClient = (
    contentType: HeaderContent = "application/json"
): AxiosInstance => {
    return axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_URL}`,
        headers: { "Content-Type": contentType },
    });
};

export const backendApi = getClient();
