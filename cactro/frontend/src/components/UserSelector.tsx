const USERS = [
  { id: "user-free-001", label: "Free Tier User" },
  { id: "user-paid-001", label: "Paid Tier User" },
];

interface UserSelectorProps {
  value: string;
  onChange: (userId: string) => void;
}

export default function UserSelector({ value, onChange }: UserSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="user-selector" className="text-sm font-medium text-gray-700">
        User
      </label>
      <select
        id="user-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {USERS.map((user) => (
          <option key={user.id} value={user.id}>
            {user.label}
          </option>
        ))}
      </select>
    </div>
  );
}
