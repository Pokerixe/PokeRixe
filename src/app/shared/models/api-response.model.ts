/**
 * Represents a standard API response structure.
 *
 * @template T - The type of the data contained in the response.
 */
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}
