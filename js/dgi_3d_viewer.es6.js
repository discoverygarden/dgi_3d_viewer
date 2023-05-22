/**
 * @file
 * A Drupal behavior to display a 3D model using ThreeJS.
 */
import * as THREE from 'three'; // Import ThreeJS.
import {GLTFLoader} from 'addons/loaders/GLTFLoader.js';
import {Camera} from "three"; // Import the GLTFLoader addon.
// TODO: Add support for other loaders.
// TODO: Add support for OrbitControls.
// Set mapping of file extensions to supported loaders.
const file_extension_to_loader = {
  'glb': GLTFLoader,
  'gltf': GLTFLoader,
};

/**
 * Setting up the Drupal behavior.
 */
(function ($, Drupal, drupalSettings) {
  'use strict';
  Drupal.behaviors.dgi3DViewer = {
    /**
     * Settings expected to be replaced by drupalSettings for this viewer.
     */
    dgi3DViewerSettings: {
      canvas_loaded_class: 'dgi-3d-viewer-canvas-loaded',
      file_url: false,
      container_classes: [
        'dgi-3d-viewer-canvas'
      ],
      progress_element_classes: [
        'dgi-3d-viewer-progress'
      ],
      perspective_camera_settings: {
        fov: 50,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 2000,
        position: {
          x: 0,
          y: 0,
          z: 25
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0
        }
      }
    },
    /**
     * Attach the behavior.
     * @param context
     */
    attach: function (context) {
      // Get the settings from drupalSettings.
      if (drupalSettings.dgi3DViewer) {
        this.dgi3DViewerSettings = {
          ...this.dgi3DViewerSettings,
          ...drupalSettings.dgi3DViewer
        };
      }
      // Get the container.
      let container_classes = this.dgi3DViewerSettings.container_classes.join(' ');
      const container = context.getElementsByClassName(container_classes)[0];
      if (container) {
        // Verify that ThreeJS is loaded.
        if (typeof THREE !== "undefined") {
          // Verify that the viewer has not already been loaded.
          if (!container.classList.contains(this.dgi3DViewerSettings.canvas_loaded_class)) {
            // Get the path to the model.
            let model_path = this.dgi3DViewerSettings.file_url;
            if (!model_path) {
              // This is present for debugging purposes.
              console.error('File path to model is not defined.');
            } else {
              // Get the type of model, and the name of the appropriate loader.
              let model_ext = model_path ? model_path.split('.').pop() : 'undefined';
              if (model_ext in file_extension_to_loader) {
                let loader_class = file_extension_to_loader[model_ext];
                this.renderThreeJS(model_path, loader_class, container);
              } else {
                // If this gets triggered, the field widget should be hardened to prevent it.
                console.error('No loader currently supported for file extension: ' + model_ext);
              }
            }
          } else {
            // This is present for debugging purposes, not something the user needs to see.
            console.log('Attempted to load ThreeJS viewer, but it has already been loaded.');
          }
        } else {
          // This is present for debugging purposes, not something the user needs to see.
          console.error('THREE is undefined');
        }
      } else {
        // This likely means the element attaching this behavior needs to be hardened.
        console.log('No container element found for placing the 3D viewer.');
        console.error('Expected to find an element with the following classes: ' + container_classes);
      }
    },
    renderThreeJS: function (model_path, loader_class, container) {
      // Again, this is present for debugging purposes to facilitate development.
      console.log('Beginning to render ' + model_path + ' with ' + loader_class.name + '.');
      const scene = new THREE.Scene();
      const loader = new loader_class();
      let camera = new Camera();
      let camera_settings = this.dgi3DViewerSettings.camera_settings;
      let light = this.dgi3DViewerSettings.light;

      // Setting this up as an array of Loader callbacks to allow for future expansion.
      let onLoad = {
        GLTFLoader: function (gltf) {
          // Add the scene.
          scene.add(gltf.scene);

          // If there is a camera defined in settings, override objevt camera.
          if (camera_settings) {
            console.log('Creating a camera from settings.');
            if (camera_settings.type == 'OrthographicCamera') {
              camera = new THREE.OrthographicCamera(
                camera_settings.settings.left,
                camera_settings.settings.right,
                camera_settings.settings.top,
                camera_settings.settings.bottom,
                camera_settings.settings.near,
                camera_settings.settings.far
              );
            } else if (camera_settings.type == 'PerspectiveCamera') {
              camera = new THREE.PerspectiveCamera(
                camera_settings.settings.fov,
                camera_settings.settings.aspect,
                camera_settings.settings.near,
                camera_settings.settings.far
              );
            }

            camera.position.set(
              camera_settings.settings.position.x,
              camera_settings.settings.position.y,
              camera_settings.settings.position.z
            );
            camera.rotation.set(
              camera_settings.settings.rotation.x,
              camera_settings.settings.rotation.y,
              camera_settings.settings.rotation.z,
            );
          } else {
            // If the scene has camera(s), use the first one for the viewer.
            console.log('Using object camera.');
            if (gltf.cameras.length > 0) {
              camera = gltf.cameras[0];
            } else {
              // Default camera.
              console.log('Default camera.');
              camera = new THREE.PerspectiveCamera(67, window.innerWidth / window.innerHeight, 0.1, 1000);
            }
          }
          // If the viewer settings, has a light set, override light.
          if (light) {
            console.log('Light from settings.');
            scene.add(new THREE[light]);
          }
          // Add lights if none exist.
          // There is not a built-in way to check for lights in the GLTF file like there is for cameras.
          // Therefore, we search the whole scene for lights, and stop if we find one.
          else if(scene.children.length > 0)
          {
            let has_light = false;

            function checkSceneForLights(child) {
              if (!has_light) {
                console.log(child.type);
                if (child.children.length > 0) {
                  child.children.forEach(checkSceneForLights);
                }
                if (child instanceof THREE.Light) {
                  has_light = true;
                }
              }
            }

            scene.children.forEach(checkSceneForLights);
            if (!has_light) {
              console.log('No lights found in gltf file, adding default light.');
              let light = new THREE.AmbientLight(); // White light
              scene.add(light);
            }
          }
          // The last step for the 'onLoad' callback is to render the scene.
          render();
        }
      };

      // Get the progress loader element.
      const progress_element_classes = '.' + this.dgi3DViewerSettings.progress_element_classes.join(' .');

      // Pretty safe to generalize the loader.load() call to all supported
      // loaders. We can only get to this point if the file extension is
      // supported, and if the loader is defined. Looking through provided
      // ThreeJS Loaders, they all seem to expect the same load() parameters.
      // However, if a loader has a different expectation for load()
      // parameters, that would be identified in implementation of support
      // for that loader, and can be handled as a special case at that point.
      loader.load(
        model_path, // URL of model file to be loaded.
        onLoad[loader_class.name], // Callback function to be executed on load.
        function (xhr) { // Callback function to be executed on progress.
          let progress = Math.round(xhr.loaded / xhr.total * 100);
          let progress_display = '';
          if (progress < 100) {
            progress_display = progress + '%';
          }
          $(progress_element_classes, document).text(progress_display);
        },
        function (error) { // Callback function to be executed on error.
          console.error('An error happened:' + error);
        }
      );

      // Set up the renderer. Currently, the same for all models.
      const renderer = new THREE.WebGLRenderer({antialias: true});
      // Just a size for the renderer to start with.
      // This will be updated in the render() function.
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Make sure the renderer canvas is responsive.
      // Rather than triggering a resize event, we just set the size of the
      // canvas to the size of the container element.
      renderer.domElement.style.maxWidth = '100%';
      renderer.domElement.style.maxHeight = '100%';
      renderer.domElement.style.objectFit = 'contain';
      // Add the canvas to the container.
      container.appendChild(renderer.domElement);
      // Flag that the viewer has been loaded.
      container.classList.add(this.dgi3DViewerSettings.canvas_loaded_class);

      function render() {
        // These width and height values don't get set until the renderer is
        // added to the DOM, so we have to wait until this point to set them.
        camera.aspect = container.clientWidth / container.clientHeight;
        renderer.setSize(container.clientWidth, container.clientHeight);
        // This needs to be done anytime the camera is updated.
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      }
    }
  };
}(jQuery, Drupal, drupalSettings));
