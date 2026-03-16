import type { HttpTransport } from "../http.js";
import type { Job } from "../types/job.js";

/** List all jobs for the authenticated user. */
export async function listJobs(http: HttpTransport): Promise<Job[]> {
	const result = await http.get<Job[]>("/jobs", { retryable: true });
	return result.data;
}

/** Get a specific job by ID. */
export async function getJob(http: HttpTransport, jobId: string): Promise<Job> {
	const result = await http.get<Job>(`/jobs/${jobId}`, { retryable: true });
	return result.data;
}
