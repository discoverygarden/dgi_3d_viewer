import * as THREE from 'three';
import {GLTFLoader} from 'addons/loaders/GLTFLoader.js';
import {OBJLoader} from 'addons/loaders/OBJLoader.js';
import {MTLLoader} from 'addons/loaders/MTLLoader.js';
import {OrbitControls} from 'addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'addons/environments/RoomEnvironment.js';
import * as JSZip from 'jszip';
import * as JSZipUtils from 'jszip-utils';

export class ThreeDViewer {

  constructor(container, settings, isProd) {
    this.log = !isProd;
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.settings = settings;
    this.camera = new THREE.PerspectiveCamera(67, window.innerWidth / window.innerHeight, 0.1, 800);
    this.camera.position.set(0, 1, -10);
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.manager = new THREE.LoadingManager();
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.materials = [];
    this.loader = [];

    this.setRendererSettings();

    // Instantiate only once.
    if (this.container.classList.contains(this.settings.canvas_loaded_class)) {
      throw "Attempted to load ThreeJS viewer, but it has already been loaded.";
    }
    else {
      // Flag that the viewer has been loaded.
      this.container.appendChild(this.renderer.domElement);
      this.container.classList.add(this.settings.canvas_loaded_class);
    }

    // Add event listener for resize event.
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }


  loadModel(url, fileType = 'gltf') {
    // Add a loader.
    var progressClass = this.settings.progress_element_classes;
    this.manager.onProgress = function (item, loaded, total) {
      let progress = Math.round(loaded / total * 100);
      let progress_display = '';
      if (progress < 100) {
        progress_display = progress + '%';
      }
      document.getElementsByClassName(progressClass)[0].innerText = progress_display;
    };

    //  loader.load(url, this.onModelLoaded.bind(this));
    switch (this.settings.model_ext) {
      case "obj":
        this.loadObj(url);
        break;
      case "glb":
      case "gltf":
      default:
        this.loadGltf(url);
        break;
    }
  }

  createCameraFromSettings() {
    if (this.settings.camera_settings.type === 'PerspectiveCamera') {
      this.camera = new THREE.PerspectiveCamera(
        this.settings.camera_settings.settings.fov,
        this.settings.camera_settings.settings.aspect,
        this.settings.camera_settings.settings.near,
        this.settings.camera_settings.settings.far
      );
    }

    this.camera.position.set(
      this.settings.camera_settings.settings.position.x,
      this.settings.camera_settings.settings.position.y,
      this.settings.camera_settings.settings.position.z
    );
    this.camera.rotation.set(
      this.settings.camera_settings.settings.rotation.x,
      this.settings.camera_settings.settings.rotation.y,
      this.settings.camera_settings.settings.rotation.z
    );
  }

  onObjLoaded(obj) {

    // let box = new THREE.Box3().setFromObject(obj);
    obj = this.centerAndScaleObject(obj);

    this.scene.add(obj);

    // Override camera from settings.
    if ("camera_settings" in this.settings) {
      this.log && console.log('Using overridden camera from camera settings.');
      this.createCameraFromSettings();
    } else {
      this.log && console.log('Using default camera.' + this.camera.type);
    }

    this.loadModelViewer();

    // Instantiating controls in the constructor does not work
    // because we are updating camera dynamically.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.render();
  }

  onGLTFLoaded(gltf) {
    this.scene.add(gltf.scene);

    // Override camera from settings.
    if ("camera_settings" in this.settings) {
      this.log && console.log('Using overridden camera from camera settings.');
      this.createCameraFromSettings();
    }
    // Add camera from file.
    else if (gltf.cameras.length > 0) {
      this.log && console.log('Using camera from uploaded file.');
      this.camera = gltf.cameras[0];
    }

    this.loadModelViewer();

    // Instantiating controls in the constructor does not work
    // because we are updating camera dynamically.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.render();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.resizeCanvasToDisplaySize();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  setRendererSettings() {
    // Just a size for the renderer to start with.
    // This will be updated in the render() function.
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Make sure the renderer canvas is responsive.
    // Rather than triggering a resize event, we just set the size of the
    // canvas to the size of the container element.
    this.renderer.domElement.style.maxWidth = '100%';
    this.renderer.domElement.style.maxHeight = '100%';
    this.renderer.domElement.style.objectFit = 'contain';
  }

  // getMaterialsFromMtl() {
  //   const loadingManager = new THREE.LoadingManager();
  //   JSZipUtils.getBinaryContent(this.settings.compressed_resources_url, function (err, data) {
  //     if (err) {
  //       console.log(err);
  //     }
  //
  //     const mtlLoader = new MTLLoader(loadingManager);
  //
  //     JSZip.loadAsync(data)
  //       .then(function (zip) {
  //         zip.forEach(function (relativePath, file) {
  //           loadingManager.setURLModifier(relativePath);
  //           console.log(relativePath);
  //
  //           if (relativePath.match(/\.(mtl)$/i)) {
  //             file.async("string")
  //               .then(function (content) {
  //                 this.loader.createMaterial(mtlLoader.parse(content));
  //               });
  //           }
  //         });
  //       });
  //   });
  // }


  loadGltf(url) {
    this.log && console.log('Beginning to render ' + url + ' with gltf loader');
    this.loader = new GLTFLoader(this.manager);
    this.loader.load(url, this.onGLTFLoaded.bind(this));
  }

  loadObj(url) {
    this.log && console.log('Beginning to render ' + url + ' with obj loader');
    this.loader = new OBJLoader(this.manager);
    if ('file_materials' in this.settings) {
      const loadingManager = new THREE.LoadingManager();

      JSZipUtils.getBinaryContent(this.settings.file_materials, (err, data) => {
        if (err) {
          console.log(err);
        }

        JSZip.loadAsync(data)
          .then((zip) => {
            zip.forEach((relativePath, file) => {
              console.log(relativePath);
              if (relativePath.match(/\.(mtl)$/i)) {
                file.async('string')
                  .then((content) => {
                    const materials = new MTLLoader(loadingManager).parse(content);
                    materials.preload();
                    this.loader.setMaterials(materials);
                  });
              }
            });
          });
      });
    }
    this.loader.load(url, this.onObjLoaded.bind(this));
  }

  loadModelViewer() {
    if ("room_environment" in this.settings) {
      this.log && console.log('Using room environment.');
      this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    }
  }

  resizeCanvasToDisplaySize() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      // you must pass false here or three.js sadly fights the browser
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.lookAt(0, 0, 0);
      this.camera.updateProjectionMatrix();
    }
  }

  centerAndScaleObject(obj) {
    var box = new THREE.Box3().setFromObject(obj);
    var center = new THREE.Vector3();
    box.getCenter(center);
    obj.position.sub(center); // center the model

    // Scale.
    let size = new THREE.Vector3();
    box.getSize(size);
    var scaleVec = new THREE.Vector3(3, 3, 3).divide(size);
    let scale = Math.min(scaleVec.x, Math.min(scaleVec.y, scaleVec.z));
    obj.scale.setScalar(scale);

    return obj;
  }
}
