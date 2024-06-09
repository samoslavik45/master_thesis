import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';


interface LoginProps {
    setIsLoggedIn: (value: boolean) => void;
  }

  const Login: React.FC<LoginProps> = ({ setIsLoggedIn }) => {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');
        const [message, setMessage] = useState('');
        const navigate = useNavigate();
  

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    console.log(data);

    if (response.ok) {
      const token = data.access; 
      if (token) {
          setIsLoggedIn(true);
          localStorage.setItem('accessToken', token);
          console.log(`Bearer ${token}`); 
          setMessage("Login successful.");
          setTimeout(() => {
            navigate('/');
          }, 500);
      } else {
          console.error("The token was not found in the response.");
          setMessage("Incorrect login information.");
      }
  } else {
      setMessage("Incorrect login information.");
  }
  };

  return (
    <div className="login-container">
      <h2 className="mb-3">Login</h2>
        <form onSubmit={handleSubmit} className='login-form'>
            <div className="mb-3">
                <input type="text" className='form-control' placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="mb-3">
                <input type="password" className='form-control' placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Login</button>
            <div>{message && <p className='mt-3'>{message}</p>} </div> {}
        </form>
    </div>
  );
};

export default Login;
