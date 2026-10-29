const route=()=>location.hash.startsWith('#admin')?'admin':location.hash.startsWith('#report=')?'report':'demo';
const initial=route();
window.addEventListener('hashchange',()=>{if(route()!==initial)location.reload()});
if(initial==='demo')import('./demo.js');else import('./main.js');
