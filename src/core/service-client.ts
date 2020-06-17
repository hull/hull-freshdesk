import axios, { AxiosRequestConfig } from "axios";

export class ServiceClient {
  private apiKey: string | undefined;

  constructor(options: any) {
    this.apiKey = options.apiKey;
  }
}
