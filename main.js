"use strict";
// ⚠️ DO NOT EDIT main.js DIRECTLY ⚠️
// This file is generated from the TypeScript source main.ts
// Any changes made here will be overwritten.
// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)
import { AmbientLight, Timer, CylinderGeometry, HemisphereLight, Mesh, PerspectiveCamera, Scene, WebGLRenderer, RingGeometry, MeshBasicMaterial, Vector3, Box3 } from 'three';
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
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/examples/jsm/Addons.js';
// Example of hard link to official repo for data, if needed
// const MODEL_PATH = 'https://raw.githubusercontent.com/mrdoob/three.js/r173/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';
// INSERT CODE HERE
let camera, scene, renderer;
const timer = new Timer();
timer.connect(document);
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
let kartPlaced = false;
let kartMoving = false;
let controller;
let track;
let trackBounds;
const holeZones = [];
const world = new CANNON.World();
const animate = (timestamp, frame) => {
    timer.update();
    const delta = timer.getDelta();
    const SPEED = 0.5; // m/s
    if (kartPlaced && kart) {
        const target = new Vector3(0, 0, -5).applyMatrix4(controller.matrixWorld);
        target.y = kart.position.y;
        if (target.distanceTo(kart.position) > 0.01) {
            kart.lookAt(target);
            kart.rotateY(Math.PI);
        }
        if (kartMoving && kartBody) {
            const dir = new Vector3(0, 0, 1).applyQuaternion(kart.quaternion);
            kartBody.velocity.set(dir.x * SPEED * 60, kartBody.velocity.y, dir.z * SPEED * 60);
        }
        else if (kartBody) {
            kartBody.velocity.set(0, kartBody.velocity.y, 0);
        }
        world.step(1 / 60, delta, 3);
        if (kartBody) {
            kart.position.copy(kartBody.position);
            kart.quaternion.copy(kartBody.quaternion);
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
                const pose = hit.getPose(referenceSpace);
                if (pose) {
                    reticle.visible = true;
                    reticle.matrix.fromArray(pose.transform.matrix);
                }
            }
            else {
                reticle.visible = false;
            }
        }
    }
    renderer.render(scene, camera);
};
const init = () => {
    scene = new Scene();
    world.gravity.set(0, -9.82, 0);
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);
    const aspect = window.innerWidth / window.innerHeight;
    camera = new PerspectiveCamera(75, aspect, 0.1, 10); // meters
    camera.position.set(0, 1.6, 3);
    const light = new AmbientLight(0xffffff, 1.0); // soft white light
    scene.add(light);
    const hemiLight = new HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);
    reticle = new Mesh(new RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2), new MeshBasicMaterial());
    reticle.rotation.x = -Math.PI / 2;
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
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
    const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test']
    });
    document.body.appendChild(arButton);
    const controls = new OrbitControls(camera, renderer.domElement);
    //controls.listenToKeyEvents(window); // optional
    controls.target.set(0, 1.6, 0);
    controls.update();
    // Handle input: see THREE.js webxr_ar_cones
    const geometry = new CylinderGeometry(0.1, 0.1, 0.2, 32).translate(0, 0.1, 0);
    const onSelect = () => {
        if (!kartPlaced && reticle.visible && kart) {
            reticle.matrix.decompose(kart.position, kart.quaternion, new Vector3());
            kart.scale.setScalar(0.2);
            kartBody.position.set(kart.position.x, kart.position.y, kart.position.z);
            kartBody.velocity.set(0, 0, 0);
            if (track) {
                track.position.copy(kart.position);
                track.quaternion.copy(kart.quaternion);
                kart.position.x += 0.5;
                kart.position.y += 0.3;
                trackBounds = new Box3().setFromObject(track);
                holeZones.length = 0;
                track.traverse((child) => {
                    if (child.name.startsWith('Box')) {
                        holeZones.push(new Box3().setFromObject(child));
                    }
                });
                holeZones.forEach((hole) => {
                    const center = new Vector3();
                    hole.getCenter(center);
                    const size = new Vector3();
                    hole.getSize(size);
                    const wallBody = new CANNON.Body({ mass: 0 });
                    wallBody.addShape(new CANNON.Box(new CANNON.Vec3(size.x / 2, 0.5, size.z / 2)));
                    wallBody.position.set(center.x, center.y, center.z);
                    world.addBody(wallBody);
                });
            }
            kartPlaced = true;
            kartMoving = true;
        }
        else if (kartPlaced) {
            kartMoving = !kartMoving;
        }
    };
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);
    window.addEventListener('resize', onWindowResize, false);
};
init();
let kart;
let kartBody;
const loader = new GLTFLoader();
loader.load('/assets/models/kart-oobi.glb', (gltf) => {
    kart = gltf.scene;
    kart.scale.setScalar(0.2);
    scene.add(kart);
    kartBody = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Box(new CANNON.Vec3(0.1, 0.05, 0.15))
    });
    world.addBody(kartBody);
});
const trackLoader = new GLTFLoader();
trackLoader.load('/assets/models/piste.glb', (gltf) => {
    track = gltf.scene;
    track.scale.setScalar(0.2);
    scene.add(track);
    // Séparer la route et les trous
    track.traverse((child) => {
        if (child.name.startsWith('Box')) {
            child.visible = false;
            const box = new Box3().setFromObject(child);
            holeZones.push(box);
        }
    });
});
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
//# sourceMappingURL=main.js.map