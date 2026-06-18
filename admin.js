
async function loadJson(path, fallback){
  try{
    const r = await fetch(path,{cache:'no-store'});
    return await r.json();
  }catch(e){
    return fallback;
  }
}
(async ()=>{
  const news = await loadJson('data/news.json',[]);
  const events = await loadJson('data/events.json',[]);
  const artists = await loadJson('data/artists.json',[]);
  const live = await loadJson('data/live_status.json',{is_live:false});

  document.getElementById('newsCount').textContent = news.length;
  document.getElementById('eventsCount').textContent = events.length;
  document.getElementById('artistsCount').textContent = artists.length;
  document.getElementById('liveStatus').textContent = live.is_live ? 'EN DIRECT' : 'HORS LIGNE';
})();
