const route=()=>location.hash.startsWith('#admin')?'admin':location.hash.startsWith('#report=')?'report':'demo';
const initial=route();
window.addEventListener('hashchange',()=>{if(route()!==initial)location.reload()});
const loaders={demo:()=>import('./demo.js'),admin:()=>import('./main.js'),report:()=>import('./main.js')};
loaders[initial]();
