import { Request } from "express";

import { ContentType } from "../../types";

export const isMultipartFormData = (req: Request): boolean => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.startsWith(ContentType.multipartFormData)) {
        return true;
    }
    return false;
};
