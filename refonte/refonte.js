/* MPBP440 V6.4.5 — safe restore without deleting working content */
(function(){
  const V="mpbp-v645-root";
  const catalogUrl="/data/music-catalog-v645.json?v=6.4.5";

  function cleanText(s){return (s||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
  function img(src,alt,cls=""){return `<img class="${cls}" src="${src}?v=6.4.5" alt="${alt}" onerror="this.src='/assets/brand/mpbp440-corp-official.png'">`}

  function hideAdmin(){
    document.querySelectorAll('a[href*="admin-pro"],a[href*="admin-440-mpbp-corp"],[href*="admin-pro"],[href*="admin-440-mpbp-corp"]').forEach(e=>e.remove());
    document.querySelectorAll("a,button,li,span").forEach(e=>{
      const t=cleanText(e.textContent);
      if(t==="admin"||t.includes("admin")) e.remove();
    });
  }

  function normalizeNav(){
    const routes=[
      {keys:["morceaux","music hub"],url:"/music/index.html"},
      {keys:["mpbp tv"],url:"/mpbp-tv/index.html"},
      {keys:["actualite","actus"],url:"/notifications/index.html"},
      {keys:["a venir","prochaines sorties"],url:"/music/index.html#avenir"},
      {keys:["evenement","evenements"],url:"/live/index.html"}
    ];
    document.querySelectorAll("a").forEach(a=>{
      const t=cleanText(a.textContent);
      routes.forEach(r=>{if(r.keys.some(k=>t.includes(k))) a.href=r.url;});
    });
    const tvLinks=[...document.querySelectorAll("a")].filter(a=>cleanText(a.textContent).includes("mpbp tv"));
    tvLinks.forEach((a,i)=>{a.href="/mpbp-tv/index.html"; if(i>0 && a.closest("nav")) (a.closest("li")||a).remove();});
  }

  function removePrivateText(){
    const patterns=[/git/i,/assets/i,/mp4/i,/zone/i,/chemin/i,/recommand/i,/compress/i,/html/i,/dev/i,/technique/i];
    document.querySelectorAll("p,div,article,section,li").forEach(el=>{
      if(el.children.length>8 || el.closest("#"+V)) return;
      const t=el.textContent||"";
      if(patterns.some(rx=>rx.test(t))){
        el.innerHTML='<p class="mpbp-v645-note">Des contenus exclusifs seront ajoutés progressivement dans cet espace officiel MPBP440.</p>';
      }
    });
  }

  function card(track, links, upcoming=false){
    const cover=track.cover||"/assets/brand/mpbp440-corp-official.png";
    const status=upcoming?"À venir":"Disponible";
    const subtitle=upcoming?`${track.artist} — sortie officielle le ${track.date}.`:track.artist;
    const btns=upcoming
      ? `<a class="mpbp-v645-btn" href="/music/index.html#avenir">Suivre</a>`
      : `<a class="mpbp-v645-btn" href="${links.artist}">Page artiste</a>${links.apple?`<a class="mpbp-v645-btn ghost" href="${links.apple}" target="_blank" rel="noopener">Apple Music</a>`:""}${links.deezer?`<a class="mpbp-v645-btn ghost" href="${links.deezer}" target="_blank" rel="noopener">Deezer</a>`:""}`;
    return `<article class="mpbp-v645-card" data-mpbp-title="${track.title}">${img(cover,track.title)}<div class="mpbp-v645-body"><span class="mpbp-v645-badge">${status}</span><h3>${track.title}</h3><p>${subtitle}</p><div class="mpbp-v645-actions">${btns}</div></div></article>`;
  }

  async function loadCatalog(){
    try{return await (await fetch(catalogUrl,{cache:"no-store"})).json();}
    catch(e){return null;}
  }

  async function buildTop(){
    if(document.getElementById(V)) return;
    const data=await loadCatalog();
    if(!data) return;
    const root=document.createElement("div");
    root.id=V; root.className="mpbp-v645";
    root.innerHTML=`
      <section class="mpbp-v645-hero">
        ${img("/assets/brand/mpbp440-corp-official.png","Logo MPBP440","mpbp-v645-logo")}
        <div>
          <p class="sup">Portail musical officiel</p>
          <h1>MPBP 440 Corp.</h1>
          <p><strong>Label indépendant — Sparetdee Simon • Juste Une Plume</strong></p>
          <div class="mpbp-v645-artists">
            <a class="mpbp-v645-artist" href="/artistes/sparetdee-simon.html">${img("/assets/artists/sparetdee-simon-profile.jpg","Sparetdee Simon")}<div><h3>Sparetdee Simon</h3><p>Rap conscient • Roots • Vibration</p></div></a>
            <a class="mpbp-v645-artist" href="/artistes/juste-une-plume.html">${img("/assets/artists/juste-une-plume-profile.jpg","Juste Une Plume")}<div><h3>Juste Une Plume</h3><p>Écriture • Émotion • Plume symbolique</p></div></a>
          </div>
        </div>
      </section>
      <section class="mpbp-v645-section" id="mpbp-v645-avenir"><p class="sup">Prochaines sorties</p><h2>À venir</h2><div class="mpbp-v645-grid">${data.upcoming.map(t=>card(t,{},true)).join("")}</div></section>
      <section class="mpbp-v645-section" id="mpbp-v645-morceaux"><p class="sup">Bibliothèque officielle</p><h2>Morceaux disponibles</h2><div class="mpbp-v645-grid">${data.sparetdee_available.map(t=>card(t,data.links.sparetdee,false)).join("")}${data.juste_une_plume_available.map(t=>card(t,data.links.juste_une_plume,false)).join("")}</div></section>
    `;
    const header=document.querySelector("header");
    if(header && header.parentNode) header.insertAdjacentElement("afterend",root);
    else document.body.insertBefore(root,document.body.firstChild);
  }

  async function ensureMusicPage(){
    if(!location.pathname.includes("/music")) return;
    const data=await loadCatalog(); if(!data) return;
    const hasJuju=cleanText(document.body.textContent).includes("je sais que tu sais");
    if(!hasJuju){
      const box=document.createElement("section");
      box.className="mpbp-v645 mpbp-v645-section";
      box.innerHTML=`<p class="sup">Catalogue artiste</p><h2>Juste Une Plume</h2><div class="mpbp-v645-grid">${data.juste_une_plume_available.map(t=>card(t,data.links.juste_une_plume,false)).join("")}</div>`;
      document.body.appendChild(box);
    }
  }

  function apply(){
    hideAdmin(); normalizeNav(); removePrivateText();
  }
  document.addEventListener("DOMContentLoaded",()=>{
    buildTop(); ensureMusicPage(); apply();
    setTimeout(apply,500); setTimeout(apply,1500);
    new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
  });
})();
