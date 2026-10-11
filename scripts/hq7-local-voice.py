from pathlib import Path
import subprocess,wave,json
r=Path(__file__).resolve().parents[1];out=r/'public/assets/hongqiao/cinema/audio';out.mkdir(exist_ok=True)
lines=[('intro_01','船到桥下，怎么停了？',3),('intro_03','莫牵了！',3),('intro_04','桅杆未落。',2),('intro_05','纤夫走神，忘了松绳降桅。',4),('intro_06','快降桅！当心脚下！',3),('intro_07','接住绳！',3),('intro_08a','松绳！',1),('intro_08b','缓缓放！',4),('intro_08c','稳住！',2),('intro_09','郎君，劳你搭把手。',3),('ending_01','都备齐了，看准了再走！',3),('ending_02','过了！过桥了！',4),('ending_03','好，慢慢靠岸！',4)]
report=[]
for id,text,budget in lines:
 aiff=r/'output/playwright/step7'/f'{id}.aiff';wav=out/f'{id}.wav'
 subprocess.run(['say','-v','Eddy (中文（中国大陆）)','-r','200','-o',str(aiff),text],check=True)
 subprocess.run(['afconvert','-f','WAVE','-d','LEI16',str(aiff),str(wav)],check=True)
 with wave.open(str(wav)) as f:duration=f.getnframes()/f.getframerate()
 report.append({'id':id,'text':text,'duration':duration,'budget':budget,'voice':'macOS Eddy zh_CN, native rate 200, no time-stretch','usable':duration<=budget});print(report[-1],flush=True)
(r/'output/playwright/step7/voice-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
