import React, { useState } from 'react';
import './Register.css';
import { useNavigate } from 'react-router-dom';


const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      const response = await fetch('http://localhost:8000/api/register/', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, email, first_name: firstName, last_name: lastName }),
      });
  
      if (response.ok) {
          setMessage('Registration successful. You can login.');
          setTimeout(() => {
            navigate('/login');
          }, 1000);
      } else {
          const errorData = await response.json();
          setMessage(errorData.detail || 'Registration failed.');
      }
  };

  return (
    <div className="register-container">
      <h2 className="mb-4">Registration</h2>
        <form onSubmit={handleSubmit} className="register-form">
          <div className="mb-3">
            <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
          </div>
          <div className="mb-3">
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
          </div>
          <div className="mb-3">
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
          </div>
          <div className="mb-3">
            <input type="text" className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" required />
          </div>
          <div className="mb-3">
            <input type="text" className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" required />
          </div>
          <button type="submit" className="btn btn-primary">Sign in</button>
        </form>
      {message && <p className="mt-3">{message}</p>}
  </div>
);
};

export default Register;
