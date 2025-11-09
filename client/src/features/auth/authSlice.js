import { createSlice } from '@reduxjs/toolkit';

const tokenFromStorage = localStorage.getItem('token');
const userFromStorage = localStorage.getItem('user');

const slice = createSlice({
    name: 'auth',
    initialState: {
        token: tokenFromStorage || null,
        user: userFromStorage ? JSON.parse(userFromStorage) : null
    },
    reducers: {
        setCredentials: (state, { payload }) => {
            state.token = payload.token;
            state.user = payload.user;
            localStorage.setItem('token', payload.token);
            localStorage.setItem('user', JSON.stringify(payload.user));
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
});


export const { setCredentials, logout } = slice.actions;
export default slice.reducer;