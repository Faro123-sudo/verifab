import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login');
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('verifab_token')) {
      api.me().then(u => { setUser(u); setPage('dashboard'); }).catch(() => {
        localStorage.removeItem('verifab_token');
      });
    }
  }, []);

  const setUserAndToken = (data) => {
    localStorage.setItem('verifab_token', data.token);
    api.me().then(u => { setUser(u); setPage('dashboard'); });
  };

  const logout = () => {
    localStorage.removeItem('verifab_token');
    setUser(null);
    setPage('login');
  };

  if (!user) {
    return <AuthPage onAuth={setUserAndToken} error={error} setError={setError} />;
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand">Verifab</div>
        <div className="nav-links">
          <button onClick={() => setPage('dashboard')}>Dashboard</button>
          <button onClick={() => setPage('claim')}>New Claim</button>
          <button onClick={() => setPage('review')}>Review Queue</button>
          <button onClick={() => setPage('credentials')}>Credentials</button>
          <span className="nav-user">@{user.username} ({user.reputation} rep)</span>
          <button className="btn-outline" onClick={logout}>Logout</button>
        </div>
      </nav>
      <main>
        {page === 'dashboard' && <Dashboard user={user} setPage={setPage} />}
        {page === 'claim' && <NewClaim user={user} />}
        {page === 'review' && <ReviewQueue user={user} />}
        {page === 'credentials' && <Credentials user={user} />}
      </main>
    </div>
  );
}

function AuthPage({ onAuth, error, setError }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = isLogin
        ? await api.login(email, password)
        : await api.register(username, email, password);
      onAuth(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verifab</h1>
        <p className="subtitle">Verifiable Skill Credentials</p>
        <p className="tagline">Prove your skills. No certificate required.</p>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        <p className="switch" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'No account? Register here' : 'Have an account? Login here'}
        </p>
      </div>
    </div>
  );
}

