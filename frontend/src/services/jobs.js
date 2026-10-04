import { api } from "../api/client";

export const listJobs = (params = {}) => api.get("/jobs", { params }).then((r) => r.data);
export const getJob = (id) => api.get(`/jobs/${id}`).then((r) => r.data);
export const getJobStatus = (id) => api.get(`/jobs/${id}/status`).then((r) => r.data);
export const getDownload = (id) => api.get(`/jobs/${id}/download`).then((r) => r.data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
export const uploadFile = (file, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  return api
    .post("/files/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
    })
    .then((r) => r.data);
};