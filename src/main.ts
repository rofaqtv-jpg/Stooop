import "./style.css";

import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  FollowCamera,
  TransformNode,
  Quaternion,
  PhysicsAggregate,
  PhysicsShapeType,
  PhysicsMotionType,
  PBRMaterial,
  Space
} from "@babylonjs/core";

import HavokPhysics from "@babylonjs/havok";

import { HavokPlugin } from "@babylonjs/core/Physics";


// ============================================================
// ENGINE
// ============================================================

const canvas =
  document.getElementById("renderCanvas") as HTMLCanvasElement;

const engine = new Engine(
  canvas,
  true,
  {
    preserveDrawingBuffer: false,
    stencil: true
  },
  true
);

engine.setHardwareScalingLevel(
  Math.min(
    1.5,
    Math.max(1, window.devicePixelRatio)
  )
);


// ============================================================
// SCENE
// ============================================================

const scene = new Scene(engine);

scene.clearColor =
  new Color4(
    0.035,
    0.045,
    0.055,
    1
  );


// ============================================================
// HAVOK
// ============================================================

const havok = await HavokPhysics();

const havokPlugin =
  new HavokPlugin(
    true,
    havok
  );

scene.enablePhysics(
  new Vector3(
    0,
    -9.81,
    0
  ),
  havokPlugin
);


// ============================================================
// LIGHTING
// ============================================================

const skyLight =
  new HemisphericLight(
    "SkyLight",
    new Vector3(0, 1, 0),
    scene
  );

skyLight.intensity = 0.72;


const sun =
  new DirectionalLight(
    "Sun",
    new Vector3(
      -0.4,
      -1,
      -0.25
    ),
    scene
  );

sun.position =
  new Vector3(
    100,
    180,
    80
  );

sun.intensity = 1.2;


// ============================================================
// MATERIALS
// ============================================================

function createMaterial(
  name: string,
  color: Color3
) {

  const material =
    new PBRMaterial(
      name,
      scene
    );

  material.albedoColor =
    color;

  material.roughness =
    0.82;

  return material;
}


const terrainMaterial =
  createMaterial(
    "Terrain",
    new Color3(
      0.22,
      0.24,
      0.20
    )
  );


const roadMaterial =
  createMaterial(
    "Road",
    new Color3(
      0.075,
      0.08,
      0.085
    )
  );


const carMaterial =
  createMaterial(
    "CarRed",
    new Color3(
      0.65,
      0.025,
      0.025
    )
  );


const glassMaterial =
  createMaterial(
    "Glass",
    new Color3(
      0.04,
      0.09,
      0.12
    )
  );

glassMaterial.metallic = 0.2;
glassMaterial.roughness = 0.18;


const buildingMaterial =
  createMaterial(
    "Buildings",
    new Color3(
      0.58,
      0.56,
      0.51
    )
  );


// ============================================================
// TERRAIN
// ============================================================

const terrain =
  MeshBuilder.CreateGround(
    "Terrain",
    {
      width: 1000,
      height: 1000,
      subdivisions: 80
    },
    scene
  );

terrain.material =
  terrainMaterial;


const positions =
  terrain.getVerticesData(
    "position"
  );

if (positions) {

  for (
    let i = 1;
    i < positions.length;
    i += 3
  ) {

    const x =
      positions[i - 1];

    const z =
      positions[i + 1];

    positions[i] =
      Math.sin(x * 0.018) * 2.2 +
      Math.cos(z * 0.021) * 2.5 +
      Math.sin((x + z) * 0.009) * 3;
  }

  terrain.updateVerticesData(
    "position",
    positions
  );
}


new PhysicsAggregate(
  terrain,
  PhysicsShapeType.MESH,
  {
    mass: 0,
    friction: 0.9,
    restitution: 0.05
  },
  scene
);


// ============================================================
// STATIC OBJECT
// ============================================================

