//Use CommonJs for higher compatability
import fetch from "node-fetch";
import { clearInterval } from "timers";

import { CloudlayerPdfOptions } from "./interfaces/pdf-options.interface";
import { CloudlayerApiResponse } from "./interfaces/response.interface";

export type CloudlayerApiResponseGetAsset = CloudlayerApiResponse & {
  getAsset: () => Promise<Buffer>;
};

const BASE_URL = "https://api.cloudlayer.io/v2";

export class CloudlayerApiClient {
  constructor(private apiKey: string, private baseURL: string = BASE_URL) {
    if (!apiKey) {
      throw new Error("API key is not provided.");
    }
  }

  public async templateToPdf(
    templateId: string,
    data: Record<string, any>,
    options?: CloudlayerPdfOptions
  ) {
    const endpoint = `${this.baseURL}/template/pdf`;

    const jobRsp = await this.fetcher<CloudlayerApiResponse>("POST", endpoint, {
      data,
      ...{
        templateId,
        ...options,
      },
    });

    return this.pollJob<CloudlayerApiResponse>(jobRsp);
  }

  private async fetcher<T>(
    method: "GET" | "POST",
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": this.apiKey,
      },
      ...options,
      ...(data && { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText} : '${url}'`
      );
    }

    const jsonResponse = await response.json();
    return jsonResponse as T;
  }

  private async fetchFile<Buffer>(url: string) {
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText} : '${url}'`
      );
    }

    const buffer = await response.arrayBuffer();
    return buffer;
  }

  private async getResponse<T extends CloudlayerApiResponse>(jobData: T) {
    if(jobData.status === "success") {
      return jobData;
    }

    let count = 0;
    return new Promise<CloudlayerApiResponse>((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        const rspSelf = await this.fetcher<CloudlayerApiResponse>(
          "GET",
          jobData.self
        );

        if (rspSelf.status === "success" || rspSelf.status === "error") {
          clearInterval(pollInterval);
          resolve(rspSelf);
        }

        if (count > 90) {
          clearInterval(pollInterval);
          reject("Timed out");
        }
        count++;
      }, 1000);
    });
  }

  private async pollJob<
    T extends CloudlayerApiResponse | CloudlayerApiResponseGetAsset
  >(jobData: T): Promise<CloudlayerApiResponseGetAsset> {
    let jobStatus = jobData.status;

    const response = await this.getResponse<T>(jobData);

    if (response) {
      if (response.status === "success") {
        const result = {
          ...response,
          getAsset: async () => {
            return Buffer.from(await this.fetchFile(response.assetUrl));
          },
        };
        return result as T & CloudlayerApiResponseGetAsset;
      } else if (jobStatus === "error") {
        return response as T & CloudlayerApiResponseGetAsset;
      }
    }

    throw Error("Unknown Errror");
  }
}
