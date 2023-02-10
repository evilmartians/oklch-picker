import { Vec3Like } from "./vec3.js";

type Network = {
  [k: number]: {
    adjacentIndices: {
      [kk: number]: boolean
    }
  }
};

export function laplacianFilter(vertices: Vec3Like[], indices: number[], iterations: number): Vec3Like[] {
  let network = buildNetwork(indices);

  for (let i = 0; i < iterations; i++) {
    vertices = laplacianFilterStep(network, vertices);
  }

  return vertices;
}

function laplacianFilterStep(network: Network, vertices: Vec3Like[]): Vec3Like[] {
  let filteredVertices: Vec3Like[] = [];

  for (let i = 0; i < vertices.length; i++) {
    let connections = network[i].adjacentIndices;
    let newVertex = {x: 0, y: 0, z: 0};

    for (let key of Object.keys(connections)) {
      let index = Number(key);
      let currentVertex = vertices[index];
      newVertex.x += currentVertex.x;
      newVertex.y += currentVertex.y;
      newVertex.z += currentVertex.z;
    }

    let connectionsLength = Object.keys(connections).length;
    filteredVertices[i] = {
      x: newVertex.x / connectionsLength,
      y: newVertex.y / connectionsLength,
      z: newVertex.z / connectionsLength
    };
  }

  return filteredVertices;
}

function buildNetwork(indices: number[]): Network {
  let network: Network = {};

  for (let i = 0; i < indices.length; i += 3) {
    let indexA = indices[i];
    let indexB = indices[i + 1];
    let indexC = indices[i + 2];

    if (!(indexA in network)) network[indexA] = { adjacentIndices: {} };
    if (!(indexB in network)) network[indexB] = { adjacentIndices: {} };
    if (!(indexC in network)) network[indexC] = { adjacentIndices: {} };

    network[indexA].adjacentIndices[indexB] = true;
    network[indexA].adjacentIndices[indexC] = true;

    network[indexB].adjacentIndices[indexA] = true;
    network[indexB].adjacentIndices[indexC] = true;

    network[indexC].adjacentIndices[indexA] = true;
    network[indexC].adjacentIndices[indexB] = true;
  }

  return network;
}


