'use strict';
const $ = (id) => document.getElementById(id);
const foods = [
  {id:'pizza', name:'披萨', emoji:'🍕'}, {id:'sushi', name:'寿司', emoji:'🍣'},
  {id:'hotpot', name:'火锅', emoji:'🍲'}, {id:'bbq', name:'烤肉', emoji:'🥩'},
  {id:'cantonese', name:'粤菜', emoji:'🥟'}, {id:'ramen', name:'拉面', emoji:'🍜'},
  {id:'malatang', name:'麻辣烫', emoji:'🌶️'}, {id:'crayfish', name:'小龙虾', emoji:'🦞'},
  {id:'skewers', name:'烧烤', emoji:'🍢'}, {id:'other', name:'其他', emoji:'✍️'}
];
const state = {screen:'invite', date:'', time:'', food:'', customFood:''};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const localISODate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
$('date').min = localISODate(new Date());
$('date').value = localISODate(tomorrow);
for (let hour=10; hour<=23; hour++) {
  for (const minute of ['00','30']) {
    const time=`${String(hour).padStart(2,'0')}:${minute}`;
    $('time').add(new Option(time,time));
  }
}
const grid = document.querySelector('.food-grid');
for (const food of foods) {
  const label = document.createElement('label'); label.className='food-option';
  const radio = document.createElement('input'); radio.type='radio'; radio.name='food'; radio.value=food.id; radio.required=true;
  const emoji=document.createElement('span'); emoji.className='food-emoji'; emoji.setAttribute('aria-hidden','true'); emoji.textContent=food.emoji;
  const name=document.createElement('span'); name.className='food-name'; name.textContent=food.name;
  label.append(radio,emoji,name); grid.append(label);
  radio.addEventListener('change',()=>selectFood(food.id));
}
let screenTransition=Promise.resolve();
function show(screen) {
  const target=$(screen);
  if(!target || !target.classList.contains('screen')) throw new Error('Unknown screen');
  // Serialize navigation so quick repeat presses cannot leave a half-hidden step.
  screenTransition=screenTransition.then(async()=>{
    if(state.screen===screen)return;
    const card=$('card');
    const outgoing=$(state.screen);
    const animations=[];
    const reveal=()=>{
      for(const element of document.querySelectorAll('.screen'))element.hidden=element!==target;
      state.screen=screen;
    };
    card.inert=true;
    card.setAttribute('aria-busy','true');
    try{
      if(reducedMotion.matches || typeof card.animate!=='function'){
        reveal();
      }else{
        const oldHeight=card.offsetHeight;
        const fadeOut=outgoing.animate([
          {opacity:1,transform:'translateY(0)'},
          {opacity:0,transform:'translateY(-7px)'}
        ],{duration:220,easing:'ease-in-out',fill:'forwards'});
        animations.push(fadeOut);
        await fadeOut.finished;
        card.style.overflow='hidden';
        reveal();
        const newHeight=card.offsetHeight;
        card.style.height=`${oldHeight}px`;
        const resize=card.animate([
          {height:`${oldHeight}px`},{height:`${newHeight}px`}
        ],{duration:600,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
        const fadeIn=target.animate([
          {opacity:0,transform:'translateY(10px)'},
          {opacity:1,transform:'translateY(0)'}
        ],{duration:560,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'});
        animations.push(resize,fadeIn);
        await Promise.all([resize.finished,fadeIn.finished]);
      }
    }catch{
      // A cancelled or unavailable animation must never interrupt navigation.
      reveal();
    }finally{
      for(const animation of animations)animation.cancel();
      card.style.height='';
      card.style.overflow='';
      card.inert=false;
      card.removeAttribute('aria-busy');
      target.querySelector('h1').focus({preventScroll:true});
      window.scrollTo({top:0,behavior:reducedMotion.matches?'instant':'smooth'});
      // In Streamlit, the outer page owns the scrollbar for this auto-height
      // iframe. Bring its top back into view after navigating between steps.
      if(window.frameElement){
        window.frameElement.scrollIntoView({block:'start',behavior:reducedMotion.matches?'instant':'smooth'});
      }
    }
  });
  return screenTransition;
}
function scheduleProblem(date,time) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)) return '先选好日期和时间吧～';
  const selected=new Date(`${date}T${time}:00`);
  if(!Number.isFinite(selected.getTime()) || localISODate(selected)!==date) return '这个日期好像不太对，再选一次吧。';
  if(selected<=new Date()) return '我们选一个还没到的时间，好不好？';
  if(!Array.from($('time').options).some(o=>o.value===time)) return '请选择列表里的见面时间。';
  return '';
}
function saveSchedule(date,time) {
  const problem=scheduleProblem(date,time);
  if(problem) throw new Error(problem);
  state.date=date;state.time=time;
  $('date').value=date;$('time').value=time;
  $('schedule-error').textContent='';
  return show('food');
}
function selectFood(id) {
  if(!foods.some(food=>food.id===id)) throw new Error('请选择一种菜单里的美食。');
  state.food=id;
  for(const radio of grid.querySelectorAll('input')) radio.checked=radio.value===id;
  $('other-food').hidden=id!=='other';
  $('custom-food').required=id==='other';
  $('confirm-food').disabled=false;
  $('food-error').textContent='';
}
function confirmDate() {
  const problem=scheduleProblem(state.date,state.time);
  if(problem){$('schedule-error').textContent=problem;show('schedule');return false;}
  const food=foods.find(item=>item.id===state.food);
  if(!food){$('food-error').textContent='先选一个想吃的吧～';return false;}
  state.customFood=$('custom-food').value.trim();
  if(food.id==='other'&&!state.customFood){$('food-error').textContent='告诉我你想吃什么吧～';$('custom-food').focus();return false;}
  const [year,month,day]=state.date.split('-').map(Number);
  const shortDate=`${month}月${day}日`;
  const menu=food.id==='other'?state.customFood:food.name;
  $('summary-date').textContent=shortDate;
  $('summary-date').title=`${year}年${shortDate}`;
  $('summary-time').textContent=state.time;
  $('summary-food').textContent=`${food.emoji} ${menu}`;
  $('confirmation-copy').textContent=`${shortDate} ${state.time}，我们去吃${menu}。带好胃口，我带好路线！`;
  show('confirmed').then(()=>{if(state.screen==='confirmed')celebrate();});return true;
}
function celebrate() {
  if(reducedMotion.matches) return;
  $('confetti').replaceChildren();
  for(let i=0;i<28;i++){
    const heart=document.createElement('span');heart.textContent=i%4===0?'✦':'♥';
    heart.style.left=`${Math.random()*100}%`;heart.style.animationDelay=`${Math.random()*.7}s`;
    heart.style.setProperty('--drift',`${Math.random()*160-80}px`);
    heart.style.color=['#f044b5','#e9a2cb','#d4ce74','#f675a8'][i%4];
    $('confetti').append(heart);
  }
  setTimeout(()=>$('confetti').replaceChildren(),5400);
}
$('yes').addEventListener('click',()=>show('surprise'));
$('really-yes').addEventListener('click',()=>show('schedule'));
const noButton=$('no');
const yesButton=$('yes');
const buttonArea=document.querySelector('.invite-actions');
let noAttempts=0;
let lastPointerAttempt=-Infinity;
let yesTarget;
let noScale=1;
let lastNoZone=-1;
function updateYesSize() {
  const width=buttonArea.clientWidth;
  const baseWidth=parseFloat(getComputedStyle(yesButton).minWidth)||124;
  // Make the first few attempts visibly dramatic while staying inside the card.
  const growth=1-Math.exp(-noAttempts/2.2);
  const centering=1-Math.exp(-noAttempts/1.3);
  const targetWidth=baseWidth+(width-baseWidth)*growth;
  const targetHeight=49+91*growth;
  const gap=window.innerWidth<=540?17:30;
  const initialX=Math.max(0,(width-baseWidth-noButton.offsetWidth-gap)/2);
  const centerX=(width-targetWidth)/2;
  const x=initialX+(centerX-initialX)*centering;
  const y=24+((buttonArea.clientHeight-targetHeight)/2-24)*centering;
  yesButton.style.width=`${targetWidth}px`;
  yesButton.style.height=`${targetHeight}px`;
  yesButton.style.left=`${x}px`;
  yesButton.style.top=`${y}px`;
  yesButton.style.fontSize=`${.95+1.55*growth}rem`;
  yesTarget={left:x,top:y,right:x+targetWidth,bottom:y+targetHeight};
  noScale=.32+.68*Math.exp(-noAttempts/3.2);
}
function dodgeNo(event) {
  if(event){event.preventDefault();event.stopImmediatePropagation();}
  if(state.screen!=='invite') return;
  noAttempts++;
  updateYesSize();
  const area=buttonArea.getBoundingClientRect();
  const invitation=$('invite').getBoundingClientRect();
  const rect=noButton.getBoundingClientRect();
  const yes=yesButton.getBoundingClientRect();
  // Use the rendered position so rapid attempts can redirect an unfinished hop.
  const current={x:rect.left-area.left,y:rect.top-area.top};
  const pointer=event && event.type==='pointerdown'
    ? {x:event.clientX-area.left,y:event.clientY-area.top}
    : {x:current.x+rect.width/2,y:current.y+rect.height/2};
  const noWidth=noButton.offsetWidth*noScale;
  const noHeight=noButton.offsetHeight*noScale;
  // Negative y positions reach the top of the invitation, beyond the button strip.
  // Every rectangle stays in the same coordinate system: relative to buttonArea.
  const minX=invitation.left-area.left+6;
  const minY=invitation.top-area.top+6;
  const maxX=Math.max(minX,invitation.right-area.left-noWidth-6);
  const maxY=Math.max(minY,invitation.bottom-area.top-noHeight-8);
  const yesNow={left:yes.left-area.left,top:yes.top-area.top,right:yes.right-area.left,bottom:yes.bottom-area.top};
  const overlaps=(x,y,box)=>x<box.right+10 && x+noWidth>box.left-10 && y<box.bottom+10 && y+noHeight>box.top-10;
  const zoneAt=(y)=>Math.min(2,Math.max(0,Math.floor(3*(y-minY)/(maxY-minY+1))));
  const currentZone=lastNoZone<0?zoneAt(current.y):lastNoZone;
  const differentZones=[],all=[];
  for(let i=0;i<160;i++){
    const x=minX+Math.random()*(maxX-minX),y=minY+Math.random()*(maxY-minY);
    const underPointer=pointer.x>x-12 && pointer.x<x+noWidth+12 && pointer.y>y-12 && pointer.y<y+noHeight+12;
    const distance=Math.hypot(x-current.x,y-current.y);
    if(underPointer || distance<45 || overlaps(x,y,yesTarget) || overlaps(x,y,yesNow)) continue;
    const position={x,y};
    all.push(position);
    if(zoneAt(y)!==currentZone)differentZones.push(position);
  }
  // Favor a different vertical third so No explores the top, middle and bottom.
  const choices=differentZones.length?differentZones:all;
  if(!choices.length){
    for(const x of [minX,(minX+maxX)/2,maxX]){
      for(const y of [minY,(minY+maxY)/2,maxY]){
        const underPointer=pointer.x>=x && pointer.x<=x+noWidth && pointer.y>=y && pointer.y<=y+noHeight;
        if(!underPointer && Math.hypot(x-current.x,y-current.y)>30 && !overlaps(x,y,yesTarget) && !overlaps(x,y,yesNow))choices.push({x,y});
      }
    }
  }
  if(choices.length){
    const target=choices[Math.floor(Math.random()*choices.length)];
    noButton.style.transform=`translate(${target.x}px, ${target.y}px) scale(${noScale})`;
    lastNoZone=zoneAt(target.y);
  }
  const notes=['抓不到我～ 🙈','再试一次？嘿嘿。','“愿意”越来越心动了 ♥'];
  $('no-note').textContent=notes[(noAttempts-1)%notes.length];
}
// Start the hop on a press, so each mouse click or tap is a real growth attempt.
noButton.addEventListener('pointerdown',(event)=>{lastPointerAttempt=performance.now();dodgeNo(event);});
noButton.addEventListener('pointercancel',()=>{lastPointerAttempt=-Infinity;});
// Consume a matching release click; count direct or assistive clicks only once.
noButton.addEventListener('click',(event)=>{
  event.preventDefault();event.stopImmediatePropagation();
  if(event.detail>0 && performance.now()-lastPointerAttempt<1200){lastPointerAttempt=-Infinity;return;}
  dodgeNo(event);
});
noButton.addEventListener('keydown',(event)=>{
  if(event.key==='Enter'||event.key===' '){
    event.preventDefault();event.stopImmediatePropagation();
    if(!event.repeat)dodgeNo(event);
  }
});
noButton.addEventListener('keyup',(event)=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopImmediatePropagation();}
});
function resetNoPosition(){
  if(state.screen!=='invite')return;
  updateYesSize();
  const x=Math.max(0,buttonArea.clientWidth-noButton.offsetWidth*noScale-(noAttempts?6:yesTarget.left));
  const y=noAttempts?buttonArea.clientHeight-noButton.offsetHeight*noScale-12:24;
  noButton.style.transform=`translate(${x}px, ${y}px) scale(${noScale})`;
  lastNoZone=-1;
}
resetNoPosition();
requestAnimationFrame(()=>buttonArea.classList.add('buttons-ready'));
let lastInvitationWidth=window.innerWidth;
window.addEventListener('resize',()=>{
  // Streamlit also resizes the iframe height as content changes; those events
  // must not interrupt a random dodge or move No back to a fixed location.
  if(window.innerWidth===lastInvitationWidth)return;
  lastInvitationWidth=window.innerWidth;
  resetNoPosition();
});
for(const button of document.querySelectorAll('[data-back]')) button.addEventListener('click',()=>show(button.dataset.back));
$('schedule-form').addEventListener('submit',async(event)=>{
  event.preventDefault();
  try{await saveSchedule($('date').value,$('time').value);}catch(error){$('schedule-error').textContent=error.message;}
});
$('date').addEventListener('input',()=>{$('schedule-error').textContent='';});
$('time').addEventListener('change',()=>{$('schedule-error').textContent='';});
$('food-form').addEventListener('submit',(event)=>{event.preventDefault();confirmDate();});

