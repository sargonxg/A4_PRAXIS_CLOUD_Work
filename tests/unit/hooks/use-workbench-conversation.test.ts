import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkbenchConversation } from '@/components/praxis/use-workbench-conversation';

// Deterministic state/effect lifecycle harness, matching existing hook tests.
// This executes the production hook; it is not browser/React scheduler acceptance.
const runtime = vi.hoisted(() => {
  let cursor=0; const states:unknown[]=[];
  const effects=new Map<number,{deps:readonly unknown[];cleanup?:()=>void}>();const pending:Array<()=>void>=[];
  return {
    useState<T>(initial:T|(()=>T)){
      const index=cursor++;if(!(index in states))states[index]=typeof initial==='function'?(initial as ()=>T)():initial;
      return [states[index] as T,(update:T|((previous:T)=>T))=>{states[index]=typeof update==='function'?(update as (previous:T)=>T)(states[index] as T):update}] as const;
    },
    useEffect(effect:()=>void|(()=>void),deps:readonly unknown[]){
      const index=cursor++,previous=effects.get(index);if(previous&&deps.every((value,i)=>Object.is(value,previous.deps[i])))return;
      pending.push(()=>{effects.get(index)?.cleanup?.();const cleanup=effect();effects.set(index,{deps,cleanup:cleanup||undefined})});
    },
    render<T>(callback:()=>T){cursor=0;return callback()},flush(){for(const effect of pending.splice(0))effect()},
    useCallback<T>(callback:T){return callback},
    reset(){for(const effect of effects.values())effect.cleanup?.();states.length=0;effects.clear();pending.length=0;cursor=0},
  };
});
vi.mock('react',()=>({useState:runtime.useState,useEffect:runtime.useEffect,useCallback:runtime.useCallback}));
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done});return {promise,resolve};}
const base={authenticated:true,ownerId:'analyst-a',capsuleId:'capsule',threadId:'thread-a',setStatus:vi.fn()};
function render(props=base){let hook!:ReturnType<typeof useWorkbenchConversation>;for(let i=0;i<3;i++){hook=runtime.render(()=>useWorkbenchConversation(props));runtime.flush()}return hook;}
beforeEach(()=>runtime.reset());afterEach(()=>{runtime.reset();vi.unstubAllGlobals()});

describe('workbench cancellation and authentication lifecycle',()=>{
  for(const change of [{ownerId:'analyst-b'},{threadId:'thread-b'},{authenticated:false}]){
    it(`masks prior-scope messages before passive effects for ${JSON.stringify(change)}`,()=>{
      vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(()=>{})));
      let hook=render();hook.setChatMessages([{role:'assistant',text:'Private prior conversation'}]);hook.setIsStreaming(true);hook=render();
      expect(hook.chatMessages).toHaveLength(1);expect(hook.isStreaming).toBe(true);
      const beforeEffects=runtime.render(()=>useWorkbenchConversation({...base,...change}));
      expect(beforeEffects.chatMessages).toEqual([]);expect(beforeEffects.isStreaming).toBe(false);
      runtime.flush();
    });
  }
  it('cancels the current conversation and clears streaming even when its scope does not change',async()=>{
    const pending=deferred<Response>();vi.stubGlobal('fetch',vi.fn(()=>pending.promise));
    let hook=render();hook.setChatMessages([{role:'assistant',text:'New answer'}]);hook.setIsStreaming(true);hook=render();
    hook.cancelWorkbenchRequest();hook=render();expect(hook.isStreaming).toBe(false);
    pending.resolve(Response.json({turns:[{prompt:'Old',output:'Old'}]}));
    await vi.waitFor(()=>expect(render().chatMessages).toEqual([{role:'assistant',text:'New answer'}]));
  });
  it('uses a null unauthenticated owner and rehydrates after same-owner relogin with a stale user object',async()=>{
    const old=deferred<Response>();const renewed=deferred<Response>();vi.stubGlobal('fetch',vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(renewed.promise));
    let hook=render();hook.setChatMessages([{role:'assistant',text:'Private old state'}]);hook.setIsStreaming(true);
    hook=render({...base,authenticated:false});
    expect(hook.authenticatedOwnerId).toBeNull();expect(hook.chatMessages).toEqual([]);expect(hook.isStreaming).toBe(false);expect(hook.conversationLoadedFor).toBeNull();
    render();renewed.resolve(Response.json({turns:[{prompt:'Reloaded',output:'Owned answer'}]}));
    await vi.waitFor(()=>expect(render().chatMessages).toMatchObject([{text:'Reloaded'},{text:'Owned answer'}]));
    old.resolve(Response.json({turns:[{prompt:'Stale owner',output:'Stale answer'}]}));
    await new Promise<void>(resolve=>setImmediate(resolve));expect(render().chatMessages).toMatchObject([{text:'Reloaded'},{text:'Owned answer'}]);
  });
  it('does not replace a newly opened conversation with its delayed predecessor',async()=>{
    const old=deferred<Response>();vi.stubGlobal('fetch',vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce(Response.json({turns:[{prompt:'Thread B',output:'Answer B'}]})));
    render();const next={...base,threadId:'thread-b'};render(next);
    await vi.waitFor(()=>expect(render(next).chatMessages).toMatchObject([{text:'Thread B'},{text:'Answer B'}]));
    old.resolve(Response.json({turns:[{prompt:'Thread A',output:'Answer A'}]}));
    await new Promise<void>(resolve=>setImmediate(resolve));expect(render(next).chatMessages).toMatchObject([{text:'Thread B'},{text:'Answer B'}]);
  });
});
