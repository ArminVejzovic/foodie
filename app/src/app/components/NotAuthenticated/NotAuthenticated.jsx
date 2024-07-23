"use client"
import { useRouter } from 'next/navigation';

const NotAuthenticated = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div>
      <p>Niste autentificirani. Molimo prijavite se.</p>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default NotAuthenticated;
