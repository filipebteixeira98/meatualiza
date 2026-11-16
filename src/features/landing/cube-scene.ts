import {
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Scene,
  Sphere,
  Spherical,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  createCube,
  cubeFaces,
  isCubeSolved,
  turnCube,
  type CubeFace,
  type Cubie,
} from "./cube-model";

type Move = { face: CubeFace; inverse: boolean };
type CubeState = { busy: boolean; solved: boolean };
export type CubeController = ReturnType<typeof createCubeScene>;

export function createCubeScene(
  host: HTMLDivElement,
  onChange: (state: CubeState) => void,
  onUnavailable: () => void,
) {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  const canvas = renderer.domElement;
  canvas.className =
    "h-full w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute(
    "aria-label",
    "Cubo mágico. Setas giram a visão; F, R, U, B, L e D movem as faces. Shift inverte o giro.",
  );
  const scene = new Scene();
  const camera = new PerspectiveCamera(33, 1, 0.1, 100);
  camera.position.set(6, 4.5, 7);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI - 0.25;
  controls.update();

  const theme = getComputedStyle(host);
  const color = (name: string) =>
    new Color(theme.getPropertyValue(`--cube-${name}`).trim());
  const light = new DirectionalLight(color("U"), 3);
  light.position.set(4, 7, 5);
  scene.add(light, new HemisphereLight(color("U"), color("body"), 2));
  const cubies = createCube();
  const geometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
  const material = new MeshStandardMaterial({
    roughness: 0.4,
    metalness: 0.12,
  });
  const pieces = cubies.flatMap((cubie) => [
    {
      cubie,
      local: new Matrix4().makeScale(0.94, 0.94, 0.94),
      color: color("body"),
      normal: null as Vector3 | null,
    },
    ...cubeFaces
      .filter((face) => cubie.home[face.axis] === face.layer)
      .map((face) => {
        const normal = new Vector3().setComponent(face.axis, face.layer);
        return {
          cubie,
          local: new Matrix4().compose(
            normal.clone().multiplyScalar(0.49),
            new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal),
            new Vector3(0.8, 0.8, 0.035),
          ),
          color: color(face.id),
          normal,
        };
      }),
  ]);
  const mesh = new InstancedMesh(geometry, material, pieces.length);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  // Every legal face turn stays inside this sphere, including intermediate angles.
  mesh.boundingSphere = new Sphere(new Vector3(), 3);
  pieces.forEach((piece, index) => mesh.setColorAt(index, piece.color));
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  host.appendChild(canvas);

  let frame = 0;
  let disposed = false;
  let visible = true;
  let queue: Move[] = [];
  let animation: {
    move: Move;
    members: Set<Cubie>;
    start: number;
    duration: number;
  } | null = null;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const world = new Matrix4(),
    transform = new Matrix4(),
    rotation = new Matrix4();
  const basis = [new Vector3(), new Vector3(), new Vector3()];
  const axis = new Vector3();

  function updateInstances(angle = 0) {
    if (animation)
      rotation.makeRotationAxis(
        axis.set(0, 0, 0).setComponent(animation.move.face.axis, 1),
        angle,
      );
    for (let index = 0; index < pieces.length; index++) {
      const { cubie, local } = pieces[index];
      world.makeBasis(
        basis[0].fromArray(cubie.basis[0]),
        basis[1].fromArray(cubie.basis[1]),
        basis[2].fromArray(cubie.basis[2]),
      );
      world.setPosition(
        cubie.position[0] * 1.04,
        cubie.position[1] * 1.04,
        cubie.position[2] * 1.04,
      );
      if (animation?.members.has(cubie)) world.premultiply(rotation);
      mesh.setMatrixAt(index, transform.multiplyMatrices(world, local));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function notify() {
    onChange({ busy: queue.length > 0, solved: isCubeSolved(cubies) });
  }

  function requestRender() {
    if (!disposed && !frame && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }

  function beginMove(time: number) {
    const move = queue[0];
    animation = {
      move,
      start: time,
      duration: queue.length > 1 ? 100 : 220,
      members: new Set(
        cubies.filter(
          (cubie) => cubie.position[move.face.axis] === move.face.layer,
        ),
      ),
    };
  }

  function render(time: number) {
    frame = 0;
    let angle = 0;
    if (animation) {
      const progress = Math.min(
        1,
        (time - animation.start) / animation.duration,
      );
      angle =
        (((1 - (1 - progress) ** 3) * Math.PI) / 2) *
        animation.move.face.layer *
        (animation.move.inverse ? 1 : -1);
      if (progress === 1) {
        turnCube(cubies, animation.move.face, animation.move.inverse);
        queue.shift();
        animation = null;
        angle = 0;
        if (queue.length) beginMove(time);
        else notify();
      }
    }
    updateInstances(angle);
    renderer.render(scene, camera);
    if (animation) requestRender();
  }

  function finishMoves() {
    cancelAnimationFrame(frame);
    frame = 0;
    for (const move of queue) turnCube(cubies, move.face, move.inverse);
    queue = [];
    animation = null;
    updateInstances();
    notify();
    requestRender();
  }

  function play(moves: Move[]) {
    if (disposed || queue.length) return;
    queue = moves;
    notify();
    if (motion.matches || !visible || document.hidden) finishMoves();
    else {
      beginMove(performance.now());
      requestRender();
    }
  }

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let pressed: { x: number; y: number; id: number } | null = null;
  function onPointerDown(event: PointerEvent) {
    pressed = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.focus({ preventScroll: true });
  }
  function onPointerUp(event: PointerEvent) {
    const start = pressed;
    pressed = null;
    if (
      !start ||
      start.id !== event.pointerId ||
      queue.length ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
    )
      return;
    const bounds = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(mesh)[0];
    const piece = hit?.instanceId === undefined ? null : pieces[hit.instanceId];
    if (!piece?.normal) return;
    const normal = piece.normal
      .clone()
      .transformDirection(
        world.makeBasis(
          basis[0].fromArray(piece.cubie.basis[0]),
          basis[1].fromArray(piece.cubie.basis[1]),
          basis[2].fromArray(piece.cubie.basis[2]),
        ),
      );
    const face = cubeFaces.find(
      (face) => Math.round(normal.getComponent(face.axis)) === face.layer,
    );
    if (face) play([{ face, inverse: event.shiftKey }]);
  }
  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const face = cubeFaces.find((face) => face.id === event.key.toUpperCase());
    if (face) {
      event.preventDefault();
      play([{ face, inverse: event.shiftKey }]);
    } else if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      const orbit = new Spherical().setFromVector3(camera.position);
      if (event.key === "ArrowLeft") orbit.theta -= 0.2;
      if (event.key === "ArrowRight") orbit.theta += 0.2;
      if (event.key === "ArrowUp") orbit.phi -= 0.2;
      if (event.key === "ArrowDown") orbit.phi += 0.2;
      orbit.phi = Math.max(
        controls.minPolarAngle,
        Math.min(controls.maxPolarAngle, orbit.phi),
      );
      camera.position.setFromSpherical(orbit);
      controls.update();
    }
  }
  function onVisibilityChange() {
    if (document.hidden && queue.length) finishMoves();
    else requestRender();
  }
  function onMotionChange() {
    if (motion.matches && queue.length) finishMoves();
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    dispose();
    onUnavailable();
  }
  const viewport = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible && queue.length) finishMoves();
    else requestRender();
  });
  const resize = new ResizeObserver(() => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    requestRender();
  });
  viewport.observe(host);
  resize.observe(host);
  controls.addEventListener("change", requestRender);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("webglcontextlost", onContextLost);
  document.addEventListener("visibilitychange", onVisibilityChange);
  motion.addEventListener("change", onMotionChange);
  updateInstances();
  notify();
  requestRender();

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    viewport.disconnect();
    controls.dispose();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("keydown", onKeyDown);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    motion.removeEventListener("change", onMotionChange);
    mesh.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  return {
    turn: (face: CubeFace) => play([{ face, inverse: false }]),
    scramble() {
      const moves: Move[] = [];
      for (let index = 0; index < 16; index++) {
        const options = cubeFaces.filter(
          (face) => face.id !== moves.at(-1)?.face.id,
        );
        moves.push({
          face: options[Math.floor(Math.random() * options.length)],
          inverse: Math.random() < 0.5,
        });
      }
      play(moves);
    },
    reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      queue = [];
      animation = null;
      const original = createCube();
      cubies.forEach((cubie, index) => Object.assign(cubie, original[index]));
      camera.position.set(6, 4.5, 7);
      controls.update();
      notify();
      requestRender();
    },
    dispose,
  };
}
