import { z } from "zod";
import { Types } from "mongoose";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import Config from "./config";
import { MimeType } from "./types";

extendZodWithOpenApi(z);

const zodObjectId = () => {
    return z
        .string()
        .min(24)
        .refine((val) => Types.ObjectId.isValid(val), {
            message: "Must be a valid ObjectId",
        })
        .transform((val) => new Types.ObjectId(val));
};

const fileRuntimeSchema = (
    acceptedMimetypes: string[] | null = null,
    maxSize: number = Config.FILEUPLOAD_MAX_SIZE
) => {
    acceptedMimetypes = acceptedMimetypes || [MimeType.JPEG, MimeType.PNG];
    return z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string().refine((val) => acceptedMimetypes.includes(val)),
        size: z
            .number()
            .max(maxSize * 1024 * 1024, `File must be ≤${maxSize}MB`),
        buffer: z.instanceof(Buffer),
    });
};

const zodFile = (
    description: string,
    acceptedMimetypes: string[] | null = null,
    maxSize: number = Config.FILEUPLOAD_MAX_SIZE
) => {
    return z
        .string()
        .transform((val) => {
            const rs = fileRuntimeSchema(acceptedMimetypes, maxSize);
            const result = rs.safeParse(val);
            if (!result.success) {
                throw new Error("Invalid file upload");
            }
            return result.data;
        })
        .openapi({
            type: "string",
            format: "binary",
            description,
        });
};

export { z, zodObjectId, zodFile };
