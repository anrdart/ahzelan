import { crudHandlers } from "@/lib/api";
export const prerender = false;
export const { POST, PUT, DELETE } = crudHandlers("packages");
