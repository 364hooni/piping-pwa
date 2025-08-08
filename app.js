
let structure = null; // HLINE, VLINE, RECT
let material = null;
let sizeInch = null;
let parts = []; // [{type,len,dir}] type: PIPE/VALVE/TRAP/TEE; dir: L/R/U/D

// Build size buttons 1/2 to 10
(function(){
  const sizes = ['1/2','3/4','1','1-1/4','1-1/2','2','2-1/2','3','4','5','6','8','10'];
  const wrap = document.getElementById('sizeBtns');
  sizes.forEach(s=>{
    const b = document.createElement('button');
    b.className='btn';
    b.textContent = s + '″';
    b.onclick = ()=>{ sizeInch=s; document.getElementById('sizeView').textContent=s+'″'; render(); };
    wrap.appendChild(b);
  });
})();

// structure buttons
document.querySelectorAll('#structBtns .btn').forEach(b=>{
  b.addEventListener('click',()=>{ structure = b.dataset.shape; render(); });
});

// material buttons
document.querySelectorAll('#matBtns .btn').forEach(b=>{
  b.addEventListener('click',()=>{ material = b.dataset.mat; document.getElementById('matView').textContent = material; render(); });
});

function addPart(type){
  const p = { type, len: (type==='PIPE'?300:100), dir: 'R' };
  if(type==='VALVE' || type==='TRAP') p.dir = 'R'; // default right
  parts.push(p);
  syncTable();
  render();
}
function delPart(i){ parts.splice(i,1); syncTable(); render(); }
function clearParts(){ parts=[]; syncTable(); render(); }

function syncTable(){
  const tb = document.getElementById('partsT');
  tb.innerHTML='';
  let total = 0;
  parts.forEach((p,i)=>{
    const tr = document.createElement('tr');
    const td0 = document.createElement('td'); td0.textContent=i+1;
    const td1 = document.createElement('td'); td1.textContent=p.type;
    const td2 = document.createElement('td');
    const td3 = document.createElement('td');
    const td4 = document.createElement('td');

    const len = document.createElement('input'); len.type='number'; len.value=p.len; len.style.width='90px';
    len.oninput = e=>{ p.len = parseFloat(e.target.value||0); render(); updateTotal(); };
    td2.appendChild(len);

    if(p.type==='VALVE' || p.type==='TRAP'){
      const dirs = ['L','R','U','D'];
      dirs.forEach(d=>{
        const btn = document.createElement('button'); btn.className='btn ghost'; btn.textContent=d;
        btn.onclick=()=>{ p.dir=d; render(); };
        if(p.dir===d) btn.style.borderColor='#2563eb';
        td3.appendChild(btn);
      });
    }

    const del = document.createElement('button'); del.className='btn'; del.textContent='삭제';
    del.onclick=()=>delPart(i);
    td4.appendChild(del);

    tr.append(td0,td1,td2,td3,td4);
    tb.appendChild(tr);

    total += Number(p.len)||0;
  });
  document.getElementById('totalLen').textContent = total;
}

function updateTotal(){
  let total = parts.reduce((s,p)=> s + (Number(p.len)||0), 0);
  document.getElementById('totalLen').textContent = total;
}

function render(){
  const svg = document.getElementById('svg');
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  // draw base structure
  const w = 1200, h = 600; // viewport
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const border = rect(10,10,w-20,h-20,'none','#d9d9de',1);
  svg.appendChild(border);

  // title block
  const tb = rect(w-360, h-110, 350, 100, 'none', '#999', 1);
  svg.appendChild(tb);
  svg.appendChild(text(w-350, h-90, 12, 'TITLE BLOCK'));
  const equipName = document.getElementById('equipName').value || '-';
  const equipLoc = document.getElementById('equipLoc').value || '-';
  svg.appendChild(text(w-350, h-70, 12, `NAME: ${equipName}`));
  svg.appendChild(text(w-350, h-50, 12, `LOC: ${equipLoc}`));
  svg.appendChild(text(w-350, h-30, 12, `MAT: ${material||'-'} SIZE: ${sizeInch?sizeInch+'″':'-'}`));

  // base axes
  let x = 100, y = 200;
  if(structure==='HLINE'){
    svg.appendChild(line(x,y,x+800,y,3));
  }else if(structure==='VLINE'){
    svg.appendChild(line(x,y,x,y+300,3));
  }else if(structure==='RECT'){
    const r = rect(x,y,600,260,'none','#111',3);
    svg.appendChild(r);
  }

  // sequence drawing (simple linear rightward baseline; turns are by direction arrows on symbols)
  let cursorX = 120, cursorY = (structure==='VLINE')?220:200;
  parts.forEach((p,i)=>{
    const g = group(cursorX, cursorY);
    if(p.type==='PIPE'){
      g.appendChild(line(0,0,p.len,0,3));
      g.appendChild(text(p.len/2 - 14, -8, 12, `${p.len}mm`));
      cursorX += p.len;
    }
    if(p.type==='VALVE'){
      g.appendChild(rect(0,-12,60,24,'#fff','#111',2));
      g.appendChild(text(6,-16,12,'VALVE'));
      // direction arrow
      drawDir(g, 30, -24, p.dir);
      cursorX += p.len;
      g.appendChild(line(60,0,p.len,0,3)); // pad length visual
      g.appendChild(text(70,-8,12, `${p.len}mm`));
    }
    if(p.type==='TRAP'){
      g.appendChild(circle(20,0,12,'#fff','#111',2));
      g.appendChild(text(2,-16,12,'TRAP'));
      drawDir(g, 20, -24, p.dir);
      cursorX += p.len;
      g.appendChild(line(32,0,p.len,0,3));
      g.appendChild(text(40,-8,12, `${p.len}mm`));
    }
    if(p.type==='TEE'){
      g.appendChild(line(0,0,60,0,3));
      g.appendChild(line(30,0,30,-30,3));
      g.appendChild(text(4,-16,12,'TEE'));
      cursorX += p.len;
      g.appendChild(line(60,0,p.len,0,3));
      g.appendChild(text(70,-8,12, `${p.len}mm`));
    }
    svg.appendChild(g);
  });
}

