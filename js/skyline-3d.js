// Home page backdrop: aurora sky, Seattle skyline, and a lit Space Needle whose
// elevator car rides the core as the hero scrolls (top of hero = top of tower).
// Everything is procedural and kept to a few dozen draw calls: towers, trees and
// landmarks are instanced or merged, and lighting is baked into a tiny env map.
import * as THREE from './vendor/three.module.min.js';

// Colors follow the site tokens in styles.scss (--brand / --brand-secondary)
const PALETTES = {
	dark: {
		skyTop: 0x03050b, skyHorizon: 0x0f1d2e, haze: 0x0b1420,
		auroraA: 0x3fbe72, auroraB: 0x00baff, auroraC: 0x7c3aed, auroraStrength: 0.55, auroraMix: 0.0,
		stars: 1.0,
		building: 0x0b1120, buildingTop: 0x1a2a3d, rim: 0x2fd3a0,
		winWarm: 0xffc978, winCool: 0x9fe3ff, winStrength: 0.8,
		water: 0x04070e,
		ground: 0x05080f, groundLit: 0x0d1626,
		treeDark: 0x07120f, treeLit: 0x1e4d3a,
		sphereGlass: 0x3f7ea3, sphereGlow: 0xffc978, sphereFrame: 0x8fb0c4, sphereGlowStrength: 1.6,
		envSky: 0x0e1c2e, envHorizon: 0x3a5c7e, envGround: 0x05070d, envSun: 0xdfe8ff,
		key: 0xdfe8ff, keyIntensity: 1.5, fill: 0x2a6a8f,
		needle: 0xf4f4f4, needleEmissive: 0x3a4558, deck: 0xffd9a0, deckStrength: 1.0,
		uplight: 0xe6eeff, uplightIntensity: 90, underglow: 0x00baff,
		car: 0xffcf7a, hemiSky: 0x2a6a8f, hemiGround: 0x05070d, hemiIntensity: 0.55,
		glow: 1.0,
	},
	light: {
		skyTop: 0xc9d8ea, skyHorizon: 0xf0f3f7, haze: 0xe4e9f0,
		auroraA: 0x1f8a4c, auroraB: 0x0077b6, auroraC: 0x7c3aed, auroraStrength: 0.5, auroraMix: 1.0,
		stars: 0.0,
		building: 0x8d99ad, buildingTop: 0xb7c1cf, rim: 0x1f8a4c,
		winWarm: 0xf4f8fc, winCool: 0xdcecf8, winStrength: 0.25,
		water: 0xd3dce8,
		ground: 0x8f9aa8, groundLit: 0xb3bdc9,
		treeDark: 0x23483a, treeLit: 0x5f8f6b,
		sphereGlass: 0xbfdcee, sphereGlow: 0xffffff, sphereFrame: 0x5a6b7c, sphereGlowStrength: 0.35,
		envSky: 0xbcd0e6, envHorizon: 0xffffff, envGround: 0x8f9bad, envSun: 0xffffff,
		key: 0xffffff, keyIntensity: 2.2, fill: 0xe6eef8,
		needle: 0xf4f6f9, needleEmissive: 0x2b3442, deck: 0xffe6bd, deckStrength: 0.45,
		uplight: 0xffffff, uplightIntensity: 30, underglow: 0x0077b6,
		car: 0xffb84d, hemiSky: 0xe6eef8, hemiGround: 0x9aa6b8, hemiIntensity: 1.6,
		glow: 0.45,
	},
	// "Linotype" theme: printed-poster duotone, paper sky over a navy city, red signal accents
	linotype: {
		skyTop: 0xa9cbe3, skyHorizon: 0xece7dc, haze: 0xe6e0d3,
		auroraA: 0x5aa6d6, auroraB: 0x1d3f6e, auroraC: 0xa9d3ee, auroraStrength: 0.18, auroraMix: 1.0,
		stars: 0.0,
		building: 0x1d3f6e, buildingTop: 0x3b6fa3, rim: 0xa9d3ee,
		winWarm: 0xece7dc, winCool: 0xa9d3ee, winStrength: 0.3,
		water: 0xd8d1c2,
		ground: 0xb9ae99, groundLit: 0xcfc6b2,
		treeDark: 0x14304f, treeLit: 0x3b6fa3,
		sphereGlass: 0xa9d3ee, sphereGlow: 0xece7dc, sphereFrame: 0x1d3f6e, sphereGlowStrength: 0.4,
		envSky: 0xa9cbe3, envHorizon: 0xece7dc, envGround: 0xa89f8c, envSun: 0xffffff,
		key: 0xffffff, keyIntensity: 2.0, fill: 0xeef2f5,
		needle: 0xf1ece2, needleEmissive: 0x24303f, deck: 0xb8322a, deckStrength: 0.4,
		uplight: 0xffffff, uplightIntensity: 26, underglow: 0x5aa6d6,
		car: 0xb8322a, hemiSky: 0xeef2f5, hemiGround: 0xa89f8c, hemiIntensity: 1.6,
		glow: 0.3,
	},
};

const NEEDLE = { height: 184, carLow: 6, carHigh: 143, coreRadius: 3.2 };
const NEEDLE_FOV = 11; // long lens: near-elevation view with just enough perspective to read as solid
const EYE_HEIGHT = 16;
const HORIZON_SHIFT = 0.6; // lens shift: horizon sits 20% up from the bottom of the screen
const LAND_EDGE = -720; // where the foreground hill meets Elliott Bay
const SPHERES = { x: -215, z: -520 }; // Amazon Spheres, on the near lawn to the left so they stay in view
const VIEW_HALF = 0.52; // half the visible world width per unit of depth, for a 40° lens at ~3:2

