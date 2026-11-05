document.getElementById('ano').textContent = new Date().getFullYear();
 
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
/* Palavra rotativa no hero */
(function(){
  const el=document.getElementById('rot'); if(!el||reduce) return;
  const w=['Stories','Reels','Feed','Lives']; let i=0;
  setInterval(()=>{el.classList.add('out');setTimeout(()=>{i=(i+1)%w.length;el.textContent=w[i];el.classList.remove('out');},250);},2200);
})();
 
/* Revelar ao rolar + contadores */
(function(){
  const targets=document.querySelectorAll('.card,.post,.why-item,.head,.cta-box,.reveal');
  const count=el=>{
    const end=+el.dataset.count; if(reduce){el.textContent=end.toLocaleString('pt-BR');return;}
    const t0=performance.now(),d=1400;
    const tick=t=>{const p=Math.min((t-t0)/d,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(end*e).toLocaleString('pt-BR');if(p<1)requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  };
  if(!('IntersectionObserver' in window)){document.querySelectorAll('[data-count]').forEach(count);return;}
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    e.target.classList.add('in');
    const t=e.target;setTimeout(()=>{t.classList.remove('reveal','in');t.style.transitionDelay='';},1000);
    e.target.querySelectorAll('[data-count]').forEach(count);
    io.unobserve(e.target);
  }),{threshold:.15});
  targets.forEach((el,i)=>{if(!el.classList.contains('reveal'))el.classList.add('reveal');el.style.transitionDelay=(i%4)*70+'ms';io.observe(el);});
})();
 
/* Demo de Stories */
(function(){
  const screen=document.getElementById('sscreen'); if(!screen) return;
  const slides=[...screen.querySelectorAll('.slide')], bars=[...document.querySelectorAll('#sbars i')];
  const steps=[...document.querySelectorAll('#steps button')];
  const phone=document.getElementById('sphone');
  const DUR=5000; let idx=0,timer=null,visible=false;
  const go=n=>{
    idx=(n+slides.length)%slides.length;
    slides.forEach((s,i)=>s.classList.toggle('on',i===idx));
    steps.forEach((b,i)=>b.classList.toggle('on',i===idx));
    bars.forEach((b,i)=>{b.classList.remove('act');b.classList.toggle('done',i<idx);});
    void screen.offsetWidth; bars[idx].classList.add('act');
    clearTimeout(timer);
    if(!reduce&&visible) timer=setTimeout(()=>go(idx+1),DUR);
  };
  document.getElementById('next').onclick=()=>go(idx+1);
  document.getElementById('prev').onclick=()=>go(idx-1);
  steps.forEach((b,i)=>b.onclick=()=>go(i));
  new IntersectionObserver(es=>{visible=es[0].isIntersecting;go(idx);},{threshold:.4}).observe(phone);
  document.querySelectorAll('#poll button').forEach(b=>b.onclick=e=>{
    e.stopPropagation();const p=b.parentElement; if(p.dataset.done)return; p.dataset.done=1;
    p.querySelectorAll('button').forEach(x=>{x.querySelector('.bar').style.width=x.dataset.v+'%';x.querySelector('b').textContent=x.dataset.v+'%';});
  });
})();
 
/* Curtir, salvar e coração em duplo toque */
(function(){
  const rise=(x,y)=>{
    if(reduce)return;
    for(let i=0;i<5;i++){
      const h=document.createElement('span');h.className='fh';h.textContent='❤️';
      h.style.left=(x-10)+'px';h.style.top=(y-10)+'px';h.style.setProperty('--dx',(Math.random()*60-30)+'px');
      h.style.animationDelay=(i*70)+'ms';document.body.appendChild(h);setTimeout(()=>h.remove(),1300);
    }
  };
  const setLike=(btn,on,fx)=>{
    const b=btn.querySelector('b'),base=+b.dataset.base;
    btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',on);b.textContent=base+(on?1:0);
    if(on&&fx){const r=btn.getBoundingClientRect();rise(r.left+r.width/2,r.top);}
  };
  document.querySelectorAll('.like').forEach(b=>b.onclick=()=>setLike(b,!b.classList.contains('on'),true));
  document.querySelectorAll('.save').forEach(b=>b.onclick=()=>b.classList.toggle('on'));
})();
 
