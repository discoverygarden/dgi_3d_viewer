/**
 * @file
 * A Drupal behavior to display a 3D model using ThreeJS.
 */
import {ThreeDViewer} from './ThreeDViewer.js';

(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.dgi3DViewer = {
      /**
       * Settings expected to be replaced by drupalSettings for this viewer.
       */
      dgi3DViewerSettings: {
        canvas_loaded_class: 'dgi-3d-viewer-canvas-loaded',
        file_url: false,
        model_ext: 'gltf',
        container_classes: [
          'dgi-3d-viewer-canvas'
        ],
        progress_element_classes: [
          'dgi-3d-viewer-progress'
        ],
      },
    attach: function (context) {
      // Get the settings from drupalSettings.
      if (drupalSettings.dgi3DViewer) {
        this.dgi3DViewerSettings = {
          ...this.dgi3DViewerSettings,
          ...drupalSettings.dgi3DViewer
        };
      }

      // Get the settings from drupalSettings.
      const settings = this.dgi3DViewerSettings || {};

      // Get the container.
      let container_classes = settings.container_classes.join(' ');
      const threeViewerElement = context.getElementsByClassName(container_classes)[0];

      // If the three-viewer element exists, create a new ThreeDViewer instance and attach it to the element.
      if (threeViewerElement) {

        try {
          /**
           * Sets up the view manager.
           * @return {Viewer}
           */
          const viewer = new ThreeDViewer(threeViewerElement, settings, drupalSettings.isProd ?? true);

          viewer.loadModel(settings.file_url, settings.model_ext);
        }
        catch (err) {
          drupalSettings.isProd && console.log("An error occurred: " + err);
        }

      }
    },
  };
}(jQuery, Drupal, drupalSettings));
