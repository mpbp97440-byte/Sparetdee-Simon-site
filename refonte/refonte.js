/* MPBP440 V6.3.3 — Clean Refonte Fix */
(function(){
  const V633_ID = "mpbp-v633-home";

  function isBadOldBlock(el){
    if(!el || !el.textContent) return false;
    const text = el.textContent.toLowerCase();
    return text.includes("double sortie") || text.includes("double sorti");
  }

  function hideOldBrokenBlocks(){
    document.querySelectorAll(".mpbp-v63-hero,.mpbp-v63-section,.mpbp-v631-root,.mpbp-v631-hero,.mpbp-v631-section").forEach(el=>{
      if(!el.classList.contains("mpbp-v633-home")) el.remove();
    });

    document.querySelectorAll("section, article").forEach(el=>{
      if(el.closest("#"+V633_ID)) return;
      if(isBadOldBlock(el)) el.classList.add("mpbp-v633-hide");
    });

    document.querySelectorAll("div").forEach(el=>{
      if(el.closest("#"+V633_ID)) return;
      if(el.children.length > 8) return;
      if(isBadOldBlock(el)) el.classList.add("mpbp-v633-hide");
    });
  }

  function buildHome(){
    if(document.getElementById(V633_ID)) return;

    const wrap = document.createElement("div");
    wrap.id = V633_ID;
    wrap.className = "mpbp-v633-home";
    wrap.innerHTML = `
      <section class="mpbp-v633-hero">
        <img class="mpbp-v633-logo" src="/assets/brand/mpbp440-official-logo.webp?v=6.3.3" alt="Logo officiel MPBP440">
        <div class="mpbp-v633-title">
          <p>Portail musical officiel</p>
          <h1>MPBP 440 Corp.</h1>
          <strong>Label indépendant — Sparetdee Simon • Juste Une Plume</strong>
          <div class="mpbp-v633-artists">
            <a class="mpbp-v633-artist" href="/artistes/sparetdee-simon.html">
              <img src="/assets/artists/sparetdee-simon-profile.webp?v=6.3.3" alt="Sparetdee Simon">
              <div><h3>Sparetdee Simon</h3><p>Rap conscient • Roots • Vibration</p></div>
            </a>
            <a class="mpbp-v633-artist" href="/artistes/juste-une-plume.html">
              <img src="/assets/artists/juste-une-plume-profile.webp?v=6.3.3" alt="Juste Une Plume">
              <div><h3>Juste Une Plume</h3><p>Écriture • émotion • plume symbolique</p></div>
            </a>
          </div>
        </div>
      </section>

      <section class="mpbp-v633-section">
        <p>Comptes à rebours officiels</p>
        <h2>Prochaines sorties</h2>
        <div class="mpbp-v633-grid">
          <article class="mpbp-v633-card">
            <img src="/assets/covers/reves-et-cauchemards.webp?v=6.3.3" alt="Rêves et Cauchemards">
            <div class="mpbp-v633-content">
              <h3>Rêves et Cauchemards</h3>
              <p>Sparetdee Simon — sortie officielle prévue le <strong>24/06/2026</strong>.</p>
              <a class="mpbp-v633-btn" href="/music/index.html">Voir dans Music Hub</a>
            </div>
          </article>
          <article class="mpbp-v633-card">
            <div class="mpbp-v633-content">
              <h3>Le Système</h3>
              <p>Sparetdee Simon — sortie officielle prévue le <strong>27/06/2026</strong>.</p>
              <a class="mpbp-v633-btn ghost" href="/music/index.html">Voir la sortie</a>
            </div>
          </article>
        </div>
      </section>

      <section class="mpbp-v633-section">
        <p>Bibliothèque officielle</p>
        <h2>Titres disponibles</h2>
        <div class="mpbp-v633-grid">
          <article class="mpbp-v633-card">
            <img src="/assets/covers/je-vous-pousse-tous.webp?v=6.3.3" alt="Je Vous Pousse Tous">
            <div class="mpbp-v633-content">
              <h3>Je Vous Pousse Tous</h3>
              <p>Disponible sur toutes les plateformes.</p>
              <a class="mpbp-v633-btn" href="/artistes/sparetdee-simon.html">Page artiste</a>
            </div>
          </article>
          <article class="mpbp-v633-card">
            <img src="/assets/covers/l-argent.webp?v=6.3.3" alt="L’Argent">
            <div class="mpbp-v633-content">
              <h3>L’Argent</h3>
              <p>Disponible sur toutes les plateformes.</p>
              <a class="mpbp-v633-btn" href="/artistes/sparetdee-simon.html">Page artiste</a>
            </div>
          </article>
        </div>
      </section>
    `;

    const header = document.querySelector("header");
    if(header && header.parentNode){
      header.insertAdjacentElement("afterend", wrap);
    }else{
      document.body.insertBefore(wrap, document.body.firstChild);
    }
  }

  function apply(){
    hideOldBrokenBlocks();
    buildHome();
    hideOldBrokenBlocks();
  }

  document.addEventListener("DOMContentLoaded", () => {
    apply();
    setTimeout(apply, 500);
    setTimeout(apply, 1500);

    const observer = new MutationObserver(() => hideOldBrokenBlocks());
    observer.observe(document.body, {childList:true, subtree:true});
  });
})();