function createBox(
  name: string,
  position: Vector3,
  scale: Vector3,
  material: any
) {

  const mesh =
    MeshBuilder.CreateBox(
      name,
      {
        width: scale.x,
        height: scale.y,
        depth: scale.z
      },
      scene
    );

  mesh.position =
    position;

  mesh.material =
    material;

  new PhysicsAggregate(
    mesh,
    PhysicsShapeType.BOX,
    {
      mass: 0,
      friction: 0.8,
      restitution: 0.05
    },
    scene
  );

  return mesh;
}


// ============================================================
// ROADS
// ============================================================

for (
  let z = -420;
  z <= 420;
  z += 40
) {

  createBox(
    "Road",
    new Vector3(
      0,
      0.08,
      z
    ),
    new Vector3(
      18,
      0.16,
      34
    ),
    roadMaterial
  );
}


for (
  let x = -360;
  x <= 360;
  x += 45
) {

  createBox(
    "Road",
    new Vector3(
      x,
      0.09,
      0
    ),
    new Vector3(
      38,
      0.16,
      14
    ),
    roadMaterial
  );
}


// ============================================================
// CITY
// ============================================================

for (
  let x = -220;
  x <= 220;
  x += 55
) {

  for (
    let z = -220;
    z <= 220;
    z += 55
  ) {

    if (
      (x + z) % 110 === 0
    ) {
      continue;
    }

    const height =
      12 +
      Math.abs(
        Math.sin(
          x * 0.08 +
          z * 0.03
        )
      ) * 32;

    createBox(
      "Building",
      new Vector3(
        x,
        height / 2,
        z
      ),
      new Vector3(
        28,
        height,
        28
      ),
      buildingMaterial
    );
  }
}


// ============================================================
// SUMMIT
// ============================================================

const summit =
  MeshBuilder.CreateCylinder(
    "Summit",
    {
      diameter: 5,
      height: 9
    },
    scene
  );

summit.position =
  new Vector3(
    0,
    6,
    410
  );

summit.material =
  carMaterial;


// ============================================================
// PLAYER CAR
// ============================================================

const car =
  new TransformNode(
    "PlayerVehicle",
    scene
  );

car.position =
  new Vector3(
    0,
    3,
    -330
  );


// BODY

const body =
  MeshBuilder.CreateBox(
    "VehicleBody",
    {
      width: 3.2,
      height: 1,
      depth: 5.4
    },
    scene
  );

body.parent = car;

body.position.y =
  0.9;

body.material =
  carMaterial;


// CABIN

const cabin =
  MeshBuilder.CreateBox(
    "VehicleCabin",
    {
      width: 2.55,
      height: 1,
      depth: 2.35
    },
    scene
  );

cabin.parent =
  car;

cabin.position =
  new Vector3(
    0,
    1.65,
    -0.2
  );

cabin.material =
  glassMaterial;


// ============================================================
// WHEELS
// ============================================================

const wheels:
  TransformNode[] = [];


for (
  const x of [-1.35, 1.35]
) {

  for (
    const z of [-1.85, 1.85]
  ) {

    const wheel =
      MeshBuilder.CreateCylinder(
        "Wheel",
        {
          diameter: 1,
          height: 0.38,
          tessellation: 16
        },
        scene
      );

    wheel.parent =
      car;

    wheel.rotationQuaternion =
      Quaternion.FromEulerAngles(
        0,
        0,
        Math.PI / 2
      );

    wheel.position =
      new Vector3(
        x,
        0.35,
        z
      );

    wheel.material =
      roadMaterial;

    wheels.push(wheel);
  }
}


// ============================================================
// HAVOK VEHICLE BODY
// ============================================================

const carPhysics =
  new PhysicsAggregate(
    body,
    PhysicsShapeType.BOX,
    {
      mass: 1450,
      friction: 0.75,
      restitution: 0.05
    },
    scene
  );


carPhysics.body.setMotionType(
  PhysicsMotionType.DYNAMIC
);

carPhysics.body.setLinearDamping(
  0.18
);

carPhysics.body.setAngularDamping(
  0.65
);


// ============================================================
// CAMERA
// ============================================================

const camera =
  new FollowCamera(
    "FollowCamera",
    new Vector3(
      0,
      5,
      -12
    ),
    scene
  );

