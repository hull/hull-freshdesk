import axios, { AxiosRequestConfig } from "axios";
import {
  ApiResultObject,
  ApiMethod,
  FreshdeskPagedResult,
  FreshdeskTicketListOrderBy,
  FreshdeskTicketListOrderDir,
  FreshdeskTicketListIncludes,
  FreshdeskTicket,
} from "../core/service-objects";
import { ApiUtil } from "../utils/api-util";
import {
  FreshdeskContactField,
  FreshdeskCompanyField,
  FreshdeskContactCreateUpdate,
  FreshdeskContact,
  FreshdeskFilterResult,
  FreshdeskCompanyCreateOrUpdate,
  FreshdeskCompany,
  FreshdeskAgent,
} from "./service-objects";
import { Logger } from "winston";
import { logger } from "hull";

export class ServiceClient {
  readonly apiKey: string;
  readonly apiBaseUrl: string;
  readonly logger: Logger;

  constructor(options: any) {
    this.apiKey = options.apiKey;
    this.apiBaseUrl = `https://${options.domain}.freshdesk.com`;
    this.logger = options.logger;
  }

  public async listContactFields(): Promise<
    ApiResultObject<undefined, FreshdeskContactField[] | undefined>
  > {
    const url = `${this.apiBaseUrl}/api/v2/contact_fields`;
    const method: ApiMethod = "query";
    const axiosConfig = this.getAxiosConfig();

    try {
      logger.debug(
        "ServiceClient.listContactFields: Executing API Call...",
        url,
        axiosConfig,
      );
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
      logger.error(
        "ServiceClient.listContactFields: Failed API Call",
        url,
        axiosConfig,
        error,
      );
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

  public async createCompany(
    data: FreshdeskCompanyCreateOrUpdate,
  ): Promise<
    ApiResultObject<
      FreshdeskCompanyCreateOrUpdate,
      FreshdeskCompany | undefined
    >
  > {
    const url = `${this.apiBaseUrl}/api/v2/companies`;
    const method: ApiMethod = "insert";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.post<FreshdeskCompany>(
        url,
        data,
        axiosConfig,
      );
      return ApiUtil.handleApiResultSuccess(url, method, data, axiosResponse);
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, data, error);
    }
  }

  public async updateCompany(
    id: number,
    data: FreshdeskCompanyCreateOrUpdate,
  ): Promise<
    ApiResultObject<
      FreshdeskCompanyCreateOrUpdate,
      FreshdeskCompany | undefined
    >
  > {
    const url = `${this.apiBaseUrl}/api/v2/companies/${id}`;
    const method: ApiMethod = "update";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.put<FreshdeskCompany>(
        url,
        data,
        axiosConfig,
      );
      return ApiUtil.handleApiResultSuccess(url, method, data, axiosResponse);
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, data, error);
    }
  }

  public async filterCompanies(
    query: string,
  ): Promise<
    ApiResultObject<
      undefined,
      FreshdeskFilterResult<FreshdeskCompany> | undefined
    >
  > {
    const url = `${this.apiBaseUrl}/api/v2/search/companies?query="${encodeURI(
      query,
    )}"`;
    const method: ApiMethod = "query";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.get<
        FreshdeskFilterResult<FreshdeskCompany>
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

  public async getCurrentlyAuthenticatedAgent(): Promise<
    ApiResultObject<unknown, FreshdeskAgent | undefined>
  > {
    const url = `${this.apiBaseUrl}/api/v2/agents/me`;
    const method: ApiMethod = "query";
    const axiosConfig = this.getAxiosConfig();

    try {
      logger.debug(
        "ServiceClient.getCurrentlyAuthenticatedAgent: Executing API Call...",
        url,
        axiosConfig,
      );
      const axiosResponse = await axios.get<FreshdeskAgent>(url, axiosConfig);
      return ApiUtil.handleApiResultSuccess(
        url,
        method,
        undefined,
        axiosResponse,
      );
    } catch (error) {
      logger.error(
        "ServiceClient.getCurrentlyAuthenticatedAgent: Failed API Call",
        url,
        axiosConfig,
        error,
      );
      return ApiUtil.handleApiResultError(url, method, undefined, error);
    }
  }

  public async listContacts(
    page: number,
    perPage: number,
    filter?: string,
  ): Promise<
    ApiResultObject<unknown, FreshdeskPagedResult<FreshdeskContact> | undefined>
  > {
    let url = `${this.apiBaseUrl}/api/v2/contacts?page=${page}&per_page=${perPage}`;
    if (filter !== undefined) {
      url += `&${filter}`;
    }

    const method: ApiMethod = "query";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.get<Array<FreshdeskContact>>(
        url,
        axiosConfig,
      );

      const pagedResult: FreshdeskPagedResult<FreshdeskContact> = {
        results: axiosResponse.data,
        page,
        perPage,
        hasMore: axiosResponse.headers.link !== undefined,
      };

      return ApiUtil.handleApiResultSuccess(url, method, undefined, {
        ...axiosResponse,
        data: pagedResult,
      });
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, undefined, error);
    }
  }

  public async listCompanies(
    page: number,
    perPage: number,
  ): Promise<
    ApiResultObject<unknown, FreshdeskPagedResult<FreshdeskCompany> | undefined>
  > {
    const url = `${this.apiBaseUrl}/api/v2/companies?page=${page}&per_page=${perPage}`;
    const method: ApiMethod = "query";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.get<Array<FreshdeskCompany>>(
        url,
        axiosConfig,
      );

      const pagedResult: FreshdeskPagedResult<FreshdeskCompany> = {
        results: axiosResponse.data,
        page,
        perPage,
        hasMore: axiosResponse.headers.link !== undefined,
      };

      return ApiUtil.handleApiResultSuccess(url, method, undefined, {
        ...axiosResponse,
        data: pagedResult,
      });
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, undefined, error);
    }
  }

  public async listTickets(
    page: number,
    perPage: number,
    orderBy: FreshdeskTicketListOrderBy,
    orderDirection: FreshdeskTicketListOrderDir,
    includes: FreshdeskTicketListIncludes[],
    updatedSince?: string,
  ): Promise<
    ApiResultObject<unknown, FreshdeskPagedResult<FreshdeskTicket> | undefined>
  > {
    let url = `${this.apiBaseUrl}/api/v2/tickets?page=${page}&per_page=${perPage}&order_by=${orderBy}&order_type=${orderDirection}`;
    if (includes.length !== 0) {
      url += `&include=${includes.join(",")}`;
    }

    if (updatedSince) {
      url += `&updated_since=${updatedSince}`;
    }

    const method: ApiMethod = "query";
    const axiosConfig = this.getAxiosConfig();

    try {
      const axiosResponse = await axios.get<Array<FreshdeskTicket>>(
        url,
        axiosConfig,
      );

      const pagedResult: FreshdeskPagedResult<FreshdeskTicket> = {
        results: axiosResponse.data,
        page,
        perPage,
        hasMore: axiosResponse.headers.link !== undefined,
      };

      return ApiUtil.handleApiResultSuccess(url, method, undefined, {
        ...axiosResponse,
        data: pagedResult,
      });
    } catch (error) {
      return ApiUtil.handleApiResultError(url, method, undefined, error);
    }
  }

  private getAxiosConfig(): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {
      auth: {
        username: this.apiKey,
        password: "X",
      },
      responseType: "json",
    };

    return axiosConfig;
  }
}
