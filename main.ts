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
  Quaternion,
  Euler,
  MathUtils
} from 'three';

// XR Emulator
import { DevUI } from '@iwer/devui';
import { XRDevice, metaQuest3 } from 'iwer';
import { RingGeometry, MeshBasicMaterial } from 'three';

// XR
import { XRButton } from 'three/addons/webxr/XRButton.js';

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

// Example of hard link to official repo for data, if needed
// const MODEL_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/r173/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';




// INSERT CODE HERE
let camera : PerspectiveCamera, scene : Scene, renderer : WebGLRenderer;

let hitTestSource: any = null;
let referenceSpace: any = null;
let viewerSpace: any = null;

let reticle: Mesh;
let kart: any = null;
let isRunning = false;


const timer = new Timer();
timer.connect(document);

// Main loop
// Main loop
const animate = (timestamp?: number, frame?: XRFrame) => {

  timer.update();
  const delta = timer.getDelta();
  const elapsed = timer.getElapsed();


  if (frame && hitTestSource && referenceSpace) {

    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {

      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);

      if (pose) {
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      }
    }
  }

  if (kart && isRunning && frame) {

    const pose = frame.getViewerPose(referenceSpace);

    if (pose) {

      const orientation = pose.transform.orientation;

      const q = new Quaternion(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w
      );

      const euler = new Euler().setFromQuaternion(q, 'YXZ');

      kart.rotation.y = MathUtils.lerp(
        kart.rotation.y,
        euler.y,
        0.1
      );
    }

    kart.translateZ(-0.02);
  }

  renderer.render(scene, camera);
};




const init = () => {
  scene = new Scene();

  const aspect = window.innerWidth / window.innerHeight;
  camera = new PerspectiveCamera(75, aspect, 0.1, 10); // meters
  camera.position.set(0, 1.6, 3);

  const light = new AmbientLight(0xffffff, 1.0); // soft white light
  scene.add(light);

  const hemiLight = new HemisphereLight(0xffffff, 0xbbbbff, 3);
  hemiLight.position.set(0.5, 1, 0.25);
  scene.add(hemiLight);

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate); // requestAnimationFrame() replacement, compatible with XR 
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  /*
  document.body.appendChild( XRButton.createButton( renderer, {
    'optionalFeatures': [ 'depth-sensing' ],
    'depthSensing': { 'usagePreference': [ 'gpu-optimized' ], 'dataFormatPreference': [] }
  } ) );
*/

  const ringGeo = new RingGeometry(0.08, 0.1, 32);
  ringGeo.rotateX(-Math.PI / 2);

  reticle = new Mesh(
    ringGeo,
    new MeshBasicMaterial({ color: 0x00ffff })
  );

  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  renderer.xr.addEventListener('sessionstart', async () => {

  const session = renderer.xr.getSession();
  if (!session) return;

  referenceSpace = await session.requestReferenceSpace('local');
  viewerSpace = await session.requestReferenceSpace('viewer');

  if (session.requestHitTestSource) {

  hitTestSource = await session.requestHitTestSource({
    space: viewerSpace
  });

}

});

  const xrButton = XRButton.createButton(renderer, {
    requiredFeatures: ['hit-test']
  });
  xrButton.style.backgroundColor = 'skyblue';
  document.body.appendChild(xrButton);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.6, 0);
  controls.update();

  new GLTFLoader()
    .setPath('assets/models/')
    .load('kart-oobi.glb', (gltf) => {

      kart = gltf.scene;
      kart.scale.set(0.3, 0.3, 0.3);
      kart.visible = false;
      scene.add(kart);

    });

  renderer.domElement.addEventListener('click', () => {

    if (!reticle.visible || !kart) return;

    kart.visible = true;
    kart.position.setFromMatrixPosition(reticle.matrix);

    isRunning = false;
    createStartButton();

  });

  function createStartButton() {

  const btn = document.createElement('button');
  btn.innerText = "START";
  btn.style.position = "fixed";
  btn.style.bottom = "40px";
  btn.style.left = "50%";
  btn.style.transform = "translateX(-50%)";
  btn.style.padding = "20px";
  btn.style.fontSize = "20px";

  btn.onclick = () => {
    isRunning = true;
    btn.remove();
  };

  document.body.appendChild(btn);
}
}

init();

//

/*
function loadData() {
  new GLTFLoader()
    .setPath('assets/models/')
    .load('test.glb', gltfReader);
}


function gltfReader(gltf) {
  let testModel = null;

  testModel = gltf.scene;

  if (testModel != null) {
    console.log("Model loaded:  " + testModel);
    scene.add(gltf.scene);
  } else {
    console.log("Load FAILED.  ");
  }
}

loadData();
*/


// camera.position.z = 3;




function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}