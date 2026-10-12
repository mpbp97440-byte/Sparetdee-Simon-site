import fs from 'node:fs';

const source = fs.readFileSync('assets/js/mpbp440-firebase.js', 'utf8');
const match = source.match(/apiKey:'([^']+)'/);
if (!match) throw new Error('Firebase apiKey not found');
const apiKey = match[1];

const signUp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({returnSecureToken: true})
});
const signText = await signUp.text();
if (!signUp.ok) throw new Error(`Anonymous auth failed: ${signUp.status} ${signText}`);
const data = JSON.parse(signText);
if (!data.idToken || !data.localId) throw new Error('Anonymous auth returned no idToken/localId');
console.log('ANONYMOUS_AUTH_PASS', data.localId);

const del = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({idToken: data.idToken})
});
const delText = await del.text();
if (!del.ok) throw new Error(`Cleanup failed: ${del.status} ${delText}`);
console.log('CLEANUP_PASS');