function init(canvas) {
	let renderer;
	try {
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
	} catch (e) {
		return; // CSS aurora fallback stays visible
	}
	renderer.autoClear = false;
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	// Tone mapping only touches the lit (MeshStandard) materials, i.e. the needle
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const root = document.documentElement;
	// Still frame when the OS asks for reduced motion or the gear menu turns motion off
	const motionOff = () => reduceMotion.matches || root.dataset.motion === 'off';

	const camera = new THREE.PerspectiveCamera(40, 1, 1, 6000);
	camera.position.set(0, EYE_HEIGHT, 0);

	const scene = new THREE.Scene();
	const sky = createSky();
	const city = createCity();
	const spheres = createSpheres();
	const land = createLand();
	const trees = createTrees();
	const needle = createNeedle();
	const water = createWater();
	const ridge = createRidge();
	scene.add(city.group, spheres.mesh, land.mesh, trees.mesh, water.mesh, ridge.mesh);

	// The needle gets its own pass with a long lens so it reads as a near-elevation
	// (like /images/space-needle.svg) but still has depth, and its own env map for reflections
	const needleScene = new THREE.Scene();
	needleScene.add(needle.group);
	const needleCamera = new THREE.PerspectiveCamera(NEEDLE_FOV, 1, 10, 6000);
	const pmrem = new THREE.PMREMGenerator(renderer);
	pmrem.compileEquirectangularShader();
	let envTarget = null;

	const shared = { time: { value: 0 }, dim: { value: 0 }, fold: { value: 0 } };
	for (const m of [sky.material, city.material, spheres.material, land.material, trees.material, water.material, ridge.material]) {
		m.uniforms.uTime = shared.time;
		m.uniforms.uDim = shared.dim;
		m.uniforms.uFold = shared.fold;
	}

	let palette;
	function applyPalette() {
		// data-theme (gear menu) wins; no attribute = follow the OS
		const theme = root.dataset.theme;
		palette = PALETTES[theme] || (darkQuery.matches ? PALETTES.dark : PALETTES.light);
		sky.setPalette(palette);
		city.setPalette(palette);
		spheres.setPalette(palette);
		land.setPalette(palette);
		trees.setPalette(palette);
		needle.setPalette(palette);
		water.setPalette(palette);
		ridge.setPalette(palette);

		const equirect = envTexture(palette);
		const next = pmrem.fromEquirectangular(equirect);
		equirect.dispose();
		if (envTarget) envTarget.dispose();
		envTarget = next;
		needleScene.environment = envTarget.texture;
		requestRender();
	}

	function resize() {
		const w = window.innerWidth;
		const h = window.innerHeight;
		const aspect = w / h;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 1.75));
		renderer.setSize(w, h, false);
		camera.aspect = aspect;
		camera.updateProjectionMatrix();
		camera.projectionMatrix.elements[9] = HORIZON_SHIFT;
		camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

		// Keep the needle in the right corner at a sensible size on any aspect ratio.
		// On portrait screens it tucks into the corner, partly off-screen, clear of the hero text.
		const portrait = aspect < 0.8;
		const viewH = 240 * Math.max(1, (portrait ? 0.9 : 1.05) / aspect);
		const viewW = viewH * aspect;
		const bottom = -0.13 * viewH; // base sits 13% up from the bottom, near the horizon line
		const dist = (viewH / 2) / Math.tan(THREE.MathUtils.degToRad(NEEDLE_FOV / 2));
		const eyeY = bottom + viewH / 2;
		needleCamera.aspect = aspect;
		needleCamera.near = dist * 0.4;
		needleCamera.far = dist * 2.5;
		needleCamera.updateProjectionMatrix();
		needleCamera.position.set(0, eyeY, dist);
		needleCamera.lookAt(0, eyeY, 0);
		needle.group.position.x = (portrait ? 0.92 : 0.74) * (viewW / 2);

		sky.material.uniforms.uRes.value.set(w, h);
		requestRender();
	}

	// Scroll: 0 at the top of the hero, 1 once its bottom edge reaches the bottom of the viewport
	const hero = canvas.closest('.hero-section') || document.documentElement;
	let carTarget = 1;
	let carPos = 1;
	let dimTarget = 0;
	function readScroll() {
		const rect = hero.getBoundingClientRect();
		const max = Math.max(1, rect.height - window.innerHeight);
		const p = Math.min(1, Math.max(0, -rect.top / max));
		// With motion off the elevator car stays parked instead of tracking the scroll
		carTarget = motionOff() ? 1 : 1 - p;
		dimTarget = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
		requestRender();
	}

	const clock = new THREE.Clock();
	let running = false;
	let pending = false;
	let firstFrame = true;

	function frame() {
		pending = false;
		const dt = Math.min(clock.getDelta(), 0.1);
		const animate = !motionOff();
		if (animate) shared.time.value += dt;
		// The pop-up fold plays once, the first time the hero is on screen; motion off shows it standing
		shared.fold.value = animate ? Math.min(shared.fold.value + dt, FOLD_END + 1) : FOLD_END + 1;

		const ease = animate ? 1 - Math.exp(-dt * 4) : 1;
		carPos += (carTarget - carPos) * ease;
		shared.dim.value += (dimTarget - shared.dim.value) * ease;
		needle.update(shared.time.value, carPos, shared.dim.value);
		city.update(shared.time.value, shared.fold.value);

		if (animate) camera.position.x = Math.sin(shared.time.value * 0.05) * 4;
		camera.lookAt(camera.position.x, EYE_HEIGHT, -1000);

		renderer.clear();
		renderer.render(sky.scene, sky.camera);
		renderer.render(scene, camera);
		renderer.clearDepth();
		renderer.render(needleScene, needleCamera);

		if (firstFrame) {
			firstFrame = false;
			canvas.classList.add('is-ready');
		}
		const settling = Math.abs(carTarget - carPos) > 0.0005 || Math.abs(dimTarget - shared.dim.value) > 0.001;
		if ((animate && running) || settling) schedule();
	}

	function schedule() {
		if (!pending && !document.hidden) {
			pending = true;
			requestAnimationFrame(frame);
		}
	}
	function requestRender() {
		schedule();
	}
	// Only animate while the hero is on screen
	let heroVisible = true;
	function start() {
		running = heroVisible && !motionOff();
		clock.getDelta();
		schedule();
	}
	if ('IntersectionObserver' in window && hero !== document.documentElement) {
		new IntersectionObserver(([entry]) => {
			heroVisible = entry.isIntersecting;
			start();
		}).observe(hero);
	}

	window.addEventListener('resize', resize, { passive: true });
	window.addEventListener('scroll', readScroll, { passive: true });
	document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
	darkQuery.addEventListener('change', applyPalette);
	reduceMotion.addEventListener('change', () => { readScroll(); start(); });
	new MutationObserver(() => {
		applyPalette();
		readScroll();
		start();
	}).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-motion'] });
	canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
	canvas.addEventListener('webglcontextrestored', start);

	applyPalette();
	resize();
	readScroll();
	carPos = carTarget;
	shared.dim.value = dimTarget;
	start();
}

// ---------------------------------------------------------------------------
// Shared GLSL helpers
const NOISE_GLSL = `
	float hash12(vec2 p) {
		vec3 p3 = fract(vec3(p.xyx) * 0.1031);
		p3 += dot(p3, p3.yzx + 33.33);
		return fract((p3.x + p3.y) * p3.z);
	}
	float vnoise(vec2 p) {
		vec2 i = floor(p);
		vec2 f = fract(p);
		vec2 u = f * f * (3.0 - 2.0 * f);
		return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
			mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
	}
	float fbm(vec2 p) {
		float v = 0.0;
		float a = 0.5;
		for (int i = 0; i < 4; i++) {
			v += a * vnoise(p);
			p = p * 2.03 + vec2(17.1, 9.2);
			a *= 0.5;
		}
		return v;
	}
`;

const FOG_GLSL = `
	uniform vec3 uHaze;
	uniform float uDim;
	vec3 applyFog(vec3 col, float dist) {
		float fogAmount = 1.0 - exp(-pow(dist * 0.00042, 2.0));
		col = mix(col, uHaze, fogAmount);
		return mix(col, uHaze, uDim * 0.45);
	}
`;

// Pop-up book: every piece starts flat on the page, tipped back on a hinge along its base,
// and stands up in turn from the foreground trees back to downtown, with a little paper overshoot.
// uFold is seconds since the scene first showed; FOLD_END must cover the last piece.
const FOLD_END = 3.5;
const FOLD_GLSL = `
	uniform float uFold;
	float foldAngle(vec3 pivot) {
		float jitter = fract(sin(dot(pivot.xz, vec2(12.9898, 78.233))) * 43758.5453);
		float delay = 0.5 + clamp((-pivot.z - 230.0) / 1030.0, 0.0, 1.0) * 1.6 + jitter * 0.45;
		float p = clamp((uFold - delay) / 0.9, 0.0, 1.0);
		float q = p - 1.0;
		float rise = 1.0 + 2.6 * q * q * q + 1.6 * q * q; // ease-out-back
		return -1.5708 * (1.0 - rise);
	}
	vec3 foldX(vec3 v, float a) {
		float c = cos(a);
		float s = sin(a);
		return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
	}
`;

// Painted look for the world geometry (needs NOISE_GLSL): brush strokes, pigment that pools
// warm and cool, light laid on in a few soft bands, and paper tooth over the top
const PAINT_GLSL = `
	float brush(vec2 p) {
		return 0.6 * vnoise(p) + 0.4 * vnoise(p * 2.7 + 3.1);
	}
	// Watercolour wash: big soft blooms that drift warm (ochre) and cool (blue) across a surface
	vec3 pigment(vec3 col, vec3 p) {
		float k = fbm(p.xz * 0.012 + p.y * 0.006) - 0.45;
		float bloom = fbm(p.xz * 0.05 + p.y * 0.04 + 7.3) - 0.5;
		col *= 1.0 + k * vec3(0.38, 0.06, -0.3);
		return col * (1.0 + bloom * 0.35);
	}
	float bands(float l, float wobble) {
		l += (wobble - 0.5) * 0.3;
		return 0.45 * smoothstep(0.28, 0.34, l) + 0.55 * smoothstep(0.62, 0.68, l);
	}
	vec3 paper(vec3 col) {
		vec2 fc = gl_FragCoord.xy;
		float tooth = hash12(floor(fc * 0.75)) - 0.5;
		float fibre = vnoise(fc * vec2(0.06, 0.35)) - 0.5;
		return col * (1.0 + tooth * 0.07 + fibre * 0.05);
	}
`;

// Vertex shader shared by the world geometry: world position, normal, view distance,
// and a per-vertex (or per-instance) tint. Works for plain and instanced meshes.
// With FOLD defined the piece folds up on its base (aPivot, or the instance origin);
// vRest/vRestNormal keep the standing pose so painted detail stays stuck to the paper.
const WORLD_VERTEX_GLSL = `
	attribute vec3 aTint;
	varying vec3 vPos;
	varying vec3 vRest;
	varying vec3 vNormal;
	varying vec3 vRestNormal;
	varying vec3 vTint;
	varying vec2 vUv;
	varying float vDist;
	#ifdef FOLD
		attribute vec3 aPivot;
		${FOLD_GLSL}
	#endif
	void main() {
		mat4 m = modelMatrix;
		#ifdef USE_INSTANCING
			m = modelMatrix * instanceMatrix;
		#endif
		vec4 world = m * vec4(position, 1.0);
		vec3 nrm = normalize(mat3(m) * normal);
		vRest = world.xyz;
		vRestNormal = nrm;
		#ifdef FOLD
			#ifdef USE_INSTANCING
				vec3 pivot = (m * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
			#else
				vec3 pivot = (modelMatrix * vec4(aPivot, 1.0)).xyz;
			#endif
			pivot.y = 0.0;
			float a = foldAngle(pivot);
			world.xyz = pivot + foldX(world.xyz - pivot, a);
			nrm = foldX(nrm, a);
		#endif
		vPos = world.xyz;
		vNormal = nrm;
		vUv = uv;
		vTint = aTint;
		#ifdef USE_INSTANCING_COLOR
			vTint *= instanceColor;
		#endif
		vec4 mv = viewMatrix * world;
		vDist = length(mv.xyz);
		gl_Position = projectionMatrix * mv;
	}
`;

