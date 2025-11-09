import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const dispatch = useDispatch();


    const submit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const { data } = await axios.post(`${base}/auth/login`, { email, password });
            dispatch(setCredentials(data));
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '3rem auto' }}>
            <h2>Login</h2>
            <form onSubmit={submit}>
                <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
                <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </div>
    );
}