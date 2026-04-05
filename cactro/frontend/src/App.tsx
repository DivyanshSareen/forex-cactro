import { useState } from 'react';
import UserSelector from './components/UserSelector';
import RateTable from './components/RateTable';

export default function App() {
  const [userId, setUserId] = useState('user-free-001');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Forex Rates</h1>
        <div className="mb-6">
          <UserSelector value={userId} onChange={setUserId} />
        </div>
        <RateTable userId={userId} />
      </div>
    </div>
  );
}
