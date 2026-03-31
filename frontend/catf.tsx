import React, { useState, useEffect } from "react";

export function LoginForm({ onSubmit }: { onSubmit: any }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!email.includes("@")) {
      setError("Invalid email");
      return;
    }

    setError("");
    onSubmit(email);
  };

  return (
    <div>
      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleSubmit}>Submit</button>
      {error && <span>{error}</span>}
    </div>
  );
}

export function UserList({ api }: { api: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsers().then((data: any) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <span>Loading...</span>;

  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}