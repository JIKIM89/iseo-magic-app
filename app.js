const consonants=[['ㄱ','기역'],['ㄴ','니은'],['ㄷ','디귿'],['ㄹ','리을'],['ㅁ','미음'],['ㅂ','비읍'],['ㅅ','시옷'],['ㅇ','이응'],['ㅈ','지읒'],['ㅊ','치읓'],['ㅋ','키읔'],['ㅌ','티읕'],['ㅍ','피읖'],['ㅎ','히읗']];
const vowels=[['ㅏ','아'],['ㅑ','야'],['ㅓ','어'],['ㅕ','여'],['ㅗ','오'],['ㅛ','요'],['ㅜ','우'],['ㅠ','유'],['ㅡ','으'],['ㅣ','이']];
const english='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(x=>[x,x]);
const sets={c:{title:'한글 자음',items:consonants},v:{title:'한글 모음',items:vowels},e:{title:'영어 ABC',items:english}};
const $=id=>document.getElementById(id);let mode='c',idx=0,quiz=null,stars=Number(localStorage.getItem('iseo-stars')||0),audioContext=null;
function refresh(){ $('stars').textContent='⭐ '+stars }
// iOS home-screen PWAs can fail to start speech synthesis even when Safari works.
// Play a short offline WebAudio cue immediately on the tap, then attempt native TTS.
// Real prerecorded voices can be added later as audio/ko/<name>.mp3 or audio/en/<letter>.mp3.
let activeAudio=null;
function chime(){
  try {
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return;
    if(!audioContext)audioContext=new C();
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
    const now=audioContext.currentTime;
    [660,880].forEach((freq,i)=>{
      const osc=audioContext.createOscillator(), gain=audioContext.createGain();
      osc.type='sine';osc.frequency.value=freq;
      gain.gain.setValueAtTime(.0001,now+i*.11);
      gain.gain.exponentialRampToValueAtTime(.075,now+i*.11+.018);
      gain.gain.exponentialRampToValueAtTime(.0001,now+i*.11+.18);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(now+i*.11);osc.stop(now+i*.11+.19);
    });
  } catch(e) { /* no sound device */ }
}
function sound(name,lang){
  if(activeAudio){activeAudio.pause();activeAudio=null;}
  // Only try recorded files when explicitly listed here, avoiding nonexistent-file errors.
  const recordings=window.ISEO_RECORDINGS||{};
  const key=(lang==='en'?'en/':'ko/')+name;
  if(recordings[key]){
    const audio=new Audio(recordings[key]);activeAudio=audio;
    audio.play().catch(()=>speak(name,lang));
  }else speak(name,lang);
}
function speak(t,lang='ko'){
  if(!('speechSynthesis' in window))return;
  try {
    const synth=window.speechSynthesis;
    synth.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang=lang==='en'?'en-US':'ko-KR';u.rate=.78;u.pitch=1.15;u.volume=1;
    const voices=synth.getVoices();
    const matches=voices.filter(v=>v.lang.toLowerCase().startsWith(lang==='en'?'en':'ko'));
    const voice=matches.find(v=>/female|여성|sora|yuna|samantha/i.test(v.name))||matches[0];
    if(voice)u.voice=voice;
    synth.speak(u);
  }catch(e){ /* TTS unavailable in this iOS web-app context */ }
}

const englishSounds = {
  A:'에이', B:'비', C:'씨', D:'디', E:'이',
  F:'에프', G:'지', H:'에이치', I:'아이', J:'제이',
  K:'케이', L:'엘', M:'엠', N:'엔', O:'오우',
  P:'피', Q:'큐', R:'아르', S:'에스', T:'티',
  U:'유', V:'브이', W:'더블유', X:'엑스',
  Y:'와이', Z:'지'
};

