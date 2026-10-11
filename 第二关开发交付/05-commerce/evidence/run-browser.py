import pathlib,subprocess,os,sys,json
script=pathlib.Path(sys.argv[1]); env=dict(os.environ,npm_config_offline='true')
p=subprocess.run(['node','/Users/zhengrui/.npm/_npx/31e32ef8478fbf80/node_modules/@playwright/cli/playwright-cli.js','--session','commerce05','run-code',script.read_text()],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
pathlib.Path(script.stem+'.log').write_text(p.stdout)
if '### Result\n' in p.stdout:
 result=p.stdout.split('### Result\n',1)[1].split('\n### Ran',1)[0];pathlib.Path(script.stem+'-result.json').write_text(json.dumps(json.loads(result),ensure_ascii=False,indent=2)+'\n')
 print('assertions:',len(json.loads(result).get('assertions',[])))
else: print(p.stdout[-4000:])
sys.exit(p.returncode)
