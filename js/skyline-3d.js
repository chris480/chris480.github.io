// Home page backdrop: aurora sky, Seattle skyline, and a lit Space Needle whose
// elevator car rides the core as the hero scrolls (top of hero = top of tower).
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
		needle: 0xf4f6f9, needleEmissive: 0x2b3442, deck: 0xffe6bd, deckStrength: 0.45,
		uplight: 0xffffff, uplightIntensity: 30, underglow: 0x0077b6,
		car: 0xffb84d, hemiSky: 0xe6eef8, hemiGround: 0x9aa6b8, hemiIntensity: 1.6,
		glow: 0.45,
	},
};

const NEEDLE = { height: 184, carLow: 6, carHigh: 143, coreRadius: 3.2 };
const EYE_HEIGHT = 16;
const HORIZON_SHIFT = 0.6; // lens shift: horizon sits 20% up from the bottom of the screen

function init(canvas) {
	let renderer;
	try {
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
	} catch (e) {
		return; // CSS aurora fallback stays visible
	}
	renderer.autoClear = false;
	renderer.outputColorSpace = THREE.SRGBColorSpace;

	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

	const camera = new THREE.PerspectiveCamera(40, 1, 1, 6000);
	camera.position.set(0, EYE_HEIGHT, 0);

	const scene = new THREE.Scene();
	const sky = createSky();
	const city = createCity();
	const needle = createNeedle();
	const water = createWater();
	const ridge = createRidge();
	scene.add(city.group, water.mesh, ridge.mesh);

	// The needle gets its own orthographic pass so it reads as a straight-on elevation
	// (level saucer, no underside showing), like /images/space-needle.svg
	const needleScene = new THREE.Scene();
	needleScene.add(needle.group);
	const needleCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
	needleCamera.position.set(0, 0, 1000);

	const shared = { time: { value: 0 }, dim: { value: 0 } };
	for (const m of [sky.material, city.material, water.material, ridge.material]) {
		m.uniforms.uTime = shared.time;
		m.uniforms.uDim = shared.dim;
	}

	let palette;
	function applyPalette() {
		palette = darkQuery.matches ? PALETTES.dark : PALETTES.light;
		sky.setPalette(palette);
		city.setPalette(palette);
		needle.setPalette(palette);
		water.setPalette(palette);
		ridge.setPalette(palette);
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
		needleCamera.left = -viewW / 2;
		needleCamera.right = viewW / 2;
		needleCamera.bottom = bottom;
		needleCamera.top = bottom + viewH;
		needleCamera.updateProjectionMatrix();
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
		carTarget = 1 - p;
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
		const animate = !reduceMotion.matches;
		if (animate) shared.time.value += dt;

		const ease = animate ? 1 - Math.exp(-dt * 4) : 1;
		carPos += (carTarget - carPos) * ease;
		shared.dim.value += (dimTarget - shared.dim.value) * ease;
		needle.update(shared.time.value, carPos, shared.dim.value);
		city.update(shared.time.value);

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
		running = heroVisible && !reduceMotion.matches;
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
	reduceMotion.addEventListener('change', start);
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

const color = (hex) => new THREE.Color(hex);

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
// Downtown Seattle: instanced towers with procedural lit windows
function createCity() {
	const rand = mulberry32(206);
	const boxes = [];
	const add = (x, z, w, d, h) => boxes.push({ x, z, w, d, h });

	// Landmark-ish massing (heights are compressed so the skyline sits low)
	add(-150, -1090, 54, 54, 150); // Columbia Center stack
	add(-150, -1090, 42, 42, 180);
	add(-150, -1090, 30, 30, 205);
	add(-60, -1040, 40, 40, 165); // crowned tower (cap added below)
	add(-245, -1010, 36, 44, 150);
	add(30, -1120, 38, 38, 140);
	add(-330, -1150, 34, 34, 125);

	for (let z = -1250; z <= -900; z += 58) {
		for (let x = -720; x <= 340; x += 50) {
			if (rand() < 0.18) continue;
			const px = x + (rand() - 0.5) * 18;
			const pz = z + (rand() - 0.5) * 16;
			const core = Math.exp(-Math.pow((px + 140) / 260, 2));
			const nearWater = (pz + 900) / -350; // 0 at waterfront, 1 at back
			const h = 18 + 150 * core * (0.3 + 0.7 * rand()) * (0.55 + 0.45 * nearWater) + rand() * 25;
			add(px, pz, 22 + rand() * 24, 22 + rand() * 24, h);
		}
	}

	const material = new THREE.ShaderMaterial({
		uniforms: {
			uBase: { value: color(0) }, uTop: { value: color(0) }, uRim: { value: color(0) },
			uWarm: { value: color(0) }, uCool: { value: color(0) }, uWin: { value: 1 },
			uHaze: { value: color(0) },
		},
		vertexShader: `
			varying vec3 vPos;
			varying vec3 vNormal;
			varying float vDist;
			void main() {
				mat4 m = modelMatrix;
				#ifdef USE_INSTANCING
					m = modelMatrix * instanceMatrix;
				#endif
				vec4 world = m * vec4(position, 1.0);
				vPos = world.xyz;
				vNormal = normalize(mat3(m) * normal);
				vec4 mv = viewMatrix * world;
				vDist = length(mv.xyz);
				gl_Position = projectionMatrix * mv;
			}
		`,
		fragmentShader: `
			uniform vec3 uBase, uTop, uRim, uWarm, uCool;
			uniform float uWin, uTime;
			varying vec3 vPos;
			varying vec3 vNormal;
			varying float vDist;
			${NOISE_GLSL}
			${FOG_GLSL}
			void main() {
				vec3 n = normalize(vNormal);
				float heightT = clamp(vPos.y / 220.0, 0.0, 1.0);
				vec3 col = uBase * (0.75 + 0.5 * heightT);

				if (n.y > 0.5) {
					col = uTop;
				} else {
					float along = abs(n.x) > 0.5 ? vPos.z : vPos.x;
					vec2 cell = vec2(along / 3.6, vPos.y / 4.2);
					vec2 id = floor(cell);
					vec2 f = fract(cell);
					float pane = step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.8);
					vec2 seed = id + floor(vec2(vPos.x + vPos.z * 1.3, vPos.z - vPos.x) / 9.0) * 0.37;
					float r = hash12(seed);
					float lit = step(0.8, r);
					// A handful of windows switch on and off very slowly
					lit *= step(0.12, fract(r * 47.0 + uTime * 0.004 * step(0.96, r)));
					vec3 wc = mix(uWarm, uCool, step(0.82, hash12(seed * 1.7)));
					col += pane * lit * wc * (0.25 + 0.5 * hash12(seed * 3.1)) * uWin * smoothstep(3.0, 8.0, vPos.y);
					// Side facing the camera catches a little aurora light near the top
					col += uRim * 0.07 * smoothstep(60.0, 220.0, vPos.y);
				}
				// Ground haze
				col = mix(col, uHaze, (1.0 - smoothstep(0.0, 70.0, vPos.y)) * 0.35);
				gl_FragColor = vec4(applyFog(col, vDist), 1.0);
				#include <colorspace_fragment>
			}
		`,
	});

	const group = new THREE.Group();
	const boxGeo = new THREE.BoxGeometry(1, 1, 1);
	boxGeo.translate(0, 0.5, 0);
	const towers = new THREE.InstancedMesh(boxGeo, material, boxes.length);
	const m = new THREE.Matrix4();
	boxes.forEach((b, i) => {
		m.makeScale(b.w, b.h, b.d).setPosition(b.x, 0, b.z);
		towers.setMatrixAt(i, m);
	});
	towers.frustumCulled = false;
	group.add(towers);

	const crown = new THREE.Mesh(new THREE.ConeGeometry(20, 28, 4, 1), material);
	crown.rotation.y = Math.PI / 4;
	crown.position.set(-60, 165 + 14, -1040);
	group.add(crown);

	// Red aviation beacons on the tallest roofs
	const beaconTex = glowTexture();
	const beacons = boxes
		.slice()
		.sort((a, b) => b.h - a.h)
		.slice(0, 6)
		.map((b, i) => {
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
		update(t) {
			beacons.forEach((b) => {
				const blink = Math.pow(0.5 + 0.5 * Math.sin(t * 1.6 + b.userData.phase), 6);
				b.material.opacity = (0.15 + 0.85 * blink) * b.userData.max;
			});
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
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9000, 4200), material);
	mesh.rotation.x = -Math.PI / 2;
	mesh.position.set(0, 0, -2000);
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
// Space Needle, modeled in meters after /images/space-needle.svg: white blade legs that
// pinch near the core, slate core, 100-foot ring, and a layered top house (ribbed underside,
// two glass bands, halo disc, bell-shaped roof, drum, and a slim spire with a red tip)
function createNeedle() {
	const group = new THREE.Group();
	const grainTexture = noiseTexture();
	const H = NEEDLE.height;

	// Matte painted steel with a weathered grain, so it doesn't read as chrome
	const grain = (rx, ry) => {
		const t = grainTexture.clone();
		t.repeat.set(rx, ry);
		t.needsUpdate = true;
		return t;
	};
	const painted = (color, rx, ry, extra = {}) => new THREE.MeshStandardMaterial({
		color, map: grain(rx, ry), bumpMap: grain(rx, ry), bumpScale: 1.2, roughnessMap: grain(rx, ry),
		metalness: 0, roughness: 0.92, side: THREE.DoubleSide, ...extra,
	});
	const white = painted(0xf4f4f4, 6, 2);
	const legMat = painted(0xf4f4f4, 1, 24); // tubes: u runs along the leg, v around it
	const slate = painted(0x657180, 4, 8);
	const glass = new THREE.MeshStandardMaterial({
		color: 0x3c4756, emissive: 0xffd9a0, emissiveIntensity: 1, emissiveMap: stripeTexture('#fff', '#2a3240', 96, 0.18),
		bumpMap: grain(8, 1), bumpScale: 0.4, metalness: 0.05, roughness: 0.6, side: THREE.DoubleSide,
	});
	const ribbed = new THREE.MeshStandardMaterial({
		map: stripeTexture('#f4f4f4', '#3d3a3a', 64, 0.55), bumpMap: grain(8, 1), bumpScale: 1.2, metalness: 0, roughness: 0.9, side: THREE.DoubleSide,
	});
	const haloMat = new THREE.MeshStandardMaterial({
		map: stripeTexture('#f4f4f4', '#c9ced6', 72, 0.06), bumpMap: grain(8, 1), bumpScale: 1.2, metalness: 0, roughness: 0.9, side: THREE.DoubleSide,
	});
	const ringWindows = new THREE.MeshStandardMaterial({
		color: 0x111111, emissive: 0xffd36b, emissiveIntensity: 1, emissiveMap: stripeTexture('#000', '#fff', 80, 0.45, true),
		roughness: 0.4, side: THREE.DoubleSide,
	});
	const lathe = (pts, mat) => {
		const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 96), mat);
		group.add(mesh);
		return mesh;
	};
	const strut = (a, b, radius, mat) => {
		const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 6), mat);
		mesh.position.copy(a).add(b).multiplyScalar(0.5);
		mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
		group.add(mesh);
		return mesh;
	};

	// Core
	const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(NEEDLE.coreRadius, NEEDLE.coreRadius * 1.15, 147, 24), slate);
	coreMesh.position.y = 73.5;
	group.add(coreMesh);

	// Three legs: each a pair of white blades joined by rungs, pinching near the core about 60% up
	const profile = [[15.5, 0], [13.4, 29], [10.5, 54], [7.5, 80], [5.3, 100], [4.7, 112], [5.4, 125], [7.6, 137], [10.4, 147.4]];
	const leg = (k, side) => new THREE.CatmullRomCurve3(profile.map(([r, y], i) => {
		const a = (k / 3) * Math.PI * 2 + Math.PI / 2 + 0.45 + THREE.MathUtils.degToRad(4.2 - i * 0.25) * side;
		return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
	}));
	for (let k = 0; k < 3; k++) {
		const left = leg(k, -1);
		const right = leg(k, 1);
		for (const curve of [left, right]) group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.95, 8, false), legMat));
		for (let t = 0.1; t < 0.92; t += 0.045) strut(left.getPoint(t), right.getPoint(t), 0.22, white);
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

	// Gentle lighting: base uplights, soft underglow on the saucer, fill from the sky
	const hemi = new THREE.HemisphereLight(0x2a6a8f, 0x05070d, 0.55);
	group.add(hemi);
	const moon = new THREE.DirectionalLight(0xdfe8ff, 1.8);
	moon.position.set(-150, 220, 400);
	group.add(moon);
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
	for (const x of [-1.7, 1.7]) {
		const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 146, 0.3), slate);
		rail.position.set(x, 73, NEEDLE.coreRadius + 0.15);
		carPivot.add(rail);
	}
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
			for (const m of [white, legMat]) {
				m.color.set(p.needle);
				m.emissive.set(p.needleEmissive);
			}
			slate.emissive.set(p.needleEmissive);
			glass.emissive.set(p.deck);
			glass.emissiveIntensity = p.deckStrength;
			ringWindows.emissiveIntensity = p.deckStrength;
			hemi.color.set(p.hemiSky);
			hemi.groundColor.set(p.hemiGround);
			hemi.intensity = p.hemiIntensity;
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
