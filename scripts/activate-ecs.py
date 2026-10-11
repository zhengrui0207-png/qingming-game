from pathlib import Path
import hashlib,json,os,shutil,subprocess,datetime
root=Path('/var/www/qingming-game');release=root/'releases/20260914-v4.2-scholar'
manifest=json.loads((release/'release.json').read_text())
for name,info in manifest['files'].items():
 p=release/name
 assert p.stat().st_size==info['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==info['sha256'],name
snippet=Path('/etc/nginx/snippets/qingming-game.conf');snippet.parent.mkdir(exist_ok=True)
content='''location = /qingming { return 301 /qingming/; }
location ^~ /qingming/ {
    alias /var/www/qingming-game/current/;
    index index.html;
    gzip_static on;
    gzip_vary on;
    add_header Cache-Control "no-cache";
}
'''
if snippet.exists():assert snippet.read_text()==content,'Unexpected existing qingming configuration'
snippet.write_text(content)
include='    include /etc/nginx/snippets/qingming-game.conf;\n\n'
changed=[];stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
for name in ['ai-resume-web.conf','airesumejob-homepage.conf']:
 p=Path('/etc/nginx/conf.d')/name;old=p.read_text()
 if include.strip() not in old:
  pos=old.rfind('    location / {');assert pos>=0
  backup=p.with_name(p.name+'.backup-qingming-'+stamp);shutil.copy2(p,backup)
  p.write_text(old[:pos]+include+old[pos:]);changed.append((p,backup))
check=subprocess.run(['nginx','-t'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,universal_newlines=True)
if check.returncode:
 for p,backup in changed:shutil.copy2(backup,p)
 raise RuntimeError(check.stderr)
current=root/'current';old_target=os.readlink(current) if current.is_symlink() else None
assert not current.exists() or current.is_symlink(),'Refuse to replace a non-symlink directory'
temp=root/'current-next';temp.symlink_to(release);os.replace(temp,current)
try:subprocess.run(['systemctl','reload','nginx'],check=True)
except Exception:
 for p,backup in changed:shutil.copy2(backup,p)
 if old_target:
  temp.symlink_to(old_target);os.replace(temp,current)
 raise
print(json.dumps({'release':str(release),'filesVerified':len(manifest['files']),'previous':old_target,'nginx':check.stderr,'url':'https://airesumejob.xyz/qingming/'},ensure_ascii=False))