/* Posts em carrossel: arrastar, setas, vídeos em autoplay e ampliar */
(function(){
  const posts=[...document.querySelectorAll('.post')]; if(!posts.length) return;
  const noMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lb=document.getElementById('lb'),stage=document.getElementById('lbStage'),
        lbTitle=document.getElementById('lbTitle'),lbDesc=document.getElementById('lbDesc');
  let lbOpen=false, lbPost=null, lbSlides=[], lbPos=0;
 
  posts.forEach(post=>{
    const car=post.querySelector('.car'), slides=[...car.children];
    const prev=post.querySelector('.prev'), next=post.querySelector('.next');
    const count=post.querySelector('.pcount'), dotsBox=post.querySelector('.pdots'), vol=post.querySelector('.pvol');
    const vids=slides.map(s=>s.querySelector('video'));
    const box=post.querySelector('.pc-text'); let firstCap=true;
    const setCaption=sl=>{
      const apply=()=>{box.querySelector('.pc-type').textContent=sl.dataset.type==='video'?'Vídeo':'Foto';box.querySelector('.pc-title').textContent=sl.dataset.cap||'';box.querySelector('.pc-desc').textContent=sl.dataset.desc||'';box.style.opacity=1;};
      if(firstCap||noMotion){firstCap=false;apply();return;}
      box.style.opacity=0;setTimeout(apply,140);
    };
    let idx=0,last=-1,inView=false,near=false,muted=true,moved=false,timer=null,ticking=false;
 
    const dots=slides.map((_,i)=>{const d=document.createElement('button');d.type='button';d.setAttribute('aria-label','Ir para o item '+(i+1));d.onclick=()=>goTo(i);dotsBox.appendChild(d);return d;});
    dotsBox.removeAttribute('aria-hidden');
 
    const load=i=>{const v=vids[i]; if(v&&!v.getAttribute('src')){v.src=v.dataset.src;v.preload='auto';}};
    const goTo=i=>{i=Math.max(0,Math.min(slides.length-1,i));car.scrollTo({left:i*car.clientWidth,behavior:noMotion?'auto':'smooth'});};
 
    const sync=()=>{
      if(near){load(idx);load(idx+1);load(idx-1);}
      vids.forEach((v,i)=>{
        if(!v)return;
        v.muted=muted;
        const play=inView&&!lbOpen&&!document.hidden&&i===idx&&!noMotion;
        if(play){const p=v.play(); if(p&&p.catch)p.catch(()=>{});} else v.pause();
      });
    };
    const update=()=>{
      ticking=false;
      idx=Math.max(0,Math.min(slides.length-1,Math.round(car.scrollLeft/car.clientWidth)));
      if(idx===last)return; last=idx;
      count.textContent=(idx+1)+'/'+slides.length;
      prev.hidden=idx===0; next.hidden=idx===slides.length-1;
      dots.forEach((d,i)=>d.classList.toggle('on',i===idx));
      post.dataset.vid=vids[idx]?'1':'0';
      setCaption(slides[idx]);
      sync();
    };
    car.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});
    update();
 
    prev.onclick=e=>{e.stopPropagation();goTo(idx-1);};
    next.onclick=e=>{e.stopPropagation();goTo(idx+1);};
    car.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();goTo(idx-1);}if(e.key==='ArrowRight'){e.preventDefault();goTo(idx+1);}});
    vol.onclick=()=>{muted=!muted;vol.textContent=muted?'🔇':'🔊';vol.setAttribute('aria-label',muted?'Ligar o som':'Desligar o som');sync();};
    document.addEventListener('lbchange',sync);
    document.addEventListener('visibilitychange',sync);
 
    new IntersectionObserver(es=>{inView=es[0].isIntersecting;sync();},{threshold:.5}).observe(post);
    new IntersectionObserver(es=>{near=es[0].isIntersecting;sync();},{rootMargin:'500px 0px'}).observe(post);
 
    /* arrastar com o mouse (no celular o deslize é nativo) */
    car.addEventListener('dragstart',e=>e.preventDefault());
    car.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse'||e.button!==0)return;
      const x0=e.clientX,s0=car.scrollLeft,i0=idx; moved=false; car.classList.add('drag');
      const mv=ev=>{const dx=ev.clientX-x0; if(Math.abs(dx)>6)moved=true; car.scrollLeft=s0-dx;};
      const up=ev=>{
        window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);
        const dx=ev.clientX-x0; car.classList.remove('drag');
        goTo(dx<-50?i0+1:dx>50?i0-1:i0);
        setTimeout(()=>{moved=false;},0);
      };
      window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);
    });
 
    /* clique = ampliar; duplo clique = curtir */
    slides.forEach((sl,i)=>{
      sl.addEventListener('click',()=>{
        if(moved)return;
        clearTimeout(timer);timer=setTimeout(()=>openLb(post,slides,i),260);
      });
      sl.addEventListener('dblclick',()=>{
        clearTimeout(timer);
        const h=document.createElement('span');h.className='burst';h.textContent='❤️';sl.appendChild(h);setTimeout(()=>h.remove(),850);
        const lk=post.querySelector('.like'); if(!lk.classList.contains('on'))lk.click();
      });
    });
  });
 
  /* visualizador */
  function showLb(i){
    lbPos=(i+lbSlides.length)%lbSlides.length;
    const sl=lbSlides[lbPos]; stage.innerHTML='';
    let el;
    if(sl.dataset.type==='video'){
      el=document.createElement('video');
      el.controls=true;el.loop=true;el.playsInline=true;el.poster=sl.dataset.poster;el.src=sl.dataset.src;
      stage.appendChild(el);
      const p=el.play(); if(p&&p.catch)p.catch(()=>{el.muted=true;el.play();});
    }else{
      el=document.createElement('img');el.src=sl.dataset.src;el.alt=sl.dataset.alt||'';stage.appendChild(el);
    }
    lbTitle.textContent=(sl.dataset.cap||lbPost.dataset.title)+' · '+(lbPos+1)+'/'+lbSlides.length;
    lbDesc.textContent=sl.dataset.desc||'';
  }
  function openLb(post,slides,i){
    lbPost=post;lbSlides=slides;lbOpen=true;document.dispatchEvent(new Event('lbchange'));
    showLb(i); if(!lb.open)lb.showModal();
  }
  function closeLb(){
    const v=stage.querySelector('video'); if(v)v.pause();
    stage.innerHTML='';lb.close();lbOpen=false;document.dispatchEvent(new Event('lbchange'));
  }
  document.getElementById('lbClose').onclick=closeLb;
  document.getElementById('lbPrev').onclick=()=>showLb(lbPos-1);
  document.getElementById('lbNext').onclick=()=>showLb(lbPos+1);
  lb.addEventListener('click',e=>{if(e.target===lb)closeLb();});
  lb.addEventListener('cancel',e=>{e.preventDefault();closeLb();});
  lb.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')showLb(lbPos-1);if(e.key==='ArrowRight')showLb(lbPos+1);});
})();
 
/* Comentar abre o WhatsApp; Enviar compartilha o link */
(function(){
  const toast=document.getElementById('toast');
  const say=m=>{toast.textContent=m;toast.classList.add('on');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('on'),2200);};
  document.querySelectorAll('.post').forEach(post=>{
    const title=post.dataset.title;
    const [,cm,sh]=post.querySelectorAll('.sbar button');
    cm.onclick=()=>window.open('https://wa.me/5579996889650?text='+encodeURIComponent('Oi Lary! Vi o post "'+title+'" no seu portfólio e quero saber mais.'),'_blank','noopener');
    sh.onclick=async()=>{
      try{
        if(navigator.share){await navigator.share({title:'By.LaryBarros: '+title,url:location.href});return;}
        await navigator.clipboard.writeText(location.href);say('Link copiado!');
      }catch(e){if(e.name!=='AbortError')say('Não foi possível compartilhar');}
    };
  });
})();
 