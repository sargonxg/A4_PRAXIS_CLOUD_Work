import { describe, expect, it } from 'vitest';
import { claimQuestionHandoff, consumeQuestionHandoff, pendingQuestionHandoff, saveQuestionHandoff, readPublicQuestionHandoff } from '@/lib/auth/question-handoff';

function storage() { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } }; }
const id = 'a7fc6ad8-73f0-4b83-a55d-7602777e02c4';
const newerId = 'b7fc6ad8-73f0-4b83-a55d-7602777e02c4';
const now = 100000;
describe('same-tab question handoff', () => {
  it('carries only an opaque identifier and safe navigation in the login URL', () => {
    const s = storage(); const saved = saveQuestionHandoff(s, { text: 'Private organizational question?', target: '/app?panel=memo&question=secret#private' }, { now, id });
    expect(saved.loginUrl).not.toContain('Private'); expect(saved.loginUrl).not.toContain('secret');
    const url = new URL(saved.loginUrl, 'https://praxis.invalid');
    expect(url.searchParams.get('redirect')).toBe(`/app?panel=memo&handoff=${id}`);
    expect(pendingQuestionHandoff(s, id, 'user-a', now)).toBe(true);
    expect(claimQuestionHandoff(s, id, 'user-a', now)?.text).toBe('Private organizational question?');
  });
  it('requires deliberate claiming and binds subsequent recovery to the chosen account', () => {
    const s=storage(); saveQuestionHandoff(s, {text:'A private draft', target:'/app'}, {now,id});
    expect(claimQuestionHandoff(s,id,'',now)).toBeNull();
    expect(claimQuestionHandoff(s,id,'user-a',now)?.text).toBe('A private draft');
    expect(pendingQuestionHandoff(s,id,'user-b',now)).toBe(false);
    expect(claimQuestionHandoff(s,id,'user-b',now)).toBeNull();
    expect(consumeQuestionHandoff(s,id,'user-b',now)).toBe(false);
    expect(claimQuestionHandoff(s,id,'user-a',now)?.text).toBe('A private draft');
  });
  it('does not replay a consumed draft or guess an unknown identifier', () => {
    const s=storage(); saveQuestionHandoff(s,{text:'Draft',target:'/app'},{now,id});
    expect(claimQuestionHandoff(s,newerId,'user-a',now)).toBeNull();
    claimQuestionHandoff(s,id,'user-a',now);
    expect(consumeQuestionHandoff(s,id,'user-a',now)).toBe(true);
    expect(claimQuestionHandoff(s,id,'user-a',now)).toBeNull();
  });
  it('expires after thirty minutes and is unavailable in a different tab', () => {
    const s=storage(); saveQuestionHandoff(s,{text:'Draft',target:'/app'},{now,id});
    expect(claimQuestionHandoff(storage(),id,'user-a',now)).toBeNull();
    expect(claimQuestionHandoff(s,id,'user-a',now+30*60*1000)).toBeNull();
  });
  it('retains independently identified newer drafts when an older handoff is consumed', () => {
    const s=storage(); saveQuestionHandoff(s,{text:'Older',target:'/app'},{now,id});
    saveQuestionHandoff(s,{text:'Newer',target:'/app/projects'},{now:now+1,id:newerId});
    claimQuestionHandoff(s,id,'user-a',now+2); consumeQuestionHandoff(s,id,'user-a',now+2);
    expect(claimQuestionHandoff(s,newerId,'user-a',now+2)?.text).toBe('Newer');
  });
  it('fails closed on unavailable storage and oversized context instead of leaking a URL fallback', () => {
    expect(()=>saveQuestionHandoff({getItem:()=>null,setItem:()=>{throw Error('blocked');},removeItem:()=>{}},{text:'Private',target:'/app'},{now,id})).toThrow();
    expect(()=>saveQuestionHandoff(storage(),{text:'x'.repeat(12001),target:'/app'},{now,id})).toThrow();
  });
  it('recovers cancelled sign-in in the same tab until an explicit account claim', () => {
    const s = storage(); saveQuestionHandoff(s, { text: 'Optional pilot', target: '/app' }, { now, id });
    expect(readPublicQuestionHandoff(s, now)).toBe('Optional pilot');
    claimQuestionHandoff(s, id, 'user-a', now);
    expect(readPublicQuestionHandoff(s, now)).toBeNull();
  });
  it('preserves a draft when a different editor requests restoration', () => {
    const s = storage(); saveQuestionHandoff(s, { text: 'Private', target: '/app' }, { now, id });
    expect(claimQuestionHandoff(s, id, 'user-a', now, '/app/projects')).toBeNull();
    expect(claimQuestionHandoff(s, id, 'user-a', now, '/app')?.text).toBe('Private');
  });
});
