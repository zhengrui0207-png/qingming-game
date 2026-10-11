"""Exercise the actual Three.js GLTFLoader, Draco decoder and AnimationMixer.

Uses the installed Playwright CLI; writes only 08 asset reports and previews.
No API requests, source-model edits, account access or formal index writes.
"""
import json
import subprocess
import sys
import struct
import hashlib
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
CLI = '/Users/zhengrui/.npm/_npx/31e32ef8478fbf80/node_modules/@playwright/cli/playwright-cli.js'
SESSION = 'batch208'


def run(*args):
    result = subprocess.run(['node', CLI, '-s=' + SESSION, *args], cwd=HERE,
                            capture_output=True, text=True, timeout=45)
    if result.returncode:
        raise RuntimeError(result.stderr + result.stdout)
    if '### Error' in result.stdout:
        raise RuntimeError(result.stdout)
    return result.stdout


results = []
for number in range(7, 17):
    asset = f'QMSH-{number:02}'
    for variant in ['raw', 'draco']:
        if '--reuse-captures' in sys.argv:
            results.append(json.loads((HERE / f'batch2-{asset}-{variant}-browser.json').read_text()))
            continue
        run('goto', f'http://127.0.0.1:5288/src/chapter2/assets/preview.html?asset={asset}&variant={variant}')
        run('run-code', 'async (page) => { await page.waitForFunction(()=>window.assetAuditReady?.()); }')
        report = json.loads(run('eval', '() => JSON.parse(document.querySelector("#report").textContent)', '--raw'))
        assert report['assetId'] == asset and report['requiredAnimationsPresent']
        assert report['cloneProof']['independentBoneObjects']
        assert report['cloneProof']['independentSkeletonObjects']
        assert report['cloneProof']['secondCloneVertexDisplacement'] == 0
        for name in ['Idle', 'Walk']:
            sample = next(s for s in report['animationSamples'] if s['clip'] == name)
            assert sample['samples'] == 61 and sample['secondCloneUnchanged']
            assert sample['maxSampledWorldVertexDisplacement'] > 1e-5
            assert max(abs(v) for v in sample['normalizedBottomYRange']) < .04
            expression = ('() => Array.from({length:9},(_,i)=>({phase:i/8,bounds:' +
                          'window.captureAssetPose(' + json.dumps(name) + ',' +
                          str(sample['duration']) + '*i/8)}))')
            wrapped = json.loads(run('eval', expression, '--raw'))
            assert all(abs(b['min'][1]) < .04 for phase in wrapped for b in phase['bounds'])
            report.setdefault('wrappedClipBounds', {})[name] = wrapped
            t = 0 if name == 'Idle' else sample['duration'] / 4
            path = ROOT / 'public/assets/chapter2/previews' / f'batch2-{asset}-{variant}-{name.lower()}.png'
            code = ('async (page) => { await page.evaluate(() => window.captureAssetPose(' +
                    json.dumps(name) + ',' + str(t) + ')); ' +
                    'await page.evaluate(()=>new Promise(requestAnimationFrame)); ' +
                    'await page.locator("#canvas").screenshot({path:' + json.dumps(str(path)) + '}); }')
            run('run-code', code)
        report['variant'] = variant
        report['verification'] = 'decoded, 61 samples per full loop, live skin displacement, independent clone, foot envelope <4cm'
        (HERE / f'batch2-{asset}-{variant}-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        results.append(report)
        print(asset, variant, 'PASS', flush=True)

loop_checks = []


def curve_signature(file):
    data = file.read_bytes()
    json_size = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20 + json_size])
    binary = data[28 + json_size:]
    widths = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}
    def values(index):
        a = doc['accessors'][index]
        assert a['componentType'] == 5126 and not a.get('sparse')
        v = doc['bufferViews'][a['bufferView']]
        width = widths[a['type']]
        at = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = v.get('byteStride', width * 4)
        return [struct.unpack_from('<' + 'f' * width, binary, at + i * stride)
                for i in range(a['count'])]
    curves = {}
    for clip in doc['animations']:
        channels = []
        for ch in clip['channels']:
            sampler = clip['samplers'][ch['sampler']]
            channels.append([doc['nodes'][ch['target']['node']]['name'], ch['target']['path'],
                             sampler.get('interpolation', 'LINEAR'),
                             values(sampler['input']), values(sampler['output'])])
        curves[clip['name']] = sorted(channels, key=lambda x: (x[0], x[1]))
        if clip['name'] in ['Idle', 'Walk']:
            angle, translation, root_range = 0, 0, 0
            for name, path, _, _, vals in channels:
                first, last = vals[0], vals[-1]
                if path == 'rotation':
                    dot = abs(sum(a*b for a, b in zip(first, last))) / math.sqrt(
                        sum(a*a for a in first) * sum(a*a for a in last))
                    angle = max(angle, math.degrees(2 * math.acos(min(1, dot))))
                elif path == 'translation':
                    translation = max(translation, math.dist(first, last))
                    if name.lower().endswith('root'):
                        root_range = max(root_range, max(math.dist(v, first) for v in vals))
            assert angle < .01 and translation < 1e-5 and root_range < 1e-5
            loop_checks.append({'file': str(file.relative_to(ROOT)), 'clip': clip['name'],
                                'loopMaxJointAngleGapDegrees': angle,
                                'loopMaxTranslationGap': translation,
                                'rootTranslationRange': root_range})
    return hashlib.sha256(json.dumps(curves, sort_keys=True).encode()).hexdigest()


for asset in {r['assetId'] for r in results}:
    a, b = [r for r in results if r['assetId'] == asset]
    assert a['decodedTriangles'] == b['decodedTriangles']
    assert a['materials'] == b['materials']
    assert a['clips'] == b['clips']
    assert a['cloneProof']['boneCount'] == b['cloneProof']['boneCount']
    # Draco reorders mesh vertices. Sparse vertex indices are not corresponding
    # vertices across variants; comparing their displacement maxima was invalid.
    # Compare every animation curve exactly, and the live whole-mesh foot bounds.
    directory = ROOT / 'public/assets/chapter2/characters' / asset / 'idlewalk-v1'
    assert curve_signature(directory / 'model.raw.glb') == curve_signature(directory / 'model.draco.glb')
    for x, y in zip(a['animationSamples'], b['animationSamples']):
        assert max(abs(v - u) for v, u in zip(x['normalizedBottomYRange'], y['normalizedBottomYRange'])) < .002

(HERE / 'batch2-idlewalk-browser-results.json').write_text(json.dumps({
    'status': 'passed', 'assets': 10, 'variants': 20,
    'loops': 40, 'samplesPerLoop': 61, 'results': results,
    'limits': ['Independent preview, no real D-region integration or player testing.',
               'QMSH-10/11 retain local rig and finger/occupation limitations.']
}, ensure_ascii=False, indent=2) + '\n')
(HERE / 'batch2-idlewalk-loop-results.json').write_text(json.dumps({
    'status': 'passed', 'method': 'all raw/Draco GLB rotation and translation curves: loop closure, fixed root',
    'checks': loop_checks
}, ensure_ascii=False, indent=2) + '\n')
print('10 assets / 20 variants / 40 idle-walk loops PASS', flush=True)
