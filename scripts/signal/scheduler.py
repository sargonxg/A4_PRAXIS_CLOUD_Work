#!/usr/bin/env python3
"""Plan or provision hourly SIGNAL sweep. Values remain in memory only."""
import argparse,json,os,subprocess,urllib.request,urllib.error
p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');args=p.parse_args()
# Use the caller's existing authenticated Google CLI configuration.
g='gcloud'
name='projects/praxisbytacitus/locations/us-central1/jobs/praxis-signal-watch-sweep'
uri='https://praxis.tacitus.me/api/signal/sweep'
if not args.apply:
 print(json.dumps({'mutation':False,'name':name,'schedule':'0 * * * *','timeZone':'Etc/UTC','httpMethod':'POST','uri':uri,'authentication':'existing praxis-cron-secret via x-cron-secret; injected directly into REST body, never logged'}));raise SystemExit()
def capture(argv):
 r=subprocess.run(argv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
 if r.returncode: raise RuntimeError('Google CLI operation failed; credential output suppressed')
 return r.stdout.decode().strip()
token=capture([g,'auth','print-access-token'])
secret=capture([g,'secrets','versions','access','latest','--secret=praxis-cron-secret','--project=praxisbytacitus'])
base='https://cloudscheduler.googleapis.com/v1/'
def call(method,path,data=None):
 req=urllib.request.Request(base+path,method=method,data=None if data is None else json.dumps(data).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=45) as r:return json.load(r)
 except urllib.error.HTTPError as e:
  if method=='GET' and e.code==404:return None
  raise RuntimeError('Scheduler API HTTP '+str(e.code)) from None
current=call('GET',name)
body={'name':name,'description':'Bounded hourly collection for explicitly watched PRAXIS SIGNAL desks','schedule':'0 * * * *','timeZone':'Etc/UTC','attemptDeadline':'180s','httpTarget':{'uri':uri,'httpMethod':'POST','headers':{'x-cron-secret':secret,'Content-Type':'application/json'},'body':'e30='},'retryConfig':{'retryCount':1,'minBackoffDuration':'60s','maxBackoffDuration':'300s'}}
if current:call('PATCH',name+'?updateMask=description,schedule,timeZone,attemptDeadline,httpTarget,retryConfig',body)
else:call('POST','projects/praxisbytacitus/locations/us-central1/jobs',body)
after=call('GET',name)
assert after['schedule']==body['schedule'] and after['httpTarget']['uri']==uri and after['httpTarget']['httpMethod']=='POST' and after['httpTarget']['headers'].get('x-cron-secret')==secret
print(json.dumps({'mutation':True,'name':after['name'],'schedule':after['schedule'],'state':after.get('state'),'uri':after['httpTarget']['uri'],'authenticationHeaderReadbackVerified':True}))
