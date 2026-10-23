/* Respirar v4.1 — Rodolfo Valle — no trackers, no accounts, no external libraries. */
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
    bell:$('bellToggle'), metronome:$('metronomeToggle'), motion:$('motionToggle'), volume:$('volume'), volumeValue:$('volumeValue'), audioStatus:$('audioStatus'),
    rhythmBlock:$('rhythmBlock'), rhythmRecap:$('rhythmRecap'), squareProgress:$('squareProgress'),squareDot:$('squareDot'),squareGuide:$('squareGuide'),metronomeTest:$('metronomeTest'),inhaleInput:$('inhaleSeconds'),holdInInput:$('holdInSeconds'),exhaleInput:$('exhaleSeconds'),holdOutInput:$('holdOutSeconds')
  };
  const modeButtons = Array.from(root.querySelectorAll('[data-mode]'));
  const durationButtons = Array.from(root.querySelectorAll('[data-duration]'));
  const rhythmButtons = Array.from(root.querySelectorAll('[data-rhythm]'));
  const soundButtons = Array.from(root.querySelectorAll('[data-sound]'));
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const audioFiles = Object.freeze({
    mar:'assets/audio/mar.mp3', brisa:'assets/audio/brisa.mp3', lluvia:'assets/audio/lluvia.mp3',
    bosque:'assets/audio/bosque.mp3', cafeteria:'assets/audio/cafeteria.mp3',
    rio:'assets/audio/rio.mp3',fogata:'assets/audio/fogata.mp3',noche:'assets/audio/noche.mp3',ventilador:'assets/audio/ventilador.mp3',marron:'assets/audio/marron.mp3'
  });
  const names = {none:'Silencio',mar:'Mar',brisa:'Brisa',lluvia:'Lluvia',bosque:'Bosque',cafeteria:'Cafetería',rio:'Río',fogata:'Fogata',noche:'Noche',ventilador:'Ventilador',marron:'Ruido marrón'};
  const icons = {none:'◌',mar:'🌊',brisa:'🍃',lluvia:'🌧️',bosque:'🌿',cafeteria:'☕',rio:'🏞️',fogata:'🔥',noche:'🌙',ventilador:'🌀',marron:'🎧'};
  const circumference = 2*Math.PI*151;
  let state='idle', mode='guided', selectedSound='none', durationMinutes=5;
  let inhaleMs=3000,holdInMs=0,exhaleMs=4000,holdOutMs=0, accumulatedMs=0, startedAt=0;
  let rAF=0, lastPhase='', lastTime='', immersive=false, rhythmAnchor=0;
  let bellOn=false,metronomeOn=true,motionOn=!media.matches,volume=.30;
  let ctx=null,active=null,audioToken=0,nextTick=0;
  const tickVoices=new Set();
  const loaded=new Map();
  let audioRest=0;
  function suspendAudio(){
    if(!ctx||ctx.state!=='running')return;
    // Suspend only after the audio nodes have stopped; resume is always user-initiated.
    if(audioRest)clearTimeout(audioRest);
    audioRest=setTimeout(()=>{audioRest=0;if(state!=='running'&&ctx&&ctx.state==='running')ctx.suspend().catch(()=>{});},620);
  }
  ui.progress.style.strokeDasharray=String(circumference);
  ui.progress.style.strokeDashoffset=String(circumference);
  const activeSession=()=>state==='running'||state==='paused';
  const hasDeadline=()=>durationMinutes!==0;
  const durationMs=()=>durationMinutes*60000;
  const elapsed=()=>accumulatedMs+(state==='running'?performance.now()-startedAt:0);
  const phases=()=>[
    {key:'inhale',label:'Inhala',length:inhaleMs,guidance:'Deja entrar el aire suavemente. Sin intentar llenarte por completo.',minScale:.75,maxScale:1},
    {key:'holdIn',label:'Pausa con aire',length:holdInMs,guidance:'Solo si resulta cómodo. Si lo necesitas, respira con naturalidad.',minScale:1,maxScale:1},
    {key:'exhale',label:'Exhala',length:exhaleMs,guidance:'Deja salir el aire sin empujar. Relaja los hombros.',minScale:1,maxScale:.75},
    {key:'holdOut',label:'Pausa sin aire',length:holdOutMs,guidance:'No fuerces esta pausa. Puedes respirar en cualquier momento.',minScale:.75,maxScale:.75}
  ].filter(x=>x.length>0);
  const cycleMs=()=>inhaleMs+holdInMs+exhaleMs+holdOutMs;
  const isSquare=()=>holdInMs>0&&holdOutMs>0&&inhaleMs===holdInMs&&holdInMs===exhaleMs&&exhaleMs===holdOutMs;
  function phaseAt(t){
    const local=t-rhythmAnchor;
    let pos=((local%cycleMs())+cycleMs())%cycleMs();
    for(const phase of phases()){
      if(pos<phase.length)return {...phase,spent:pos};
      pos-=phase.length;
    }
    return {...phases()[0],spent:0};
  }
  function updateRhythmInputs(){
    ui.inhaleInput.value=String(inhaleMs/1000);
    ui.holdInInput.value=String(holdInMs/1000);
    ui.exhaleInput.value=String(exhaleMs/1000);
    ui.holdOutInput.value=String(holdOutMs/1000);
    const holds=holdInMs||holdOutMs;
    ui.rhythmRecap.textContent=`Ciclo de ${cycleMs()/1000} segundos · ${isSquare()?'Recorrido cuadrado activo':holds?'Con pausas configuradas':'Sin pausas'}`;
  }

  const format=(ms)=>{
    const sec=Math.ceil(Math.max(0,ms)/1000);
    return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
  };
  function announce(message){ui.announcer.textContent=message;}
  function setHint(message){
    ui.audioHint.textContent=message;
    ui.audioStatus.textContent=message;
    ui.audioStatus.dataset.issue=/no pudo|bloqueó|sin audio|no ofrece/i.test(message)?'true':'false';
  }
  function scrollStage(){if(matchMedia('(max-width:860px)').matches){
    root.querySelector('.session').scrollIntoView({block:'start',behavior:media.matches?'instant':'smooth'});
  }}
  function syncButtons(){
    root.dataset.mode=mode;root.dataset.state=state;root.dataset.square=String(mode==='guided'&&isSquare());
    modeButtons.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.disabled=activeSession();});
    durationButtons.forEach(b=>{
      b.hidden=(b.dataset.duration==='0'&&mode!=='ambient');
      b.setAttribute('aria-pressed',String(Number(b.dataset.duration)===durationMinutes));
      b.disabled=activeSession();
    });
    rhythmButtons.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.rhythm===`${inhaleMs/1000},${holdInMs/1000},${exhaleMs/1000},${holdOutMs/1000}`));b.disabled=state==='running';});
    [ui.inhaleInput,ui.holdInInput,ui.exhaleInput,ui.holdOutInput].forEach(input=>input.disabled=state==='running');
    updateRhythmInputs();
    soundButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sound===selectedSound)));
    ui.volume.disabled=selectedSound==='none';
    ui.volumeValue.textContent=Math.round(volume*100)+'%';
    ui.sessionMode.textContent=mode==='guided'?'RESPIRACIÓN GUIADA':'SOLO AMBIENTES';
    ui.sessionHeading.textContent=mode==='guided'?'Tu espacio de calma':'Solo estar y escuchar';
    ui.metronome.disabled=mode!=='guided';ui.metronomeTest.disabled=mode!=='guided';
    ui.metronome.setAttribute('aria-pressed',String(metronomeOn));
    ui.metronome.textContent=metronomeOn?'Sí':'No';
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
    ui.nowPlaying.innerHTML=`<span aria-hidden="true">${icons[selectedSound]}</span> ${selectedSound==='none'?'Sin ambiente sonoro':names[selectedSound]+' · '+Math.round(volume*100)+'% de volumen'}`+(mode==='guided'&&metronomeOn?' · 🎵 Metrónomo 1 s':'');
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
    if(audioRest){clearTimeout(audioRest);audioRest=0;}
    try{
      if(!ctx){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw new Error('Sin Web Audio');ctx=new Ctx();}
      if(ctx.state!=='running')ctx.resume().catch(()=>setHint('El navegador bloqueó el sonido. Comprueba el volumen del dispositivo o continúa sin audio.'));
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
      if(sound==='none'){stopAudio(false);setHint('Ambiente silenciado; la guía y el metrónomo continúan.');}
      else startAmbience();
    }else{
      stopAudio(true);
      setHint(sound==='none'?'Elige un ambiente para acompañar tu pausa.':`${names[sound]} preparado. Comienza para escucharlo.`);
    }
    syncButtons();
  }
  function chime(phase){
    if(!bellOn||mode!=='guided')return;
    const context=initContext();if(!context||context.state!=='running')return;
    try{
      const now=context.currentTime;
      const osc=context.createOscillator(),gain=context.createGain();
      osc.type='sine';osc.frequency.value=({inhale:410,holdIn:460,exhale:330,holdOut:290})[phase]||330;
      gain.gain.setValueAtTime(.00001,now);
      gain.gain.exponentialRampToValueAtTime(.013,now+.04);
      gain.gain.exponentialRampToValueAtTime(.00001,now+.26);
      osc.connect(gain);gain.connect(context.destination);
      osc.start(now);osc.stop(now+.28);
      osc.onended=()=>{osc.disconnect();gain.disconnect();};
    }catch(_){}
  }
  // Metrónomo: un pulso cada 1000 ms del mismo reloj que mueve la esfera.
  // Se programan los próximos ~110 ms en AudioContext para evitar deriva por fotogramas.
  // Al pausar, ocultar pestaña o finalizar se cancelan incluso los pulsos futuros.
  function stopMetronome(){
    for(const voice of tickVoices){
      try{voice.osc.onended=null;voice.osc.stop();}catch(_){}
      try{voice.osc.disconnect();voice.gain.disconnect();}catch(_){}
    }
    tickVoices.clear();
  }
  function resetMetronome(){
    stopMetronome();
    nextTick=Math.ceil((elapsed()+1)/1000);
  }
  function metronomeBeat(beatMs,when){
    if(!ctx||ctx.state!=='running')return;
    const phase=phaseAt(beatMs);
    const first=phase.spent<16;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='triangle';
    // Tono breve y perceptible, sin sobresaltos, también con ambiente de fondo.
    osc.frequency.value=({inhale:740,holdIn:645,exhale:560,holdOut:470})[phase.key];
    const peak=first?.066:(phase.key.startsWith('hold')?.042:.051);
    gain.gain.setValueAtTime(.00001,when);
    gain.gain.linearRampToValueAtTime(peak,when+.007);
    gain.gain.exponentialRampToValueAtTime(.00001,when+.100);
    osc.connect(gain);gain.connect(ctx.destination);
    const voice={osc,gain};tickVoices.add(voice);
    osc.onended=()=>{tickVoices.delete(voice);try{osc.disconnect();gain.disconnect();}catch(_){}};
    osc.start(when);osc.stop(when+.105);
  }
  function scheduleMetronome(t){
    if(!metronomeOn||mode!=='guided'||state!=='running'||document.hidden||!ctx||ctx.state!=='running')return;
    // El primer pulso confirma el comienzo, incluso si el contexto de audio tardó en desbloquearse.
    if(nextTick===0){
      // Si Web Audio se desbloquea tarde, emitir un pulso audible inmediatamente.
      metronomeBeat(t,ctx.currentTime+.012);nextTick=Math.max(1,Math.ceil((t+100)/1000));
    }
    if(nextTick*1000<t-100)nextTick=Math.ceil(t/1000);
    const horizon=t+110;
    while(nextTick*1000<=horizon){
      const tickTime=nextTick*1000;
      if(!hasDeadline()||tickTime<durationMs()){
        metronomeBeat(tickTime,ctx.currentTime+Math.max(0,(tickTime-t)/1000));
      }
      nextTick++;
    }
  }
  function updateSquare(t){
    if(mode!=='guided'||!isSquare())return;
    const phase=phaseAt(t);
    const index=['inhale','holdIn','exhale','holdOut'].indexOf(phase.key);
    const moving=state==='running'&&motionOn&&!media.matches;
    const part=moving?Math.min(1,phase.spent/phase.length):0;
    const completed=index*278+part*278;
    ui.squareProgress.style.strokeDashoffset=String(1112-completed);
    const coords=[
      [31+278*part,31],
      [309,31+278*part],
      [309-278*part,309],
      [31,309-278*part]
    ][index];
    ui.squareDot.setAttribute('cx',String(coords[0]));
    ui.squareDot.setAttribute('cy',String(coords[1]));
    ui.squareGuide.querySelectorAll('[data-square-phase]').forEach(el=>{
      el.dataset.current=String(el.dataset.squarePhase===phase.key);
    });
  }
  function render(){
    const t=elapsed();
    if(state==='running'&&hasDeadline()&&t>=durationMs()){finish(true);return;}
    scheduleMetronome(t);
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
      rhythmAnchor=0;updateSquare(0);
      ui.phase.textContent=state==='completed'?'Finalizado':mode==='guided'?'A tu ritmo':'Escucha';
      ui.phaseSeconds.textContent=state==='completed'?'':'Sin prisa';
      ui.guidance.textContent=state==='completed'
        ?'Vuelve cuando quieras. No hay nada que evaluar.'
        :mode==='guided'
        ?'Puedes seguir el ritmo o respirar naturalmente. No necesitas hacerlo perfecto.'
        :'Elige un ambiente y escucha sin tener que seguir instrucciones.';
      ui.orb.style.setProperty('--orb-scale','.82');return;
    }
    if(mode==='ambient'){
      ui.phase.textContent=state==='paused'?'En pausa':'Escucha';ui.phaseSeconds.textContent=names[selectedSound];
      ui.guidance.textContent=state==='paused'?'Pausado. Continúa cuando quieras.':'No tienes que hacer nada. Puedes simplemente escuchar.';
      ui.orb.style.setProperty('--orb-scale','.86');return;
    }
    const phase=phaseAt(t);
    updateSquare(t);
    ui.phase.textContent=phase.label;
    ui.phaseSeconds.textContent=Math.ceil((phase.length-phase.spent)/1000)+' s';
    ui.guidance.textContent=state==='paused'?'Pausado. Continúa cuando te resulte cómodo.':phase.guidance;
    if(state==='running'&&lastPhase!==phase.key){
      lastPhase=phase.key;
      announce(phase.label+'. '+phase.guidance);
      chime(phase.key);
    }
    const x=phase.spent/phase.length;
    const sm=x*x*(3-2*x);
    const scale=phase.minScale+(phase.maxScale-phase.minScale)*sm;
    ui.orb.style.setProperty('--orb-scale',state==='running'&&motionOn&&!media.matches?String(scale):'.82');
  }
  function loop(){if(state!=='running')return;render();rAF=requestAnimationFrame(loop);}
  function pause(auto=false){
    if(state!=='running')return;
    accumulatedMs=elapsed();state='paused';stopClock();stopAudio(true);stopMetronome();lastPhase='';
    setHint(auto?'La pestaña quedó oculta: el sonido y la sesión se pausaron.':'Sonido pausado.');
    syncButtons();render();suspendAudio();announce(auto?'Sesión pausada al cambiar de pestaña.':'Sesión en pausa.');
  }
  function finish(natural=false){
    if(state!=='running'&&state!=='paused')return;
    if(state==='running')accumulatedMs=elapsed();
    if(natural&&hasDeadline())accumulatedMs=durationMs();
    state='completed';stopClock();stopAudio(!natural);stopMetronome();lastPhase='';
    setImmersive(false);setHint('Sesión finalizada.');
    syncButtons();render();suspendAudio();announce('Sesión finalizada. Puedes volver a tu respiración habitual.');
  }
  function start(){
    if(state==='paused'){state='running';startedAt=performance.now();lastPhase='';initContext();resetMetronome();startAmbience();syncButtons();stopClock();loop();announce('Sesión reanudada.');return;}
    accumulatedMs=0;rhythmAnchor=0;lastTime='';lastPhase='';
    state='running';startedAt=performance.now();
    initContext();nextTick=0;stopMetronome();startAmbience();setImmersive(true);syncButtons();stopClock();loop();
    announce(mode==='guided'?'Respiración iniciada.':'Ambiente iniciado.');scrollStage();
  }
  function setMode(next){
    if(activeSession()||next===mode)return;
    mode=next;state='idle';accumulatedMs=0;rhythmAnchor=0;lastPhase='';lastTime='';
    if(mode==='guided'&&durationMinutes===0)durationMinutes=5;
    if(mode==='ambient'&&selectedSound==='none')selectedSound='mar';
    stopAudio(true);stopMetronome();setImmersive(false);
    setHint(mode==='ambient'?'Mar seleccionado. Comienza para escuchar.':'El ambiente sonoro es opcional.');
    syncButtons();render();
  }
  modeButtons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  durationButtons.forEach(b=>b.addEventListener('click',()=>{
    if(activeSession())return;
    durationMinutes=Number(b.dataset.duration);
    accumulatedMs=0;rhythmAnchor=0;state='idle';lastTime='';syncButtons();render();
  }));
  function applyRhythm(values){
    if(state==='running')return;
    [inhaleMs,holdInMs,exhaleMs,holdOutMs]=values.map(v=>v*1000);
    // Si está pausado, conserva el tiempo total y empieza un ciclo nuevo al continuar.
    rhythmAnchor=state==='paused'?accumulatedMs:0;
    if(state!=='paused'){state='idle';accumulatedMs=0;lastTime='';}
    lastPhase='';resetMetronome();syncButtons();render();
  }
  rhythmButtons.forEach(b=>b.addEventListener('click',()=>{
    const vals=b.dataset.rhythm.split(',').map(Number);
    applyRhythm(vals);
  }));
  const customFields=[ui.inhaleInput,ui.holdInInput,ui.exhaleInput,ui.holdOutInput];
  const limits=[[1,15],[0,15],[1,15],[0,15]];
  function setCustomRhythm(){
    if(state==='running')return;
    // Never commit an incomplete / invalid value while someone edits the number.
    if(customFields.some((el,i)=>el.value.trim()===''||!Number.isInteger(Number(el.value))||Number(el.value)<limits[i][0]||Number(el.value)>limits[i][1]))return;
    const values=customFields.map(el=>Number(el.value));
    applyRhythm(values);
  }
  customFields.forEach((field,i)=>{
    field.addEventListener('input',setCustomRhythm);
    field.addEventListener('change',()=>{
      if(state==='running')return;
      const numeric=Number(field.value);
      const [min,max]=limits[i];
      field.value=String(Number.isFinite(numeric)?Math.max(min,Math.min(max,Math.round(numeric))):min);
      setCustomRhythm();
    });
  });
  soundButtons.forEach(b=>b.addEventListener('click',()=>changeSound(b.dataset.sound)));
  ui.volume.addEventListener('input',()=>{
    volume=Math.min(1,Math.max(0,Number(ui.volume.value)/100));
    if(active&&ctx){const now=ctx.currentTime;active.gain.gain.cancelScheduledValues(now);active.gain.gain.setTargetAtTime(volume,now,.05);}
    syncButtons();
  });
  async function testMetronome(){
    if(mode!=='guided')return;
    const context=initContext();if(!context)return;
    try{
      if(context.state!=='running')await context.resume();
      if(context.state!=='running')throw new Error('blocked');
      metronomeBeat(elapsed(),context.currentTime+.015);
      setHint('🔊 Pulso de prueba reproducido. Si no lo oyes, revisa el volumen del dispositivo.');
    }catch(_){setHint('El navegador no permitió el audio. Prueba tocando Comenzar y revisa el volumen del dispositivo.');}
  }
  ui.metronomeTest.addEventListener('click',testMetronome);
  ui.metronome.addEventListener('click',()=>{
    if(mode!=='guided')return;
    metronomeOn=!metronomeOn;
    if(metronomeOn){resetMetronome();void testMetronome();}else{stopMetronome();setHint('Metrónomo desactivado.');}
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
  window.addEventListener('pagehide',()=>{if(state==='running')pause(true);else{stopAudio(true);stopClock();stopMetronome();suspendAudio();}});
  // Instalable y offline: el trabajador de servicio nunca almacena respuestas ni sesiones.
  if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
  syncButtons();render();
})();
