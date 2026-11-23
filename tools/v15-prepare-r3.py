from pathlib import Path
import re,shutil,urllib.request
r=Path(__file__).resolve().parents[1];fonts=r/'preview/v15/fonts';fonts.mkdir(exist_ok=True)
source=r/'assets/brand/v15/engineering-atelier-r3-source.png'
if not source.exists():shutil.copy2(Path(r'C:/Users/spare/.codex/generated_images/01a20666-61b7-7dc3-bcd3-18ecc404e84b/exec-946914d3-279c-40c9-abb4-5b4e181bb2c9.png'),source)
url='https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap'
css=urllib.request.urlopen(url,timeout=30).read().decode();faces=[];seen={}
for block in re.findall(r'@font-face\s*\{.*?\}',css,re.S):
    match=re.search(r'url\((https://fonts.gstatic.com/[^)]+)\)',block)
    if not match:continue
    source_url=match.group(1)
    if source_url not in seen:
        family='space-grotesk' if 'Space Grotesk' in block else 'manrope'
        name=family+'-'+str(len(seen))+Path(source_url).suffix
        (fonts/name).write_bytes(urllib.request.urlopen(source_url,timeout=30).read());seen[source_url]=name
    faces.append(block.replace(source_url,'fonts/'+seen[source_url]))
if not any('Manrope' in f for f in faces)or not any('Space Grotesk' in f for f in faces):raise ValueError('Famille manquante')
(r/'preview/v15/fonts-r3.css').write_text('\n'.join(faces),encoding='utf-8')
for family in ('spacegrotesk','manrope'):(fonts/(family+'-OFL.txt')).write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/google/fonts/main/ofl/'+family+'/OFL.txt',timeout=30).read())
print('Polices locales:',len(seen),'fichiers ; licences OFL conservées.')
