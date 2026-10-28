
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
export const SYSTEM=['SbjNum','Filter','Date','Srvyr','SbjNam','UsrUnq','Duration','Upload','SubjData','RvwTime','RvwComment','SrvyrComment','Complete','StopQ','Test','ParentID','Latitude','Longitude','Status','UTCDiff','QAScore','FrScName','ExReNum','VStart','VEnd','RvwName','Cancel'];
export const personas={P1:'Family upgrading for a better life',P2:'Urban customer setting up a farmhouse',P3:'Price-sensitive customer'};
export const objections={S1:'What if it breaks?',S2:'I may get KPLC power soon.',S3:'Another company is cheaper.'};
export async function parseFile(bytes,name){
 if(/\.xlsx$/i.test(name)){const w=new ExcelJS.Workbook();await w.xlsx.load(bytes);if(w.worksheets.length!==1)throw Error('Use a single-sheet results workbook.');const sheet=w.worksheets[0],headers=sheet.getRow(1).values.slice(1).map(v=>String(v??'').trim());if(new Set(headers).size!==headers.length||headers.some(h=>!h))throw Error('Missing or duplicate column headers.');const rows=[];sheet.eachRow((r,n)=>{if(n===1)return;const row={};headers.forEach((h,i)=>{const c=r.getCell(i+1);if(c.type===ExcelJS.ValueType.Formula)throw Error('Formula cells are not supported in source exports. Export values only.');row[h]=c.value instanceof Date?c.value.toISOString():c.text;});rows.push(row);});return rows;}
 if(!/\.csv$/i.test(name))throw Error('Choose a full CSV or XLSX results export.');
 const result=Papa.parse(new TextDecoder().decode(bytes),{header:true,skipEmptyLines:'greedy',transformHeader:h=>h.replace(/^\uFEFF/,'').trim()});
 if(result.errors.length)throw Error('CSV structure error: '+result.errors[0].message);
 if(result.meta.renamedHeaders)throw Error('Duplicate column names must be corrected before import.');return result.data;
}
export function testClass(v){if(/^(true|1)$/i.test(String(v).trim()))return 'test';if(/^(false|0)$/i.test(String(v).trim()))return 'production';return 'unknown';}
export const approved=r=>String(r.Status).trim().toLowerCase()==='approved';
export function sourceTime(v,offset){if(!v||String(v).includes('9999'))return null;let s=String(v).trim();if(/(?:Z|[+-]\d{2}:\d{2})$/.test(s)){const n=Date.parse(s);return Number.isFinite(n)?n:null;}const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})(?::(\d{2}))?$/);if(!m||offset===''||offset==null||!Number.isFinite(Number(offset)))return null;const [,mo,d,y,h,mi,se='0']=m;const date=new Date(Date.UTC(+y,+mo-1,+d,+h,+mi,+se));if(date.getUTCMonth()!==+mo-1||date.getUTCDate()!==+d||+h>23||+mi>59)return null;return +date-Number(offset)*3600000;}
export const displayTime=n=>n==null?'Unavailable':new Intl.DateTimeFormat('en-KE',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Nairobi'}).format(n);
export function stable(row){return JSON.stringify(Object.fromEntries(Object.entries(row).sort(([a],[b])=>a.localeCompare(b))));}
export function preview(rows,existing,survey,dict={}){
 const fields=Object.keys(rows[0]||{}), seen=new Set(), errors=[],changes=[];
 if(!survey.trim())errors.push('Enter a stable survey ID.');
 if(!fields.includes('SbjNum'))errors.push('Missing SbjNum interview identifier.');
 if(!fields.some(f=>/^Q_?\d+/.test(f)))errors.push('This looks like a summary export. Upload full survey results.');
 const stats={new:0,updated:0,unchanged:0,test:0,production:0,unknown:0};
 for(const [i,row] of rows.entries()){
  const id=String(row.SbjNum||'').trim(), key=survey+':'+id;stats[testClass(row.Test)]++;
  if(!id){errors.push('Missing identifier at row '+(i+2));continue;}
  if(seen.has(key)){errors.push('Duplicate interview identifier '+id);continue;}seen.add(key);
  const prev=existing[key];const kind=!prev?'new':stable(prev.raw)===stable(row)?'unchanged':'updated';stats[kind]++;
  // Export capture dates do not reliably order revisions. Every changed record requires explicit review.
  changes.push({key,id,kind,raw:row,previous:prev?.raw});
 }
 return {fields,recognised:fields.filter(f=>SYSTEM.includes(f)||dict[f]),unrecognised:fields.filter(f=>!SYSTEM.includes(f)&&!dict[f]),errors,stats,changes};
}
export function merge(existing,p,allowUpdates=false){if(p.errors.length)throw Error(p.errors.join('\n'));if(p.stats.updated&&!allowUpdates)throw Error('Review changed records and confirm replacement. Export revision order cannot be verified.');const next={...existing};for(const c of p.changes){if(c.kind==='unchanged')continue;next[c.key]={raw:c.raw,history:[...(existing[c.key]?.history||[]),...(existing[c.key]?[existing[c.key].raw]:[])],id:c.id};}return next;}
export function eligibility(raw,d){if(!d?.verified)return 'unknown';if(!d.routing)return 'eligible';if(!d.routing.verified)return 'unknown';const v=raw[d.routing.field];if(v==null||v==='')return 'unknown';return d.routing.values.map(String).includes(String(v))?'eligible':'ineligible';}
export function decode(raw,field,d){const v=raw[field];if(eligibility(raw,d)==='ineligible')return {state:'Not applicable',label:'Not applicable (verified routing)'};if(v==null||v==='')return {state:'Not answered',label:'Not answered'};if(!d?.verified)return {state:'Unmapped',label:'Code '+v};if(d.type==='text'||d.type==='time'||d.type==='number')return {state:'Answered',label:String(v)};const label=d.codes?.[String(v)];return label?{state:'Answered',label}:{state:'Unmapped',label:'Code '+v};}
export function analyse(records,field,d){const all=records.filter(r=>testClass(r.Test)==='production'&&approved(r));const eligible=all.filter(r=>eligibility(r,d)==='eligible');const counts={};let missing=0,unmapped=0;for(const r of eligible){const a=decode(r,field,d);if(a.state==='Not answered')missing++;else if(a.state==='Unmapped')unmapped++;else counts[a.label]=(counts[a.label]||0)+1;}return {eligible:eligible.length,unknownEligibility:all.filter(r=>eligibility(r,d)==='unknown').length,missing,unmapped,counts};}
export function qc(raw,dict={},timing={}){const flags=[];if(!Object.entries(raw).some(([f,v])=>/^Q_?\d/.test(f)&&v!==''))flags.push('No question answers. Review completion and questionnaire compatibility.');if(!raw.Latitude||!raw.Longitude)flags.push('System location missing. Check question-level GPS if mapped.');for(const [f,d] of Object.entries(dict)){if(d.required&&eligibility(raw,d)==='eligible'&&!raw[f])flags.push('Missing expected answer: '+(d.label||f));}const start=sourceTime(raw[timing.start||'VStart'],raw.UTCDiff),end=sourceTime(raw[timing.end||'VEnd'],raw.UTCDiff);if(start!=null&&end!=null&&end<start)flags.push('Questionnaire completion precedes start');const departure=timing.departure?sourceTime(raw[timing.departure],raw.UTCDiff):null;if(departure!=null&&end!=null&&end-departure>900000)flags.push('Questionnaire completed more than 15 minutes after departure');if(departure!=null&&start!=null&&start<departure)flags.push('Questionnaire started before recorded departure');return flags;}
export function publicSnapshot(state){
 // All published material is built from an explicit verified, non-private categorical allowlist.
 // Raw interviews, open text, contact fields, notes, timestamps and GPS never enter the payload.
 const raw=Object.values(state.records).map(r=>r.raw);const assignment=state.assignments||[];
 const mainIds=new Set(assignment.filter(a=>a.kind==='Sun King').map(a=>a.key));
 const main=Object.entries(state.records).filter(([k,r])=>mainIds.has(k)&&testClass(r.raw.Test)==='production'&&approved(r.raw)).map(([,r])=>r.raw);
 const analysis=Object.entries(state.dictionary).filter(([f,d])=>/^Q_?\d+(?:_O\d+)?$/.test(f)&&d.verified&&d.private===false&&d.publish===true&&d.type==='single').map(([f,d])=>({label:d.label,question:d.question,section:d.section,...analyse(main,f,d)}));
 return {schema:1,publishedAt:new Date().toISOString(),importedAt:state.imports.at(-1)?.at||null,target:30,approvedProduction:main.length,assignmentAvailable:assignment.length>0,analysis};
}
