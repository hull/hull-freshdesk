import _ from "lodash";
import { AxiosError, AxiosResponse } from "axios";
import { ApiResultObject, ApiMethod } from "../types/api-result";

export class ApiUtil {
  /**
   * Handles errors of an API operation and creates an appropriate result.
   *
   * @static
   * @template T The type of data.
   * @param {string} url The url of the API endpoint
   * @param {ApiMethod} method The API method.
   * @param {T} payload The payload data with which the API endpoint has been invoked.
   * @param {AxiosError} error The error thrown by the invocation of the API.
   * @returns {ApiResultObject<T>} An API result with the properly formatted error messages.
   * @memberof ErrorUtil
   */
  public static handleApiResultError<T, undefined>(
    url: string,
    method: ApiMethod,
    payload: T,
    error: AxiosError,
  ): ApiResultObject<T, undefined> {
    const axiosResponse = error.response;

    const apiResult: ApiResultObject<T, undefined> = {
      data: undefined,
      endpoint: url,
      error: error.message,
      method,
      record: payload,
      success: false,
    };

    if (axiosResponse !== undefined || error.isAxiosError === true) {
      apiResult.data = axiosResponse ? axiosResponse.data : undefined;
      apiResult.error = _.compact([
        error.message,
        axiosResponse ? axiosResponse.statusText : null,
      ]);
    }

    return apiResult;
  }

  /**
   * Creates a properly composed API result object based on the axios response.
   *
   * @static
   * @template T The type of data.
   * @param {string} url The url of the API endpoint
   * @param {ApiMethod} method The API method.
   * @param {T} payload The payload data with which the API endpoint has been invoked.
   * @param {AxiosResponse} axiosResponse The response returned from Axios.
   * @returns {ApiResultObject<T>} A properly composed API result object.
   * @memberof ApiUtil
   */
  public static handleApiResultSuccess<T, U>(
    url: string,
    method: ApiMethod,
    payload: T,
    axiosResponse: AxiosResponse<U>,
  ): ApiResultObject<T, U> {
    const apiResult: ApiResultObject<T, U> = {
      data: axiosResponse.data,
      endpoint: url,
      error: axiosResponse.status >= 400 ? axiosResponse.statusText : undefined,
      method,
      record: payload,
      success: axiosResponse.status < 400,
    };

    return apiResult;
  }
}
