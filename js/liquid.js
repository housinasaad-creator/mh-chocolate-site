/*
  شوكولا سائلة تُخلط: شيدر واحد على WebGL خام (بدون مكتبات)، يُرسم بدقة منخفضة ثم يُكبَّر لأن السائل ناعم أصلاً.
  الإصبع (أو الماوس) يحرّك دوامة في السائل؛ وبدون لمس تتحرك "ملعقة" وهمية على مسار ثابت حتى يبقى الخلط حياً.
*/
export function createLiquid(canvas, host, opt = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const OCT = opt.oct || 3;
  const vsrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fsrc = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#define OCT ${OCT}
uniform vec2 uRes; uniform float uT; uniform vec3 uP; uniform vec3 uTint;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
float fbm(vec2 p){ float s=0.,a=.5; for(int i=0;i<OCT;i++){ s+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
vec2 swirl(vec2 p){ vec2 d=p-uP.xy; float k=uP.z*3.4*exp(-dot(d,d)*6.5); float s=sin(k),c=cos(k); return uP.xy+mat2(c,-s,s,c)*d; }
float height(vec2 p){
  p=swirl(p); float t=uT*.11;
  vec2 q=vec2(fbm(p*1.3+vec2(0.,t)),fbm(p*1.3+vec2(5.2,-t)));
  vec2 r=vec2(fbm(p*1.5+2.4*q+vec2(1.7,9.2)+t*.7),fbm(p*1.5+2.4*q+vec2(8.3,2.8)-t*.6));
  return fbm(p*1.1+3.*r);
}
void main(){
  float m=min(uRes.x,uRes.y);
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=(gl_FragCoord.xy-.5*uRes)/m*2.2;
  float e=2.2/m*1.5;
  float h0=height(p),hx=height(p+vec2(e,0.)),hy=height(p+vec2(0.,e));
  vec3 n=normalize(vec3((h0-hx)*6.5,(h0-hy)*6.5,1.));
  vec3 dark=vec3(.105,.045,.03),milk=vec3(.40,.215,.115),car=vec3(.70,.45,.24);
  vec3 col=mix(dark,milk,smoothstep(.28,.7,h0));
  col=mix(col,car,smoothstep(.62,.92,h0)*.45);
  float w=noise(p*1.5+h0*2.6+uT*.04);
  col=mix(col,uTint,smoothstep(.70,.82,w)*.3);
  col=mix(col,vec3(.93,.84,.68),smoothstep(.80,.88,noise(p*1.8-h0*3.))*.38);
  vec3 L=normalize(vec3(-.45,.55,.7)); vec3 V=vec3(0.,0.,1.);
  float diff=clamp(dot(n,L)*.62+.4,0.,1.25);
  vec3 H=normalize(L+V);
  float sp=pow(max(dot(n,H),0.),95.)*1.25+pow(max(dot(n,H),0.),16.)*.16;
  vec3 H2=normalize(normalize(vec3(.6,-.35,.5))+V);
  vec3 sp2=pow(max(dot(n,H2),0.),55.)*.4*vec3(1.,.45,.75);
  float fr=pow(1.-n.z,3.);
  vec3 c=col*diff+vec3(1.,.92,.82)*sp+sp2+fr*vec3(.5,.28,.22)*.55;
  float vg=smoothstep(1.4,.25,length(uv-.5)*1.5);
  c*=mix(.5,1.,vg);
  c+=(hash(gl_FragCoord.xy+uT)-.5)/255.;
  gl_FragColor=vec4(c,1.);
}`;
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const v = mk(gl.VERTEX_SHADER, vsrc), f = mk(gl.FRAGMENT_SHADER, fsrc);
  if (!v || !f) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes'), uT = gl.getUniformLocation(prog, 'uT'), uP = gl.getUniformLocation(prog, 'uP'), uTint = gl.getUniformLocation(prog, 'uTint');
  gl.uniform3f(uTint, 0.77, 0.28, 0.56);

  let scale = opt.scale || 0.5, W = 1, H = 1, vis = true, raf = 0, last = 0, time = 0;
  let px = 0, py = 0, ps = 0.5, tpx = 0, tpy = 0, tps = 0.5, touching = false, lastMove = -1e9;
  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(2, Math.round(r.width * dpr * scale)); H = Math.max(2, Math.round(r.height * dpr * scale));
    canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H);
  }
  const toP = (cx, cy) => { const r = canvas.getBoundingClientRect(), m = Math.min(r.width, r.height); return [((cx - r.left) / r.width - 0.5) * r.width / m * 2.2, (0.5 - (cy - r.top) / r.height) * r.height / m * 2.2]; };
  function onMove(e) { const p = toP(e.clientX, e.clientY); tpx = p[0]; tpy = p[1]; tps = 1; lastMove = performance.now(); }
  const onDown = (e) => { touching = true; onMove(e); }, onUp = () => { touching = false; };
  const wake = () => { if (!dead && !document.hidden && vis && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  let dead = false;
  host.addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('pointerdown', onDown, { passive: true });
  addEventListener('pointerup', onUp, { passive: true });
  addEventListener('resize', resize);
  const io = new IntersectionObserver((es) => { vis = es[0].isIntersecting; wake(); }); io.observe(host);
  document.addEventListener('visibilitychange', wake);
  /* تفكيك كامل: يوقف الحلقة ويحرر الشيدر والذاكرة ثم يُفقد السياق */
  function destroy() {
    if (dead) return; dead = true; vis = false; cancelAnimationFrame(raf); raf = 0;
    host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerdown', onDown);
    removeEventListener('pointerup', onUp); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', wake); io.disconnect();
    gl.deleteBuffer(buf); gl.deleteProgram(prog); gl.deleteShader(v); gl.deleteShader(f);
    const ext = gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); canvas.width = 1; canvas.height = 1;
  }

  let acc = 0, frames = 0, slow = 0;
  function frame(now) {
    raf = 0; if (dead || !vis || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    // سقف 30 إطاراً على الأجهزة اللمسية لتوفير البطارية
    acc += dt; const cap = matchMedia('(pointer: coarse)').matches ? 1 / 30 : 1 / 60;
    if (acc < cap * 0.9) { raf = requestAnimationFrame(frame); return; }
    const step = acc; acc = 0; time += step;
    const idle = now - lastMove > 1800 && !touching;
    if (idle) { // الملعقة الوهمية
      tpx = Math.sin(time * 0.55) * 0.75 + Math.sin(time * 0.23) * 0.2; tpy = Math.cos(time * 0.43) * 0.55; tps = 0.62;
    }
    const k = 1 - Math.exp(-step * (idle ? 1.6 : 8));
    px += (tpx - px) * k; py += (tpy - py) * k; ps += (tps - ps) * (1 - Math.exp(-step * 3));
    if (!idle && !touching && now - lastMove > 300) tps = 0.62;
    gl.uniform2f(uRes, W, H); gl.uniform1f(uT, time); gl.uniform3f(uP, px, py, ps);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // حارس الأداء: إن كانت الإطارات بطيئة نخفض الدقة
    frames++; if (step > 0.045) slow++;
    if (frames === 45) { if (slow > 20 && scale > 0.32) { scale *= 0.78; resize(); } frames = 0; slow = 0; }
    raf = requestAnimationFrame(frame);
  }
  resize(); raf = requestAnimationFrame((t) => { last = t; frame(t); });
  return { resize, destroy, get dead() { return dead; }, setScale(s) { scale = s; resize(); }, stir(x, y, s) { tpx = x; tpy = y; tps = s; lastMove = performance.now(); } };
}
