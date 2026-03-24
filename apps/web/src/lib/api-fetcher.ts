"use server";

import { LOGOUT_PAGE } from "@/lib/constants/pages";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { parseSearchParams } from "./parsers";
import { parseResponse } from "./response";
import { createServerAction, ServerActionError } from "./server-action";

const baseUrl = process.env.NEXT_PUBLIC_HOST_URL + "/api/data";

export const apiFetcher = createServerAction(async (url: string, args: any = {}) => {
  const session = await auth();

  const { token, headers = {}, data, ...options } = args;

  const [reqUrl, ...params] = typeof url === "string" ? [url] : url;
  const endpoint = baseUrl + reqUrl;
  const queryString = params.length > 0 ? `?${parseSearchParams(params)}` : "";

  const authToken = token ?? session?.accessToken;

  if (data) {
    if (headers?.["Content-Type"] === "multipart/form-data") {
      const formData = new FormData();
      const { file, ...rest } = data;

      if (file && Array.isArray(data.file.value)) {
        file.value.forEach((f: File) => {
          formData.append(file.name, f);
        });
      }

      Object.entries(rest).forEach(([key, value]) => {
        if (value != null) {
          if (typeof value === "object" && !Array.isArray(value)) {
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              formData.append(`${key}[${nestedKey}]`, nestedValue?.toString() ?? "");
            });
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      delete headers["Content-Type"];
      options.body = formData;
    } else {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(data);
    }
  }

  headers["Authorization"] = `Bearer ${authToken}`;
  const path = `${endpoint}${queryString}`;
  const res = await fetch(path, { headers, ...options });

  const response = await parseResponse(res);

  if (!res.ok) {
    const errorData = response;
    const statusCode = errorData?.statusCode ?? res.status;

    if (statusCode === 401 && errorData?.key !== "invalid_credentials") {
      redirect(LOGOUT_PAGE);
    }

    const error = parseError(errorData.error, statusCode);

    throw new ServerActionError(error.message, error.statusCode);
  }

  return response;
});

const parseError = (error: any, statusCode: number) => {
  const message = error?.message || error?.message?.[0] || "Something went wrong";
  switch (statusCode) {
    case 400:
      return { message, statusCode: statusCode };
    case 401:
      if (error.key === "invalid_credentials") {
        return { message, statusCode: statusCode };
      } else {
        return redirect(LOGOUT_PAGE);
      }
    case 403:
      return { message: "Forbidden", statusCode: statusCode };
    case 404:
      return { message: "Not Found", statusCode: statusCode };
    case 422:
      return { message: message, statusCode: statusCode };
    case 500:
      return { message: message, statusCode: statusCode };
    default:
      return { message: message, statusCode: statusCode };
  }
};
