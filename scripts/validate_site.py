from pathlib import Path
from html.parser import HTMLParser
import sys
import json
import xml.etree.ElementTree as ET

base=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
 def __init__(self):super().__init__();self.values=[]
 def handle_starttag(self,tag,attrs):
  info=dict(attrs)
  for k in ('href','src'):
   if k in info:self.values.append((tag,info[k]))
errors=[]
for p in base.rglob('*.html'):
 parser=Links();parser.feed(p.read_text())
 for tag,link in parser.values:
  if link.startswith(('https:','http:','mailto:','tel:','data:','#')):continue
  local=(p.parent/link.split('#')[0].split('?')[0]).resolve()
  if not local.is_file():errors.append(str(p.relative_to(base))+' -> '+link)
for p in base.rglob('*.svg'):
 try:ET.parse(p)
 except Exception as exc:errors.append(f'Invalid SVG: {p.name}: {exc}')
meta=json.loads((base/'exercise-data.json').read_text())
if len(meta)!=38:errors.append('Expected 38 exercise data entries')
if len(list((base/'exercises').glob('*.html')))!=38:errors.append('Expected 38 exercise detail pages')
if len(list((base/'assets'/'exercise-diagrams').glob('*.svg')))!=38:errors.append('Expected 38 movement diagrams')
if len(list((base/'assets'/'anatomy-diagrams').glob('*.svg')))!=38:errors.append('Expected 38 anatomy diagrams')
if errors:
 print('FAILED:',*errors,sep='\n');sys.exit(1)
print('PASS:',len(list(base.rglob('*.html'))),'HTML pages, 38 exercise entries, 76 valid SVG diagrams, all local href/src targets resolve')