const color = (hex) => new THREE.Color(hex);

// Merge geometries into one non-indexed buffer with position, normal, aTint, aPivot and uv.
// Each entry: { geo, tint: [r,g,b] (default white), matrix (optional), uv (keep face UVs for
// inked edges; otherwise 0.5 so no edge is drawn), pivot ([x, z], optional) }. aPivot is the
// part's base on the ground, where it hinges when it folds up.
function mergeTinted(parts) {
	const positions = [];
	const normals = [];
	const tints = [];
	const pivots = [];
	const uvs = [];
	const pivot = new THREE.Vector3();
	for (const part of parts) {
		let g = part.geo.index ? part.geo.toNonIndexed() : part.geo;
		if (part.matrix) {
			g = g === part.geo ? g.clone() : g;
			g.applyMatrix4(part.matrix);
			pivot.setFromMatrixPosition(part.matrix);
		} else {
			pivot.set(0, 0, 0);
		}
		if (part.pivot) pivot.set(part.pivot[0], 0, part.pivot[1]);
		if (!g.attributes.normal) g.computeVertexNormals();
		const pos = g.attributes.position.array;
		const nor = g.attributes.normal.array;
		const uv = part.uv && g.attributes.uv ? g.attributes.uv.array : null;
		const tint = part.tint || [1, 1, 1];
		for (let i = 0, j = 0; i < pos.length; i += 3, j += 2) {
			positions.push(pos[i], pos[i + 1], pos[i + 2]);
			normals.push(nor[i], nor[i + 1], nor[i + 2]);
			tints.push(tint[0], tint[1], tint[2]);
			pivots.push(pivot.x, 0, pivot.z);
			uvs.push(uv ? uv[j] : 0.5, uv ? uv[j + 1] : 0.5);
		}
		if (g !== part.geo) g.dispose();
		part.geo.dispose();
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
	geo.setAttribute('aTint', new THREE.Float32BufferAttribute(tints, 3));
	geo.setAttribute('aPivot', new THREE.Float32BufferAttribute(pivots, 3));
	geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
	return geo;
}

const placed = (geo, x, y, z, rotY = 0) => new THREE.Matrix4().makeRotationY(rotY).setPosition(x, y, z);

// ---------------------------------------------------------------------------
// Sky: gradient, procedural stars, and aurora curtains on a full-screen quad
function createSky() {
	const material = new THREE.ShaderMaterial({
		depthTest: false,
		depthWrite: false,
		uniforms: {
			uRes: { value: new THREE.Vector2(1, 1) },
			uTop: { value: color(0) }, uHorizon: { value: color(0) }, uHaze: { value: color(0) },
			uA: { value: color(0) }, uB: { value: color(0) }, uC: { value: color(0) },
			uStrength: { value: 1 }, uMix: { value: 0 }, uStars: { value: 1 },
		},
		vertexShader: `
			void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
		`,
		fragmentShader: `
			uniform vec2 uRes;
			uniform float uTime, uDim, uStrength, uMix, uStars;
			uniform vec3 uTop, uHorizon, uHaze, uA, uB, uC;
			${NOISE_GLSL}

			float curtain(float x, float y, float base, float seed, float t) {
				float edge = base + 0.07 * sin(x * 1.1 + t * 0.6 + seed) + 0.09 * (fbm(vec2(x * 0.7 + seed, t * 0.15)) - 0.5);
				float d = y - edge;
				float body = d < 0.0 ? exp(d * 40.0) : exp(-d * 7.0);
				float rays = fbm(vec2(x * 7.0 + seed * 3.0, t * 0.35 + d * 0.6));
				rays = 0.35 + 1.1 * pow(rays, 1.6);
				return body * rays * smoothstep(0.25, 0.45, y);
			}

			vec3 blend(vec3 col, vec3 c, float amount) {
				vec3 additive = col + c * amount;
				vec3 tinted = mix(col, c, clamp(amount, 0.0, 1.0));
				return mix(additive, tinted, uMix);
			}

			void main() {
				vec2 uv = gl_FragCoord.xy / uRes;
				float aspect = uRes.x / uRes.y;
				float x = uv.x * aspect;
				float t = uTime;

				// Horizon sits at uv.y = 0.2 (matches the camera lens shift)
				float h = clamp((uv.y - 0.2) / 0.8, 0.0, 1.0);
				vec3 col = mix(uHorizon, uTop, pow(h, 0.7));
				col = mix(uHaze, col, smoothstep(0.17, 0.26, uv.y));

				// Stars
				vec2 grid = gl_FragCoord.xy / 3.2;
				vec2 id = floor(grid);
				float r = hash12(id);
				if (r > 0.992) {
					vec2 pos = vec2(hash12(id + 7.1), hash12(id + 3.7));
					float star = smoothstep(0.55, 0.0, length(fract(grid) - pos));
					float twinkle = 0.6 + 0.4 * sin(t * (0.8 + r * 3.0) + r * 60.0);
					col += vec3(0.85, 0.9, 1.0) * star * twinkle * smoothstep(0.3, 0.7, uv.y) * uStars * (1.0 - uDim * 0.5);
				}

				// Aurora
				float s = uStrength * (1.0 - uDim * 0.55);
				col = blend(col, uA, curtain(x, uv.y, 0.6, 1.3, t) * 0.55 * s);
				col = blend(col, uB, curtain(x * 0.8 + 2.0, uv.y, 0.72, 4.7, t * 0.8) * 0.3 * s);
				col = blend(col, uC, curtain(x * 0.6 + 5.0, uv.y, 0.78, 8.9, t * 0.7) * 0.22 * s);

				gl_FragColor = vec4(col, 1.0);
				#include <colorspace_fragment>
			}
		`,
	});
	const scene = new THREE.Scene();
	const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
	quad.frustumCulled = false;
	scene.add(quad);
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

	return {
		scene, camera, material,
		setPalette(p) {
			const u = material.uniforms;
			u.uTop.value.set(p.skyTop);
			u.uHorizon.value.set(p.skyHorizon);
			u.uHaze.value.set(p.haze);
			u.uA.value.set(p.auroraA);
			u.uB.value.set(p.auroraB);
			u.uC.value.set(p.auroraC);
			u.uStrength.value = p.auroraStrength;
			u.uMix.value = p.auroraMix;
			u.uStars.value = p.stars;
		},
	};
}

// ---------------------------------------------------------------------------
// Downtown Seattle as seen from Queen Anne: named towers with their real massing in front,
// instanced infill behind, procedural lit windows on everything. Two draw calls plus beacons.
function createCity() {
	const rand = mulberry32(206);

	// Landmarks (heights compressed so the skyline sits low). Tints darken/lighten the base color.
	const parts = [];
	const keepClear = []; // {x, z, r} zones the random infill stays out of
	// `pivot` ([x, z]) hinges an off-centre add-on with the tower it sits on
	const box = (x, z, w, d, h, tint, rotY = 0, y = 0, pivot) => {
		const geo = new THREE.BoxGeometry(w, h, d);
		geo.translate(0, h / 2, 0);
		parts.push({ geo, tint, matrix: placed(geo, x, y, z, rotY), uv: true, pivot });
	};
	const cyl = (x, z, rTop, rBot, h, segs, tint, sx = 1, sz = 1, y = 0) => {
		const geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
		geo.translate(0, h / 2, 0);
		geo.scale(sx, 1, sz);
		parts.push({ geo, tint, matrix: placed(geo, x, y, z) });
	};
	const pyramid = (x, z, y, r, h, tint, rotY = Math.PI / 4) => {
		const geo = new THREE.ConeGeometry(r, h, 4, 1);
		geo.translate(0, h / 2, 0);
		parts.push({ geo, tint, matrix: placed(geo, x, y, z, rotY) });
	};
	const clear = (x, z, r) => keepClear.push({ x, z, r });

	const dark = [0.5, 0.52, 0.58];
	const glass = [1.12, 1.14, 1.18];
	const pale = [1.3, 1.28, 1.24];
	const stone = [0.95, 0.93, 0.9];

	// Columbia Center: three stepped curved shafts, the tallest and darkest thing downtown
	cyl(-150, -1090, 20, 20, 205, 24, dark);
	cyl(-166, -1082, 24, 24, 182, 24, dark);
	cyl(-184, -1072, 27, 27, 150, 24, dark);
	clear(-165, -1082, 60);

	// Seattle Municipal Tower: stepped slabs
	box(-300, -1080, 44, 40, 118, stone);
	box(-290, -1080, 30, 40, 150, stone);
	box(-282, -1080, 18, 40, 176, stone);
	clear(-290, -1080, 48);

	// 1201 Third Avenue: pale shaft with a stepped pyramid crown
	box(-230, -1030, 38, 38, 150, pale);
	box(-230, -1030, 28, 28, 8, pale, 0, 150);
	pyramid(-230, -1030, 158, 20, 24, pale);
	clear(-230, -1030, 44);

	// Two Union Square: round glass shaft with a domed, sloping top
	cyl(-60, -1040, 22, 22, 160, 28, glass);
	{
		const geo = new THREE.SphereGeometry(22, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2);
		geo.scale(1, 0.5, 1);
		parts.push({ geo, tint: glass, matrix: placed(geo, -60, 160, -1040) });
	}
	clear(-60, -1040, 46);

	// F5 Tower: tall glass ellipse
	cyl(-195, -985, 17, 17, 148, 28, glass, 1, 1.45);
	clear(-195, -985, 40);

	// Rainier Square Tower: the pedestal, wide at the top and curving in toward a narrow base on one side
	{
		const slices = 26;
		const H = 190;
		const top = 42;
		const base = 22;
		for (let i = 0; i < slices; i++) {
			const t0 = i / slices;
			const t1 = (i + 1) / slices;
			const curve = (t) => base + (top - base) * Math.pow(Math.min(1, t / 0.72), 1.9);
			const w = (curve(t0) + curve(t1)) / 2;
			const h = H / slices;
			const geo = new THREE.BoxGeometry(w, h, 40);
			geo.translate(w / 2 - top / 2, h / 2, 0); // flat side stays put, curved side sweeps out
			parts.push({ geo, tint: glass, matrix: placed(geo, -8, t0 * H, -1000) });
		}
		clear(-8, -1000, 50);
	}

	// Russell Investments Center and the mid-rise glass boxes around it
	box(-112, -995, 44, 44, 130, [1.0, 1.02, 1.06]);
	clear(-112, -995, 44);
	box(-20, -1120, 40, 40, 140, stone);
	box(30, -1070, 34, 34, 112, glass);
	clear(30, -1070, 36);

	// Smith Tower: white terra cotta with a pyramid cap, far down at Pioneer Square
	box(-470, -1140, 18, 18, 80, pale);
	pyramid(-470, -1140, 80, 11, 26, pale);
	clear(-470, -1140, 30);

	// Amazon campus in Denny Triangle, between downtown and the Needle: Day 1, Doppler (with its
	// slanted top fin), re:Invent, and the Spheres' plaza out front
	box(75, -935, 44, 44, 165, glass);
	clear(75, -935, 46);
	box(165, -960, 40, 40, 152, [1.04, 1.06, 1.1]);
	box(175, -960, 20, 40, 14, [1.04, 1.06, 1.1], 0, 152, [165, -960]);
	clear(165, -960, 44);
	box(240, -1000, 36, 36, 120, glass);
	clear(240, -1000, 38);

	// Infill: smaller towers that thin out from the core, kept away from the landmarks
	const boxes = [];
	for (let z = -1260; z <= -900; z += 56) {
		for (let x = -760; x <= 380; x += 48) {
			if (rand() < 0.2) continue;
			const px = x + (rand() - 0.5) * 20;
			const pz = z + (rand() - 0.5) * 16;
			if (keepClear.some((c) => Math.hypot(px - c.x, pz - c.z) < c.r)) continue;
			const core = Math.exp(-Math.pow((px + 140) / 280, 2)) + 0.55 * Math.exp(-Math.pow((px - 220) / 160, 2));
			const nearWater = (pz + 900) / -360; // 0 at waterfront, 1 at back
			const h = 16 + 120 * core * (0.3 + 0.7 * rand()) * (0.5 + 0.5 * nearWater) + rand() * 22;
			const tone = 0.78 + rand() * 0.45;
			boxes.push({ x: px, z: pz, w: 20 + rand() * 22, d: 20 + rand() * 22, h, tint: [tone, tone * (0.98 + rand() * 0.04), tone * (1.0 + rand() * 0.08)] });
		}
	}

	const material = new THREE.ShaderMaterial({
		defines: { FOLD: '' },
		uniforms: {
			uBase: { value: color(0) }, uTop: { value: color(0) }, uRim: { value: color(0) },
			uWarm: { value: color(0) }, uCool: { value: color(0) }, uWin: { value: 1 },
			uHaze: { value: color(0) },
		},
		vertexShader: WORLD_VERTEX_GLSL,
		fragmentShader: `
			uniform vec3 uBase, uTop, uRim, uWarm, uCool;
			uniform float uWin, uTime;
			varying vec3 vRest;
			varying vec3 vNormal;
			varying vec3 vRestNormal;
			varying vec3 vTint;
			varying vec2 vUv;
			varying float vDist;
			${NOISE_GLSL}
			${PAINT_GLSL}
			${FOG_GLSL}
			void main() {
				// Light follows the folding paper; everything painted on it uses the standing pose
				vec3 n = normalize(vNormal);
				vec3 rn = normalize(vRestNormal);
				vec3 rp = vRest;
				float heightT = clamp(rp.y / 220.0, 0.0, 1.0);
				vec3 col = uBase * vTint * (0.75 + 0.5 * heightT);
				float stroke;

				if (rn.y > 0.5) {
					col = uTop * vTint;
					stroke = brush(vec2(rp.x * 0.3, rp.z * 0.04));
				} else {
					// Window columns follow the wall's tangent so they wrap around curved towers
					float along = dot(rp.xz, normalize(vec2(-rn.z, rn.x) + 1e-4));
					// Long vertical strokes down each wall
					stroke = brush(vec2(along * 0.16, rp.y * 0.018));
					vec2 cell = vec2(along / 3.6, rp.y / 4.2);
					vec2 id = floor(cell);
					vec2 f = fract(cell);
					// Windows dabbed on with a loose, uneven edge
					vec2 q = abs(f - 0.5) * vec2(1.0, 1.15);
					float pane = 1.0 - smoothstep(0.2, 0.3, max(q.x, q.y) + (vnoise(cell * 4.0) - 0.5) * 0.14);
					vec2 seed = id + floor(vec2(rp.x + rp.z * 1.3, rp.z - rp.x) / 9.0) * 0.37;
					float r = hash12(seed);
					float lit = step(0.8, r);
					// A handful of windows switch on and off very slowly
					lit *= step(0.12, fract(r * 47.0 + uTime * 0.004 * step(0.96, r)));
					vec3 wc = mix(uWarm, uCool, step(0.82, hash12(seed * 1.7)));
					col += pane * lit * wc * (0.25 + 0.5 * hash12(seed * 3.1)) * uWin * smoothstep(3.0, 8.0, rp.y);
					// Faces toward the sky catch a little aurora light near the top
					col += uRim * 0.07 * smoothstep(60.0, 220.0, rp.y) * (0.5 + 0.5 * rn.z);
					// Directional light in a few brushed bands so the massing reads
					col *= 0.78 + 0.22 * bands(clamp(dot(n, normalize(vec3(-0.6, 0.0, 0.8))), 0.0, 1.0), stroke);
				}
				col *= 0.74 + 0.52 * stroke;
				col = pigment(col, rp);

				// Ink-and-wash edges: pigment pools along each box face's border, with a ragged width
				vec2 e = min(vUv, 1.0 - vUv) / max(fwidth(vUv), vec2(1e-4));
				float wob = vnoise(rp.xz * 0.35 + rp.y * 0.2);
				float ink = 1.0 - smoothstep(0.8 + 1.4 * wob, 2.0 + 2.0 * wob, min(e.x, e.y));
				col = mix(col, col * 0.42, ink * 0.85);

				// Ground haze
				col = mix(col, uHaze, (1.0 - smoothstep(0.0, 70.0, rp.y)) * 0.35);
				gl_FragColor = vec4(paper(applyFog(col, vDist)), 1.0);
				#include <colorspace_fragment>
			}
		`,
	});

	const group = new THREE.Group();
	const landmarks = new THREE.Mesh(mergeTinted(parts), material);
	landmarks.frustumCulled = false;
	group.add(landmarks);

	const boxGeo = new THREE.BoxGeometry(1, 1, 1);
	boxGeo.translate(0, 0.5, 0);
	const tints = new Float32Array(boxes.length * 3);
	boxes.forEach((b, i) => tints.set(b.tint, i * 3));
	boxGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3));
	const towers = new THREE.InstancedMesh(boxGeo, material, boxes.length);
	const m = new THREE.Matrix4();
	boxes.forEach((b, i) => {
		m.makeScale(b.w, b.h, b.d).setPosition(b.x, 0, b.z);
		towers.setMatrixAt(i, m);
	});
	towers.frustumCulled = false;
	group.add(towers);

	// Red aviation beacons on the tallest roofs
	const beaconTex = glowTexture();
	const roofs = [
		{ x: -150, z: -1090, h: 205 }, { x: -282, z: -1080, h: 176 }, { x: -230, z: -1030, h: 182 },
		{ x: -8, z: -1000, h: 190 }, { x: 75, z: -935, h: 165 }, { x: -60, z: -1040, h: 171 },
	];
	const beacons = roofs.map((b, i) => {
		const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
			map: beaconTex, color: 0xff3b3b, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
		}));
		sprite.position.set(b.x, b.h + 3, b.z);
		sprite.scale.setScalar(14);
		sprite.userData.phase = i * 1.7;
		group.add(sprite);
		return sprite;
	});

	return {
		group, material,
		setPalette(p) {
			const u = material.uniforms;
			u.uBase.value.set(p.building);
			u.uTop.value.set(p.buildingTop);
			u.uRim.value.set(p.rim);
			u.uWarm.value.set(p.winWarm);
			u.uCool.value.set(p.winCool);
			u.uWin.value = p.winStrength;
			u.uHaze.value.set(p.haze);
			beacons.forEach((b) => { b.userData.max = 0.9 * p.glow; });
		},
		update(t, fold) {
			// Beacons wait for the towers to finish standing up
			const shown = THREE.MathUtils.smoothstep(fold, FOLD_END - 0.3, FOLD_END + 0.3);
			beacons.forEach((b) => {
				const blink = Math.pow(0.5 + 0.5 * Math.sin(t * 1.6 + b.userData.phase), 6);
				b.material.opacity = (0.15 + 0.85 * blink) * b.userData.max * shown;
			});
		},
	};
}

