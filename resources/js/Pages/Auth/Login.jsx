import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const { errors } = usePage().props;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        Inertia.post('/login', form);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center mb-6">Login</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                    />
                    {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

                    <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition">
                        Login
                    </button>
                </form>
                <div className="text-center mt-4">
                    <button
                        onClick={() => Inertia.get('/register')}
                        className="text-sm text-blue-500 hover:text-blue-700"
                    >
                        Don't have an account? Register here
                    </button>
                </div>
            </div>
        </div>
    );
}
