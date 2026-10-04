import { api } from "../api/client";

export const getStatistics = () => api.get("/statistics").then((r) => r.data);