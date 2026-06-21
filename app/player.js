/* MPBP440 V6.0.4 — Mini-player neutralisé */
(function(){
  function killPlayer(){
    document.querySelectorAll(".mpbp-mini-player").forEach(function(el){ el.remove(); });
  }
  document.addEventListener("DOMContentLoaded", function(){
    killPlayer();
    setInterval(killPlayer, 500);
  });
  window.addEventListener("load", killPlayer);
})();
