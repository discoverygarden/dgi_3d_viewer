import * as THREE from 'three';
import {GLTFLoader} from 'addons/loaders/GLTFLoader.js'; // @TODO: Add support for other loaders.
import {OrbitControls} from 'addons/controls/OrbitControls.js';

export class ThreeDViewer {

  constructor(container, settings, isProd) {
    this.log = !isProd;
    this.container = container;
    this.scene = new THREE.Scene();
    this.settings = settings;
    this.camera = new THREE.PerspectiveCamera(67, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({antialias: true});

    // Just a size for the renderer to start with.
    // This will be updated in the render() function.
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Make sure the renderer canvas is responsive.
    // Rather than triggering a resize event, we just set the size of the
    // canvas to the size of the container element.
    this.renderer.domElement.style.maxWidth = '100%';
    this.renderer.domElement.style.maxHeight = '100%';
    this.renderer.domElement.style.objectFit = 'contain';

    // Add the canvas to the container.
    this.container.appendChild(this.renderer.domElement);

    // Flag that the viewer has been loaded.
    this.container.classList.add(this.settings.canvas_loaded_class);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }


  loadModel(url, fileType = 'gltf') {
    const loader_list = {
      "glb": GLTFLoader,
      "gltf": GLTFLoader,
    };

    this.log && console.log('Beginning to render ' + url + ' with ' + loader_list[fileType] + '.');

    const loader = new loader_list[fileType]();

    var progressClass = this.settings.progress_element_classes;
    loader.load(url, this.onModelLoaded.bind(this), function (xhr) { // Callback function to be executed on progress.
        let progress = Math.round(xhr.loaded / xhr.total * 100);
        let progress_display = '';
        if (progress < 100) {
          progress_display = progress + '%';
        }
        document.getElementsByClassName(progressClass)[0].innerText = progress_display;
      },
      function (error) {
        console.error(error);
      }
    );

  }

  createCameraFromSettings() {
    if (this.settings.camera_settings.type == 'OrthographicCamera') {
      this.camera = new THREE.OrthographicCamera(
        this.settings.camera_settings.settings.left,
        this.settings.camera_settings.settings.right,
        this.settings.camera_settings.settings.top,
        this.settings.camera_settings.settings.bottom,
        this.settings.camera_settings.settings.near,
        this.settings.camera_settings.settings.far
      );
    }
    else if (this.settings.camera_settings.type == 'PerspectiveCamera') {
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
      this.settings.camera_settings.settings.rotation.z,
    );
  }

  onModelLoaded(gltf) {
    this.scene.add(gltf.scene);

    // Override camera from settings.
    if ("camera_settings" in this.settings) {
      this.log && console.log('Using overridden camera from camera settings.');
      this.createCameraFromSettings();
    }

    // Add camera from file.
    if (gltf.cameras.length > 0) {
      this.log && console.log('Using camera from uploaded file.');
      this.camera = gltf.cameras[0];
    }

   // Override light.
    if ("light" in this.settings) {
      this.log && console.log('Using overridden light from settings.');
      this.createLightFromSettings();
    }
    else if (!this.hasLights(gltf)) {
      this.log && console.log('Using default light.');
      let light = new THREE.AmbientLight(); // White light
      this.scene.add(light);
    }

    // Instatiting controls in the constructor does not work
    // because we are updating camera dynamically.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.render();
  }

  createLightFromSettings() {
    var light = [];
    switch (this.settings.light) {
      case 'PointLight':
        light = new THREE.PointLight();
        break;
      case 'DirectionalLight':
        light = new THREE.DirectionalLight();
        break;
      case 'SpotLight':
        light = new THREE.SpotLight();
        break;
      case 'HemisphereLight':
        light = new THREE.HemisphereLight();
        break;
      case 'AmbientLight':
      default:
        light = new THREE.AmbientLight();
        break;
    }

    this.scene.add(light);
  }

  hasLights(gltf) {
    let hasLights = false;

    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Light) {
        hasLights = true;
      }
    });

    return hasLights;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    // These width and height values don't get set until the renderer is
    // added to the DOM, so we have to wait until this point to set them.
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    // This needs to be done anytime the camera is updated.
    this.camera.updateProjectionMatrix();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
}
