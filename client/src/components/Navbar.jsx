import React from "react";
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';

export default function Navbar() {
    const { user } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    return (
        <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
            <Link to="/">Listings</Link>
            {user ? (
                <>
                    <Link to="/me/bookings">My Bookings</Link>
                    <span style={{ marginLeft: 'auto' }}>Hi, {user.name}</span>
                    <button onClick={()=>dispatch(logout())}>Logout</button>
                </>
            ) : (
                <>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                </>
            )}
        </nav>
    );
}