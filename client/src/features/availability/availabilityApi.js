import { api } from '../../app/api';

export const availabilityApi = api.injectEndpoints({
    endpoints: (build) => ({
        getAvailability: build.query({
            query: ({ listingId, start, end }) => `/listings/${listingId}/availability?start=${start}&end=${end}`
        })
    })
});

export const { useGetAvailabilityQuery } = availabilityApi;