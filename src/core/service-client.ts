import axios, { AxiosRequestConfig } from "axios";

export class ServiceClient {
  readonly apiKey: string | undefined;

  constructor(options: any) {
    this.apiKey = options.apiKey;
  }
}