function say(item, m=mode) {
  if (m === 'e') {
    sound(englishSounds[item[0]], 'ko');
  } else {
    sound(item[1], 'ko');
  }
}
function home(){quiz=null;$('screen').innerHTML=`<section class="hero"><div class="mascot">🧚🏻‍♀️🐰✨</div><h1>이서의 마법 글자 놀이터</h1><p class="subtitle">요정 친구와 글자 마법을 배워요!</p></section><div class="menu"><button class="tile" data-go="c"><span class="emoji">🌸</span>ㄱ ㄴ ㄷ<br>자음 마법</button><button class="tile" data-go="v"><span class="emoji">🦄</span>ㅏ ㅑ ㅓ<br>모음 마법</button><button class="tile" data-go="e"><span class="emoji">🌈</span>A B C<br>ABC 마법</button><button class="tile" data-go="q"><span class="emoji">⭐</span>글자 찾기<br>별 모으기</button></div><div class="actions"><button class="btn mint" data-go="draw">✏️ 손가락 글자 쓰기</button></div><p class="small">🔊 소리 버튼을 누르면 마법 효과음이 나와요. 글자 읽기는 아이폰 음성 기능에 따라 들리지 않을 수 있어요.</p>`;document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>b.dataset.go==='q'?startQuiz():b.dataset.go==='draw'?draw():learn(b.dataset.go));}
function learn(m,i=0){mode=m;idx=i;const {title,items}=sets[m],item=items[idx];$('screen').innerHTML=`<h2>✨ ${title} 마법 ✨</h2><div class="panel"><div class="mascot">🧚🏻‍♀️</div><div class="bigletter">${item[0]}</div><div class="word">${m==='e'?item[0]+' · '+item[0].toLowerCase():item[1]}</div><p class="hint">글자를 눌러 소리를 들어보세요!</p><button class="btn" id="play">🔊 소리 듣기</button></div><div class="actions"><button class="btn secondary" id="prev">◀ 이전</button><button class="btn mint" id="next">다음 ▶</button></div><div class="gridletters">${items.map((a,j)=>`<button class="letter ${j===idx?'selected':''}" data-i="${j}">${a[0]}</button>`).join('')}</div>`;$('play').onclick=()=>say(item,m);$('prev').onclick=()=>learn(m,(idx+items.length-1)%items.length);$('next').onclick=()=>learn(m,(idx+1)%items.length);document.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{let j=+b.dataset.i;learn(m,j);say(items[j],m)});}
function startQuiz(){mode=['c','v','e'][Math.floor(Math.random()*3)];newQuestion()}
function newQuestion(){let items=sets[mode].items;let answer=Math.floor(Math.random()*items.length),options=[answer];while(options.length<3){let n=Math.floor(Math.random()*items.length);if(!options.includes(n))options.push(n)}options.sort(()=>Math.random()-.5);quiz={answer,items};$('screen').innerHTML=`<h2>🌟 글자 찾기 마법 🌟</h2><div class="panel"><div class="mascot">🐰✨</div><p class="subtitle">소리를 듣고 맞는 글자를 골라줘!</p><button class="btn" id="hear">🔊 문제 듣기</button><div class="choices">${options.map(i=>`<button class="choice" data-choice="${i}">${items[i][0]}</button>`).join('')}</div><p class="status" id="status"></p><button class="btn secondary" id="again">다른 문제 🎲</button></div><div class="actions"><button class="btn mint" id="category">다른 글자 종류 🔄</button></div>`;$('hear').onclick=()=>say(items[answer],mode);$('again').onclick=newQuestion;$('category').onclick=startQuiz;document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(+b.dataset.choice===answer){stars++;localStorage.setItem('iseo-stars',stars);refresh();$('status').textContent='✨ 정답! 이서 최고! ⭐';say(items[answer],mode);document.querySelectorAll('[data-choice]').forEach(x=>x.disabled=true)}else{$('status').textContent='🌷 다시 한번 들어볼까?';say(items[answer],mode)}})}
function draw(){let item=sets[mode].items[idx]||consonants[0];$('screen').innerHTML=`<h2>✏️ 손가락 글자 쓰기</h2><div class="panel"><div class="bigletter" id="target">${item[0]}</div><p class="hint">아래에 손가락으로 글자를 그려봐!</p><canvas id="board"></canvas><div class="actions"><button class="btn secondary" id="clear">지우기 🧽</button><button class="btn mint" id="switch">다음 글자 ▶</button></div></div>`;let canvas=$('board'),ctx=canvas.getContext('2d');function resize(){let r=canvas.getBoundingClientRect();canvas.width=r.width*devicePixelRatio;canvas.height=r.height*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);ctx.strokeStyle='#ec76ad';ctx.lineWidth=9;ctx.lineCap='round';ctx.lineJoin='round'}resize();let active=false;function point(e){let r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}canvas.onpointerdown=e=>{active=true;canvas.setPointerCapture(e.pointerId);let [x,y]=point(e);ctx.beginPath();ctx.moveTo(x,y)};canvas.onpointermove=e=>{if(!active)return;let [x,y]=point(e);ctx.lineTo(x,y);ctx.stroke()};canvas.onpointerup=()=>active=false;$('clear').onclick=resize;$('switch').onclick=()=>{idx=(idx+1)%sets[mode].items.length;draw()}}
$('home').onclick=home;refresh();home();if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
