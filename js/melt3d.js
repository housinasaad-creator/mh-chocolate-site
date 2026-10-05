/*
  قطعة تلين وتذوب حسب (الحرارة × الزمن): setSoft(0..1) يعصر القطعة ويوسّع بركة شوكولا لامعة تحتها.
*/
import { THREE, baseStage, TYPE_COLORS, paintType } from './lib3d.js';
import { buildWhole } from './models.js';

export function createMelt(canvas, o = {}) {
  const S = baseStage(canvas, { fov: 26, exposure: 1.1 });
  if (!S) return null;
  const { scene, camera, mats: M } = S;
  const key = new THREE.DirectionalLight(0xfff0dd, 1.5); key.position.set(-3, 6, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe2c8, .9); fill.position.set(2, 2.5, 7); scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffd8c0, 0x3a1c12, .7));
  const rad = (stops, size = 256) => { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size); return new THREE.CanvasTexture(c); };
  const fade = rad([[0, '#fff'], [.45, '#cfcfcf'], [1, '#000']]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshPhysicalMaterial({ color: 0x3a1b0f, roughness: .16, metalness: .12, clearcoat: 1, clearcoatRoughness: .12, transparent: true, alphaMap: fade, envMapIntensity: 1.5, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.006; floor.renderOrder = -2; scene.add(floor);
  const puddleMat = new THREE.MeshPhysicalMaterial({ color: TYPE_COLORS[o.type || 'bitter'], roughness: .1, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: .75 });
  const pg = new THREE.CircleGeometry(1, 96); { const p = pg.attributes.position; for (let i = 1; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), a = Math.atan2(y, x), k = 1 + .09 * Math.sin(3 * a + 1) + .05 * Math.sin(5 * a + 2) + .03 * Math.sin(8 * a); p.setXY(i, x * k, y * k); } }
  const puddle = new THREE.Mesh(pg, puddleMat); puddle.rotation.x = -Math.PI / 2; puddle.position.y = .01; puddle.scale.setScalar(.001); scene.add(puddle);
  const spin = new THREE.Group(), holder = new THREE.Group(); holder.add(spin); scene.add(holder);
  let whole = null, shape = null, yaw = 0, soft = 0, tgt = 0;
  function setShape(id) { if (id === shape) return; shape = id; if (whole) { spin.remove(whole); whole.traverse((n) => n.geometry && n.geometry.dispose()); } whole = buildWhole(id, M); spin.add(whole); }
  S.onResize = () => { const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), d = Math.max(2.15 / (t * camera.aspect), 1.2 / t); camera.position.set(0, .5 + d * Math.sin(.42), d * Math.cos(.42)); camera.lookAt(0, .25, 0); camera.updateProjectionMatrix(); };
  S.onResize();
  paintType(M, TYPE_COLORS[o.type || 'bitter']); setShape(o.shape || 'kalp');
  const api = { stage: S, canvas };
  api.setSoft = (v) => { tgt = Math.max(0, Math.min(1, v)); };
  api.setType = (id) => { paintType(M, TYPE_COLORS[id]); puddleMat.color.setHex(TYPE_COLORS[id]).multiplyScalar(.8); };
  api.setShape = setShape;
  api.dispose = () => S.dispose();
  Object.defineProperty(api, 'disposed', { get: () => S.disposed });
  S.onDispose = () => { puddleMat.dispose(); puddle.geometry.dispose(); fade.dispose(); };
  S.onFrame = (dt) => {
    soft += (tgt - soft) * Math.min(1, dt * 3); yaw += dt * .35; spin.rotation.y = yaw;
    const s = soft, e = s * s * (3 - 2 * s);
    holder.scale.set(1 + .3 * e, 1 - .66 * e, 1 + .3 * e);
    M.gloss.roughness = .24 - .14 * e; M.flat.roughness = M.gloss.roughness;
    puddle.scale.setScalar(.001 + (.25 + 1.55 * Math.pow(e, 1.2)) * (e > .02 ? 1 : 0));
  };
  return api;
}
