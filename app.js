/* Respirar v3.0 — Rodolfo Valle — no trackers, no accounts, no external libraries. */
(() => {
  'use strict';
  const root = document.getElementById('app');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const $ = (id) => document.getElementById(id);
  const ui = {
    phase:$('phase'), phaseSeconds:$('phaseSeconds'), guidance:$('guidance'), time:$('time'),
    timeCaption:$('timeCaption'), progress:$('progressLine'), orb:$('orb'), main:$('mainButton'),
    mainLabel:$('mainLabel'), playIcon:$('playIcon'), end:$('endButton'),
    nowPlaying:$('nowPlaying'), audioHint:$('audioHint'), settings:$('settings'),
    settingsLabel:$('settingsLabel'), settingsToggle:$('settingsToggle'), announcer:$('announcer'),
    sessionMode:$('sessionMode'), sessionHeading:$('sessionHeading'),
    bell:$('bellToggle'), motion:$('motionToggle'), volume:$('volume'), volumeValue:$('volumeValue'),
    rhythmBlock:$('rhythmBlock')
  };
  const modeButtons = Array.from(root.querySelectorAll('[data-mode]'));
  const durationButtons = Array.from(root.querySelectorAll('[data-duration]'));
  const rhythmButtons = Array.from(root.querySelectorAll('[data-rhythm]'));
  const soundButtons = Array.from(root.querySelectorAll('[data-sound]'));
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const audioFiles = Object.freeze({
    mar:'assets/audio/mar.mp3', brisa:'assets/audio/brisa.mp3', lluvia:'assets/audio/lluvia.mp3',
    bosque:'assets/audio/bosque.mp3', cafeteria:'assets/audio/cafeteria.mp3'
  });
  const names = {none:'Silencio',mar:'Mar',brisa:'Brisa',lluvia:'Lluvia',bosque:'Bosque',cafeteria:'Cafetería'};
  const icons = {none:'◌',mar:'🌊',brisa:'🍃',lluvia:'🌧️',bosque:'🌿',cafeteria:'☕'};
  const circumference = 2*Math.PI*151;
  let state='idle', mode='guided', selectedSound='none', durationMinutes=5;
  let inhaleMs=4000,exhaleMs=6000, accumulatedMs=0, startedAt=0;
  let rAF=0, lastPhase='', lastTime='', immersive=false;
  let bellOn=false,motionOn=!media.matches,volume=.30;
  let ctx=null,active=null,audioToken=0;
  const loaded=new Map();
  ui.progress.style.strokeDasharray=String(circumference);
  ui.progress.style.strokeDashoffset=String(circumference);
  const activeSession=()=>state==='running'||state==='paused';
  const hasDeadline=()=>durationMinutes!==0;
  const durationMs=()=>durationMinutes*60000;
  const elapsed=()=>accumulatedMs+(state==='running'?performance.now()-startedAt:0);
  const format=(ms)=>{
    const sec=Math.ceil(Math.max(0,ms)/1000);
    return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
  };
  function announce(message){ui.announcer.textContent=message;}
  function setHint(message){ui.audioHint.textContent=message;}
  function scrollStage(){if(matchMedia('(max-width:860px)').matches){
    root.querySelector('.session').scrollIntoView({block:'start',behavior:media.matches?'instant':'smooth'});
  }}
  function syncButtons(){
    root.dataset.mode=mode;root.dataset.state=state;
    modeButtons.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.disabled=activeSession();});
    durationButtons.forEach(b=>{
      b.hidden=(b.dataset.duration==='0'&&mode!=='ambient');
      b.setAttribute('aria-pressed',String(Number(b.dataset.duration)===durationMinutes));
      b.disabled=activeSession();
    });
    rhythmButtons.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.rhythm===`${inhaleMs/1000},${exhaleMs/1000}`));b.disabled=activeSession();});
    soundButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sound===selectedSound)));
    ui.volume.disabled=selectedSound==='none';
    ui.volumeValue.textContent=Math.round(volume*100)+'%';
    ui.sessionMode.textContent=mode==='guided'?'RESPIRACIÓN GUIADA':'SOLO AMBIENTES';
    ui.sessionHeading.textContent=mode==='guided'?'Tu espacio de calma':'Solo estar y escuchar';
    ui.bell.disabled=mode!=='guided';
    ui.bell.setAttribute('aria-pressed',String(bellOn));ui.bell.textContent=bellOn?'Sí':'No';
    ui.motion.disabled=media.matches;ui.motion.setAttribute('aria-pressed',String(!media.matches&&motionOn));
    ui.motion.textContent=!media.matches&&motionOn?'Sí':'No';
    const active=activeSession();
    ui.mainLabel.textContent=state==='running'?'Pausar':state==='paused'?'Continuar':state==='completed'?'Comenzar de nuevo':'Comenzar';
    ui.playIcon.innerHTML=state==='running'
      ?'<rect x="7" y="5" width="3.8" height="14" rx="1"/><rect x="13.2" y="5" width="3.8" height="14" rx="1"/>'
      :'<path d="M8 5.8c0-.7.8-1.1 1.4-.7l9.1 5.8a1.3 1.3 0 0 1 0 2.2l-9.1 5.8c-.6.4-1.4 0-1.4-.7V5.8Z"/>';
    ui.end.disabled=!active;
    ui.nowPlaying.innerHTML=`<span aria-hidden="true">${icons[selectedSound]}</span> ${selectedSound==='none'?'Sin ambiente sonoro':names[selectedSound]+' · '+Math.round(volume*100)+'% de volumen'}`;
  }
  function setImmersive(value){
    immersive=value;
    root.dataset.immersive=String(value);
    ui.settingsToggle.setAttribute('aria-expanded',String(!value));
    ui.settingsLabel.textContent=value?'Mostrar ajustes':'Ocultar ajustes';
    ui.settings.setAttribute('aria-hidden',String(value));
    // <aside> children are hidden through display:none; no active input can retain focus.
  }
  function stopClock(){if(rAF)cancelAnimationFrame(rAF);rAF=0;}
  function closeNode(node,delay=0){
    if(!node)return;
    try{node.source.stop(ctx.currentTime+delay+.02);}catch(_){}
    if(delay===0){try{node.source.disconnect();node.gain.disconnect();}catch(_){}}
    else node.source.onended=()=>{try{node.source.disconnect();node.gain.disconnect();}catch(_){}};
  }
  function stopAudio(immediate=true){
    audioToken++;
    if(!active)return;
    const old=active;active=null;
    if(!immediate&&ctx&&ctx.state==='running'){
      const now=ctx.currentTime;
      old.gain.gain.cancelScheduledValues(now);old.gain.gain.setValueAtTime(old.gain.gain.value,now);
      old.gain.gain.linearRampToValueAtTime(0,now+.45);closeNode(old,.45);
    }else{
      try{old.gain.gain.cancelScheduledValues(0);old.gain.gain.value=0;}catch(_){}
      closeNode(old);
    }
  }
  function initContext(){
    try{
      if(!ctx){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw new Error('Sin Web Audio');ctx=new Ctx();}
      if(ctx.state==='suspended')ctx.resume().catch(()=>setHint('El navegador bloqueó el sonido. Puedes continuar sin audio.'));
      return ctx;
    }catch(_){setHint('Este navegador no ofrece audio. La guía visual continúa.');return null;}
  }
  async function getBuffer(sound){
    if(loaded.has(sound))return loaded.get(sound);
    const response=await fetch(audioFiles[sound],{cache:'force-cache'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const array=await response.arrayBuffer();
    return await ctx.decodeAudioData(array);
  }
  function startAmbience(){
    if(state!=='running'||selectedSound==='none')return;
    const context=initContext();if(!context)return;
    const sound=selectedSound;
    const token=++audioToken;
    setHint(`Preparando ${names[sound].toLowerCase()}…`);
    // A buffer is fetched only after explicit initiation, never during initial page load.
    (async()=>{
      try{
        const buffer=await getBuffer(sound);
        if(token!==audioToken||state!=='running'||document.hidden||selectedSound!==sound)return;
        loaded.set(sound,buffer);
        await context.resume();
        if(token!==audioToken||state!=='running'||document.hidden||selectedSound!==sound)return;
        const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
        const gain=context.createGain();gain.gain.value=0;
        source.connect(gain);gain.connect(context.destination);
        const old=active;
        active={source,gain,sound};
        const now=context.currentTime;
        source.start(now);
        gain.gain.linearRampToValueAtTime(volume,now+.65);
        if(old){old.gain.gain.cancelScheduledValues(now);old.gain.gain.setValueAtTime(old.gain.gain.value,now);old.gain.gain.linearRampToValueAtTime(0,now+.65);closeNode(old,.65);}
        setHint(`${names[sound]} reproduciéndose desde este sitio.`);
      }catch(err){if(token===audioToken){setHint('El audio no pudo cargarse. Comprueba la conexión; puedes continuar en silencio.');}}
    })();
  }
  function changeSound(sound){
    if(sound===selectedSound)return;
    selectedSound=sound;
    if(state==='running'){
      if(sound==='none'){stopAudio(false);setHint('Ambiente silenciado.');}
      else startAmbience();
    }else{
      stopAudio(true);
      setHint(sound==='none'?'Elige un ambiente para acompañar tu pausa.':`${names[sound]} preparado. Comienza para escucharlo.`);
    }
    syncButtons();
  }
  function chime(inhale){
    if(!bellOn||mode!=='guided')return;
    const context=initContext();if(!context||context.state!=='running')return;
    try{
      const now=context.currentTime;
      const osc=context.createOscillator(),gain=context.createGain();
      osc.type='sine';osc.frequency.value=inhale?410:330;
      gain.gain.setValueAtTime(.00001,now);
      gain.gain.exponentialRampToValueAtTime(.013,now+.04);
      gain.gain.exponentialRampToValueAtTime(.00001,now+.26);
      osc.connect(gain);gain.connect(context.destination);
      osc.start(now);osc.stop(now+.28);
      osc.onended=()=>{osc.disconnect();gain.disconnect();};
    }catch(_){}
  }
  function render(){
    const t=elapsed();
    if(state==='running'&&hasDeadline()&&t>=durationMs()){finish(true);return;}
    if(hasDeadline()){
      const time=format(durationMs()-Math.min(t,durationMs()));
      if(time!==lastTime){ui.time.textContent=time;lastTime=time;}
      ui.timeCaption.textContent='TIEMPO RESTANTE';
      ui.progress.style.strokeDashoffset=String(circumference*(1-Math.min(t/durationMs(),1)));
    }else{
      ui.time.textContent='∞';ui.timeCaption.textContent='SIN LÍMITE DE TIEMPO';
      ui.progress.style.strokeDashoffset=String(circumference);
    }
    if(state==='idle'||state==='completed'){
      ui.phase.textContent=state==='completed'?'Finalizado':mode==='guided'?'A tu ritmo':'Escucha';
      ui.phaseSeconds.textContent=state==='completed'?'':'Sin prisa';
      ui.guidance.textContent=state==='completed'
        ?'Vuelve cuando quieras. No hay nada que evaluar.'
        :mode==='guided'
        ?'Busca una posición cómoda. Puedes mantener los ojos abiertos y respirar normalmente.'
        :'Elige un ambiente y escucha sin tener que seguir instrucciones.';
      ui.orb.style.setProperty('--orb-scale','.82');return;
    }
    if(mode==='ambient'){
      ui.phase.textContent=state==='paused'?'En pausa':'Escucha';ui.phaseSeconds.textContent=names[selectedSound];
      ui.guidance.textContent=state==='paused'?'Pausado. Continúa cuando quieras.':'No tienes que hacer nada. Puedes simplemente escuchar.';
      ui.orb.style.setProperty('--orb-scale','.86');return;
    }
    const cycle=inhaleMs+exhaleMs;
    const pos=t%cycle, inhaling=pos<inhaleMs;
    const stageTime=inhaling?inhaleMs:exhaleMs;
    const spent=inhaling?pos:pos-inhaleMs;
    const phase=inhaling?'inhale':'exhale';
    ui.phase.textContent=inhaling?'Inhala':'Exhala';
    ui.phaseSeconds.textContent=Math.ceil((stageTime-spent)/1000)+' s';
    ui.guidance.textContent=state==='paused'?'Pausado. Continúa cuando te resulte cómodo.':
      inhaling?'Deja entrar el aire suavemente. Sin intentar llenarte por completo.':
      'Deja salir el aire, sin empujar. Relaja los hombros.';
    if(state==='running'&&lastPhase!==phase){lastPhase=phase;announce(inhaling?'Inhala suavemente.':'Exhala suavemente.');chime(inhaling);}
    const x=spent/stageTime;
    const sm=x*x*(3-2*x);
    const scale=inhaling?.75+.25*sm:1-.25*sm;
    ui.orb.style.setProperty('--orb-scale',state==='running'&&motionOn&&!media.matches?String(scale):'.82');
  }
  function loop(){if(state!=='running')return;render();rAF=requestAnimationFrame(loop);}
  function pause(auto=false){
    if(state!=='running')return;
    accumulatedMs=elapsed();state='paused';stopClock();stopAudio(true);lastPhase='';
    setHint(auto?'La pestaña quedó oculta: el sonido y la sesión se pausaron.':'Sonido pausado.');
    syncButtons();render();announce(auto?'Sesión pausada al cambiar de pestaña.':'Sesión en pausa.');
  }
  function finish(natural=false){
    if(state!=='running'&&state!=='paused')return;
    if(state==='running')accumulatedMs=elapsed();
    if(natural&&hasDeadline())accumulatedMs=durationMs();
    state='completed';stopClock();stopAudio(!natural);lastPhase='';
    setImmersive(false);setHint('Sesión finalizada.');
    syncButtons();render();announce('Sesión finalizada. Puedes volver a tu respiración habitual.');
  }
  function start(){
    if(state==='paused'){state='running';startedAt=performance.now();lastPhase='';initContext();startAmbience();syncButtons();stopClock();loop();announce('Sesión reanudada.');return;}
    accumulatedMs=0;lastTime='';lastPhase='';
    state='running';startedAt=performance.now();
    initContext();startAmbience();setImmersive(true);syncButtons();stopClock();loop();
    announce(mode==='guided'?'Respiración iniciada.':'Ambiente iniciado.');scrollStage();
  }
  function setMode(next){
    if(activeSession()||next===mode)return;
    mode=next;state='idle';accumulatedMs=0;lastPhase='';lastTime='';
    if(mode==='guided'&&durationMinutes===0)durationMinutes=5;
    if(mode==='ambient'&&selectedSound==='none')selectedSound='mar';
    stopAudio(true);setImmersive(false);
    setHint(mode==='ambient'?'Mar seleccionado. Comienza para escuchar.':'El ambiente sonoro es opcional.');
    syncButtons();render();
  }
  modeButtons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  durationButtons.forEach(b=>b.addEventListener('click',()=>{
    if(activeSession())return;
    durationMinutes=Number(b.dataset.duration);
    accumulatedMs=0;state='idle';lastTime='';syncButtons();render();
  }));
  rhythmButtons.forEach(b=>b.addEventListener('click',()=>{
    if(activeSession())return;
    const vals=b.dataset.rhythm.split(',').map(Number);
    inhaleMs=vals[0]*1000;exhaleMs=vals[1]*1000;
    state='idle';accumulatedMs=0;lastPhase='';syncButtons();render();
  }));
  soundButtons.forEach(b=>b.addEventListener('click',()=>changeSound(b.dataset.sound)));
  ui.volume.addEventListener('input',()=>{
    volume=Math.min(1,Math.max(0,Number(ui.volume.value)/100));
    if(active&&ctx){const now=ctx.currentTime;active.gain.gain.cancelScheduledValues(now);active.gain.gain.setTargetAtTime(volume,now,.05);}
    syncButtons();
  });
  ui.bell.addEventListener('click',()=>{if(mode!=='guided')return;bellOn=!bellOn;if(bellOn)initContext();syncButtons();});
  ui.motion.addEventListener('click',()=>{if(media.matches)return;motionOn=!motionOn;syncButtons();render();});
  ui.settingsToggle.addEventListener('click',()=>setImmersive(!immersive));
  ui.main.addEventListener('click',()=>state==='running'?pause():start());
  ui.end.addEventListener('click',()=>finish(false));
  function handleReduce(){if(media.matches)motionOn=false;syncButtons();render();}
  if(media.addEventListener)media.addEventListener('change',handleReduce);
  else if(media.addListener)media.addListener(handleReduce);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running')pause(true);});
  window.addEventListener('pagehide',()=>{if(state==='running')pause(true);else{stopAudio(true);stopClock();}});
  syncButtons();render();
})();
