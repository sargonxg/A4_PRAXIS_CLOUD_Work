import {DatabaseSync} from 'node:sqlite';
import {hash} from './domain.mjs';
export class Store {
 constructor(path='signal.sqlite'){
  this.db=new DatabaseSync(path);this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS scopes(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES scopes(id),captured_at TEXT NOT NULL,payload TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS idx_sources_scope ON sources(scope_id,captured_at);
 CREATE TABLE IF NOT EXISTS claims(id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES scopes(id),source_id TEXT NOT NULL REFERENCES sources(id),payload TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS idx_claims_scope ON claims(scope_id);
 CREATE TABLE IF NOT EXISTS reviews(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT NOT NULL UNIQUE,claim_id TEXT NOT NULL REFERENCES claims(id),payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS collections(id INTEGER PRIMARY KEY AUTOINCREMENT,scope_id TEXT NOT NULL REFERENCES scopes(id),at TEXT NOT NULL,payload TEXT NOT NULL);`);
 }
 scope(value){const s={...value,id:'scope_'+hash(JSON.stringify(value)).slice(0,24)};this.db.prepare('INSERT OR IGNORE INTO scopes VALUES(?,?)').run(s.id,JSON.stringify(s));return s;}
 insertSource(s){return this.db.prepare('INSERT OR IGNORE INTO sources VALUES(?,?,?,?)').run(s.id,s.scopeId,s.capturedAt,JSON.stringify(s)).changes>0;}
 source(id,scope){const r=this.db.prepare('SELECT payload FROM sources WHERE id=? AND scope_id=?').get(id,scope);if(!r)throw new Error('Source not found in this scope.');return JSON.parse(r.payload);}
 insertClaim(c){this.db.prepare('INSERT INTO claims VALUES(?,?,?,?)').run(c.id,c.scopeId,c.sourceId,JSON.stringify(c));}
 claim(id,scope){const r=this.db.prepare('SELECT payload FROM claims WHERE id=? AND scope_id=?').get(id,scope);if(!r)throw new Error('Claim not found in this scope.');return JSON.parse(r.payload);}
 insertReview(r){this.db.prepare('INSERT INTO reviews(id,claim_id,payload) VALUES(?,?,?)').run(r.id,r.claimId,JSON.stringify(r));}
 collection(scope,record){this.db.prepare('INSERT INTO collections(scope_id,at,payload) VALUES(?,?,?)').run(scope,new Date().toISOString(),JSON.stringify(record));}
 state(scope){const sources=this.db.prepare('SELECT payload FROM sources WHERE scope_id=? ORDER BY captured_at DESC').all(scope).map(r=>JSON.parse(r.payload));const claims=this.db.prepare('SELECT payload FROM claims WHERE scope_id=?').all(scope).map(r=>JSON.parse(r.payload));const reviews=this.db.prepare('SELECT r.payload FROM reviews r JOIN claims c ON c.id=r.claim_id WHERE c.scope_id=? ORDER BY r.seq ASC').all(scope).map(r=>JSON.parse(r.payload));for(const r of reviews){const c=claims.find(x=>x.id===r.claimId);if(c){c.reviewState=r.decision;c.reviewer=r.reviewer;c.rationale=r.rationale;}}
 const col=this.db.prepare('SELECT payload FROM collections WHERE scope_id=? ORDER BY id DESC LIMIT 1').get(scope);return {sources,claims,reviews,collection:col?JSON.parse(col.payload):null};}
 close(){this.db.close();}
}
