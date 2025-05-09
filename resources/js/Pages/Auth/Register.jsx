import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

export default function Register() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        Inertia.post('/register', form);
    };

    const { errors } = usePage().props;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center mb-6">Register</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

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

                    <input
                        type="password"
                        name="password_confirmation"
                        placeholder="Confirm Password"
                        value={form.password_confirmation}
                        onChange={handleChange}
                        className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
                    />
                    {errors.password_confirmation && <p className="text-red-500 text-sm">{errors.password_confirmation}</p>}

                    <button type="submit" className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition">
                        Register
                    </button>
                </form>
                <div className="text-center mt-4">
                    <button
                        onClick={() => Inertia.get('/login')}
                        className="text-sm text-blue-500 hover:text-blue-700"
                    >
                        Already have an account? Login here
                    </button>
                </div>
            </div>
        </div>
    );
}
