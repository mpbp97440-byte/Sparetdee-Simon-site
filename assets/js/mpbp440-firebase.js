/* Firebase modular SDK 13.0.0, pinned. Public config; no administrative secrets. */
(() => {
  'use strict';
  const config=Object.freeze({apiKey:'AIzaSyC1_KbQ2y5JV7PKLib_Z8-6yaOJzTLSO3k',authDomain:'mpbp440-site.firebaseapp.com',projectId:'mpbp440-site',storageBucket:'mpbp440-site.firebasestorage.app',messagingSenderId:'907230366915',appId:'1:907230366915:web:d5d51dff0510071a2c2676',measurementId:'G-LYCLQ7NWFM'});
  const isAdmin=location.pathname.includes('/admin-440-mpbp-corp/');
  const isPreview=/(?:^|\.)githack\.com$/.test(location.hostname)||(location.hostname==='mpbp97440-byte.github.io'&&location.pathname.startsWith('/MPBP440-V12-Preview/'));
  let runtime,anonymous,ga;
  const ready=()=>runtime ||= Promise.all([
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js')
  ]).then(([appSdk,authSdk,storeSdk])=>{
    const app=appSdk.initializeApp(config);
    return {app,auth:authSdk.getAuth(app),db:storeSdk.getFirestore(app),...authSdk,...storeSdk};
  }).catch(error=>{runtime=null;throw error;});
  const user=async()=>{
    const sdk=await ready();await sdk.auth.authStateReady();
    if(sdk.auth.currentUser)return sdk.auth.currentUser;
    if(isAdmin||isPreview)throw new Error('Authentification requise sur ce domaine.');
    return anonymous ||= sdk.signInAnonymously(sdk.auth).then(result=>result.user).finally(()=>{anonymous=null;});
  };
  const track=async(name,parameters={})=>{
    if(isAdmin||isPreview)return;
    try{
      const analytics=await(ga ||= ready().then(async sdk=>{
        const module=await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-analytics.js');
        if(!await module.isSupported())return null;
        const instance=module.initializeAnalytics(sdk.app,{config:{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+location.pathname,page_referrer:document.referrer?new URL(document.referrer).origin:''}});
        return {instance,logEvent:module.logEvent};
      }));
      if(analytics)analytics.logEvent(analytics.instance,name,parameters);
    }catch(_){/* Analytics must never block playback or navigation. */}
  };
  const id=key=>{if(!/^[\w-]{1,160}$/.test(String(key||'')))throw new Error('Identifiant de contenu invalide.');return key;};
  const active=async(sdk,key)=>{const entry=await sdk.getDoc(sdk.doc(sdk.db,'content_registry',id(key)));return entry.exists()&&entry.data().active===true;};
  const storedId=(store,key)=>{let value=store.getItem(key);if(!value){value=crypto.randomUUID();store.setItem(key,value);}return value;};
  const format=(count,label)=>new Intl.NumberFormat('fr-FR').format(Number(count)||0)+' '+(label==='J’aime'?label:label+((Number(count)||0)===1?'':'s'));
  const count=async(sdk,path)=>(await sdk.getCountFromServer(sdk.collection(sdk.db,...path))).data().count;
  const publicContext=async key=>{const sdk=await ready(),account=await user();return {sdk,uid:account.uid,enabled:await active(sdk,key)};};
  const analytics=Object.freeze({
    isPreview,format,track,
    visitorId:()=>storedId(localStorage,'mpbp440.analytics.visitor.v1'),
    sessionId:()=>storedId(sessionStorage,'mpbp440.analytics.session.v1'),
    siteVisit:()=>track('page_view',{page_location:location.origin+location.pathname}),
    artistVisit:key=>track('artist_view',{artist_key:id(key)}),
    eventVisit:key=>track('event_view',{event_key:id(key)}),
    videoView:async key=>{
      if(isPreview)return null;
      try{const {sdk,uid,enabled}=await publicContext(key);if(!enabled)return null;
        const ref=sdk.doc(sdk.db,'engagement',key,'views',uid);
        const created=await sdk.runTransaction(sdk.db,async tx=>{if((await tx.get(ref)).exists())return false;tx.set(ref,{createdAt:sdk.serverTimestamp()});return true;});
        if(created)track('video_view',{content_id:key});return true;
      }catch(_){return null;}
    },
    toggleLike:async key=>{
      if(isPreview)return null;
      try{const {sdk,uid,enabled}=await publicContext(key);if(!enabled)return null;
        const ref=sdk.doc(sdk.db,'engagement',key,'likes',uid);
        const liked=await sdk.runTransaction(sdk.db,async tx=>{if((await tx.get(ref)).exists()){tx.delete(ref);return false;}tx.set(ref,{createdAt:sdk.serverTimestamp()});return true;});
        track('video_like',{content_id:key,liked});return liked;
      }catch(_){return null;}
    },
    videoEngagement:async key=>{
      if(isPreview)return null;
      const {sdk,uid,enabled}=await publicContext(key);if(!enabled)return null;
      const [views,likes,own]=await Promise.all([count(sdk,['engagement',key,'views']),count(sdk,['engagement',key,'likes']),sdk.getDoc(sdk.doc(sdk.db,'engagement',key,'likes',uid))]);
      return {views,likes,liked:own.exists()};
    },
    commentsForClip:async key=>{
      if(isPreview)return [];
      const {sdk,enabled}=await publicContext(key);if(!enabled)return [];
      // Equality filters only: merge single-field indexes, then order locally.
      const result=await sdk.getDocs(sdk.query(sdk.collection(sdk.db,'comments'),sdk.where('status','==','approved'),sdk.where('contentId','==',key),sdk.where('contentType','==','clip'),sdk.limit(100)));
      return result.docs.map(entry=>{const data=entry.data();return {display_name:data.displayName,message:data.message,created_at:data.createdAt?.toDate().toISOString()||new Date(0).toISOString()};}).sort((a,b)=>a.created_at.localeCompare(b.created_at));
    },
    submitComment:async(key,displayName,message)=>{
      if(isPreview)return null;
      displayName=String(displayName||'').trim();message=String(message||'').trim();
      if(displayName.length<2||displayName.length>60||message.length<1||message.length>1000)throw new Error('Commentaire invalide.');
      const {sdk,uid,enabled}=await publicContext(key);if(!enabled)throw new Error('Ce clip attend son activation dans le catalogue.');
      const result=await sdk.addDoc(sdk.collection(sdk.db,'comments'),{contentId:key,contentType:'clip',authorUid:uid,displayName,message,status:'pending',createdAt:sdk.serverTimestamp()});
      track('comment_submit',{content_id:key});return {id:result.id};
    }
  });
  window.MPBP440Firebase=Object.freeze({ready,user,config,isPreview});
  if(isAdmin)return;
  window.MPBP440Analytics=analytics;
  window.MPBP440AnalyticsUnavailable=element=>{if(element)element.textContent='Statistiques temporairement indisponibles';};
  document.addEventListener('DOMContentLoaded',()=>{
    analytics.siteVisit();
    const artists={'sparetdee-simon.html':'sparetdee-simon','makeda-muse.html':'makeda-muse','juste-une-plume.html':'juste-une-plume'};
    const artist=artists[location.pathname.split('/').pop()];if(artist)analytics.artistVisit(artist);
    if(/\/(evenements|live)(\/|$)/.test(location.pathname))analytics.eventVisit('archives');
    document.addEventListener('click',event=>{
      const link=event.target.closest('a[href]');if(!link)return;
      const url=new URL(link.href);
      if(/(^|\.)(spotify\.com|youtube\.com|youtu\.be|music\.apple\.com|deezer\.com|amazon\.[a-z.]+|tiktok\.com)$/.test(url.hostname))track('platform_click',{platform:url.hostname});
    });
  },{once:true});
})();
