# Kart AR

Une expérience de course en réalité augmentée construite avec **THREE.js + WebXR**. Posez un kart et un circuit miniature sur n'importe quelle surface réelle et pilotez-le avec des interactions tactiles.

🔗 **[Tester en live](https://elmehdikaalat.github.io/kart-ar/)**

---

## Le principe

Pointez votre téléphone vers une surface plate, appuyez pour poser le kart et le circuit, puis appuyez à nouveau pour démarrer/arrêter le mouvement. Le kart navigue sur la piste avec des collisions physiques — le tout ancré dans le monde réel via le hit-test WebXR.

---

## Mode d'emploi

1. Ouvrir le lien live sur un appareil compatible WebXR (Android + Chrome recommandé)
2. Appuyer sur **Start AR** et pointer la caméra vers une surface plate
3. Quand le réticule apparaît, **appuyer pour poser** le kart et la piste
4. Appuyer à nouveau pour **démarrer/arrêter** le kart
5. Se déplacer autour — il reste ancré dans le monde réel

---

## Démo


---

## Fonctionnalités

| Fonctionnalité | Détails |
|---|---|
| **Hit-test** | Le réticule se snap sur les surfaces réelles via l'API WebXR hit-test |
| **Interaction tactile** | Tap pour poser, tap pour toggle le mouvement |
| **Physique (Cannon-es)** | Corps rigide pour le kart + murs AABB générés depuis la géométrie de la piste |
| **Modèles 3D** | Kart custom (`kart-oobi.glb`) + circuit (`piste.glb`) chargés via GLTFLoader |

---

## Lancer en local

```bash
git clone https://github.com/elmehdikaalat/kart-ar.git
cd kart-ar
npm install
npm run dev
```
---

## Sources & crédits

- Template de base — [fdoganis/three_vite_xr_ts](https://github.com/fdoganis/three_vite_xr_ts) (MIT)
- Référence WebXR hit-test — [threejs.org/examples/webxr_ar_cones](https://threejs.org/examples/webxr_ar_cones.html) (MIT)
- Modèle kart — [Kenney Car Kit](https://kenney.nl/assets/car-kit) (CC0)
- Modèle piste — [Poly Pizza](https://poly.pizza) (CC Attribution)
- Workflow de déploiement — [meta-quest/webxr-first-steps](https://github.com/meta-quest/webxr-first-steps) (MIT)

---

## Licence

MIT — voir [LICENSE](./LICENSE)
