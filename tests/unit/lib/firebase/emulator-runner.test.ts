import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { emulatorEnvironment } from '../../../../scripts/emulators/environment.mjs';

describe('isolated emulator runner boundaries', () => {
  it('does not forward production secrets, credentials, projects or option injection', () => {
    const env = emulatorEnvironment({ PATH: 'test-path', PRAXIS_TEST_JAVA_HOME: '/isolated/java',
      PRAXIS_TEST_BROWSERS_PATH: '/isolated/browsers',
      GOOGLE_APPLICATION_CREDENTIALS: '/never-read', TEST_FIREBASE_PASSWORD: 'never-forward',
      GOOGLE_CLOUD_PROJECT: 'production', NODE_OPTIONS: '--require=unknown', OPENAI_API_KEY: 'never-forward' }, '/receipt');
    expect(env).not.toHaveProperty('GOOGLE_APPLICATION_CREDENTIALS');
    expect(env).not.toHaveProperty('OPENAI_API_KEY');
    expect(env.GOOGLE_CLOUD_PROJECT).toBe('demo-praxis-ci');
    expect(env.NODE_OPTIONS).toBe('--max-old-space-size=2048');
    expect(env.TEST_FIREBASE_PASSWORD).not.toBe('never-forward');
    expect(env.FIREBASE_AUTH_EMULATOR_HOST).toBe('127.0.0.1:9099');
  });
  it('maps only the explicit absolute browser cache and refuses Linux without it', () => {
    const input = { PRAXIS_TEST_JAVA_HOME: '/isolated/java', PRAXIS_TEST_BROWSERS_PATH: '/isolated/browsers',
      PLAYWRIGHT_BROWSERS_PATH: '/ambient/never-forward', PWDEBUG: '1' };
    const env = emulatorEnvironment(input, '/receipt', { platform: 'linux' });
    expect(env.PLAYWRIGHT_BROWSERS_PATH).toBe('/isolated/browsers');
    expect(env.XDG_CACHE_HOME).not.toBe('/ambient/never-forward');
    expect(env).not.toHaveProperty('PWDEBUG');
    expect(() => emulatorEnvironment({ PRAXIS_TEST_JAVA_HOME: '/isolated/java' }, '/receipt', { platform: 'linux' }))
      .toThrow(/BROWSER_CACHE_PATH_REQUIRED/);
  });
  it.each(['relative/cache', '0', '--browser-option'])('refuses browser path injection %s without echoing it', (browserPath) => {
    expect(() => emulatorEnvironment({ PRAXIS_TEST_JAVA_HOME: '/isolated/java', PRAXIS_TEST_BROWSERS_PATH: browserPath }, '/receipt'))
      .toThrow('BROWSER_CACHE_PATH_INVALID');
  });
  it('refuses a hosted runner before environment scrubbing could hide its identity', () => {
    expect(() => emulatorEnvironment({ K_SERVICE: 'production', PRAXIS_TEST_JAVA_HOME: '/isolated/java' }, '/receipt')).toThrow(/hosted/);
  });
  it('blocks non-lane connections before invoking any real networking', () => {
    const guard = resolve('scripts/emulators/loopback-only.js');
    const result = spawnSync(process.execPath, ['-e', `
      const net=require('node:net'); let called=0;
      net.Socket.prototype.connect=function(){called++;return this};
      require(${JSON.stringify(guard)});
      for(const [host,port] of [['identitytoolkit.googleapis.com',443],['generativelanguage.googleapis.com',443],['169.254.169.254',80],['127.0.0.1',80]]){
        try{new net.Socket().connect({host,port});throw Error('guard failed')}catch(e){if(!e.message.includes('blocked'))throw e}
      }
      new net.Socket().connect({host:'127.0.0.1',port:8080});
      if(called!==1)throw Error('unexpected network access');
    `], { env: { NODE_ENV: 'test', PATH: process.env.PATH, PRAXIS_EMULATOR_MODE: 'local-ci', GCLOUD_PROJECT: 'demo-praxis-ci',
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' } });
    expect(result.status, result.stderr.toString()).toBe(0);
  });
});
