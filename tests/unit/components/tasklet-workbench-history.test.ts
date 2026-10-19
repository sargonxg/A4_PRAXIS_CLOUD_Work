import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWorkbenchRequestOwner, loadWorkbenchConversationHistory, workbenchRequestKey } from '@/components/praxis/tasklet-workbench-history';
import type { ChatMessage } from '@/components/praxis/tasklet-workbench-conversation';

function deferred<T>() {let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done});return {promise,resolve};}
afterEach(()=>vi.unstubAllGlobals());
describe('workbench history request ownership',()=>{
  for(const path of ['primary','empty legacy','failed-primary legacy'] as const){
    for(const change of ['local send','owner switch','conversation switch'] as const){
      it(`preserves newer messages after ${change} while ${path} history is delayed`,async()=>{
        const owner=createWorkbenchRequestOwner();owner.setScope(workbenchRequestKey('owner-a','capsule','thread-a'));const request=owner.begin();
        const pending=deferred<Response>();const legacyStarted=deferred<void>();
        vi.stubGlobal('fetch',vi.fn((url:string)=>{
          if(url.startsWith('/api/conversations/'))return path==='primary'?pending.promise:Promise.resolve(new Response(JSON.stringify({turns:[]}),{status:path==='failed-primary legacy'?500:200}));
          legacyStarted.resolve();return pending.promise;
        }));
        let messages:ChatMessage[]=[];let status='';
        const load=loadWorkbenchConversationHistory({capsuleId:'capsule',threadId:'thread-a',request,onMessages:value=>{messages=value},onStatus:value=>{status=value}});
        if(path!=='primary')await legacyStarted.promise;
        if(change==='local send')owner.invalidate();else owner.setScope(workbenchRequestKey(change==='owner switch'?'owner-b':'owner-a','capsule',change==='conversation switch'?'thread-b':'thread-a'));
        messages=[{role:'user',text:'New question'},{role:'assistant',text:'New cited answer'}];status='New answer saved';
        pending.resolve(new Response(JSON.stringify({turns:[{prompt:'Old question',output:'Old answer'}]})));
        await load;
        expect(messages).toEqual([{role:'user',text:'New question'},{role:'assistant',text:'New cited answer'}]);
        expect(status).toBe('New answer saved');
      });
    }
  }
  it('loads owned primary history normally',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({turns:[{prompt:'Saved question',output:'Saved answer'}]}))));
    const owner=createWorkbenchRequestOwner();owner.setScope(workbenchRequestKey('owner','capsule','thread'));const messages=vi.fn();
    await loadWorkbenchConversationHistory({capsuleId:'capsule',threadId:'thread',request:owner.begin(),onMessages:messages,onStatus:vi.fn()});
    expect(messages).toHaveBeenCalledWith([{role:'user',text:'Saved question'},{role:'assistant',text:'Saved answer'}]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  for(const primaryStatus of [200,500]){
    it(`restores legacy history when primary history ${primaryStatus===200?'is empty':'fails'}`,async()=>{
      const calls:string[]=[];
      vi.stubGlobal('fetch',vi.fn((url:string)=>{
        calls.push(url);
        return Promise.resolve(new Response(JSON.stringify({turns:url.startsWith('/api/conversations/')?[]:[{prompt:'Legacy question',output:'Legacy answer'}]}),{status:url.startsWith('/api/conversations/')?primaryStatus:200}));
      }));
      const owner=createWorkbenchRequestOwner();owner.setScope(workbenchRequestKey('owner','capsule one','thread-a'));const messages=vi.fn();
      await loadWorkbenchConversationHistory({capsuleId:'capsule one',threadId:'thread-a',request:owner.begin(),onMessages:messages,onStatus:vi.fn()});
      expect(messages).toHaveBeenCalledExactlyOnceWith([{role:'user',text:'Legacy question'},{role:'assistant',text:'Legacy answer'}]);
      expect(calls).toEqual(['/api/conversations/thread-a','/api/ai/chat?capsuleId=capsule+one&threadId=thread-a&limit=12']);
    });
  }
});
