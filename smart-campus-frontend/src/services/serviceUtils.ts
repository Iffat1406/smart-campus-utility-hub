import { ApiResponse, ApiError } from "@/types";

/**
 * Extract single payload object from API response
 */
export const getPayload = <T = unknown>(
  data: ApiResponse<unknown>,
  key: string,
): T | undefined => {
  return ((data?.data as Record<string, unknown>)?.[key] as T) || undefined;
};

/**
 * Extract array payload from API response
 */
export const getPayloadArray = <T = unknown>(
  data: ApiResponse<unknown>,
  key: string,
): T[] => {
  return ((data?.data as Record<string, unknown>)?.[key] as T[]) || [];
};

/**
 * Extract response.data directly
 */
export const asApiData = <T = unknown>(response: {
  data: T;
}): T => response.data;

/**
 * Global service error wrapper
 * Used to wrap async service methods
 */
export const withServiceError =
  <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    fallbackMessage = "Something went wrong",
  ) =>
  async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args);
    } catch (error: unknown) {
      console.error("Service Error:", error);

      const apiError = (error as {
        response?: {
          data?: ApiError;
        };
      })?.response?.data;

      throw (
        apiError || {
          message: fallbackMessage,
        }
      );
    }
  };