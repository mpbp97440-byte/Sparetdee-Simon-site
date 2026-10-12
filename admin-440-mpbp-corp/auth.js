/* Firebase Auth + Firestore role + Worker validation. No browser GitHub token. */
(() => {
  'use strict';
  const worker='https://mpbp440-cms-worker.mpbp97440.workers.dev';
  const draftKey='mpbp440.cms.draft.firebase.v1';
  const $=id=>document.getElementById(id);
  let verifiedUid=null,revision=0;
  const message=(text,error=true)=>{const node=$('loginMsg');if(node){node.textContent=text;node.classList.toggle('success',!error);}};
  const hide=()=>{verifiedUid=null;$('loginBox').hidden=false;$('adminBox').hidden=true;};
  async function invoke(name,body={}) {
    if(!['admin-verify','admin-bootstrap-registry','admin-media-upload','admin-publish-site'].includes(name))throw new Error('Endpoint non autorisé.');
    const sdk=await window.MPBP440Firebase.ready(),account=sdk.auth.currentUser;
    if(!account||(account.uid!==verifiedUid&&name!=='admin-verify'))throw new Error('Session administrateur requise.');
    const token=await account.getIdToken();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
    try{
      const response=await fetch(worker+'/'+name,{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+token,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body instanceof FormData?body:JSON.stringify(body)});
      const result=await response.json().catch(()=>null);
      if(!response.ok){if((response.status===401||response.status===403)&&name!=='admin-bootstrap-registry'){hide();message('Session refusée. Reconnectez-vous.');}throw Object.assign(new Error(result?.error?.message||result?.error||result?.message||'Worker : erreur '+response.status),{status:response.status});}
      if(result?.ok===false)throw new Error(result.message||result.error||'Opération refusée.');
      return result;
    }finally{clearTimeout(timer);}
  }
  async function rpc(name,args={}) {
    const sdk=await window.MPBP440Firebase.ready(),account=sdk.auth.currentUser;
    if(!account||account.uid!==verifiedUid)throw new Error('Session administrateur requise.');
    if(name==='cms_save_draft'){
      if(JSON.stringify(args.p_payload).includes('blob:'))throw new Error('Un média temporaire ne peut pas être restauré. Importez-le de nouveau avant publication.');
      localStorage.setItem(draftKey,JSON.stringify({payload:args.p_payload,savedAt:new Date().toISOString(),uid:account.uid}));return {ok:true};
    }
    if(!window.MPBP440AdminData)throw new Error('Module administrateur indisponible.');
    return window.MPBP440AdminData.rpc(name,args,sdk);
  }
  async function signOut(){revision++;hide();const sdk=await window.MPBP440Firebase.ready();await sdk.signOut(sdk.auth);}
  window.MPBP440Admin=Object.freeze({invoke,rpc,signOut});
  window.togglePassword=()=>{$('adminPass').type=$('adminPass').type==='password'?'text':'password';};
  window.logoutAdmin=()=>signOut().catch(error=>message(error.message));
  async function validate(account){
    const current=++revision;hide();if(!account||account.isAnonymous)return;
    try{
      const sdk=await window.MPBP440Firebase.ready();
      const role=await sdk.getDoc(sdk.doc(sdk.db,'admins',account.uid));
      if(!role.exists()||role.data().active!==true||role.data().role!=='admin')throw new Error('Ce compte ne possède pas le rôle administrateur actif.');
      await invoke('admin-verify');
      if(current!==revision||sdk.auth.currentUser?.uid!==account.uid)return;
      verifiedUid=account.uid;$('loginBox').hidden=true;$('adminBox').hidden=false;
      $('sessionInfo').textContent='Session administrateur Firebase active';message('',false);
      document.dispatchEvent(new CustomEvent('mpbp-admin-ready'));
      const bootstrapKey='mpbp440.registry.firebase.v1.'+account.uid;
      if(!sessionStorage.getItem(bootstrapKey)){
        sessionStorage.setItem(bootstrapKey,'attempted');
        try{await invoke('admin-bootstrap-registry');document.dispatchEvent(new CustomEvent('mpbp-registry-ready'));}
        catch(error){
          const status=$('cmsStatus');
          if(status){const warning=document.createElement('p');warning.className='msg';warning.id='registryWarning';warning.setAttribute('role','status');warning.textContent='Attention : synchronisation du catalogue indisponible. '+error.message;status.after(warning);}
        }
      }
    }catch(error){if(current===revision){hide();message(error.message||'Session invalide ou expirée.');}}
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    sessionStorage.removeItem('mpbp440.admin.supabase.session.v1');
    $('adminLoginForm').addEventListener('submit',async event=>{
      event.preventDefault();const email=$('adminEmail').value.trim(),password=$('adminPass').value;
      if(!email||!password){message('Saisissez votre adresse e-mail et votre mot de passe.');return;}
      $('loginSubmit').disabled=true;message('Connexion Firebase en cours…',false);
      try{const sdk=await window.MPBP440Firebase.ready();await sdk.signInWithEmailAndPassword(sdk.auth,email,password);$('adminPass').value='';}
      catch(error){hide();message(/invalid-credential|wrong-password|user-not-found/.test(error.code||'')?'Identifiants incorrects.':error.message||'Connexion impossible.');}
      finally{$('loginSubmit').disabled=false;}
    });
    try{const sdk=await window.MPBP440Firebase.ready();sdk.onAuthStateChanged(sdk.auth,validate);}
    catch(error){message('Firebase indisponible : '+error.message);}
  },{once:true});
})();
