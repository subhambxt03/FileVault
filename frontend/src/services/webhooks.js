import { api } from "../api/client";

export const listWebhooks = () => api.get("/webhooks").then((r) => r.data);
export const createWebhook = (url) => api.post("/webhooks", { url }).then((r) => r.data);
export const deleteWebhook = (id) => api.delete(`/webhooks/${id}`);