import {
  Color,
  DirectionalLight,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Spherical,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type CubeController = ReturnType<typeof createCubeScene>;

export function createCubeScene(
  host: HTMLDivElement,
  onUnavailable: () => void,
) {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  const canvas = renderer.domElement;
  canvas.className =
    "h-full w-full cursor-grab rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute(
    "aria-label",
    "Cubo mágico em 3D. Arraste ou use as setas para girar a visualização.",
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

  const sample = document.createElement("canvas");
  sample.width = sample.height = 1;
  const context = sample.getContext("2d", { willReadFrequently: true })!;
  const theme = getComputedStyle(host);
  function themeColor(token: string) {
    // Let the browser convert the design system's OKLCH colors to sRGB.
    context.fillStyle = theme.getPropertyValue(token).trim();
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return new Color().setRGB(r / 255, g / 255, b / 255, SRGBColorSpace);
  }
  const body = themeColor("--background");
  const surface = themeColor("--muted-foreground");
  const illumination = themeColor("--foreground");
  const light = new DirectionalLight(illumination, 3);
  light.position.set(4, 7, 5);
  scene.add(light, new HemisphereLight(illumination, body, 2));

  const geometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
  const material = new MeshStandardMaterial({
    roughness: 0.4,
    metalness: 0.12,
  });
  const mesh = new InstancedMesh(geometry, material, 80);
  const normals = [
    new Vector3(1, 0, 0),
    new Vector3(-1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, -1, 0),
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1),
  ];
  let index = 0;
  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        const position = new Vector3(x, y, z);
        const center = position.clone().multiplyScalar(1.04);
        mesh.setMatrixAt(
          index,
          new Matrix4().makeScale(0.94, 0.94, 0.94).setPosition(center),
        );
        mesh.setColorAt(index++, body);
        for (const normal of normals) {
          if (position.dot(normal) !== 1) continue;
          mesh.setMatrixAt(
            index,
            new Matrix4().compose(
              center.clone().addScaledVector(normal, 0.49),
              new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal),
              new Vector3(0.8, 0.8, 0.035),
            ),
          );
          mesh.setColorAt(index++, surface);
        }
      }
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);
  host.appendChild(canvas);

  let frame = 0;
  let disposed = false;
  let visible = true;
  function requestRender() {
    if (!disposed && !frame && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function render() {
    frame = 0;
    renderer.render(scene, camera);
  }
  function onKeyDown(event: KeyboardEvent) {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      !event.key.startsWith("Arrow")
    )
      return;
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
  function onContextLost(event: Event) {
    event.preventDefault();
    dispose();
    onUnavailable();
  }
  const viewport = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestRender();
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
  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("webglcontextlost", onContextLost);
  document.addEventListener("visibilitychange", requestRender);
  requestRender();

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    viewport.disconnect();
    controls.dispose();
    canvas.removeEventListener("keydown", onKeyDown);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    document.removeEventListener("visibilitychange", requestRender);
    mesh.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }
  return { dispose };
}
