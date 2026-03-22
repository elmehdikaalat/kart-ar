"use strict";

// ⚠️ DO NOT EDIT main.js DIRECTLY ⚠️
// This file is generated from the TypeScript source main.ts
// Any changes made here will be overwritten.

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import {
  AmbientLight,
  BoxGeometry,
  Timer,
  Color,
  CylinderGeometry,
  HemisphereLight,
  Mesh,
  MeshNormalMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  RingGeometry,
  MeshBasicMaterial,
  Group,
  Vector3,
  Quaternion,
  Raycaster,
  Vector2,
  Box3
} from 'three';

// XR Emulator
import { DevUI } from '@iwer/devui';
import { XRDevice, metaQuest3 } from 'iwer';

// XR
import { XRButton } from 'three/addons/webxr/XRButton.js';

import * as CANNON from 'cannon-es';

// If you prefer to import the whole library, with the THREE prefix, use the following line instead:
// import * as THREE from 'three'

// NOTE: three/addons alias is supported by Rollup: you can use it interchangeably with three/examples/jsm/  

// Importing Ammo can be tricky.
// Vite supports webassembly: https://vitejs.dev/guide/features.html#webassembly
// so in theory this should work:
//
// import ammoinit from 'three/addons/libs/ammo.wasm.js?init';
// ammoinit().then((AmmoLib) => {
//  Ammo = AmmoLib.exports.Ammo()
// })
//
// But the Ammo lib bundled with the THREE js examples does not seem to export modules properly.
// A solution is to treat this library as a standalone file and copy it using 'vite-plugin-static-copy'.
// See vite.config.js
// 
// Consider using alternatives like Oimo or cannon-es
import {
  OrbitControls
} from 'three/addons/controls/OrbitControls.js';

import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import { XRController } from 'iwer/lib/device/XRController';
import { ARButton } from 'three/examples/jsm/Addons.js';

// Example of hard link to official repo for data, if needed
// const MODEL_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/r173/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';




// INSERT CODE HERE
let camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer;


const timer = new Timer();
timer.connect(document);

let reticle: Mesh;

let hitTestSource: any = null;
let hitTestSourceRequested = false;
let kartPlaced = false;

let kartMoving = false;
let controller: any;
let track: Group;
let trackBounds: Box3;
const holeZones: Box3[] = [];
const world = new CANNON.World();


let groundBody: CANNON.Body;


const animate = (timestamp?: number, frame?: XRFrame) => {

  timer.update();
  const delta = timer.getDelta();

  const SPEED = 2; // m/s

  if (kartPlaced && kart) {
    const target = new Vector3(0, 0, -5).applyMatrix4(controller.matrixWorld);
    target.y = kart.position.y;

    if (kartMoving && target.distanceTo(kart.position) > 0.05) {
      kart.lookAt(target);
      kart.rotateY(Math.PI);
    }

    if (kartMoving && kartBody) {
      const dir = new Vector3(0, 0, 1).applyQuaternion(kart.quaternion);
      kartBody.velocity.set(dir.x * SPEED, kartBody.velocity.y, dir.z * SPEED);
    }
    else if (kartBody) {
      kartBody.velocity.set(0, kartBody.velocity.y, 0);
    }

    world.step(1 / 60, delta, 3);

    if (kartBody) {
      kart.position.x = kartBody.position.x;
      kart.position.z = kartBody.position.z;
      kart.position.y = kartBody.position.y;
    }

  }

  if (frame) {

    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (session && hitTestSourceRequested === false) {

      session.requestReferenceSpace('viewer').then((viewerSpace) => {

        if (session.requestHitTestSource) {

          session.requestHitTestSource?.({ space: viewerSpace })?.then((source) => {
            hitTestSource = source;
          });

        }

      });

      session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });

      hitTestSourceRequested = true;
    }

    if (hitTestSource) {

      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {

        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace!);

        if (pose) {
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
        }

      } else {

        reticle.visible = false;

      }

    }

  }

  renderer.render(scene, camera);
};