// Optional browser-agent access follows the same state and validation as the UI.
if(document.modelContext?.registerTool){
  const lifetime=new AbortController();
  const register=(tool)=>{
    try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifetime.signal})).catch(()=>{});}catch{}
  };
  register({name:'get_invitation_state',description:'Read the current invitation screen and locally selected date, time and food.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({...state})});
  register({name:'stage_date_plan',description:'Choose a future date, half-hour time from 10:00 to 23:30, and a food option, then show the food screen for review. Does not confirm the plan or send it to anyone.',inputSchema:{type:'object',properties:{date:{type:'string'},time:{type:'string'},food:{type:'string',enum:foods.map(food=>food.id)},customFood:{type:'string',maxLength:40}},required:['date','time','food'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input)=>{
    if(!input||typeof input!=='object')throw new Error('Invalid plan');
    const {date,time,food,customFood=''}=input;
    if(typeof date!=='string'||typeof time!=='string'||typeof food!=='string'||typeof customFood!=='string'||customFood.length>40)throw new Error('Invalid plan');
    const problem=scheduleProblem(date,time);if(problem)throw new Error(problem);
    if(!foods.some(item=>item.id===food)||(food==='other'&&!customFood.trim()))throw new Error('Choose a valid food option');
    await saveSchedule(date,time);selectFood(food);$('custom-food').value=customFood.trim();state.customFood=customFood.trim();
    return {...state};
  }});
  window.addEventListener('pagehide',()=>lifetime.abort(),{once:true});
}
