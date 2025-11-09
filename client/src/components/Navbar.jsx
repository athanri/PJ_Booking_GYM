import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { logout } from '../features/auth/authSlice';


export default function Navbar() {
    const { user } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    return (
        <header className="border-b bg-background">
            <div className="container flex items-center gap-3 py-3">
                <Link to="/" className="font-semibold">Classes</Link>
                <nav className="ml-auto flex items-center gap-2">
                    {user ? (
                    <>
                        <Link to="/me/bookings" className="text-sm">My Bookings</Link>
                        <span className="text-sm opacity-70">Hi, {user.name}</span>
                        <Button variant="outline" size="sm" onClick={()=>dispatch(logout())}>Logout</Button>
                    </>
                    ) : (
                    <>
                        <Button asChild variant="ghost" size="sm"><Link to="/login">Login</Link></Button>
                        <Button asChild size="sm"><Link to="/register">Register</Link></Button>
                    </>
                    )}
                </nav>
            </div>
        </header>
    );
}