import axios from "axios";
import { ApiResponse } from "./ApiResponse.js";

class ApiRequest {
  static async call(url, options = {}) {
    try {
      const response = await axios({
        url,
        method: options.method || "GET",
        headers: options.headers || {},
        data: options.body || null,
        params: options.params || {},
        timeout: options.timeout || 10000,
      });

      return response;
    } catch (error) {
      if (error.response) {
        return new ApiResponse(
          error.response.status,
          error.response.data?.message || "API error",
          error.response.data
        );
      } else if (error.request) {
        return new ApiResponse(503, "No response from server");
      } else {
        return new ApiResponse(500, error.message);
      }
    }
  }
}

export { ApiRequest };