// ---------------------------------------------------------------------------
// Amazon Spheres: three intersecting geodesic domes, faceted glass with a lit interior
// and the steel lattice drawn in the shader from barycentric coordinates. One draw call.
function createSpheres() {
	const domes = [
		{ r: 18, x: -31, z: 8 },
		{ r: 24.5, x: 0, z: 0 },
		{ r: 18, x: 31, z: 6 },
	];
	const positions = [];
	const normals = [];
	const bary = [];
	for (const d of domes) {
		const g = new THREE.IcosahedronGeometry(d.r, 3); // already non-indexed
		g.translate(SPHERES.x + d.x, d.r * 0.68, SPHERES.z + d.z);
		g.computeVertexNormals(); // flat facets
		const pos = g.attributes.position.array;
		const nor = g.attributes.normal.array;
		for (let i = 0; i < pos.length; i += 9) {
			for (let k = 0; k < 3; k++) {
				positions.push(pos[i + k * 3], pos[i + k * 3 + 1], pos[i + k * 3 + 2]);
				normals.push(nor[i + k * 3], nor[i + k * 3 + 1], nor[i + k * 3 + 2]);
			}
			bary.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
		}
		g.dispose();
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
	geo.setAttribute('aBary', new THREE.Float32BufferAttribute(bary, 3));

	const material = new THREE.ShaderMaterial({
		uniforms: {
			uGlass: { value: color(0) }, uGlow: { value: color(0) }, uFrame: { value: color(0) },
			uHaze: { value: color(0) }, uGlowStrength: { value: 1 },
		},
		vertexShader: `
			attribute vec3 aBary;
			varying vec3 vPos;
			varying vec3 vNormal;
			varying vec3 vBary;
			varying float vDist;
			${FOLD_GLSL}
			void main() {
				vec4 world = modelMatrix * vec4(position, 1.0);
				// All three domes fold up together on the lawn
				vec3 pivot = vec3(${SPHERES.x.toFixed(1)}, 0.0, ${SPHERES.z.toFixed(1)});
				float a = foldAngle(pivot);
				world.xyz = pivot + foldX(world.xyz - pivot, a);
				vPos = world.xyz;
				vNormal = foldX(normalize(mat3(modelMatrix) * normal), a);
				vBary = aBary;
				vec4 mv = viewMatrix * world;
				vDist = length(mv.xyz);
				gl_Position = projectionMatrix * mv;
			}
		`,
		fragmentShader: `
			uniform vec3 uGlass, uGlow, uFrame;
			uniform float uGlowStrength, uTime;
			varying vec3 vPos;
			varying vec3 vNormal;
			varying vec3 vBary;
			varying float vDist;
			${NOISE_GLSL}
			${PAINT_GLSL}
			${FOG_GLSL}
			void main() {
				vec3 n = normalize(vNormal);
				vec3 v = normalize(cameraPosition - vPos);
				float fres = pow(1.0 - max(dot(n, v), 0.0), 2.2);
				// Warm plant-filled interior, brighter low and toward the middle
				float interior = 0.3 + 0.35 * fbm(vPos.xz * 0.09 + vec2(uTime * 0.01, 0.0)) + 0.2 * (1.0 - smoothstep(4.0, 24.0, vPos.y));
				vec3 col = mix(uGlow * interior * uGlowStrength + uGlass * 0.3, uGlass, 0.3 + 0.6 * fres);
				// Steel lattice along the facet edges
				float d = min(min(vBary.x, vBary.y), vBary.z);
				float w = fwidth(d) * 1.5;
				float line = 1.0 - smoothstep(0.0, w, d - 0.02);
				col = mix(col, uFrame, line * 0.65);
				gl_FragColor = vec4(paper(applyFog(col, vDist)), 1.0);
				#include <colorspace_fragment>
			}
		`,
	});
	const mesh = new THREE.Mesh(geo, material);
	mesh.frustumCulled = false;
	return {
		mesh, material,
		setPalette(p) {
			const u = material.uniforms;
			u.uGlass.value.set(p.sphereGlass);
			u.uGlow.value.set(p.sphereGlow);
			u.uFrame.value.set(p.sphereFrame);
			u.uHaze.value.set(p.haze);
			u.uGlowStrength.value = p.sphereGlowStrength;
		},
	};
}

// Painted material for the hill and the trees: two-tone lambert laid on in brushed bands,
// with fog and ground haze. `fold` makes the pieces pop up (the trees; the hill is the page).
function terrainMaterial({ fold = false } = {}) {
	return new THREE.ShaderMaterial({
		defines: fold ? { FOLD: '' } : {},
		uniforms: { uDark: { value: color(0) }, uLit: { value: color(0) }, uHaze: { value: color(0) } },
		vertexShader: WORLD_VERTEX_GLSL,
		fragmentShader: `
			uniform vec3 uDark, uLit;
			varying vec3 vRest;
			varying vec3 vNormal;
			varying vec3 vTint;
			varying float vDist;
			${NOISE_GLSL}
			${PAINT_GLSL}
			${FOG_GLSL}
			void main() {
				vec3 n = normalize(vNormal);
				float ndl = clamp(dot(n, normalize(vec3(-0.55, 0.7, 0.45))), 0.0, 1.0);
				#ifdef FOLD
					// Foliage laid on in dabs that droop with the branches
					float stroke = brush(vRest.xz * 0.45 + vRest.y * vec2(0.25, 0.7));
				#else
					// Long horizontal strokes across the lawn and hillside
					float stroke = brush(vec2(vRest.x * 0.015, vRest.z * 0.09 + vRest.y * 0.2));
				#endif
				float light = bands(ndl, stroke);
				// Sky light from above plus a soft fill on back faces, so branch undersides stay dark
				float sky = 0.5 + 0.5 * n.y;
				vec3 col = mix(uDark, uLit, 0.1 + 0.6 * light + 0.3 * light * sky) * vTint;
				col *= 0.72 + 0.56 * stroke;
				col = pigment(col, vRest);
				col = mix(col, uHaze, (1.0 - smoothstep(0.0, 30.0, vRest.y)) * 0.12);
				gl_FragColor = vec4(paper(applyFog(col, vDist)), 1.0);
				#include <colorspace_fragment>
			}
		`,
	});
}

// ---------------------------------------------------------------------------
// Queen Anne foreground: a flat lawn in front and a wavy hillside crest that hides the
// bay behind the treeline. One merged mesh.
function createLand() {
	const rand = mulberry32(31);
	const width = 6000;
	const steps = 120;
	const crest = [];
	for (let i = 0; i <= steps; i++) {
		const x = -width / 2 + (i / steps) * width;
		const left = Math.exp(-Math.pow((x + 1100) / 600, 2)); // the hill rises to the far left
		const y = 10 + 9 * Math.sin(i * 0.37) * Math.sin(i * 0.11) + 24 * left + rand() * 5;
		crest.push([x, Math.max(6, y)]);
	}
	const positions = [];
	const normals = [];
	for (let i = 0; i < steps; i++) {
		const [x0, y0] = crest[i];
		const [x1, y1] = crest[i + 1];
		positions.push(x0, 0, LAND_EDGE, x1, 0, LAND_EDGE, x1, y1, LAND_EDGE, x0, 0, LAND_EDGE, x1, y1, LAND_EDGE, x0, y0, LAND_EDGE);
		for (let k = 0; k < 6; k++) normals.push(0, 0, 1);
	}
	const wall = new THREE.BufferGeometry();
	wall.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	wall.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

	const lawn = new THREE.PlaneGeometry(width, 100 - LAND_EDGE);
	lawn.rotateX(-Math.PI / 2);
	lawn.translate(0, 0.4, (100 + LAND_EDGE) / 2);

	const material = terrainMaterial();
	const mesh = new THREE.Mesh(mergeTinted([{ geo: wall, tint: [0.7, 0.72, 0.75] }, { geo: lawn }]), material);
	mesh.frustumCulled = false;
	return {
		mesh, material,
		setPalette(p) {
			const u = material.uniforms;
			u.uDark.value.set(p.ground);
			u.uLit.value.set(p.groundLit);
			u.uHaze.value.set(p.haze);
		},
	};
}

// ---------------------------------------------------------------------------
// Evergreens: Douglas fir / cedar silhouettes (trunk plus four cone tiers), one instanced
// mesh of ~300 trees banked on either side of the view, thinning toward the middle.
function createTrees() {
	// Seven overlapping whorls of drooping branches with a ragged rim, darker and fuller low down,
	// each nudged a little off-axis so the silhouette isn't a perfect stack of cones
	const shape = mulberry32(5);
	const trunk = new THREE.CylinderGeometry(0.35, 0.75, 7, 6);
	trunk.translate(0, 3.5, 0);
	const parts = [{ geo: trunk, tint: [0.5, 0.4, 0.34] }];
	const whorls = 7;
	for (let i = 0; i < whorls; i++) {
		const f = i / (whorls - 1); // 0 bottom, 1 top
		const r = 5.6 * (1 - f) * (0.78 + 0.22 * Math.cos(f * Math.PI)) + 0.9;
		const h = 5.2 - 1.6 * f;
		const y = 2.6 + f * 16.5;
		const g = new THREE.ConeGeometry(r, h, 9, 1, true);
		// Ragged rim: pull the bottom ring in and out, and let branch tips droop unevenly
		const pos = g.attributes.position;
		for (let v = 0; v < pos.count; v++) {
			if (pos.getY(v) < 0) {
				const k = 0.82 + shape() * 0.36;
				pos.setX(v, pos.getX(v) * k);
				pos.setZ(v, pos.getZ(v) * k);
				pos.setY(v, pos.getY(v) - shape() * 1.2);
			}
		}
		g.translate((shape() - 0.5) * 0.9, y + h / 2, (shape() - 0.5) * 0.9);
		g.computeVertexNormals();
		const tone = 0.72 + 0.4 * f;
		parts.push({ geo: g, tint: [tone * 0.96, tone, tone * 0.98] });
	}
	const tip = new THREE.ConeGeometry(0.5, 3.2, 6);
	tip.translate(0, 20.2, 0);
	parts.push({ geo: tip, tint: [1.15, 1.12, 1.05] });
	const geo = mergeTinted(parts);

	// Trees are placed by where they land on screen (fraction of the half-width at their depth),
	// so the banks frame the lower corners on any viewport and thin out toward the middle
	const rand = mulberry32(88);
	const spots = [];
	const tryPlace = (x, z, scale) => {
		for (const s of spots) if (Math.hypot(s.x - x, s.z - z) < 7.5 * scale) return;
		spots.push({ x, z, scale });
	};
	for (let i = 0; i < 2400 && spots.length < 300; i++) {
		const z = -230 - rand() * (-LAND_EDGE - 240);
		const depth = (-z - 230) / (-LAND_EDGE - 240); // 0 near, 1 at the crest
		const side = rand() < 0.5 ? -1 : 1;
		let sx = side * (0.48 + rand() * 0.7); // screen half-width fraction
		if (rand() < 0.1 && depth > 0.65) sx = (rand() - 0.5) * 0.8; // a few at the crest in the middle
		// Keep the middle open so downtown stays visible
		if (Math.abs(sx) < 0.48 && depth < 0.65) continue;
		if (rand() > 0.3 + 0.7 * Math.min(1, (Math.abs(sx) - 0.35) / 0.4)) continue;
		// Nearer trees are bigger and sparser
		const scale = (0.8 + rand() * 0.6) * (1.15 - 0.4 * depth);
		const x = sx * VIEW_HALF * -z;
		// Leave the Spheres' lawn open, and nothing nearer the camera in front of them
		if (Math.hypot(x - SPHERES.x, z - SPHERES.z) < 95) continue;
		if (z > SPHERES.z - 60 && sx < -0.58 && sx > -1.0) continue;
		tryPlace(x, z, scale);
	}

	const material = terrainMaterial({ fold: true });
	const mesh = new THREE.InstancedMesh(geo, material, spots.length);
	const m = new THREE.Matrix4();
	const q = new THREE.Quaternion();
	const up = new THREE.Vector3(0, 1, 0);
	const c = new THREE.Color();
	spots.forEach((s, i) => {
		const scale = s.scale;
		const width = 0.85 + rand() * 0.4;
		q.setFromAxisAngle(up, rand() * Math.PI * 2);
		m.compose(new THREE.Vector3(s.x, 0.4, s.z), q, new THREE.Vector3(scale * width, scale, scale * width));
		mesh.setMatrixAt(i, m);
		const tone = 0.8 + rand() * 0.4;
		c.setRGB(tone * (0.95 + rand() * 0.1), tone, tone * (0.95 + rand() * 0.1));
		mesh.setColorAt(i, c);
	});
	mesh.frustumCulled = false;
	return {
		mesh, material,
		setPalette(p) {
			const u = material.uniforms;
			u.uDark.value.set(p.treeDark);
			u.uLit.value.set(p.treeLit);
			u.uHaze.value.set(p.haze);
		},
	};
}

// ---------------------------------------------------------------------------
// Elliott Bay: dark water with drifting aurora reflections
function createWater() {
	const material = new THREE.ShaderMaterial({
		uniforms: { uWater: { value: color(0) }, uA: { value: color(0) }, uB: { value: color(0) }, uHaze: { value: color(0) }, uRefl: { value: 1 } },
		vertexShader: `
			varying vec3 vPos;
			varying float vDist;
			void main() {
				vec4 world = modelMatrix * vec4(position, 1.0);
				vPos = world.xyz;
				vec4 mv = viewMatrix * world;
				vDist = length(mv.xyz);
				gl_Position = projectionMatrix * mv;
			}
		`,
		fragmentShader: `
			uniform vec3 uWater, uA, uB;
			uniform float uTime, uRefl;
			varying vec3 vPos;
			varying float vDist;
			${NOISE_GLSL}
			${FOG_GLSL}
			void main() {
				float ripple = fbm(vec2(vPos.x * 0.02, vPos.z * 0.12 + uTime * 0.25));
				float streak = smoothstep(0.55, 0.85, ripple);
				vec3 refl = mix(uA, uB, fbm(vec2(vPos.x * 0.004 + uTime * 0.02, 1.0)));
				float far = smoothstep(200.0, 1100.0, vDist);
				vec3 col = uWater + refl * streak * 0.14 * far * uRefl;
				gl_FragColor = vec4(applyFog(col, vDist), 1.0);
				#include <colorspace_fragment>
			}
		`,
	});
	// Starts where the hill ends, so the bay sits behind the treeline
	const depth = 4100 + LAND_EDGE;
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9000, depth), material);
	mesh.rotation.x = -Math.PI / 2;
	mesh.position.set(0, 0, LAND_EDGE - depth / 2);
	return {
		mesh, material,
		setPalette(p) {
			const u = material.uniforms;
			u.uWater.value.set(p.water);
			u.uA.value.set(p.auroraA);
			u.uB.value.set(p.auroraB);
			u.uHaze.value.set(p.haze);
			u.uRefl.value = p.auroraMix ? 0.3 : 1;
		},
	};
}

