import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ListingsPage from './pages/ListingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyBookingsPage from './pages/MyBookingsPage';
import SessionsPage from './pages/SessionsPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<ListingsPage />} />
                <Route path="/classes" element={<SessionsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/me/bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}