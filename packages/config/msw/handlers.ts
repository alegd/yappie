// MSW handlers for mocking external APIs
// Add handlers here as needed for OpenAI, Jira, etc.

import { http, HttpResponse } from "msw";

// OpenAI API mock handlers
export const openaiHandlers = [
  http.post("https://api.openai.com/v1/audio/transcriptions", () => {
    return HttpResponse.json({
      text: "Mock transcription text from audio recording.",
    });
  }),

  http.post("https://api.openai.com/v1/chat/completions", () => {
    return HttpResponse.json({
      id: "mock-completion-id",
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify([
              {
                title: "Mock ticket",
                description: "Mock ticket description",
                priority: "medium",
              },
            ]),
          },
          finish_reason: "stop",
        },
      ],
    });
  }),
];

// Atlassian/Jira API mock handlers
export const jiraHandlers = [
  http.get("https://api.atlassian.com/ex/jira/*/rest/api/3/project", () => {
    return HttpResponse.json([{ id: "10001", key: "TEST", name: "Test Project" }]);
  }),

  http.post("https://api.atlassian.com/ex/jira/*/rest/api/3/issue", () => {
    return HttpResponse.json({
      id: "10001",
      key: "TEST-1",
      self: "https://mock.atlassian.net/rest/api/3/issue/10001",
    });
  }),
];

// All handlers combined
export const handlers = [...openaiHandlers, ...jiraHandlers];
