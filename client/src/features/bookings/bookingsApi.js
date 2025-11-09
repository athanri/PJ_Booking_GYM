import { api } from '../../app/api';

export const bookingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // SESSION booking
    createSessionBooking: build.mutation({
      query: ({ sessionId }) => ({ url: `/session-bookings`, method: 'POST', body: { sessionId } }),
      invalidatesTags: ['Booking', 'Session']
    }),
    // My bookings (sessions only)
    getMyBookings: build.query({
      query: () => '/bookings/me',
      providesTags: ['Booking']
    }),
    // Cancel my booking
    cancelBooking: build.mutation({
      query: (id) => ({ url: `/bookings/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: ['Booking', 'Session', 'Waitlist']
    }),
    // Waitlist
    joinWaitlist: build.mutation({
      query: ({ sessionId }) => ({ url: `/waitlist`, method: 'POST', body: { sessionId } }),
      invalidatesTags: ['Waitlist']
    }),
    leaveWaitlist: build.mutation({
      query: (sessionId) => ({ url: `/waitlist/${sessionId}`, method: 'DELETE' }),
      invalidatesTags: ['Waitlist']
    }),
    getMyWaitlist: build.query({
      query: () => `/waitlist/me`,
      providesTags: ['Waitlist']
    }),
  })
});

export const {
  useCreateSessionBookingMutation,
  useGetMyBookingsQuery,
  useCancelBookingMutation,
  useJoinWaitlistMutation,
  useLeaveWaitlistMutation,
  useGetMyWaitlistQuery,
} = bookingsApi;