function group(x,y){ const g = document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('transform',`translate(${x},${y})`); return g; }
function line(x1,y1,x2,y2,w){ const el=document.createElementNS('http://www.w3.org/2000/svg','line'); el.setAttribute('x1',x1);el.setAttribute('y1',y1);el.setAttribute('x2',x2);el.setAttribute('y2',y2);el.setAttribute('stroke','#111');el.setAttribute('stroke-width',w); return el; }
function rect(x,y,w,h,fill,stroke,sw){ const el=document.createElementNS('http://www.w3.org/2000/svg','rect'); el.setAttribute('x',x);el.setAttribute('y',y);el.setAttribute('width',w);el.setAttribute('height',h);el.setAttribute('fill',fill);el.setAttribute('stroke',stroke);el.setAttribute('stroke-width',sw); return el; }
function circle(cx,cy,r,fill,stroke,sw){ const el=document.createElementNS('http://www.w3.org/2000/svg','circle'); el.setAttribute('cx',cx);el.setAttribute('cy',cy);el.setAttribute('r',r);el.setAttribute('fill',fill);el.setAttribute('stroke',stroke);el.setAttribute('stroke-width',sw); return el; }
function text(x,y,size,content){ const el=document.createElementNS('http://www.w3.org/2000/svg','text'); el.setAttribute('x',x); el.setAttribute('y',y); el.setAttribute('font-size',size); el.textContent=content; return el; }

function drawDir(g, x, y, d){
  // d: L/R/U/D
  const len = 18;
  let x2=x, y2=y;
  if(d==='L'){ x2 = x-len; }
  if(d==='R'){ x2 = x+len; }
  if(d==='U'){ y2 = y-len; }
  if(d==='D'){ y2 = y+len; }
  const arrow = document.createElementNS('http://www.w3.org/2000/svg','line');
  arrow.setAttribute('x1',x); arrow.setAttribute('y1',y);
  arrow.setAttribute('x2',x2); arrow.setAttribute('y2',y2);
  arrow.setAttribute('stroke','#111'); arrow.setAttribute('stroke-width',2);
  arrow.setAttribute('marker-end','url(#arrow)');
  g.appendChild(defArrow());
  g.appendChild(arrow);
}

function defArrow(){
  let defs = document.querySelector('svg defs');
  if(!defs){
    defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    document.getElementById('svg').appendChild(defs);
  }
  let m = document.getElementById('arrow');
  if(!m){
    m = document.createElementNS('http://www.w3.org/2000/svg','marker');
    m.setAttribute('id','arrow'); m.setAttribute('markerWidth','6'); m.setAttribute('markerHeight','6');
    m.setAttribute('refX','5'); m.setAttribute('refY','3'); m.setAttribute('orient','auto');
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M0,0 L6,3 L0,6 Z'); path.setAttribute('fill','#111');
    m.appendChild(path);
    defs.appendChild(m);
  }
  return defs;
}

// export
function saveSVG(){
  const svg = document.getElementById('svg');
  const s = new XMLSerializer().serializeToString(svg);
  const a = document.createElement('a');
  a.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  a.download = 'piping_v2.svg'; a.click();
}
function savePNG(){
  const svg = document.getElementById('svg');
  const s = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  img.onload = function(){
    const canvas = document.createElement('canvas');
    canvas.width = 1400; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle='white'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'piping_v2.png'; a.click();
  };
  img.src = url;
}

// equip fields
['equipName','equipLoc'].forEach(id => {
  const el = document.getElementById(id); el.addEventListener('input', render);
});

// iOS A2HS hint
(function(){
  const el = document.getElementById('a2hs');
  if(window.navigator.standalone){ el.textContent='홈화면 앱'; return; }
  const btn = document.createElement('button'); btn.className='btn primary'; btn.textContent='홈화면 추가 안내';
  btn.onclick = ()=> alert('사파리 공유 ▶︎ "홈 화면에 추가"');
  el.appendChild(btn);
})();

syncTable(); render();
