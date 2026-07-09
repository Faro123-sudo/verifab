const BASE = 'http://localhost:3001/api';

function token() {
  return localStorage.getItem('verifab_token');
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const t = token();
  if (t) opts.headers['Authorization'] = `Bearer ${t}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (username, email, password) => request('POST', '/auth/register', { username, email, password }),
  me: () => request('GET', '/auth/me'),
  getCategories: () => request('GET', '/skills/categories'),
  getChallenge: (cat) => request('GET', `/skills/challenges/${cat}`),
  claim: (skillName, category) => request('POST', '/skills/claim', { skillName, category }),
  submitProof: (claimId, files) => request('POST', '/skills/submit-proof', { claimId, files }),
  myClaims: () => request('GET', '/skills/my-claims'),
  getClaim: (id) => request('GET', `/skills/${id}`),
  pendingReviews: () => request('GET', '/reviews/pending'),
  submitReview: (claimId, decision, notes) => request('POST', '/reviews/submit', { claimId, decision, notes }),
  myReviews: () => request('GET', '/reviews/my-reviews'),
  myCredentials: () => request('GET', '/credentials/my'),
  verifyCredential: (hash) => request('GET', `/credentials/verify/${hash}`),
};
