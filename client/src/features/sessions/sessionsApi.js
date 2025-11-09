import { api } from '../../app/api';

export const sessionsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSessions: build.query({
      query: ({ from, to }) => `/classes/sessions?from=${from}&to=${to}`,
      providesTags: ['Session']
    }),
    getTemplates: build.query({
      query: () => `/classes/templates`
    })
  })
});

export const { useGetSessionsQuery, useGetTemplatesQuery } = sessionsApi;
