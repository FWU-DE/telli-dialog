'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function TestLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await signIn('credentials', {
      redirect: true,
      username,
      password,
      callbackUrl: '/',
    });
    if (res?.error) setError(res.error);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Test Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-80">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Login
        </button>
        {error && <div className="text-red-500">{error}</div>}
      </form>
    </div>
  );
}
