import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCube,
  cubeFaces,
  isCubeSolved,
  turnCube,
} from "../../src/features/landing/cube-model.ts";

test("o cubo começa organizado, com 26 peças distintas e 54 adesivos", () => {
  const cube = createCube();
  assert.equal(cube.length, 26);
  assert.equal(new Set(cube.map(({ position }) => position.join())).size, 26);
  assert.equal(
    cube.reduce((count, { home }) => count + home.filter(Math.abs).length, 0),
    54,
  );
  assert.equal(isCubeSolved(cube), true);
});

test("cada giro preserva a camada oposta e quatro giros restauram todo o cubo", () => {
  for (const face of cubeFaces) {
    const cube = createCube();
    const original = structuredClone(cube);
    turnCube(cube, face);
    assert.equal(isCubeSolved(cube), false);
    for (let index = 0; index < cube.length; index++) {
      if (original[index].position[face.axis] !== face.layer)
        assert.deepEqual(cube[index], original[index]);
    }
    for (let turn = 0; turn < 3; turn++) turnCube(cube, face);
    assert.deepEqual(cube, original);
    assert.equal(isCubeSolved(cube), true);
  }
});

test("uma sequência e sua inversa restauram posições e orientações, sem perder peças", () => {
  const cube = createCube();
  const original = structuredClone(cube);
  const sequence = [...cubeFaces, ...cubeFaces.slice().reverse(), ...cubeFaces];
  for (const face of sequence) {
    turnCube(cube, face);
    assert.equal(new Set(cube.map(({ position }) => position.join())).size, 26);
    assert.ok(
      cube.every(({ position, basis }) =>
        [...position, ...basis.flat()].every(
          (value) => Number.isInteger(value) && Math.abs(value) <= 1,
        ),
      ),
    );
  }
  for (const face of sequence.reverse()) turnCube(cube, face, true);
  assert.deepEqual(cube, original);
  assert.equal(isCubeSolved(cube), true);
});
