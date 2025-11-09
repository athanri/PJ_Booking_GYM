import { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const dispatch = useDispatch();

    const submit = async (e) => {
        e.preventDefault(); setError('');
        try {
            const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const { data } = await axios.post(`${base}/auth/register`, { name, email, password });
            dispatch(setCredentials(data));
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="container max-w-md mx-auto py-8">
            <Card>
                <CardHeader><CardTitle>Create account</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={name} onChange={(e)=>setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full">Create account</Button>
                    </form>
                </CardContent>
                <CardFooter>
                <p className="text-xs opacity-70">You can change details later.</p>
                </CardFooter>
            </Card>
        </div>
    );
}