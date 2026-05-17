async function loadData(){
  const res = await fetch("data.json");
  const data = await res.json();

  document.getElementById("year").textContent = new Date().getFullYear();

  const f = data.featured;
  document.getElementById("featuredCard").innerHTML = `
    <img src="${f.cover}" alt="${f.title}">
    <div>
      <span class="status-pill">${f.status}</span>
      <h3>${f.title}</h3>
      <p class="eyebrow">${f.date}</p>
      <p>${f.description}</p>
      <div class="platforms">${Object.entries(f.links || {}).map(([name,url]) => url ? `<a href="${url}" target="_blank">${name}</a>` : "").join("")}</div>
    </div>
  `;

  document.getElementById("upcomingGrid").innerHTML = data.upcoming.map((item, i) => `
    <article class="time-card">
      <img src="${item.cover}" alt="${item.title}">
      <div class="time-body">
        <p class="eyebrow">Étape ${i+1}</p>
        <h3>${item.title}</h3>
        <p><strong>${item.date}</strong></p>
        <p>${item.description}</p>
      </div>
    </article>
  `).join("");

  document.getElementById("tracks").innerHTML = data.tracks.map(track => `
    <article class="card">
      <img src="${track.cover}" alt="${track.title}">
      <div class="card-body">
        <p class="eyebrow">${track.year || ""}</p>
        <h3>${track.title}</h3>
        <p>${track.description || ""}</p>
        <div class="platforms">${Object.entries(track.links || {}).map(([name,url]) => url ? `<a href="${url}" target="_blank">${name}</a>` : "").join("")}</div>
      </div>
    </article>
  `).join("");

  document.getElementById("videoList").innerHTML = data.videos.map(video => `
    <div>
      <div class="video-frame"><iframe src="https://www.youtube.com/embed/${video.youtubeId}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
      <div class="platforms"><a href="${video.url}" target="_blank">${video.title}</a></div>
    </div>
  `).join("");

  document.getElementById("officialLinks").innerHTML = Object.entries(data.socials).map(([name,url]) => `
    <a class="link-card" href="${url}" target="_blank">${name}</a>
  `).join("");
}
document.getElementById("menuBtn").addEventListener("click",()=>document.getElementById("navlinks").classList.toggle("open"));
window.addEventListener("scroll",()=>{document.getElementById("topBtn").style.display=window.scrollY>500?"block":"none"});
document.getElementById("topBtn").addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
loadData();
