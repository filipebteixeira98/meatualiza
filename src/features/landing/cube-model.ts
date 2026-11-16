export const cubeFaces = [
  { id: "F", label: "Frente", axis: 2, layer: 1 },
  { id: "R", label: "Direita", axis: 0, layer: 1 },
  { id: "U", label: "Cima", axis: 1, layer: 1 },
  { id: "B", label: "Trás", axis: 2, layer: -1 },
  { id: "L", label: "Esquerda", axis: 0, layer: -1 },
  { id: "D", label: "Baixo", axis: 1, layer: -1 },
] as const;

export type CubeFace = (typeof cubeFaces)[number];
export type Coordinate = [number, number, number];
export type Cubie = {
  home: Coordinate;
  position: Coordinate;
  basis: [Coordinate, Coordinate, Coordinate];
};

export function createCube(): Cubie[] {
  const cubies: Cubie[] = [];
  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        cubies.push({
          home: [x, y, z],
          position: [x, y, z],
          basis: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ],
        });
      }
    }
  }
  return cubies;
}

function rotate(
  [x, y, z]: Coordinate,
  axis: number,
  direction: number,
): Coordinate {
  const rotated =
    axis === 0
      ? [x, -direction * z, direction * y]
      : axis === 1
        ? [direction * z, y, -direction * x]
        : [-direction * y, direction * x, z];
  return rotated.map((value) => value || 0) as Coordinate;
}

export function turnCube(cubies: Cubie[], face: CubeFace, inverse = false) {
  const direction = face.layer * (inverse ? 1 : -1);
  for (const cubie of cubies) {
    if (cubie.position[face.axis] !== face.layer) continue;
    cubie.position = rotate(cubie.position, face.axis, direction);
    cubie.basis = cubie.basis.map((vector) =>
      rotate(vector, face.axis, direction),
    ) as Cubie["basis"];
  }
}

export function isCubeSolved(cubies: Cubie[]) {
  return cubies.every((cubie) =>
    cubeFaces.every(
      (face) =>
        cubie.home[face.axis] !== face.layer ||
        (cubie.position[face.axis] === face.layer &&
          cubie.basis[face.axis].every(
            (value, axis) => value === (axis === face.axis ? 1 : 0),
          )),
    ),
  );
}
