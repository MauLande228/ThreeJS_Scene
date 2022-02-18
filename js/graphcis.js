import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/GLTFLoader.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

const particleCount = 5000;

/* Torus particle */
const geometry = new THREE.TorusGeometry(10, 3, 20, 100);
const material = new THREE.PointsMaterial({ 
    size: 0.005});
const torus  =new THREE.Points(geometry, material);
scene.add(torus);
/***********/

/* Particles */
const particles = new THREE.BufferGeometry();
const particlesMaterial = new THREE.PointsMaterial({ 
    size: 0.1,
    vertexColors: true});
const positionArray = [];
const colorsArray = [];
const color = new THREE.Color();

const n = 1000, n2 = n / 2; 

for(let i = 0; i < particleCount; i++)
{
    //positions
    const x = Math.random() * n - n2;
    const y = Math.random() * n - n2;
    const z = Math.random() * n - n2;
    positionArray.push(x, y, z);

    //colors
    const vx = (x / n) + 0.5;
    const vy = (y / n) + 0.5;
    const vz = (z / n) + 0.5;

    color.setRGB(vx, vy, vz);
    colorsArray.push(color.r, color.g, color.b);
}

particles.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3));
particles.setAttribute('color', new THREE.Float32BufferAttribute(colorsArray, 3));
particles.computeBoundingSphere();

const particlesMesh = new THREE.Points(particles, particlesMaterial);
scene.add(particlesMesh);


/* LIGHT */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8);
pointLight.position.set(25, 50, 25);
scene.add(pointLight);

window.addEventListener('resize', onWindowResize);

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();
function tick()
{
    const elapsedTime = clock.getElapsedTime();

    requestAnimationFrame(tick);
    torus.rotation.x = 0.5 * elapsedTime;
    torus.rotation.y = 0.5 * elapsedTime;
    renderer.render(scene, camera);
}

tick();