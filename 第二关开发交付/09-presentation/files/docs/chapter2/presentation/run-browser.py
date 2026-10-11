from pathlib import Path
import subprocess,json,sys,base64
folder=Path(__file__).resolve().parent
script=folder/(sys.argv[1] if len(sys.argv)>1 else 'browser-checks.js')
r=subprocess.run(['node','/Users/zhengrui/.npm/_npx/31e32ef8478fbf80/node_modules/@playwright/cli/playwright-cli.js','-s=presentation09','run-code',script.read_text()],cwd=folder,capture_output=True,text=True)
(folder/(script.stem+'.log')).write_text(r.stdout+r.stderr)
if '### Result\n' in r.stdout:
 raw=r.stdout.split('### Result\n',1)[1].split('\n### ',1)[0]
 try:
  value=json.loads(raw)
  if isinstance(value,dict) and 'videoBase64' in value:
   video=folder/'output/playwright/intro-ending.webm';video.write_bytes(base64.b64decode(value.pop('videoBase64')));value['videoBytes']=video.stat().st_size;value['videoFile']='output/playwright/intro-ending.webm';(folder/(script.stem+'.log')).write_text('Actual canvas/audio recording saved; see recording-results.json and video.\n')
  (folder/(script.stem+'-results.json')).write_text(json.dumps(value,ensure_ascii=False,indent=2));print(json.dumps({k:value[k] for k in ['total','passed'] if k in value},ensure_ascii=False) if isinstance(value,dict) else 'Visual checks saved')
 except json.JSONDecodeError:print(raw[:2500])
else: print(r.stdout[:3000]+r.stderr[:1000]);sys.exit(1)
