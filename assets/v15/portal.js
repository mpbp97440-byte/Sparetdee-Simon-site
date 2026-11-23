(() => { 'use strict';
const legacy=new Set(["home", "sortie", "alaune", "avenir", "clips", "artistes", "artists-hall", "actus", "actu", "events", "galerie", "radio", "label", "recherche", "journal", "liens", "application", "contenu-principal", "morceaux"]);
function route(){if(!['/','/index.html'].includes(location.pathname))return;let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{return;}if(legacy.has(hash)){location.replace((hash==='morceaux'?'/music/index.html':'/musique/')+location.search+'#'+encodeURIComponent(hash));}}
route();addEventListener('hashchange',route);
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
})();