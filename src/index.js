
const container = document.querySelector("#app");
const localEarth = "src/assets/earthmap1k.jpg";
const localCloud = "src/assets/2k_earth_clouds.jpg";
const localMoon = "src/assets/2k_moon.jpg";
const texture = new THREE.TextureLoader().load(localEarth);
const texture_clouds = new THREE.TextureLoader().load(localCloud);
const texture_moon = new THREE.TextureLoader().load(localMoon);
const localSunTexture = "src/assets/Map_of_the_full_sun.jpg";
const localSunClouds = "src/assets/sun2.jpg";
const sunTexture = new THREE.TextureLoader().load(localSunClouds);
const sunClouds = new THREE.TextureLoader().load(localSunTexture);


//scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("black");

const width = window.innerWidth;
const height = window.innerHeight;

// Objects
// Sun
const sunGeometry = new THREE.SphereGeometry(100, 128, 128);
const sunMaterial = new THREE.MeshBasicMaterial({
  map: sunTexture
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

//LIGHTS
const pointLight = new THREE.PointLight(0xffffff, 1.5);
pointLight.position.copy(sunMesh.position);
pointLight.castShadow = true;
const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);

scene.add(pointLight);
scene.add(ambientLight);

// Sun Clouds
const sunCloudGeometry = new THREE.SphereGeometry(100.25, 128, 128);
const sunCloudMaterial = new THREE.MeshLambertMaterial({
  color: "orange",
  alphaMap: sunClouds
});
sunCloudMaterial.transparent = true;
const sunCloudsObject = new THREE.Mesh(sunCloudGeometry, sunCloudMaterial);

//Earth
const sphereGeometry = new THREE.SphereGeometry(10, 128, 128);
const planetEarthMaterial = new THREE.MeshPhongMaterial({ map: texture });
const planetEarth = new THREE.Mesh(sphereGeometry, planetEarthMaterial);
planetEarth.rotation.x = (28 / 180) * Math.PI;

//Clouds
const cloudGeometry = new THREE.SphereGeometry(10.5, 128, 128);
const cloudMaterial = new THREE.MeshLambertMaterial({
  color: "white",
  alphaMap: texture_clouds
});

cloudMaterial.transparent = true;
const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);

//Camera
const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 10000);
camera.position.z = 2000;
camera.position.y = 500;

const defaultCamera = camera.clone();

const moonGeo = new THREE.SphereGeometry(2.7, 128, 128);
const moonMat = new THREE.MeshLambertMaterial({
  color: "white",
  map: texture_moon
});
const moon = new THREE.Mesh(moonGeo, moonMat);
moon.position.copy(planetEarth.position);

//SHADOWS
moon.castShadow = true;
planetEarth.receiveShadow = true;
clouds.castShadow = true;
// dirLight.castShadow = true;
camera.position.y = 0;

//Renderer
const renderer = new THREE.WebGLRenderer();
container.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);

const clock = new THREE.Clock();

const paintOrbit = (radio, affectY = true) => {
  const segments = 64;
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const posY = Math.sin(theta) * (radio / 3);
    points.push(
      new THREE.Vector3(
        Math.sin(theta) * radio,
        affectY ? posY : 0,
        Math.cos(theta) * radio
      )
    );
  }

  const radioGeom = new THREE.BufferGeometry().setFromPoints(points);
  const radioMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  return new THREE.Line(radioGeom, radioMat);
};
const moonOrbitRadius = 25;
const moonOrbitSpeed = 0.6;

const moonOrbit = paintOrbit(moonOrbitRadius);
const earthOrbit = paintOrbit(1000, false);

const earthGroup = new THREE.Group();
earthGroup.add(moonOrbit);
earthGroup.add(planetEarth);
earthGroup.add(clouds);
earthGroup.add(moon);

scene.add(earthGroup);
scene.add(earthOrbit);
scene.add(sunMesh);
scene.add(sunCloudsObject);



const orbitControls = new THREE.OrbitControls(camera, renderer.domElement)

//Events
let target;
let startAnim = false;

const getPlanetZoomIn = (planet, reset = false) => {
  return {
    target: planet.position.clone(),
    targetSize: new THREE.Box3()
      .setFromObject(planet)
      .getSize(new THREE.Vector3()),
    cameraLookat: reset ? scene.position : planet.position
  };
};

document.getElementById("reset").addEventListener("click", () => {
  target = null;
  startAnim = true;
});

const addPlanetClickListener = (planet) => {
  document.getElementById(planet).addEventListener("click", () => {
    target = planet;
    startAnim = true;
  });
};

addPlanetClickListener("sun");
addPlanetClickListener("earth");


const orbitMovement = (theta, radius, mesh, affectY = false) => {
  mesh.position.x = Math.sin(theta) * radius;
  mesh.position.y = affectY ? Math.sin(theta) * (radius / 3) : 0;
  mesh.position.z = Math.cos(theta) * radius;
};
//LOOP
const loop = () => {
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();
  clouds.rotation.y += delta * 0.03;
  planetEarth.rotation.y += delta * 3;
  sunMesh.rotation.y += delta * 0.03;
  sunCloudsObject.rotation.y += delta * 0.03;
  orbitMovement(elapsedTime * 0.1, 1000, earthGroup);
  orbitMovement(elapsedTime * moonOrbitSpeed, moonOrbitRadius, moon, true);

  // camera animation

  if (startAnim) {
    let data;

    switch (target) {
      case "sun":
        data = getPlanetZoomIn(sunMesh);
        break;
      case "earth":
        data = getPlanetZoomIn(earthGroup);
        break;
      default: {
        data = {
          target: defaultCamera.position.clone(),
          targetSize: new THREE.Vector3(),
          cameraLookat: new THREE.Vector3()
        };
        break;
      }
    }

    const distancedTarget = data.target;
    distancedTarget.z += data.targetSize.z;
    orbitControls.target.copy(data.cameraLookat);
    orbitControls.update();
    orbitControls.enabled = false;
    camera.position.lerp(distancedTarget, delta);

    if (camera.position.distanceTo(distancedTarget) < 10) {
      orbitControls.enabled = true;
      startAnim = false;
    }
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
};

loop();

document.getElementById("earth").addEventListener("click", () => {
  const planetInfo = document.getElementById("planet-info");
  planetInfo.style.display = "block";
});

// Agregar un evento de clic al botón de cierre
document.getElementById("closeBtn").addEventListener("click", () => {
  const planetInfo = document.getElementById("planet-info");
  planetInfo.style.display = "none";
});