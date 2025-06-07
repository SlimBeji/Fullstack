import { z } from "zod";
import { Types } from "mongoose";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

const zodObjectId = () => {
    return z
        .string()
        .min(24)
        .refine((val) => Types.ObjectId.isValid(val), {
            message: "Must be a valid ObjectId",
        })
        .transform((val) => new Types.ObjectId(val));
};

extendZodWithOpenApi(z);

export { z, zodObjectId };
