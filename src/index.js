import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import { GUI } from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let scene;
let camera;
let renderer;
let camControls;
let flyControls;
let activeControls;

let Stars = [];
let m1 = 20;
let m2 = 15;

let Planets = [];
let Moons = [];
let Belt;

let t0 = 0;
let accglobal = 0.0005;
let timestamp;
let barycenter = new THREE.Vector3(1, 0, 1);

let shadow = true;

const clock = new THREE.Clock();
let paused = false;
let usingFly = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float time;
uniform vec3 starColor;
varying vec2 vUv;

float noise(vec2 p){
  return sin(p.x)*sin(p.y);
}

void main() {
  float n = noise(vUv * 20.0 + time * 0.5);
  vec3 baseColor = starColor;
  vec3 hotter = baseColor + vec3(0.2, 0.1, 0.0); // más cálido
  vec3 color = mix(baseColor, hotter, n);
  gl_FragColor = vec4(color, 1.0);
}
`;

const uniforms = { time: { value: 0 } };

init();
animationLoop();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 100);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //Se activan las sombras
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // por defecto THREE.PCFShadowMap
  }

  // Controls
  camControls = new OrbitControls(camera, renderer.domElement);

  flyControls = new FlyControls(camera, renderer.domElement);
  flyControls.dragToLook = true;
  flyControls.movementSpeed = 25;
  flyControls.rollSpeed = 1;

  activeControls = camControls;

  const gui = new GUI({ width: 260 });
  const guiControls = {
    controlMode: "OrbitControls",
    toggleControls: toggleControls,
    paused: paused,
    usingFly: usingFly,
  };

  gui.title("Stellar Simultaion");
  gui.add(guiControls, "controlMode").name("Modo cámara").listen();
  gui.add(guiControls);
  gui
    .add(guiControls, "usingFly")
    .name("Change Controls")
    .onChange((value) => {
      usingFly = value;
      if (usingFly) {
        camControls.enabled = false;
        flyControls.enabled = true;
        activeControls = flyControls;
        guiControls.controlMode = "FlyControls";
      } else {
        flyControls.enabled = false;
        camControls.enabled = true;
        activeControls = camControls;
        guiControls.controlMode = "camControls";
      }
    });
  gui
    .add(guiControls, "paused")
    .name("Pause/Resume")
    .onChange((value) => {
      paused = value;
    });

  const sky = createSkySphere("src/milkyway.png");

  const totalDist = 100;
  const totalMass = m1 + m2;
  const dist1 = totalDist * (m1 / totalMass);
  const dist2 = totalDist * (m2 / totalMass);

  Star(
    10,
    dist1,
    1.0,
    0xffbf00,
    1.2,
    1.0,
    2,
    dist1 * -1,
    0,
    0,
    "src/Betelguese.png",
    "Betelguese"
  );
  Star(
    6,
    dist2,
    2.0,
    0xcad7ff,
    1.2,
    1.0,
    2,
    dist2,
    0,
    Math.PI,
    "src/white-dwarf.png",
    "White dwarf"
  );
  Planet(
    2.5,
    32.0,
    1.0,
    0xcad7ff,
    1.0,
    1.5,
    20,
    Stars[0],
    "src/coruscant.png",
    "Coruscant"
  );
  Moon(
    Planets[0],
    0.35,
    10.0,
    -3.5,
    0xffff00,
    0.6,
    1.0,
    0.0,
    "src/deathstar.png",
    "Death Star I"
  );
  Moon(
    Planets[0],
    0.65,
    14.0,
    1.0,
    0x0000ff,
    1.0,
    1.4,
    -10.0,
    "src/dathomir.png",
    "Dathomir"
  );
  Planet(
    2.0,
    26.0,
    2.0,
    0x00fff0,
    1.5,
    1.8,
    -45,
    Stars[1],
    "src/planet2.png",
    "Aureon"
  );
  Planet(
    0.5,
    5.0,
    5.0,
    0xffcf00,
    1.5,
    2.0,
    -45,
    Stars[1],
    "src/planet1.png",
    "Neryth"
  );
  Moon(
    Planets[1],
    0.3,
    3.2,
    2.6,
    0xf000ff,
    1.2,
    0.8,
    20.0,
    "src/mustafar.png",
    "Mustafar"
  );
  Planet(
    1.2,
    6.0,
    0.4,
    0xff0f00,
    2.5,
    3.0,
    -50,
    Stars[0],
    "src/planet3.png",
    "Volcaris"
  );
  Planet(
    5.0,
    40.0,
    0.2,
    0xffa0ff,
    4.5,
    4.0,
    90,
    null,
    "src/alderaan.png",
    "Alderaan"
  );
  Planet(
    8.0,
    50.0,
    0.2,
    0x0faaff,
    5.0,
    3.0,
    -30,
    null,
    "src/planet4.png",
    "Thalmyra"
  );
  Moon(
    Planets[4],
    1.5,
    9.6,
    2.6,
    0xf0f00f,
    1.6,
    1.8,
    20.0,
    "src/moon1.png",
    "Selunara"
  );
  Moon(
    Planets[5],
    0.7,
    10.0,
    2.6,
    0xff00ff,
    2.2,
    2.8,
    60.0,
    "src/exegol.png",
    "Exegol"
  );

  const ambientLight = new THREE.AmbientLight(0x404040, 2.0);
  scene.add(ambientLight);

  document.addEventListener("mousedown", onDocumentMouseDown);

  Belt = createAsteroidBelt(Planets[5], 10, 14, 500);
}

function onDocumentMouseDown(event) {
  //Conversión coordenadas del puntero
  const mouse = {
    x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
  };

  raycaster.setFromCamera(mouse, camera);

  // Objetos que queremos que puedan seleccionarse
  const selectableObjects = [...Stars, ...Planets, ...Moons];

  // Calcular intersecciones
  const intersects = raycaster.intersectObjects(selectableObjects);

  // Si se detecta un objeto
  if (intersects.length > 0) {
    const selectedObject = intersects[0].object;
    showInfoGUI(selectedObject);
  }
}

function createInfoGUI() {
  let gui = document.getElementById("celestialInfoGUI");
  if (gui) return gui;

  gui = document.createElement("div");
  gui.id = "celestialInfoGUI";
  gui.style.position = "fixed";
  gui.style.top = "20px";
  gui.style.right = "20px";
  gui.style.background = "rgba(25,25,25,0.95)";
  gui.style.border = "1px solid rgba(255,255,255,0.15)";
  gui.style.borderRadius = "6px";
  gui.style.fontFamily = "monospace";
  gui.style.fontSize = "13px";
  gui.style.color = "#fff";
  gui.style.zIndex = "9999";
  gui.style.width = "240px";
  gui.style.maxHeight = "400px";
  gui.style.overflow = "hidden";
  gui.style.boxShadow = "0 2px 12px rgba(0,0,0,0.4)";
  gui.style.transition = "max-height 0.3s ease-in-out";

  const header = document.createElement("div");
  header.id = "guiHeader";
  header.style.padding = "8px 12px";
  header.style.cursor = "pointer";
  header.style.background = "rgba(255,255,255,0.05)";
  header.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
  header.innerText = "Cuerpo celeste";

  const content = document.createElement("div");
  content.id = "guiContent";
  content.style.padding = "10px 12px";
  content.style.display = "none";

  const closeBtn = document.createElement("div");
  closeBtn.innerText = "✕";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "5px";
  closeBtn.style.right = "8px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.color = "#aaa";
  closeBtn.onclick = () => (gui.style.display = "none");

  header.onclick = () => {
    if (content.style.display === "none") {
      content.style.display = "block";
      gui.style.maxHeight = "400px";
    } else {
      content.style.display = "none";
      gui.style.maxHeight = "32px";
    }
  };

  gui.appendChild(header);
  gui.appendChild(content);
  gui.appendChild(closeBtn);
  document.body.appendChild(gui);

  return gui;
}

// === Muestra info dentro del panel GUI ===
function showInfoGUI(object) {
  const gui = createInfoGUI();
  gui.style.display = "block";

  const header = gui.querySelector("#guiHeader");
  const content = gui.querySelector("#guiContent");

  const data = object.userData || {};
  const name = data.name || "Cuerpo celeste";

  const distStr = typeof data.dist === "number" ? data.dist.toFixed(2) : "?";
  const speedStr = typeof data.speed === "number" ? data.speed.toFixed(3) : "?";
  const inclDeg =
    typeof data.inclination === "number"
      ? (data.inclination * 180) / Math.PI
      : null;
  const inclStr = inclDeg !== null ? inclDeg.toFixed(1) + "°" : "0";

  let colorHTML = "—";
  try {
    if (object.material && object.material.color) {
      const colorHex = "#" + object.material.color.getHexString();
      colorHTML = `<span style="display:inline-block;width:12px;height:12px;background:${colorHex};border-radius:50%;margin-right:6px;vertical-align:middle;"></span>${colorHex}`;
    }
  } catch (e) {}

  header.innerText = name;
  content.innerHTML = `
    <p><b>Distancia:</b> ${distStr}</p>
    <p><b>Velocidad:</b> ${speedStr}</p>
    <p><b>Inclinación:</b> ${inclStr}</p>
    <p><b>Color:</b> ${colorHTML}</p>
  `;
  content.style.display = "block";
  gui.style.maxHeight = "400px";
}

function Star(
  radius,
  dist,
  speed,
  color,
  f1,
  f2,
  rotation,
  centerX = 0,
  centerZ = 0,
  phase,
  texturePath = undefined,
  name
) {
  let loader = new THREE.TextureLoader();
  let texture = loader.load(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;

  const col = new THREE.Color(color);

  let geometry = new THREE.SphereGeometry(radius, 30, 30);
  let material = new THREE.ShaderMaterial({
    map: texture,
    bumpMap: texture,
    specularMap: texture,
    color: color,
    emissive: new THREE.Color(0xffcc66),
    emissiveIntensity: 5,
    emissiveMap: texture,
    uniforms: {
      time: { value: 0 },
      starColor: { value: new THREE.Vector3(col.r, col.g, col.b) }, // <- aquí lo pasas al shader
    },
    vertexShader,
    fragmentShader,
  });
  let star = new THREE.Mesh(geometry, material);
  let Lpunt = new THREE.PointLight(color, 1000000, 0, 2);
  Lpunt.position.set(centerX, 0, centerZ);
  star.add(Lpunt);

  star.userData = {
    dist,
    speed,
    f1,
    f2,
    centerX,
    centerZ,
    phase,
    Lpunt,
    texture,
    uniforms,
    name,
  };

  if (shadow) {
    star.castShadow = true;
    Lpunt.castShadow = true;
    Lpunt.shadow.mapSize.width = 2048;
    Lpunt.shadow.mapSize.height = 2048;
    Lpunt.shadow.bias = -0.001;
  }

  Stars.push(star);
  scene.add(star);

  addGlow(star, color, radius * 4);
  drawStarOrbit(dist, f1, f2, rotation, centerX, centerZ);
}

function addGlow(star, color = 0xffcc00, size = 25) {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: createGlowTexture(),
    color: color,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });

  const glow = new THREE.Sprite(spriteMaterial);
  glow.scale.set(size, size, 1.0);
  star.add(glow);
}

function createGlowTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function Planet(
  radius,
  dist,
  speed,
  col,
  f1,
  f2,
  rotation,
  host,
  texturePath = undefined,
  name
) {
  let loader = new THREE.TextureLoader();
  let texture = loader.load(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;

  let geom = new THREE.SphereGeometry(radius, 20, 20);
  let mat = new THREE.MeshPhongMaterial({
    color: col,
    map: texture,
    bumpMap: texture,
    //specularMap: texture,
  });
  let planet = new THREE.Mesh(geom, mat);
  const inclination = THREE.MathUtils.degToRad(rotation);
  planet.userData = { dist, speed, f1, f2, inclination, host, name };

  if (shadow) {
    planet.castShadow = true;
    planet.receiveShadow = true;
  }

  Planets.push(planet);
  scene.add(planet);

  drawCircumbinaryOrbit(dist, f1, f2, inclination, host);
}

function Moon(
  host,
  radius,
  dist,
  speed,
  col,
  f1,
  f2,
  inclination,
  texturePath = undefined,
  name
) {
  let pivot = new THREE.Object3D();
  host.add(pivot);

  let loader = new THREE.TextureLoader();
  let texture = loader.load(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;

  var geom = new THREE.SphereGeometry(radius, 20, 20);
  var mat = new THREE.MeshPhongMaterial({
    color: col,
    map: texture,
    bumpMap: texture,
  });
  var moon = new THREE.Mesh(geom, mat);

  moon.userData = { dist, speed, f1, f2, inclination, host, name };

  if (shadow) {
    moon.castShadow = true;
    moon.receiveShadow = true;
  }

  Moons.push(moon);
  pivot.add(moon);

  drawCircumbinaryOrbit(dist, f1, f2, inclination, host, 0x707070);
}

function drawStarOrbit(dist, f1, f2, rotation = 2, centerX = 0, centerZ = 0) {
  //Dibuja trayectoria, con
  let curve = new THREE.EllipseCurve(
    centerX,
    centerZ, // centro
    dist * f1,
    dist * f2 // radios elipse
  );
  //Crea geometría
  let points = curve.getPoints(50);
  let geome = new THREE.BufferGeometry().setFromPoints(points);
  let mate = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
  });
  // Objeto
  let orbit = new THREE.Line(geome, mate);
  orbit.rotation.x = Math.PI / rotation;
  scene.add(orbit);
}

function drawCircumbinaryOrbit(
  dist,
  f1,
  f2,
  inclination = 0,
  host,
  color = 0xa0a0a0
) {
  // Curva elíptica en el plano XZ
  const curve = new THREE.EllipseCurve(
    0,
    0, // centro en origen
    dist * f1, // radio X
    dist * f2 // radio Z
  );

  // Convertir a puntos 3D (X, 0, Y → X, 0, Z)
  const points2D = curve.getPoints(100);
  const points3D = points2D.map((p) => new THREE.Vector3(p.x, 0, p.y));

  const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.6,
  });
  const orbit = new THREE.Line(geometry, material);

  // Inclinación orbital (rotación sobre eje X)
  orbit.rotation.x = -inclination;

  // Añadir al objeto principal
  if (host) {
    host.add(orbit);
  } else {
    scene.add(orbit);
  }
}

function createSkySphere(texturePath) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.SphereGeometry(500, 64, 64);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide, // importante: para ver el interior
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });

  const sky = new THREE.Mesh(geometry, material);
  scene.add(sky);

  return sky;
}

function toggleControls() {
  const switchBtn = document.createElement("button");
  switchBtn.textContent = "Cambiar a FlyControls";
  switchBtn.style.position = "absolute";
  switchBtn.style.top = "10px";
  switchBtn.style.right = "10px";
  switchBtn.style.padding = "10px 16px";
  switchBtn.style.border = "none";
  switchBtn.style.borderRadius = "6px";
  switchBtn.style.background = "rgba(30,30,30,0.7)";
  switchBtn.style.color = "#fff";
  switchBtn.style.fontFamily = "sans-serif";
  switchBtn.style.cursor = "pointer";
  switchBtn.style.zIndex = 10;
  document.body.appendChild(switchBtn);

  // === Evento para alternar ===
  switchBtn.addEventListener("click", () => {
    if (activeControls === camControls) {
      activeControls = flyControls;
      camControls.enabled = false;
      flyControls.enabled = true;
      switchBtn.textContent = "Cambiar a OrbitControls";
    } else {
      activeControls = camControls;
      flyControls.enabled = false;
      camControls.enabled = true;
      switchBtn.textContent = "Cambiar a FlyControls";
    }
  });
}

function createAsteroidBelt(
  host,
  innerRadius = 8,
  outerRadius = 12,
  count = 300
) {
  const belt = new THREE.Group();

  const geometry = new THREE.IcosahedronGeometry(0.05, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x888888 });

  for (let i = 0; i < count; i++) {
    const asteroid = new THREE.Mesh(geometry, material);

    // Distribución aleatoria dentro del anillo
    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.lerp(
      innerRadius,
      outerRadius,
      Math.random()
    );
    const yOffset = (Math.random() - 0.5) * 0.2; // leve dispersión vertical

    asteroid.position.set(
      Math.cos(angle) * radius,
      yOffset,
      Math.sin(angle) * radius
    );

    // Rotación aleatoria
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    belt.add(asteroid);
  }

  host.add(belt);
  return belt;
}

function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;

  const delta = clock.getDelta();
  if (activeControls === flyControls) {
    flyControls.update(delta);
  } else {
    camControls.update();
  }

  if (!paused) {
    for (let object of Stars) {
      const {
        dist,
        speed,
        f1,
        f2,
        centerX,
        centerZ,
        phase,
        texture,
        uniforms,
      } = object.userData;

      const t = timestamp * speed + phase;

      object.position.x = centerX + Math.cos(t) * f1 * dist;
      object.position.z = centerZ + Math.sin(t) * f2 * dist;
      texture.offset.x += 0.001;
      uniforms.time.value = performance.now() * 0.001;
    }

    for (let object of Planets) {
      const host = object.userData.host;
      const angle = timestamp * object.userData.speed;
      const inc = object.userData.inclination; // radianes

      // Coordenadas en el plano XZ
      const x = Math.cos(angle) * object.userData.f1 * object.userData.dist;
      const z = Math.sin(angle) * object.userData.f2 * object.userData.dist;

      // Aplicar rotación de inclinación al plano orbital (rotar alrededor del eje X)
      const cosI = Math.cos(inc);
      const sinI = Math.sin(inc);

      const y = z * sinI; // componente vertical derivada de la rotación
      const zRot = z * cosI; // nueva coordenada Z tras rotación

      if (host) {
        object.position.set(
          host.position.x + x,
          host.position.y + y,
          host.position.z + zRot
        );
      } else {
        object.position.set(
          barycenter.x + x,
          barycenter.y + y,
          barycenter.z + zRot
        );
      }
    }

    for (let object of Moons) {
      const angle = timestamp * object.userData.speed; // tu mismo ángulo
      const inc = object.userData.inclination || 0; // por si no tiene inclinación
      const f1 = object.userData.f1 || 1;
      const f2 = object.userData.f2 || 1;
      const dist = object.userData.dist;

      // Cálculo de la órbita elíptica con inclinación sobre X
      const x = Math.cos(angle) * f1 * dist;
      const z0 = Math.sin(angle) * f2 * dist;

      // aplicar inclinación sobre el eje X
      const y = z0 * Math.sin(inc);
      const z = z0 * Math.cos(inc);

      object.position.set(x, y, z);
    }
  }

  Belt.rotation.y += 0.01;

  requestAnimationFrame(animationLoop);

  renderer.render(scene, camera);
}
