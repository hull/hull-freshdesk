import axios, { AxiosRequestConfig } from "axios";
import { ApiResultObject, ApiMethod } from "../types/api-result";
import { ApiUtil } from "../utils/api-util";
import {
  FreshdeskContactField,
  FreshdeskCompanyField,
  FreshdeskContactCreateUpdate,
  FreshdeskContact,
  FreshdeskFilterResult,
} from "./service-objects";

export class ServiceClient {
  readonly apiKey: string | undefined;
  readonly apiBaseUrl: string;

  constructor(options: any) {
    this.apiKey = options.apiKey;
    this.apiBaseUrl = "https://domain.freshdesk.com";
  }

  public async listContactFields(): Promise<
    ApiResultObject<undefined, FreshdeskContactField[] | undefined>
  > {
    const url = `${this.apiBaseUrl}/api/v2/contact_fields`;
    const method: ApiMethod = "query";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.get<FreshdeskContactField[]>(
        url,
        axiosConfig,
      );
      return ApiUtil.handleApiResultSuccess(
        url,
        method,
        undefined,
        axiosResponse,
      );
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, undefined, error);
    }
  }

  public async listCompanyFields(): Promise<
    ApiResultObject<undefined, FreshdeskCompanyField[] | undefined>
  > {
    const url = `${this.apiBaseUrl}/api/v2/company_fields`;
    const method: ApiMethod = "query";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.get<FreshdeskCompanyField[]>(
        url,
        axiosConfig,
      );
      return ApiUtil.handleApiResultSuccess(
        url,
        method,
        undefined,
        axiosResponse,
      );
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, undefined, error);
    }
  }

  public async createContact(
    data: FreshdeskContactCreateUpdate,
  ): Promise<
    ApiResultObject<FreshdeskContactCreateUpdate, FreshdeskContact | undefined>
  > {
    const url = `${this.apiBaseUrl}/api/v2/contacts`;
    const method: ApiMethod = "insert";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.post<FreshdeskContact>(
        url,
        data,
        axiosConfig,
      );
      return ApiUtil.handleApiResultSuccess(url, method, data, axiosResponse);
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, data, error);
    }
  }

  public async updateContact(
    id: number,
    data: FreshdeskContactCreateUpdate,
  ): Promise<
    ApiResultObject<FreshdeskContactCreateUpdate, FreshdeskContact | undefined>
  > {
    const url = `${this.apiBaseUrl}/api/v2/contacts/${id}`;
    const method: ApiMethod = "update";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.put<FreshdeskContact>(
        url,
        data,
        axiosConfig,
      );
      return ApiUtil.handleApiResultSuccess(url, method, data, axiosResponse);
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, data, error);
    }
  }

  public async filterContacts(
    query: string,
  ): Promise<
    ApiResultObject<
      undefined,
      FreshdeskFilterResult<FreshdeskContact> | undefined
    >
  > {
    const url = `${this.apiBaseUrl}/api/v2/search/contacts?query="${encodeURI(
      query,
    )}"`;
    const method: ApiMethod = "query";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.get<
        FreshdeskFilterResult<FreshdeskContact>
      >(url, axiosConfig);
      return ApiUtil.handleApiResultSuccess(
        url,
        method,
        undefined,
        axiosResponse,
      );
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, undefined, error);
    }
  }

  private getAxiosConfig(): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      responseType: "json",
    };

    return axiosConfig;
  }
}
