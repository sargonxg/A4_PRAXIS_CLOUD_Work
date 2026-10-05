#!/usr/bin/env python3
"""Plan/apply the separate twelve-hour public-source refresh. Never print credentials."""
import argparse
import json
import subprocess
import urllib.request
import urllib.error

parser = argparse.ArgumentParser()
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()
name = 'projects/praxisbytacitus/locations/us-central1/jobs/praxis-signal-world-refresh'
uri = 'https://praxis.tacitus.me/api/signal/world/refresh'
schedule = '0 */12 * * *'
if not args.apply:
    print(json.dumps({'mutation': False, 'name': name, 'schedule': schedule, 'timeZone': 'Etc/UTC', 'uri': uri,
                      'authentication': 'Existing cron secret, held only in memory', 'scope': 'Shared public-source observations; private watched desks unchanged'}))
    raise SystemExit()

def capture(command):
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False, timeout=60)
    if result.returncode:
        raise RuntimeError('Required Google Cloud operation failed; credential output suppressed')
    return result.stdout.decode().strip()

token = capture(['gcloud', 'auth', 'print-access-token'])
secret = capture(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=praxis-cron-secret', '--project=praxisbytacitus'])
base = 'https://cloudscheduler.googleapis.com/v1/'

def call(method, path, data=None):
    request = urllib.request.Request(base + path, method=method, data=None if data is None else json.dumps(data).encode(),
                                     headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        if method == 'GET' and error.code == 404:
            return None
        raise RuntimeError('Scheduler operation HTTP ' + str(error.code)) from None

body = {'name': name, 'description': 'Bounded twelve-hour SIGNAL world public-source refresh',
        'schedule': schedule, 'timeZone': 'Etc/UTC', 'attemptDeadline': '180s',
        'httpTarget': {'uri': uri, 'httpMethod': 'POST', 'headers': {'x-cron-secret': secret, 'Content-Type': 'application/json'}, 'body': 'e30='},
        'retryConfig': {'retryCount': 1, 'minBackoffDuration': '60s', 'maxBackoffDuration': '300s'}}
if call('GET', name):
    call('PATCH', name + '?updateMask=description,schedule,timeZone,attemptDeadline,httpTarget,retryConfig', body)
else:
    call('POST', 'projects/praxisbytacitus/locations/us-central1/jobs', body)
after = call('GET', name)
assert after['schedule'] == schedule and after['timeZone'] == 'Etc/UTC'
assert after['httpTarget']['uri'] == uri and after['httpTarget']['httpMethod'] == 'POST'
assert after['httpTarget']['headers'].get('x-cron-secret') == secret
print(json.dumps({'mutation': True, 'name': name, 'schedule': schedule, 'timeZone': after['timeZone'],
                  'state': after.get('state'), 'uri': uri, 'authenticationHeaderReadbackVerified': True}))
