import { api } from '../../app/api';

export const listingsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getListings: build.query({
            query: () => '/listings',
            providesTags: ['Listing']
        }),
        
        getListing: build.query({
            query: (id) => `/listings/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'Listing', id }]
        })
    })
});

export const { useGetListingsQuery, useGetListingQuery } = listingsApi;