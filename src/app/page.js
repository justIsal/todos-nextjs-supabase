'use client';

export default function Home() {
  const handleLogout = async () => {
    await fetch('/api/v1.0.0/logout', { method: 'POST' });
  };
  return (
    <>
      <button onClick={() => handleLogout()}>logout</button>
    </>
  );
}