// ---------------------------------------------------------------------------
// Distant Cascades with Mount Rainier, mostly lost in haze
function createRidge() {
	const pts = [];
	const rand = mulberry32(11);
	const width = 9000;
	const steps = 180;
	for (let i = 0; i <= steps; i++) {
		const x = -width / 2 + (i / steps) * width;
		let y = 60 + 70 * Math.sin(i * 0.21) * Math.sin(i * 0.053) + rand() * 25;
		const peak = Math.exp(-Math.pow((x + 900) / 380, 2)); // Rainier, left of downtown
		y = Math.max(y, 520 * peak);
		pts.push(x, Math.max(10, y));
	}
	const positions = [];
	for (let i = 0; i < steps; i++) {
		const [x0, y0, x1, y1] = [pts[i * 2], pts[i * 2 + 1], pts[i * 2 + 2], pts[i * 2 + 3]];
		positions.push(x0, 0, 0, x1, 0, 0, x1, y1, 0, x0, 0, 0, x1, y1, 0, x0, y0, 0);
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

	const material = new THREE.ShaderMaterial({
		uniforms: { uHaze: { value: color(0) }, uSnow: { value: color(0) }, uRock: { value: color(0) } },
		vertexShader: `
			varying float vY;
			void main() {
				vY = position.y;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: `
			uniform vec3 uHaze, uSnow, uRock;
			uniform float uDim, uTime;
			varying float vY;
			void main() {
				vec3 col = mix(uRock, uSnow, smoothstep(260.0, 420.0, vY));
				col = mix(uHaze, col, 0.35 * (1.0 - uDim * 0.6));
				gl_FragColor = vec4(col, 1.0);
				#include <colorspace_fragment>
			}
		`,
	});
	const mesh = new THREE.Mesh(geo, material);
	mesh.position.set(0, 0, -4200);
	mesh.frustumCulled = false;
	return {
		mesh, material,
		setPalette(p) {
			const u = material.uniforms;
			u.uHaze.value.set(p.haze);
			u.uRock.value.set(p.building);
			u.uSnow.value.set(p.auroraMix ? 0xffffff : 0x9fb3c8);
		},
	};
}

// ---------------------------------------------------------------------------
// Space Needle, modeled in meters after /images/space-needle.svg: broad steel blade legs
// that pinch near the core, slate core, 100-foot ring, and a layered top house (ribbed
// underside, two glass bands, halo disc, bell-shaped roof, drum, slim spire with a red tip).
// Parts are merged per material so the whole tower is about ten draw calls.
function createNeedle() {
	const group = new THREE.Group();
	const grainTexture = noiseTexture();
	const H = NEEDLE.height;

	// Painted steel: mostly matte, with a faint grain and real reflections from the env map
	const grain = (rx, ry) => {
		const t = grainTexture.clone();
		t.repeat.set(rx, ry);
		t.needsUpdate = true;
		return t;
	};
	const painted = (color, rx, ry, extra = {}) => new THREE.MeshStandardMaterial({
		color, bumpMap: grain(rx, ry), bumpScale: 0.12, roughnessMap: grain(rx, ry),
		metalness: 0.08, roughness: 0.55, envMapIntensity: 1.0, side: THREE.DoubleSide, ...extra,
	});
	const white = painted(0xf4f4f4, 6, 2);
	const slate = painted(0x5b6573, 4, 8, { metalness: 0.35, roughness: 0.5 });
	const glass = new THREE.MeshStandardMaterial({
		color: 0x3c4756, emissive: 0xffd9a0, emissiveIntensity: 1, emissiveMap: stripeTexture('#fff', '#2a3240', 96, 0.18),
		metalness: 0.2, roughness: 0.3, envMapIntensity: 1.6, side: THREE.DoubleSide,
	});
	const ribbed = new THREE.MeshStandardMaterial({
		map: stripeTexture('#f4f4f4', '#3d3a3a', 64, 0.55), bumpMap: grain(8, 1), bumpScale: 0.2, metalness: 0.05, roughness: 0.7, side: THREE.DoubleSide,
	});
	const haloMat = new THREE.MeshStandardMaterial({
		map: stripeTexture('#f4f4f4', '#c9ced6', 72, 0.06), bumpMap: grain(8, 1), bumpScale: 0.2, metalness: 0.08, roughness: 0.55, side: THREE.DoubleSide,
	});
	const ringWindows = new THREE.MeshStandardMaterial({
		color: 0x111111, emissive: 0xffd36b, emissiveIntensity: 1, emissiveMap: stripeTexture('#000', '#fff', 80, 0.45, true),
		roughness: 0.4, side: THREE.DoubleSide,
	});

	// Geometry is collected per material and merged into one mesh each
	const bins = new Map();
	const add = (geo, mat, matrix) => {
		if (!bins.has(mat)) bins.set(mat, []);
		bins.get(mat).push({ geo, matrix });
	};
	const lathe = (pts, mat) => add(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 64), mat);
	const strut = (a, b, radius, mat) => {
		const geo = new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 6);
		const m = new THREE.Matrix4();
		const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
		m.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
		add(geo, mat, m);
	};

	// Core
	const core = new THREE.CylinderGeometry(NEEDLE.coreRadius, NEEDLE.coreRadius * 1.15, 147, 24);
	core.translate(0, 73.5, 0);
	add(core, slate);

	// Three legs: each a pair of flat steel blades (wide at the base, slim at the pinch) joined by
	// rungs, pinching toward the core about 60% up and flaring back out under the saucer
	const profile = [[15.5, 0], [13.4, 29], [10.5, 54], [7.5, 80], [5.3, 100], [4.7, 112], [5.4, 125], [7.6, 137], [10.4, 147.4]];
	const leg = (k, side) => new THREE.CatmullRomCurve3(profile.map(([r, y], i) => {
		const a = (k / 3) * Math.PI * 2 + Math.PI / 2 + 0.45 + THREE.MathUtils.degToRad(4.2 - i * 0.25) * side;
		return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
	}));
	const bladeWidth = (t) => 3.4 - 2.0 * Math.sin(Math.min(1, t / 0.7) * Math.PI / 2) + 0.9 * Math.max(0, (t - 0.7) / 0.3);
	for (let k = 0; k < 3; k++) {
		const left = leg(k, -1);
		const right = leg(k, 1);
		for (const curve of [left, right]) add(sweepBlade(curve, bladeWidth, 0.55, 44), white);
		for (let t = 0.08; t < 0.94; t += 0.045) {
			const a = left.getPoint(t);
			const b = right.getPoint(t);
			const geo = new THREE.BoxGeometry(0.4, 0.5, a.distanceTo(b));
			const m = new THREE.Matrix4();
			const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.clone().sub(a).normalize());
			m.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
			add(geo, white, m);
		}
		// Struts tying each leg back to the core
		for (const i of [2, 3]) {
			const t = i / (profile.length - 1);
			const mid = left.getPoint(t).add(right.getPoint(t)).multiplyScalar(0.5);
			const inner = new THREE.Vector3(mid.x, 0, mid.z).setLength(NEEDLE.coreRadius).setY(mid.y);
			strut(mid, inner, 0.35, white);
		}
	}

	// 100-foot level ring with a band of lit windows
	lathe([[NEEDLE.coreRadius, 26.2], [13.2, 26.2], [15.9, 27.4], [15.9, 28.2]], white);
	lathe([[15.9, 28.2], [15.9, 30.2]], ringWindows);
	lathe([[15.9, 30.2], [15.9, 30.8], [13.6, 31.6], [NEEDLE.coreRadius, 31.6]], white);

	// Top house, bottom to top
	lathe([[0.1, 146.6], [6, 146.8], [10.5, 147.6], [14.5, 149.2], [16.9, 150.6]], ribbed); // ribbed underside
	lathe([[16.9, 150.6], [17.1, 151.4], [14.8, 151.8]], white);
	lathe([[14.8, 151.8], [14.9, 155.2]], glass); // restaurant level
	lathe([[14.9, 155.2], [20.2, 156.1], [20.2, 156.4], [16.8, 157.6]], haloMat); // halo disc
	lathe([[16.8, 157.6], [16.8, 161.4]], glass); // observation level
	const bell = [];
	for (let i = 0; i <= 12; i++) bell.push([5.6 + 11.2 * Math.pow(1 - i / 12, 2.2), 161.4 + (i / 12) * 5]);
	lathe([...bell, [7.8, 167.2], [7.8, 167.7], [5.9, 167.9]], white); // bell-shaped roof
	lathe([[5.9, 167.9], [5.9, 170]], slate); // drum
	lathe([[5.9, 170], [2, 170.4], [1.8, 172.6], [0.1, 172.8]], slate); // spire base

	// Spire: three slim rods meeting at the tip
	const tip = new THREE.Vector3(0, H - 0.6, 0);
	for (let k = 0; k < 3; k++) {
		const a = (k / 3) * Math.PI * 2;
		strut(new THREE.Vector3(Math.cos(a) * 1.4, 172.6, Math.sin(a) * 1.4), tip, 0.22, slate);
	}

	for (const [mat, parts] of bins) group.add(new THREE.Mesh(mergeTinted(parts), mat));

	// Lighting: key from the front-left, cool rim from behind, sky fill, base uplights, soft
	// underglow on the saucer. The env map supplies the reflections.
	const hemi = new THREE.HemisphereLight(0x2a6a8f, 0x05070d, 0.55);
	group.add(hemi);
	const key = new THREE.DirectionalLight(0xdfe8ff, 1.8);
	key.position.set(-180, 240, 320);
	group.add(key);
	const rim = new THREE.DirectionalLight(0x2fd3a0, 0.9);
	rim.position.set(160, 120, -260);
	group.add(rim);
	const uplights = [0, 1, 2].map((k) => {
		const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
		const light = new THREE.PointLight(0xdfe9ff, 90, 0, 1);
		light.position.set(Math.cos(a) * 22, 3, Math.sin(a) * 22);
		group.add(light);
		return light;
	});
	const underglow = new THREE.PointLight(0x00baff, 25, 0, 1);
	underglow.position.set(0, 138, 0);
	group.add(underglow);

	// Glows (additive sprites) for the deck and the red tip
	const tex = glowTexture();
	const sprite = (c, scale, y) => {
		const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
		s.scale.setScalar(scale);
		s.position.y = y;
		group.add(s);
		return s;
	};
	const deckGlow = sprite(0xffd9a0, 60, 156);
	const beacon = sprite(0xff3b3b, 10, H);

	// Elevator car and its rails on the face of the core (the pivot turns them toward the camera)
	const carPivot = new THREE.Group();
	group.add(carPivot);
	const rails = mergeTinted([-1.7, 1.7].map((x) => {
		const geo = new THREE.BoxGeometry(0.3, 146, 0.3);
		return { geo, matrix: new THREE.Matrix4().setPosition(x, 73, NEEDLE.coreRadius + 0.15) };
	}));
	carPivot.add(new THREE.Mesh(rails, slate));
	const carMat = new THREE.MeshStandardMaterial({ color: 0xd99a5b, emissive: 0xffcf7a, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.45 });
	const car = new THREE.Mesh(new THREE.BoxGeometry(3, 3.8, 1.8), carMat);
	car.position.z = NEEDLE.coreRadius + 1;
	carPivot.add(car);
	const carLight = new THREE.PointLight(0xffcf7a, 25, 40, 1);
	carLight.position.z = NEEDLE.coreRadius + 3;
	carPivot.add(carLight);
	const carGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffcf7a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
	carGlow.scale.setScalar(18);
	carGlow.position.z = NEEDLE.coreRadius + 1.3;
	carPivot.add(carGlow);

	let p = PALETTES.dark;
	return {
		group, carPivot,
		setPalette(palette) {
			p = palette;
			white.color.set(p.needle);
			white.emissive.set(p.needleEmissive);
			white.emissiveIntensity = 0.3;
			slate.emissive.set(p.needleEmissive);
			slate.emissiveIntensity = 0.3;
			glass.emissive.set(p.deck);
			glass.emissiveIntensity = p.deckStrength;
			ringWindows.emissiveIntensity = p.deckStrength;
			hemi.color.set(p.hemiSky);
			hemi.groundColor.set(p.hemiGround);
			hemi.intensity = p.hemiIntensity;
			key.color.set(p.key);
			key.intensity = p.keyIntensity;
			rim.color.set(p.rim);
			uplights.forEach((l) => { l.color.set(p.uplight); l.intensity = p.uplightIntensity; });
			underglow.color.set(p.underglow);
			underglow.intensity = 25 * p.glow;
			carMat.emissive.set(p.car);
			carLight.color.set(p.car);
			carGlow.material.color.set(p.car);
			deckGlow.material.color.set(p.deck);
		},
		update(t, carT, dim) {
			const y = NEEDLE.carLow + (NEEDLE.carHigh - NEEDLE.carLow) * carT;
			car.position.y = y;
			carLight.position.y = y;
			carGlow.position.y = y;
			const breathe = 0.85 + 0.15 * Math.sin(t * 0.7);
			deckGlow.material.opacity = 0.2 * p.glow * breathe;
			beacon.material.opacity = 0.4 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(t * 0.9), 3);
			carGlow.material.opacity = 0.6 * p.glow + 0.2;
			// Uplights ease off a little once the reader is past the hero
			uplights.forEach((l) => { l.intensity = p.uplightIntensity * (1 - dim * 0.3); });
		},
	};
}

// Sweep a flat rectangular section along a curve: the blade's broad face lies in the plane of
// the tower's radius and the leg direction, its thin edge points around the tower.
function sweepBlade(curve, widthAt, thick, segs) {
	const rings = [];
	const T = new THREE.Vector3();
	const radial = new THREE.Vector3();
	const B = new THREE.Vector3();
	const N = new THREE.Vector3();
	for (let i = 0; i <= segs; i++) {
		const t = i / segs;
		const p = curve.getPoint(t);
		curve.getTangent(t, T).normalize();
		radial.set(p.x, 0, p.z).normalize();
		B.crossVectors(T, radial).normalize();
		N.crossVectors(B, T).normalize();
		const w = widthAt(t) / 2;
		const h = thick / 2;
		rings.push([
			p.clone().addScaledVector(N, w).addScaledVector(B, h),
			p.clone().addScaledVector(N, w).addScaledVector(B, -h),
			p.clone().addScaledVector(N, -w).addScaledVector(B, -h),
			p.clone().addScaledVector(N, -w).addScaledVector(B, h),
		]);
	}
	const pos = [];
	const quad = (a, b, c, d) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
	for (let i = 0; i < segs; i++) {
		const r0 = rings[i];
		const r1 = rings[i + 1];
		for (let k = 0; k < 4; k++) quad(r0[k], r0[(k + 1) % 4], r1[(k + 1) % 4], r1[k]);
	}
	quad(rings[0][3], rings[0][2], rings[0][1], rings[0][0]);
	const last = rings[segs];
	quad(last[0], last[1], last[2], last[3]);
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	geo.computeVertexNormals();
	return geo;
}

// Tiny equirectangular sky for the needle's reflections: gradient sky over ground with one
// bright highlight. Run through PMREM once per palette change.
function envTexture(p) {
	const w = 128;
	const h = 64;
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const g = c.getContext('2d');
	const hex = (v) => '#' + new THREE.Color(v).getHexString();
	const grad = g.createLinearGradient(0, 0, 0, h);
	grad.addColorStop(0, hex(p.envSky));
	grad.addColorStop(0.48, hex(p.envHorizon));
	grad.addColorStop(0.53, hex(p.envGround));
	grad.addColorStop(1, hex(p.envGround));
	g.fillStyle = grad;
	g.fillRect(0, 0, w, h);
	// Key light highlight, upper left, toward the viewer
	const sun = g.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, w * 0.12);
	sun.addColorStop(0, hex(p.envSun));
	sun.addColorStop(0.4, hex(p.envSun) + 'aa');
	sun.addColorStop(1, hex(p.envSun) + '00');
	g.fillStyle = sun;
	g.fillRect(0, 0, w, h);
	const tex = new THREE.CanvasTexture(c);
	tex.mapping = THREE.EquirectangularReflectionMapping;
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

// ---------------------------------------------------------------------------
// Small canvas textures
function glowTexture() {
	const size = 64;
	const c = document.createElement('canvas');
	c.width = c.height = size;
	const g = c.getContext('2d');
	const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	grad.addColorStop(0, 'rgba(255,255,255,1)');
	grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
	grad.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, size, size);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

// Mottled grain with faint vertical weathering streaks, for color, bump and roughness maps
function noiseTexture() {
	const size = 256;
	const c = document.createElement('canvas');
	c.width = c.height = size;
	const g = c.getContext('2d');
	const img = g.createImageData(size, size);
	const rand = mulberry32(7);
	const streaks = Array.from({ length: size }, () => rand());
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const v = 205 + rand() * 40 - streaks[x] * 22 - (rand() < 0.015 ? 40 : 0);
			const i = (y * size + x) * 4;
			img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v));
			img.data[i + 3] = 255;
		}
	}
	g.putImageData(img, 0, 0);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	tex.anisotropy = 4;
	return tex;
}

// Repeating vertical stripes around a lathe (glass mullions, underside ribs, ring windows).
// With `windows`, stripes become short panes centered in the band instead of full-height lines.
function stripeTexture(base, stripe, count, width, windows = false) {
	const w = 1024;
	const h = 32;
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const g = c.getContext('2d');
	g.fillStyle = base;
	g.fillRect(0, 0, w, h);
	g.fillStyle = stripe;
	const step = w / count;
	for (let i = 0; i < count; i++) {
		const x = i * step + (step * (1 - width)) / 2;
		if (windows) g.fillRect(x, h * 0.25, step * width, h * 0.5);
		else g.fillRect(x, 0, step * width, h);
	}
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.wrapS = THREE.RepeatWrapping;
	tex.anisotropy = 4;
	return tex;
}

function mulberry32(seed) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const sceneCanvas = document.getElementById('skyline-3d');
if (sceneCanvas) init(sceneCanvas);