function Dashboard({ user, setPage }) {
  const [claims, setClaims] = useState([]);
  const [creds, setCreds] = useState([]);

  useEffect(() => {
    api.myClaims().then(setClaims).catch(() => {});
    api.myCredentials().then(setCreds).catch(() => {});
  }, []);

  return (
    <div className="dashboard">
      <div className="welcome">
        <h2>Welcome, {user.username}</h2>
        <p>Reputation: <strong>{user.reputation}</strong> | Member since: {user.created_at?.slice(0, 10)}</p>
      </div>

      <div className="cards">
        <div className="card stat" onClick={() => setPage('claim')}>
          <h3>{claims.length}</h3>
          <p>Skill Claims</p>
        </div>
        <div className="card stat" onClick={() => setPage('credentials')}>
          <h3>{creds.length}</h3>
          <p>Verified Credentials</p>
        </div>
        <div className="card stat" onClick={() => setPage('review')}>
          <h3>{claims.filter(c => c.status === 'submitted').length}</h3>
          <p>Pending Reviews</p>
        </div>
      </div>

      <h3>Recent Claims</h3>
      <table>
        <thead><tr><th>Skill</th><th>Category</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          {claims.slice(0, 5).map(c => (
            <tr key={c.id}><td>{c.skill_name}</td><td>{c.skill_category}</td><td><span className={`badge badge-${c.status}`}>{c.status}</span></td><td>{c.created_at?.slice(0, 10)}</td></tr>
          ))}
        </tbody>
      </table>

      {creds.length > 0 && (
        <>
          <h3>Your Credentials</h3>
          <div className="cred-list">
            {creds.map(c => (
              <div key={c.id} className="cred-card">
                <strong>{c.skill_name}</strong>
                <span className="badge badge-verified">Verified</span>
                <small>Hash: {c.credential_hash?.slice(0, 16)}...</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NewClaim({ user }) {
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [skillName, setSkillName] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [claimId, setClaimId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState({ recording: '', gitLog: '', artifact: '', metadata: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { api.getCategories().then(setCategories); }, []);

  const handleClaim = async () => {
    setMsg('');
    try {
      const data = await api.claim(skillName, selectedCat);
      setChallenge(data.challenge);
      setClaimId(data.claimId);
    } catch (err) { setMsg(err.message); }
  };

  const handleSubmitProof = async () => {
    setSubmitting(true);
    setMsg('');
    try {
      await api.submitProof(claimId, files);
      setMsg('Proof submitted! Waiting for peer reviews.');
      setChallenge(null);
      setClaimId(null);
    } catch (err) { setMsg(err.message); }
    setSubmitting(false);
  };

  if (challenge) {
    return (
      <div className="claim-flow">
        <h2>Challenge: {challenge.title}</h2>
        <p>{challenge.description}</p>
        <p><strong>Estimated time:</strong> {challenge.estimatedMinutes} min</p>
        <hr />
        <h3>Submit Your Proof</h3>
        <p className="hint">Record your screen solving this challenge. Paste details below.</p>
        <input placeholder="Screen recording ref (URL/hash)" value={files.recording} onChange={e => setFiles({ ...files, recording: e.target.value })} />
        <input placeholder="Git log / terminal output" value={files.gitLog} onChange={e => setFiles({ ...files, gitLog: e.target.value })} />
        <input placeholder="Final artifact (code URL, screenshot hash)" value={files.artifact} onChange={e => setFiles({ ...files, artifact: e.target.value })} />
        <textarea placeholder="Metadata (duration, tools, environment)" value={files.metadata} onChange={e => setFiles({ ...files, metadata: e.target.value })} />
        <button className="btn-primary" onClick={handleSubmitProof} disabled={submitting}>Submit Proof</button>
        {msg && <p className="success">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="claim-flow">
      <h2>New Skill Claim</h2>
      {msg && <p className="error">{msg}</p>}
      <label>Skill Name</label>
      <input placeholder="e.g. React, Plumbing, Data Analysis" value={skillName} onChange={e => setSkillName(e.target.value)} />
      <label>Category</label>
      <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
        <option value="">Select a category</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button className="btn-primary" onClick={handleClaim} disabled={!skillName || !selectedCat}>Get Challenge</button>
    </div>
  );
}

function ReviewQueue({ user }) {
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { api.pendingReviews().then(setPending); }, []);

  const handleSubmit = async () => {
    setMsg('');
    try {
      await api.submitReview(selected.id, decision, notes);
      setMsg('Review submitted!');
      setSelected(null);
      setDecision('');
      setNotes('');
      api.pendingReviews().then(setPending);
    } catch (err) { setMsg(err.message); }
  };

  if (selected) {
    return (
      <div className="review-flow">
        <h2>Review Claim</h2>
        <p><strong>Claimant:</strong> @{selected.claimant_name}</p>
        <p><strong>Skill:</strong> {selected.skill_name} ({selected.skill_category})</p>
        <p><strong>Challenge:</strong></p>
        <pre>{JSON.stringify(JSON.parse(selected.challenge || '{}'), null, 2)}</pre>
        <p><strong>Proof Hash:</strong> {selected.proof_hash}</p>
        {selected.proof_metadata && (
          <pre>{JSON.stringify(JSON.parse(selected.proof_metadata), null, 2)}</pre>
        )}
        <div className="review-actions">
          <button className="btn-approve" onClick={() => { setDecision('approve'); handleSubmit(); }}>Approve</button>
          <button className="btn-reject" onClick={() => setDecision('reject')}>Reject</button>
          {decision === 'reject' && (
            <div className="reject-form">
              <textarea placeholder="Why are you rejecting?" value={notes} onChange={e => setNotes(e.target.value)} />
              <button className="btn-primary" onClick={handleSubmit}>Submit Rejection</button>
            </div>
          )}
        </div>
        {msg && <p className="success">{msg}</p>}
        <button className="btn-outline" onClick={() => setSelected(null)}>Back</button>
      </div>
    );
  }

  return (
    <div className="review-queue">
      <h2>Pending Reviews</h2>
      {pending.length === 0 && <p>No pending reviews. Check back later.</p>}
      {pending.map(c => (
        <div key={c.id} className="review-card" onClick={() => setSelected(c)}>
          <strong>{c.skill_name}</strong> by @{c.claimant_name}
          <span className="badge badge-submitted">Needs Review</span>
        </div>
      ))}
    </div>
  );
}

function Credentials({ user }) {
  const [creds, setCreds] = useState([]);
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => { api.myCredentials().then(setCreds); }, []);

  const handleVerify = async () => {
    if (!verifyHash) return;
    try {
      const res = await api.verifyCredential(verifyHash);
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({ valid: false, error: err.message });
    }
  };

  return (
    <div className="credentials-page">
      <h2>Your Credentials</h2>
      {creds.length === 0 && <p>No credentials yet. Complete a skill claim with 3 peer approvals.</p>}
      <div className="cred-list">
        {creds.map(c => (
          <div key={c.id} className="cred-card full">
            <div className="cred-header">
              <h3>{c.skill_name}</h3>
              <span className="badge badge-verified">Verified</span>
            </div>
            <p>Category: {c.skill_category}</p>
            <p>Issued: {c.issued_at?.slice(0, 10)}</p>
            <p className="cred-hash">Hash: {c.credential_hash}</p>
            <p className="cred-hash">Signature: {c.issuer_signature?.slice(0, 32)}...</p>
            <button className="btn-outline" onClick={() => { setVerifyHash(c.credential_hash); handleVerify(); }}>Verify On-Chain</button>
          </div>
        ))}
      </div>

      <hr />
      <h3>Verify a Credential</h3>
      <div className="verify-box">
        <input placeholder="Paste credential hash" value={verifyHash} onChange={e => setVerifyHash(e.target.value)} />
        <button className="btn-primary" onClick={handleVerify}>Verify</button>
      </div>
      {verifyResult && (
        <div className={`verify-result ${verifyResult.valid ? 'valid' : 'invalid'}`}>
          {verifyResult.valid ? 'Credential is valid' : 'Credential not found or invalid'}
          {verifyResult.credential && (
            <div>
              <p>Holder: {verifyResult.credential.user_name}</p>
              <p>Skill: {verifyResult.credential.skill_name}</p>
              <p>Issued: {verifyResult.credential.issued_at}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