camera.lockedTarget =
  car;

camera.radius =
  11;

camera.heightOffset =
  4.2;

camera.rotationOffset =
  180;

camera.cameraAcceleration =
  0.08;

camera.maxCameraSpeed =
  30;

scene.activeCamera =
  camera;


// ============================================================
// INPUT
// ============================================================

const keys:
  Record<string, boolean> = {};


window.addEventListener(
  "keydown",
  event => {

    keys[
      event.key.toLowerCase()
    ] = true;

  }
);


window.addEventListener(
  "keyup",
  event => {

    keys[
      event.key.toLowerCase()
    ] = false;

  }
);


// ============================================================
// MOBILE CONTROLS
// ============================================================

document
  .querySelectorAll(
    "[data-key]"
  )
  .forEach(button => {

    const key =
      (button as HTMLElement)
        .dataset.key!;

    button.addEventListener(
      "pointerdown",
      event => {

        event.preventDefault();

        keys[key] = true;

      }
    );

    button.addEventListener(
      "pointerup",
      () => {

        keys[key] = false;

      }
    );

    button.addEventListener(
      "pointercancel",
      () => {

        keys[key] = false;

      }
    );

    button.addEventListener(
      "pointerleave",
      () => {

        keys[key] = false;

      }
    );

  });


// ============================================================
// GAME LOOP
// ============================================================

scene.onBeforeRenderObservable.add(
  () => {

    const dt =
      Math.min(
        engine.getDeltaTime() / 1000,
        0.05
      );


    const gas =
      keys["w"] ||
      keys["arrowup"] ||
      keys["gas"];


    const brake =
      keys["s"] ||
      keys["arrowdown"] ||
      keys["brake"];


    const left =
      keys["a"] ||
      keys["arrowleft"] ||
      keys["left"];


    const right =
      keys["d"] ||
      keys["arrowright"] ||
      keys["right"];


    const throttle =
      (gas ? 1 : 0) -
      (brake ? 0.8 : 0);


    const steering =
      (left ? -1 : 0) +
      (right ? 1 : 0);


    const velocity =
      carPhysics.body
        .getLinearVelocity();


    const speed =
      velocity.length();


    // Engine force

    const engineForce =
      throttle * 5200;


    carPhysics.body.applyForce(
      car.forward.scale(
        engineForce
      ),
      body.position
    );


    // Steering

    if (
      Math.abs(steering) > 0.01
    ) {

      const torque =
        new Vector3(
          0,
          steering *
            -2200 *
            Math.min(
              1,
              speed / 8
            ),
          0
        );

      carPhysics.body
        .applyTorque(torque);
    }


    // Brake

    if (
      keys["space"]
    ) {

      carPhysics.body
        .setLinearVelocity(
          velocity.scale(0.93)
        );
    }


    // Wheel rotation

    wheels.forEach(
      wheel => {

        wheel.rotate(
          Vector3.Right(),
          speed * dt * 2.8,
          Space.LOCAL
        );

      }
    );


    // Keep vehicle above terrain

    if (
      car.position.y < 1.15
    ) {

      car.position.y =
        1.15;
    }


    // Speed HUD

    const speedElement =
      document.getElementById(
        "speed"
      );

    if (speedElement) {

      speedElement.textContent =
        `${Math.round(
          speed * 3.6
        )} km/h`;

    }


    // Mission

    if (
      car.position.z > 385
    ) {

      const mission =
        document.getElementById(
          "mission"
        );

      if (mission) {

        mission.textContent =
          "✓ وصلت إلى القمة — المهمة مكتملة";

      }
    }

  }
);


// ============================================================
// RENDER
// ============================================================

engine.runRenderLoop(
  () => {

    scene.render();

  }
);


window.addEventListener(
  "resize",
  () => {

    engine.resize();

  }
);


// ============================================================
// LOADING SCREEN
// ============================================================

setTimeout(
  () => {

    const loading =
      document.getElementById(
        "loading"
      );

    loading?.remove();

  },
  900
);
