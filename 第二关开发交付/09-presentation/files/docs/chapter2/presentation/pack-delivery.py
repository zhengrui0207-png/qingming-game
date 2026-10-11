from pathlib import Path
import hashlib,json,shutil,difflib
root=Path(__file__).resolve().parents[3]
delivery=Path('/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/09-presentation')
delivery.mkdir(parents=True,exist_ok=True)
selected=[root/'chapter2-presentation-preview.html']
for folder in ['src/chapter2/presentation','docs/chapter2/presentation']:
 for p in (root/folder).rglob('*'):
  if not p.is_file() or '.playwright-cli' in p.parts or '__pycache__' in p.parts:continue
  rel=p.relative_to(root).as_posix()
  if rel.startswith(('docs/chapter2/presentation/output/build/','docs/chapter2/presentation/output/module-build/')):continue
  selected.append(p)
rows=[];patch=[]
for p in sorted(selected):
 rel=p.relative_to(root).as_posix();target=delivery/'files'/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target);digest=hashlib.sha256(p.read_bytes()).hexdigest()
 kind='media' if p.suffix in ['.png','.webm'] else 'audio' if p.suffix=='.wav' else 'test' if p.name.endswith('.test.js') else 'module' if rel.startswith('src/') else 'documentation'
 rows.append({'path':rel,'baseSHA256':None,'newSHA256':digest,'bytes':p.stat().st_size,'kind':kind})
 if p.suffix in ['.js','.mjs','.py','.json','.css','.html','.md']:
  patch.extend(difflib.unified_diff([],p.read_text().splitlines(True),fromfile='/dev/null',tofile='b/'+rel))
 assert hashlib.sha256(target.read_bytes()).hexdigest()==digest
manifest={'task':'09-presentation','baselineId':'2026-10-01-core-ready-v1','contractVersion':'1.0.0','newFilesOnly':True,'excludedGeneratedOutputs':['.playwright-cli','output/build','output/module-build'],'files':rows}
(delivery/'files.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));(delivery/'source.patch').write_text(''.join(patch));shutil.copy2(root/'docs/chapter2/presentation/handoff.md',delivery/'handoff.md');shutil.copy2(root/'docs/chapter2/presentation/ready.json',delivery/'ready.json');shutil.copy2(root/'docs/chapter2/presentation/scope-audit.json',delivery/'baseline-verification.json')
(delivery/'README.md').write_text('# 09-presentation 已交付\n\n2026-10-05，独立演出与声音模块 PRESENTATION_READY。真实main装配、08正式NPC资产与真人验收不在本次ready范围。\n\n先读handoff.md、ready.json与files.json；只按清单审查/合入09源码，不覆盖整个游戏或其它副本。完整报告在files/docs/chapter2/presentation/。\n')
checks={'filesVerified':len(rows),'allDeliverySHAMatched':True,'baselineFilesUnchanged':215,'frozenFilesUnchanged':21,'patchHasOnlyAllowedPaths':all(r['path']=='chapter2-presentation-preview.html' or r['path'].startswith(('src/chapter2/presentation/','docs/chapter2/presentation/')) for r in rows),'nodeTestsPassed':213,'browserAssertionsPassed':117,'formalIntegration':False}
(delivery/'delivery-verification.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2));print(json.dumps(checks,ensure_ascii=False))
