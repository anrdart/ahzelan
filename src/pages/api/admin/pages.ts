import { crudHandlers } from "@/lib/api";
export const prerender = false;
export const { GET, POST, PUT, DELETE } = crudHandlers("pages");