const init = () => {
  scene = new Scene();
  world.gravity.set(0, -9.82, 0);

  groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(new CANNON.Plane());
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  const aspect = window.innerWidth / window.innerHeight;
  camera = new PerspectiveCamera(75, aspect, 0.1, 10);
  camera.position.set(0, 1.6, 3);

  const light = new AmbientLight(0xffffff, 1.0);
  scene.add(light);

  const hemiLight = new HemisphereLight(0xffffff, 0xbbbbff, 3);
  hemiLight.position.set(0.5, 1, 0.25);
  scene.add(hemiLight);


  reticle = new Mesh(
    new RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new MeshBasicMaterial()
  );

  reticle.rotation.x = -Math.PI / 2;
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  const arButton = ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test']
  });
  document.body.appendChild(arButton);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.6, 0);
  controls.update();


  const onSelect = () => {
    if (!kartPlaced && reticle.visible && kart) {
      reticle.matrix.decompose(kart.position, kart.quaternion, new Vector3());
      kart.scale.setScalar(0.2);
      kart.visible = true;

      groundBody.position.set(0, kart.position.y, 0);

      kartBody.position.set(kart.position.x, kart.position.y, kart.position.z);
      kartBody.velocity.set(0, 0, 0);
      kartBody.angularVelocity.set(0, 0, 0);

      if (track) {
        track.position.copy(kart.position);
        track.quaternion.copy(kart.quaternion);
        track.visible = true;

        kart.position.x += 0.5;
        kartBody.position.set(kart.position.x, kart.position.y, kart.position.z);


        track.updateWorldMatrix(true, true);

        const surfaceY = kart.position.y;

        trackBounds = new Box3().setFromObject(track);

        holeZones.length = 0;
        track.traverse((child) => {
          if (child.name.startsWith('Box')) {
            holeZones.push(new Box3().setFromObject(child));
          }
        });

        const wallH = 0.1;
        const wallT = 0.02;

        holeZones.forEach((hole) => {
          const center = new Vector3();
          hole.getCenter(center);
          const hx = (hole.max.x - hole.min.x) / 2;
          const hz = (hole.max.z - hole.min.z) / 2;
          const wallY = surfaceY + wallH;

          [
            { pos: [center.x, wallY, hole.min.z - wallT], half: [hx + wallT, wallH, wallT] }, // North
            { pos: [center.x, wallY, hole.max.z + wallT], half: [hx + wallT, wallH, wallT] }, // South
            { pos: [hole.min.x - wallT, wallY, center.z], half: [wallT, wallH, hz + wallT] }, // West
            { pos: [hole.max.x + wallT, wallY, center.z], half: [wallT, wallH, hz + wallT] }, // East
          ].forEach(({ pos, half }) => {
            const b = new CANNON.Body({ mass: 0 });
            b.addShape(new CANNON.Box(new CANNON.Vec3(half[0], half[1], half[2])));
            b.position.set(pos[0], pos[1], pos[2]);
            world.addBody(b);
          });
        });

        const tb = trackBounds;
        const cx = (tb.max.x + tb.min.x) / 2;
        const cz = (tb.max.z + tb.min.z) / 2;
        const halfW = (tb.max.x - tb.min.x) / 2;
        const halfD = (tb.max.z - tb.min.z) / 2;
        const outerH = 0.1;
        const outerT = 0.02;
        const outerY = surfaceY + outerH;

        [
          { pos: [cx, outerY, tb.min.z - outerT], half: [halfW, outerH, outerT] }, // North
          { pos: [cx, outerY, tb.max.z + outerT], half: [halfW, outerH, outerT] }, // South
          { pos: [tb.min.x - outerT, outerY, cz], half: [outerT, outerH, halfD] }, // West
          { pos: [tb.max.x + outerT, outerY, cz], half: [outerT, outerH, halfD] }, // East
        ].forEach(({ pos, half }) => {
          const b = new CANNON.Body({ mass: 0 });
          b.addShape(new CANNON.Box(new CANNON.Vec3(half[0], half[1], half[2])));
          b.position.set(pos[0], pos[1], pos[2]);
          world.addBody(b);
        });
      }

      kartPlaced = true;
      kartMoving = true;
    } else if (kartPlaced) {
      kartMoving = !kartMoving;
    }
  };



  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);


  window.addEventListener('resize', onWindowResize, false);

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') onSelect();
  });

}

init();

let kart: Group;
let kartBody: CANNON.Body;
const loader = new GLTFLoader();
loader.load('assets/models/kart-oobi.glb', (gltf) => {
  kart = gltf.scene;
  kart.scale.setScalar(0.2);
  kart.visible = false;
  scene.add(kart);

  kartBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(0.1, 0.05, 0.15)),
    linearDamping: 0.9,
    angularDamping: 1.0,
  });

  kartBody.fixedRotation = true;
  kartBody.updateMassProperties();
  world.addBody(kartBody);
});

const trackLoader = new GLTFLoader();
trackLoader.load('assets/models/piste.glb', (gltf) => {
  track = gltf.scene;
  track.scale.setScalar(0.2);
  track.visible = false;
  scene.add(track);

  track.traverse((child) => {
    if (child.name.startsWith('Box')) {
      (child as Mesh).visible = false;
    }
  });
});




function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  if (!renderer.xr.isPresenting) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}