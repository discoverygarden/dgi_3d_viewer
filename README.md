# DGI 3D Viewer

## Introduction
This module provides display plugins for 3D model files in Drupal.
Currently, the following formats are supported:
* GLTF/GLB - GLB is preferred, since some browsers fail to handle large GLTFs.
* OBJ

## Three.js Library Usage Notes
Given that Drupal does not yet fully support ES6 modules, specifically
importmaps, and we want to use the latest version of three.js, we have
a slightly unusual setup for using the three.js library that results in
compiling our usage of three.js into a single file that can be loaded.
Such a setup results in the actual three.js library only needing to be
present to compile when developing, and not needing to be present in
production. However, if this process becomes unnecessary in the future,
then we can simply use the three.js library directly, without compiling.

## Requirements (for development)
This module requires the following modules/libraries:
* [Three.js 0.151.0](https://github.com/mrdoob/three.js/releases/tag/r151 )
  * And the following 'Add-ons':
    * [GLTFLoader](https://github.com/mrdoob/three.js/blob/r151/examples/jsm/loaders/GLTFLoader.js)
    * [OBJLoader](https://github.com/mrdoob/three.js/blob/r151/examples/jsm/loaders/OBJLoader.js)
    * [MTLLoader](https://github.com/mrdoob/three.js/blob/r151/examples/jsm/loaders/MTLLoader.js)
    * [OrbitControls](https://github.com/mrdoob/three.js/blob/r151/examples/jsm/controls/OrbitControls.js)
    * [RoomEnvironment](https://github.com/mrdoob/three.js/blob/r151/examples/jsm/environments/RoomEnvironment.js)
    * [strFromU8, unzipSync](https://github.com/mrdoob/three.js/blob/r151/examples/jsm/libs/fflate.module.js)
* [Node.js](https://nodejs.org/en/)
* [NPM](https://www.npmjs.com/)
* [Webpack](https://webpack.js.org/)
* [Babel](https://babeljs.io/)

## Installation
Install the module as usual,
see [this](https://www.drupal.org/docs/8/extending-drupal-8/installing-drupal-8-modules) for further information.

## Configuration
To use the 3D viewer, you need to configure the display plugin(s) for the file field you want to use.
The `3D Model File` widget provided by this module adds the ability to preview the uploaded file
provided the file is a supported format. The `3D Model File` formatter provided by this module can be
used independently of the widget if you do not want file preview added to the ingest form.
The preview provided by the widget could be useful for users to verify that they have uploaded the correct file,
and to verify that the file is supported by the 3D viewer. However, the preview loading time can be slow, depending
on the model being previewed, and so it may be best to use the regular file widget in some cases.

### Bonus configuration: Camera, Lights, Textures
The following is a work in progress to be replaced by a MediaSource Plugin

Sometimes we want to accommodate viewing a 3D model that does not include anything aside from the object itself in
the uploaded file, so we need a way to configure a camera and some light; without light and something to perceive
the light bouncing off the model, only darkness is rendered. Additionally, sometimes we would rather not generate
a GLB, and just upload the OBJ and related MTL and texture files. These capabilities are available, but rely on
the existence of certain configuration entities.

Configuration expectations:
* media.type.3d_object
  * field_media_file: the field that uses the 3D File Formatter
  * field_customcamera: programmatically flattened values from field_camera
  * field_camera: Entity reference link to paragraphs.paragraphs_type.perspective_camera_settings
  * field_materials_zip
  * field_room_environment
  * field_background_color
  * field_add_default_lights

The camera is chosen in this order: a camera configured through `field_camera`; otherwise, for GLB/GLTF, the
first camera in the file; otherwise the viewer frames the model automatically, backing the camera off along its
default viewing direction until the whole model fits the view and orbiting around the model's centre. The model
itself is never moved or rescaled.

## Usage
Once the module is installed and configured, file fields using the `3D Model File` formatter to display a file field
will render the 3D model in the browser, provided the file is a supported format.

## Resources
For more information on the three.js library, and 3D model formats, see the following resources:
* [Three.js](https://threejs.org/)
* [GLTF](https://www.khronos.org/gltf/)

## Development

This module uses Webpack to compile the three.js library and our usage of it into a small set of files.

### Library Compilation

1. In the module root directory, run `npm install` to install the required packages.
2. Make desired changes to the `js/*.es6.js` file(s)
3. Compile the packages with:
   * `npm run build-dev`; or,
   * `npm run build-prod` as desired
   * or some other invocation of `webpack` to compile it to `js/dist/*.js`.

For an example of compilation, and a way to check if issues are with your code
changes or the rest of the setup, see `js/test_threejs.es6.js`,
`webpack_test_threejs.config.js`, and the `build-test` script in `package.json`.
Try deleting `js/test_threejs.js` and recompiling it with `npm run build-test`.

## Sponsors
* [UNR](https://library.unr.edu/)

## Maintainers
Current maintainers:
* [discoverygarden](https://discoverygarden.ca/)

## License
[GPLv3](http://www.gnu.org/licenses/gpl-3.0.txt)
