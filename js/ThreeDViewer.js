import * as THREE from 'three';
import {GLTFLoader} from 'addons/loaders/GLTFLoader.js';
import {OBJLoader} from 'addons/loaders/OBJLoader.js';
import {MTLLoader} from 'addons/loaders/MTLLoader.js';
import {OrbitControls} from 'addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'addons/environments/RoomEnvironment.js';
import {strFromU8, unzipSync} from "addons/libs/fflate.module";
import {Spinner} from "spin.js";

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

    // Add a spin loader.
    var target = document.getElementsByClassName(this.settings.progress_element_classes)[0];
    var spinner = new Spinner();

    this.manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
      spinner.spin(target);
    };

    this.manager.onLoad = function ( ) {
      spinner.stop();
    };


    this.setRendererSettings();

    // Instantiate only once.
    if (this.container.classList.contains(this.settings.canvas_loaded_class)) {
      throw "Attempted to load ThreeJS viewer, but it has already been loaded.";
    } else {
      // Flag that the viewer has been loaded.
      this.container.appendChild(this.renderer.domElement);
      this.container.classList.add(this.settings.canvas_loaded_class);
    }

    // Add event listener for resize event.
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }


  loadModel(url, fileType = 'gltf') {
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
    if (this.settings.defaults.camera_settings.type === 'PerspectiveCamera') {
      this.camera = new THREE.PerspectiveCamera(
        Number(this.settings.defaults.camera_settings.settings.fov),
        Number(this.settings.defaults.camera_settings.settings.aspect),
        Number(this.settings.defaults.camera_settings.settings.near),
        Number(this.settings.defaults.camera_settings.settings.far)
      );
    }

    this.camera.position.set(
      Number(this.settings.defaults.camera_settings.settings.position.x),
      Number(this.settings.defaults.camera_settings.settings.position.y),
      Number(this.settings.defaults.camera_settings.settings.position.z)
    );
    this.camera.rotation.set(
      Number(this.settings.defaults.camera_settings.settings.rotation.x),
      Number(this.settings.defaults.camera_settings.settings.rotation.y),
      Number(this.settings.defaults.camera_settings.settings.rotation.z)
    );
  }


  addDefaults() {
    let defaults = [];
    // Check what needs to be overridden and override.
    for (const setting in this.settings.defaults) {
      switch (setting) {
        case 'room_environment':
          this.log && console.log('Using overridden room environment.');
          this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
          defaults.push('room_environment');
          break;
        case 'default_lights':
          this.log && console.log('Using overridden default lights.');

          const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
          hemiLight.position.set(0, 20, 0);
          this.scene.add(hemiLight);

          const dirLight = new THREE.DirectionalLight(0xffffff, 3);
          dirLight.position.set(3, 10, 10);
          dirLight.castShadow = true;
          dirLight.shadow.camera.top = 2;
          dirLight.shadow.camera.bottom = -2;
          dirLight.shadow.camera.left = -2;
          dirLight.shadow.camera.right = 2;
          dirLight.shadow.camera.near = 0.1;
          dirLight.shadow.camera.far = 40;
          this.scene.add(dirLight);
          defaults.push('default_lights');
          break;
        case 'camera_settings':
          this.log && console.log('Using overridden camera settings.');
          this.createCameraFromSettings();
          defaults.push('camera_settings');
          break;
        case 'background_color':
          this.log && console.log('Using overridden background color.');
          this.scene.background = new THREE.Color(this.settings.defaults[setting]);
          defaults.push('background_color');
          break;
      }
    }

    return defaults;
  }

  onObjLoaded(obj) {
    this.scene.add(obj);
    this.addDefaults();

    // Instantiating controls in the constructor does not work
    // because we are updating camera dynamically.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.render();
  }

  onGLTFLoaded(gltf) {
    this.scene.add(gltf.scene);
    let defaults = this.addDefaults();

    // Set camera from gltf if not overridden.
    if (!("camera_settings" in defaults) && gltf.cameras.length > 0) {
      this.log && console.log('Using camera from uploaded file.');
      this.camera = gltf.cameras[0];
    }

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


  loadGltf(url) {
    this.log && console.log('Beginning to render ' + url + ' with gltf loader');
    this.loader = new GLTFLoader(this.manager);
    this.loader.load(url, this.onGLTFLoaded.bind(this));
  }

  loadObj(url) {
    this.log && console.log('Beginning to render ' + url + ' with obj loader');
    this.loader = new OBJLoader(this.manager);
    if ('file_materials' in this.settings) {
      this.handleZIP(this.settings.file_materials);
    }
    this.loader.load(url, this.onObjLoaded.bind(this));
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
    var scaleVec = new THREE.Vector3(4, 4, 4).divide(size);
    let scale = Math.min(scaleVec.x, Math.min(scaleVec.y, scaleVec.z));
    obj.scale.setScalar(scale);

    return obj;
  }

  async handleZIP(contents) {
    let obj_file = null, mtl_file = null;
    let mime_type = 'image/';
    let filename = 'model';
    let obj_textures = {};


    const file = await fetch(contents).then(
      res => res.arrayBuffer()
    );
    let zip = unzipSync(new Uint8Array(file));

    // Poly

    Object.keys(zip).filter(key => !key.startsWith('__MACOSX')).forEach(key => {

      let key_lc = key.toLowerCase();

      if (key_lc.endsWith('.obj')) {

        filename = key;
        obj_file = zip [key];

      } else if (key_lc.endsWith('.mtl')) {

        mtl_file = zip [key];

      } else {

        let ext = key_lc.substring(key_lc.lastIndexOf('.') + 1);

        switch (ext) {

          case 'png':

            mime_type += 'png';

            break;

          case 'jpg':
          case 'pjp':
          case 'jpeg':
          case 'jfif':
          case 'pjpeg':

            mime_type += 'jpeg';

            break;

          case 'bmp':
          case 'dib':

            mime_type += 'bmp';

            break;

          case 'gif':

            mime_type += 'gif';

            break;

          case 'svg':

            mime_type += 'svg+xml';

            break;

          case 'webp':

            mime_type += 'webp';

            break;

          default:

            break;
        }


        let blob = new Blob([zip[key].buffer], {type: mime_type});
        obj_textures[key] = URL.createObjectURL(blob);
        URL.revokeObjectURL(blob);
      }

    });

    if (mtl_file !== null) {
      let materials = new MTLLoader(this.manager).parse(strFromU8(mtl_file));

      if (Object.entries(obj_textures).length !== 0) {

        for (const [key, value] of Object.entries(materials.materialsInfo)) {

          Object.keys(obj_textures).forEach(textureKey => {

            if (value.bump && textureKey.endsWith(value.bump.indexOf('/') > -1 ? value.bump.substring(value.bump.lastIndexOf('/') + 1) : value.bump)) value.bump = obj_textures[textureKey];
            if (value.norm && textureKey.endsWith(value.norm.indexOf('/') > -1 ? value.norm.substring(value.norm.lastIndexOf('/') + 1) : value.norm)) value.norm = obj_textures[textureKey];
            if (value.map_d && textureKey.endsWith(value.map_d.indexOf('/') > -1 ? value.map_d.substring(value.map_d.lastIndexOf('/') + 1) : value.map_d)) value.map_d = obj_textures[textureKey];
            if (value.map_ka && textureKey.endsWith(value.map_ka.indexOf('/') > -1 ? value.map_ka.substring(value.map_ka.lastIndexOf('/') + 1) : value.map_ka)) value.map_ka = obj_textures[textureKey];
            if (value.map_kd && textureKey.endsWith(value.map_kd.indexOf('/') > -1 ? value.map_kd.substring(value.map_kd.lastIndexOf('/') + 1) : value.map_kd)) value.map_kd = obj_textures[textureKey];
            if (value.map_ke && textureKey.endsWith(value.map_ke.indexOf('/') > -1 ? value.map_ke.substring(value.map_ke.lastIndexOf('/') + 1) : value.map_ke)) value.map_ke = obj_textures[textureKey];
            if (value.map_ks && textureKey.endsWith(value.map_ks.indexOf('/') > -1 ? value.map_ks.substring(value.map_ks.lastIndexOf('/') + 1) : value.map_ks)) value.map_ks = obj_textures[textureKey];
            if (value.map_bump && textureKey.endsWith(value.map_bump.indexOf('/') > -1 ? value.map_bump.substring(value.map_bump.lastIndexOf('/') + 1) : value.map_bump)) value.map_bump = obj_textures[textureKey];

          });

        }

      }
      materials.preload();
      this.loader.setMaterials(materials);
    }

  }
}
