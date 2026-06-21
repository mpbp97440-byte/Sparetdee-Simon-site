async function loadJson(url,fallback){try{const r=await fetch(url,{cache:"no-store"});return await r.json()}catch(e){return fallback}}
function standalone(){return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone}
async function loadDashboard(){
  const data=await loadJson("/data/dashboard-app.json?v=6.1",{});
  if(data.hero){
    heroKicker.textContent=data.hero.kicker||"Application MPBP440";
    heroTitle.textContent=data.hero.title||"Bienvenue sur MPBP440";
    heroSubtitle.textContent=data.hero.subtitle||"";
  }
  const f=data.featured_release||{};
  featuredRelease.innerHTML=`${f.cover?`<img src="/${f.cover}" onerror="this.style.display='none'">`:""}<div><h3>${f.title||"MPBP440"}</h3><p>${f.artist||""}</p><p>${f.date||""}</p><a class="btn ghost" href="${f.url||"/music/index.html"}">Ouvrir</a></div>`;
  widgets.innerHTML=(data.widgets||[]).map(w=>`<a class="widget" href="${w.url||"#"}"><span>${w.label}</span><strong>${w.value}</strong></a>`).join("");
  quickActions.innerHTML=(data.quick_actions||[]).map(a=>`<a class="action" href="${a.url||"#"}"><div class="icon">${a.icon||"•"}</div><h3>${a.title}</h3><p>${a.text||""}</p></a>`).join("");
  notifications.innerHTML=(data.internal_notifications||[]).map(n=>`<article class="notice"><p class="sup">${n.type||"info"}</p><h3>${n.title}</h3><p>${n.text||""}</p></article>`).join("");
  appMode.textContent = standalone() ? "Mode application installé actif." : "Mode navigateur actif. Vous pouvez installer l’application depuis la page Application.";
}
async function cacheEssentials(){
  if(window.mpbpCacheEssentials){
    const ok=await window.mpbpCacheEssentials();
    cacheStatus.textContent = ok ? "Pages essentielles préchargées." : "Préchargement non disponible.";
  }else{
    cacheStatus.textContent = "Gestion hors connexion non disponible sur ce navigateur.";
  }
}
document.addEventListener("DOMContentLoaded",loadDashboard);