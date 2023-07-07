/**
 * @file
 * Test compilation of ES6 code from three.js.
 */
 import * as THREE from 'three';
 // The following line is not needed, but it to verify addons are working.
 import { GLTFLoader } from 'addons/loaders/GLTFLoader.js';
 const loader = new GLTFLoader();

 (function ($, Drupal, drupalSettings, once) {
   console.log('in the drupal behavior');
   Drupal.behaviors.Dgi3DViewer = {

     attach: function (context, drupalSettings) {
       if (typeof THREE !== "undefined") {
         if (document.body.getAttribute('class') !== 'test-threejs-loaded') {
           this.renderThreeJS();
         }
         else {
           console.log('Attempted to load ThreeJS test, but it has already been loaded.');
         }
       }
       else {
         console.log('THREE is undefined');
       }
     },
     renderThreeJS: function () {
       console.log('Beginning of renderThreeJS');

       // The following test code is from https://github.com/mrdoob/three.js/tree/r151#usage
       const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
       camera.position.z = 1;

       const scene = new THREE.Scene();

       const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
       const material = new THREE.MeshNormalMaterial();

       const mesh = new THREE.Mesh( geometry, material );
       scene.add( mesh );

       const renderer = new THREE.WebGLRenderer( { antialias: true } );
       renderer.setSize( window.innerWidth, window.innerHeight );
       renderer.setAnimationLoop( animation );
       document.body.appendChild( renderer.domElement );
       document.body.setAttribute('class', 'test-threejs-loaded');

       // animation

       function animation( time ) {

         mesh.rotation.x = time / 2000;
         mesh.rotation.y = time / 1000;

         renderer.render( scene, camera );

       }
     }
   };
 }(jQuery, Drupal, drupalSettings, once));
