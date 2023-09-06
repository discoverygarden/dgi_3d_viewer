# DGI 3D Viewer

## Introduction
This module provides display plugins for 3D model files in Drupal.
Currently, the following formats are supported:
* GLTF

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

## Usage
Once the module is installed and configured, file fields using the `3D Model File` formatter to display a file field
will render the 3D model in the browser, provided the file is a supported format.

## Resources
For more information on the three.js library, and 3D model formats, see the following resources:
* [Three.js](https://threejs.org/)
* [GLTF](https://www.khronos.org/gltf/)

## Development
This module uses Webpack to compile the three.js library and our usage of it into a single file.
### Three.js Library Installation
Desired outcome: The appropriate version of three.js exists in
`/opt/www/drupal/libraries/three`; if the location needs to change, then
adjust the webpack.config.js file accordingly.

#### A Composer way to install three.js:
1. Add npm-asset handling to your drupal-project composer.json.
* See [this](https://www.drupal.org/docs/develop/using-composer/manage-dependencies#third-party-libraries) for more information.
* Make sure to add the following to the `extra` section of your composer.json:
  ```
  "installer-paths": {
    "libraries/{$name}": ["type:npm-asset"]
  }
  ```
2. Run `composer require npm-asset/three:^0.151.0` in the drupal-project root directory.

#### A manual way to install three.js:
1. In `/opt/www/drupal/libraries`, run `git clone --branch=<version tag> --depth=1 https://github.com/mrdoob/three.js.git`
   It's a rather large repo, so the `--depth=1` option is recommended to avoid downloading the entire history.

### Three.js Library Compilation
1. In the module root directory, run `npm install` to install the required packages.
2. Make sure the three.js library is installed in the correct location expected by webpack.config.js.
3. Make desired changes to the `js/*.es6.js` file(s), and run `webpack` to compile it to `js/*.js`.

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
