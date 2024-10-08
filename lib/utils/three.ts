import { Vector3, Object3D, Box3, Camera, Mesh } from 'three';
import type {
  InstancedMesh as InstancedMeshType,
  PerspectiveCamera,
} from 'three';

export const computeBoxForObject = function (object: Mesh) {
  const tempVector = new Vector3();
  const tempBox = new Box3();
  const box = new Box3();

  // Computes the world-axis-aligned bounding box of an object (including its children),
  // accounting for both the object's, and children's, world transforms

  object.updateWorldMatrix(false, false);

  var geometry = object.geometry;

  if (geometry !== undefined) {
    if (geometry.boundingBox === null) {
      geometry.computeBoundingBox();
    }

    // @ts-ignore - isInstanceMesh isn't typed correctly
    if (object.isInstancedMesh) {
      // @ts-ignore
      const matrix4Array = object.instanceMatrix.array;
      const arrayLength = matrix4Array.length;
      for (var posOffset = 12; posOffset < arrayLength; posOffset += 16) {
        tempVector.set(
          matrix4Array[posOffset],
          matrix4Array[1 + posOffset],
          matrix4Array[2 + posOffset],
        );
        tempBox.expandByPoint(tempVector);
      }
    } else if (geometry.boundingBox != null) {
      tempBox.copy(geometry.boundingBox);
    }
    tempBox.applyMatrix4(object.matrixWorld);

    box.expandByPoint(tempBox.min);
    box.expandByPoint(tempBox.max);
  }

  var children = object.children;

  for (var i = 0, l = children.length; i < l; i++) {
    box.expandByObject(children[i]);
  }

  return box;
};

export const getSizeOfSingleInstance = (
  object: InstancedMeshType,
  camera: Camera,
) => {
  const box = new Box3().setFromObject(object);
  const objectWidth = box.max.x - box.min.x;
  const objectHeight = box.max.y - box.min.y;

  // Get 3D positions of top left corner (assuming they're not rotated)
  const topLeft = new Vector3(
    object.position.x - objectWidth / 2,
    object.position.y + objectHeight / 2,
    object.position.z,
  );
  const bottomRight = new Vector3(
    object.position.x + objectWidth / 2,
    object.position.y - objectHeight / 2,
    object.position.z,
  );

  // This converts x, y, z to the [-1, 1] range
  topLeft.project(camera);
  bottomRight.project(camera);

  // This converts from [-1, 1] to [0, windowWidth]
  const topLeftX = ((1 + topLeft.x) / 2) * window.innerWidth;
  const topLeftY = ((1 - topLeft.y) / 2) * window.innerHeight;

  const bottomRightX = ((1 + bottomRight.x) / 2) * window.innerWidth;
  const bottomRightY = ((1 - bottomRight.y) / 2) * window.innerHeight;

  return {
    width: Math.abs(bottomRightY - topLeftY),
    height: Math.abs(bottomRightX - topLeftX),
  };
};

// Taken from https://github.com/mrdoob/three.js/issues/18643

export const getObjectSizeInViewSpace = (
  object: InstancedMeshType,
  camera: Camera,
) => {
  const box = computeBoxForObject(object);
  const objectWidth = box.max.x - box.min.x;
  const objectHeight = box.max.y - box.min.y;

  // Get 3D positions of top left corner (assuming they're not rotated)
  const topLeft = new Vector3(
    object.position.x - objectWidth / 2,
    object.position.y + objectHeight / 2,
    object.position.z,
  );
  const bottomRight = new Vector3(
    object.position.x + objectWidth / 2,
    object.position.y - objectHeight / 2,
    object.position.z,
  );

  // This converts x, y, z to the [-1, 1] range
  topLeft.project(camera);
  bottomRight.project(camera);

  // This converts from [-1, 1] to [0, windowWidth]
  const topLeftX = ((1 + topLeft.x) / 2) * window.innerWidth;
  const topLeftY = ((1 - topLeft.y) / 2) * window.innerHeight;

  const bottomRightX = ((1 + bottomRight.x) / 2) * window.innerWidth;
  const bottomRightY = ((1 - bottomRight.y) / 2) * window.innerHeight;

  return { topLeftX, topLeftY, bottomRightX, bottomRightY };
};

export const getObjectSize = (object: InstancedMeshType, camera: Camera) => {
  const points = getObjectSizeInViewSpace(object, camera);

  const tlx = points.topLeftX;
  const tly = points.topLeftY;
  const brx = points.bottomRightX;
  const bry = points.bottomRightY;

  return {
    width: Math.abs(bry - tly),
    height: Math.abs(brx - tlx),
  };
};

// obj - your object (THREE.Object3D or derived)
// point - the point of rotation (THREE.Vector3)
// axis - the axis of rotation (normalized THREE.Vector3)
// theta - radian value of rotation
// pointIsWorld - boolean indicating the point is in world coordinates (default = false)
export const rotateAroundPoint = (
  obj: Object3D,
  point: Vector3,
  axis: Vector3,
  theta: number,
  pointIsWorld: boolean = false,
) => {
  pointIsWorld = pointIsWorld === undefined ? false : pointIsWorld;

  if (pointIsWorld) {
    obj.parent?.localToWorld(obj.position); // compensate for world coordinate
  }

  obj.position.sub(point); // remove the offset
  obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
  obj.position.add(point); // re-add the offset

  if (pointIsWorld) {
    obj.parent?.worldToLocal(obj.position); // undo world coordinates compensation
  }

  obj.rotateOnAxis(axis, theta); // rotate the OBJECT
};

export const fitCameraToCenteredObject = function (
  camera: PerspectiveCamera,
  object: Object3D,
  size: Vector3,
  offset?: number,
) {
  object.updateMatrix();
  object.updateMatrixWorld();
  object.updateWorldMatrix(true, true);

  const boundingBox = new Box3();
  boundingBox.setFromObject(object);

  // figure out how to fit the box in the view:
  // 1. figure out horizontal FOV (on non-1.0 aspects)
  // 2. figure out distance from the object in X and Y planes
  // 3. select the max distance (to fit both sides in)
  //
  // The reason is as follows:
  //
  // Imagine a bounding box (BB) is centered at (0,0,0).
  // Camera has vertical FOV (camera.fov) and horizontal FOV
  // (camera.fov scaled by aspect, see fovh below)
  //
  // Therefore if you want to put the entire object into the field of view,
  // you have to compute the distance as: z/2 (half of Z size of the BB
  // protruding towards us) plus for both X and Y size of BB you have to
  // figure out the distance created by the appropriate FOV.
  //
  // The FOV is always a triangle:
  //
  //  (size/2)
  // +--------+
  // |       /
  // |      /
  // |     /
  // | F° /
  // |   /
  // |  /
  // | /
  // |/
  //
  // F° is half of respective FOV, so to compute the distance (the length
  // of the straight line) one has to: `size/2 / Math.tan(F)`.
  //
  // FTR, from https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
  // the camera.fov is the vertical FOV.

  const fov = camera.fov * (Math.PI / 180);
  const fovh = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
  let dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
  let dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
  let cameraZ = Math.max(dx, dy);

  // offset the camera, if desired (to avoid filling the whole canvas)
  if (offset !== undefined && offset !== 0) cameraZ *= offset;

  camera.position.set(0, 0, cameraZ);

  // set the far plane of the camera so that it easily encompasses the whole object
  const minZ = boundingBox.min.z;
  const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

  camera.far = cameraToFarEdge * 3;
  camera.updateProjectionMatrix();

  return { boundingBox, cameraZ };
};
