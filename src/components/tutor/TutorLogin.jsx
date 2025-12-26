import React, { useState } from 'react';
import { loginUser } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';

const TutorLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser({ identifier, password });
      if (response && response.type === 'tutor') {
        navigate('/tutor/dashboard');
      } else {
        setError('Identifiant ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur lors de la connexion. Veuillez réessayer.');
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion Tuteur</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Identifiant (Email ou Téléphone)</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
};

export default TutorLogin;