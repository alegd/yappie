import { z } from "zod";

export const JiraTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().positive(),
});

export const JiraAccessibleResourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const JiraAccessibleResourcesSchema = z.array(JiraAccessibleResourceSchema);

export const JiraProjectSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  name: z.string().min(1),
});

export const JiraProjectsSchema = z.array(JiraProjectSchema);

export const JiraIssueSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  self: z.string().optional(),
});

export type JiraTokenResponse = z.infer<typeof JiraTokenResponseSchema>;
export type JiraAccessibleResource = z.infer<typeof JiraAccessibleResourceSchema>;
export type JiraProject = z.infer<typeof JiraProjectSchema>;
export type JiraIssue = z.infer<typeof JiraIssueSchema>;
