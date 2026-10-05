#!/usr/bin/env python3
"""Additive SIGNAL field indexes. Dry-run/readback unless explicitly --apply."""
import argparse, json, os, subprocess, urllib.request, urllib.error
from pathlib import Path
p=argparse.ArgumentParser(); p.add_argument('--apply',action='store_true'); p.add_argument('--manifest',default=str(Path(__file__).resolve().parents[2]/'firestore.indexes.json')); args=p.parse_args()
# Use the caller's existing authenticated Google CLI configuration.
# Captured token never printed or persisted. Existing identity only.
token=subprocess.check_output(['gcloud','auth','print-access-token'],text=True).strip()
base='https://firestore.googleapis.com/v1/projects/praxisbytacitus/databases/(default)/collectionGroups/'
def call(method,path,body=None):
    req=urllib.request.Request(base+path, data=None if body is None else json.dumps(body).encode(), method=method, headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=45) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 404 and method == 'GET': return None
        raise RuntimeError('Firestore index API HTTP '+str(e.code)) from None
manifest=json.loads(Path(args.manifest).read_text())
rows=[]
for field in manifest.get('fieldOverrides',[]):
    if field['collectionGroup'] not in ('signalDesks','signalJobs','signalRuntime'): continue
    path=field['collectionGroup']+'/fields/'+urllib.parse.quote(field['fieldPath'],safe='')
    current=call('GET',path)
    desired=field['indexes']
    config=(current or {}).get('indexConfig',{})
    def shape(i): return {k:v for k,v in i.items() if k in ('fields','queryScope','apiScope')}
    expected=[{'queryScope':i['queryScope'],'fields':[{'fieldPath':field['fieldPath'],'order':i['order']}]} for i in desired]
    explicit=not config.get('usesAncestorConfig',False)
    matches=explicit and len(config.get('indexes',[]))==len(expected) and all(any(all(x.get(k)==v for k,v in e.items()) for x in config.get('indexes',[])) for e in expected)
    row={'collectionGroup':field['collectionGroup'],'fieldPath':field['fieldPath'],'explicitConfiguration':explicit,'matches':matches,'existingStates':[i.get('state') for i in config.get('indexes',[])]}
    if args.apply and not matches:
        operation=call('PATCH',path+'?updateMask=indexConfig',{'indexConfig':{'indexes':expected}})
        row['operation']=operation.get('name'); after=call('GET',path)
        row['readback']={'usesAncestorConfig':after.get('indexConfig',{}).get('usesAncestorConfig'),'states':[i.get('state') for i in after.get('indexConfig',{}).get('indexes',[])]}
    rows.append(row)
print(json.dumps({'project':'praxisbytacitus','database':'(default)','mutation':args.apply,'fields':rows},indent=2))
