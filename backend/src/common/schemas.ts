import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25)
});

export const dateStringSchema = z.coerce.date();

export const decimalSchema = z.coerce.number().finite().nonnegative();

export function toPagination(query: { page: number; pageSize: number }) {
  return {
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize
  };
}
