// Synthetic demonstration model. Never use these variables to decode SurveyToGo exports.
export const DEMO_VERSION = 'simulation-2026-10-24-v1';
export const DEMO_DATE = '2026-10-24';
export const TARGET = 90;
export const zones = {
  East: ['CBD', 'Ngara', 'Kasarani', 'Mombasa', 'Kilifi', 'Kitui'],
  North: ['Murang’a', 'Kerugoya', 'Mwea', 'Meru', 'Mikinduri', 'Isiolo'],
  'Central Rift': ['Nyahururu', 'Olkalau', 'Molo', 'Olenguruone', 'Nakuru', 'Mau Narok'],
  West: ['Bungoma', 'Bukembe', 'Webuye', 'Chavakali', 'Busia', 'Kitale'],
  South: ['Kisumu', 'Rabuor', 'Iten', 'Eldoret', 'Migori', 'Awendo'],
};
export const venues = ['Shop', 'Gazebo', 'Parasol'];
export const shoppers = ['Tabitha Awino','Peter Ochanji','Alice Lukiri','Yvonne Nechesa','Lucy Karwitha','Roseline Mjomba','Winnie Obeto','Holyfield Mosese','Fred Wafula','Sandra Ochwada','Elizabeth Faith Mwendwa','Omar Seif','Dorothy Jackson','Pendo Mulewa','Martha Juma'].map((name,i)=>({id:`S${String(i+1).padStart(2,'0')}`,name,username:({11:'omar254',12:'dorothy254',3:'yvonne254',14:'martha254'})[i]||name.split(' ')[0].toLowerCase()+'254',usernameBasis:[3,11,12,14].includes(i)?'Based on a username example supplied by Rudder':'Illustrative username, not verified in SurveyToGo'}));
export const personas = {P1:'Family upgrading for a better life',P2:'Urban customer setting up a farmhouse',P3:'Price-sensitive customer'};
export const objections = {S1:'What if it breaks?',S2:'I may get KPLC power soon.',S3:'Another company is cheaper.'};
export const questions = [
  {id:'welcome',section:'Outlet experience',text:'Did the agent acknowledge the customer promptly?',rate:.87},
  {id:'needs',section:'Needs discovery',text:'Did the agent ask about the household and power needs?',rate:.71},
  {id:'recommend',section:'Recommendation',text:'Was a package recommendation linked to the stated needs?',rate:.78},
  {id:'demonstration',section:'Demonstration',text:'Was a product demonstration offered?',rate:.61},
  {id:'features',section:'Product explanation',text:'Were the main product features explained?',rate:.83},
  {id:'deposit',section:'Payment explanation',text:'Was the deposit explained?',rate:.86},
  {id:'instalment',section:'Payment explanation',text:'Were instalment amounts and the payment period explained?',rate:.71},
  {id:'totalcost',section:'Payment explanation',text:'Was the total cost explained?',rate:.48},
  {id:'objection',section:'Objection handling',text:'Did the agent directly address the assigned objection?',rate:.65},
  {id:'closing',section:'Closing',text:'Did the agent propose a clear next step?',rate:.73},
  {id:'delivery',section:'Delivery',text:'Was the delivery or collection process explained?',rate:.62},
  {id:'aftersales',section:'After-sales',text:'Was the after-sales support process explained?',rate:.56},
  {id:'family',section:'Persona',text:'Were family entertainment, lighting and charging needs explored?',persona:'P1',rate:.79},
  {id:'farmhouse',section:'Persona',text:'Were farmhouse rooms, users and periods of use explored?',persona:'P2',rate:.66},
  {id:'affordability',section:'Persona',text:'Were irregular income and affordable alternatives discussed?',persona:'P3',rate:.59},
  {id:'breakdown',section:'Secondary objection',text:'Was the breakdown and support process explained?',objection:'S1',rate:.72},
  {id:'grid',section:'Secondary objection',text:'Was the concern about future grid power addressed?',objection:'S2',rate:.61},
  {id:'competitor',section:'Secondary objection',text:'Was the cheaper competitor objection discussed?',objection:'S3',rate:.57},
];
let seed=24102026;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const stamp=minutes=>new Date(Date.UTC(2026,9,24,0,minutes)-3*3600000).toISOString();
export function eligible(r,q){return r.outcome==='Completed interaction'&&(!q.persona||r.persona===q.persona)&&(!q.objection||r.objection===q.objection);}
function generate(){seed=24102026;const records=[];let i=0;for(const [zone,locations] of Object.entries(zones)){for(const ahq of locations){for(const venue of venues){const shopper=shoppers[i%15];const sequence=Math.floor(i/15);const arrival=8*60+20+sequence*95+(i%15)*3;const departure=arrival+16+Math.floor(random()*22);const delay=i%11===0?21+Math.floor(random()*15):2+Math.floor(random()*5);const duration=4+Math.floor(random()*6);const unsuccessful=({8:'Closed',23:'No agent available',39:'Closed',54:'Outlet not found',67:'No agent available',82:'Closed'})[i];
const r={id:`SIM-20261024-${String(i+1).padStart(3,'0')}`,synthetic:true,test:true,date:DEMO_DATE,zone,ahq,venue,shopperId:shopper.id,shopperName:shopper.name,username:shopper.username,usernameBasis:shopper.usernameBasis,persona:['P1','P2','P3'][(Math.floor(i/3)+i%3)%3],objection:['S1','S2','S3'][(Math.floor(i/9)+i%3)%3],outcome:unsuccessful||'Completed interaction',qcStatus:i%15===0?'Follow up':i%7===0?'Requires approval':'Approved',arrival:i%29===0?null:stamp(arrival),departure:stamp(departure),questionnaireStart:stamp(i===17||i===58?departure-3:departure+delay),questionnaireEnd:stamp(departure+delay+duration),upload:stamp(departure+delay+duration+3+Math.floor(random()*18)),automaticCheckin:null,automaticCheckout:null,gps:null,answers:{},note:unsuccessful?`Simulated unsuccessful attempt: ${unsuccessful.toLowerCase()}. Normal selling questions are routed out.`:['Simulated interaction: the agent explained the package and invited follow-up.','Simulated interaction: payment information needed further clarification.','Simulated interaction: the customer received a demonstration and a next step.','Simulated interaction: the conversation ended without a clear support explanation.'][i%4]};
for(const q of questions){if(!eligible(r,q)){r.answers[q.id]=null;continue;}const x=random(),rate=q.rate+(venue==='Shop'?.045:venue==='Parasol'?-.055:0)+(['East','North'].includes(zone)?.025:-.015);r.answers[q.id]=x<.025?'':x<.045?'X2':x<rate?'Y':'N';}records.push(r);i++;}}}return records;}
export const demoRecords=generate();
export function answerLabel(r,q){if(!eligible(r,q))return 'Not applicable (demo routing)';const v=r.answers[q.id];return v==='Y'?'Yes':v==='N'?'No':v===''||v==null?'Not answered':`Code ${v} (unmapped)`;}
export function summary(records,question){const list=records.filter(r=>eligible(r,question));const result={n:list.length,yes:0,no:0,missing:0,unknown:0};for(const r of list){const v=r.answers[question.id];if(v==='Y')result.yes++;else if(v==='N')result.no++;else if(v===''||v==null)result.missing++;else result.unknown++;}result.percent=result.n?Math.round(result.yes/result.n*100):null;return result;}
export function flags(r){const result=[];if(!r.arrival)result.push('Manual arrival time missing');if(Date.parse(r.questionnaireStart)<Date.parse(r.departure))result.push('Reporting started before recorded departure');if(Date.parse(r.questionnaireEnd)-Date.parse(r.departure)>15*60000)result.push('Reporting completed more than 15 minutes after departure');if(questions.some(q=>eligible(r,q)&&r.answers[q.id]===''))result.push('Expected demo answer missing');if(questions.some(q=>eligible(r,q)&&r.answers[q.id]==='X2'))result.push('Unknown demo answer code');return result;}
export function rawRecord(r){return {Dataset:'SIMULATED DEMONSTRATION ONLY',Version:DEMO_VERSION,SbjNum:r.id,Test:'TRUE',Date:r.date,Srvyr:r.username,Shopper:r.shopperName,Zone:r.zone,AHQ:r.ahq,Venue:r.venue,Persona:r.persona,Objection:r.objection,VisitOutcome:r.outcome,DemoQCStatus:r.qcStatus,ManualArrival:r.arrival||'',ManualDeparture:r.departure,QuestionnaireStart:r.questionnaireStart,QuestionnaireEnd:r.questionnaireEnd,Upload:r.upload,AutomaticCheckin:'Unavailable',AutomaticCheckout:'Unavailable',GPS:'Unavailable',...Object.fromEntries(questions.map(q=>['DEMO_'+q.id,r.answers[q.id]??''])),SimulatedNote:r.note};}
