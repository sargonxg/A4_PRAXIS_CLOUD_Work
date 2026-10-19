'use strict';
// Applied only to this lane's app/test subprocesses, never the user's machine.
if (process.env.PRAXIS_EMULATOR_MODE !== 'local-ci'
    || process.env.GCLOUD_PROJECT !== 'demo-praxis-ci'
    || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099'
    || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080'
    || process.env.K_SERVICE || process.env.K_REVISION || process.env.CLOUD_RUN_JOB) {
  throw new Error('Loopback network guard requires isolated emulator configuration');
}
const net = require('node:net');
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const options = typeof first === 'object' && first !== null
    ? first : { port: first, host: typeof args[1] === 'string' ? args[1] : 'localhost' };
  const host = options.host || 'localhost';
  const port = Number(options.port);
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) || ![3000, 3139, 8080, 9099].includes(port) || options.path) {
    // Do not print destinations, requests, identity tokens or credentials.
    throw new Error('Non-lane network connection blocked by isolated emulator guard');
  }
  return originalConnect.apply(this, args);
};
