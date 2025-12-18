import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { infer, z } from "zod";

extendZodWithOpenApi(z);

export const zod = z;
export type { infer as ZodInfer };
