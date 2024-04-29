import React, { useState, useEffect } from 'react';

const ApiTest: React.FC = () => {
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        fetch('http://localhost:8000/main/hello/')
            .then(response => response.json())
            .then(data => setMessage(data.message));
    }, []);

    return <div>{message || 'Loading...'}</div>;
}

export default ApiTest;
