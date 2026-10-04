import { api } from "../api/client";

export const listNotifications = () => api.get("/notifications").then((r) => r.data);
export const markRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data);
export const markAllRead = () => api.patch("/notifications/read-all");