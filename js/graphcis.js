import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/GLTFLoader.js'
import RotatingSphereVS from '../shaders/RotatingSphereVS.js';
import RotatingSphereFS from '../shaders/RotatingSphereFS.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const particleCount = 20000;
var last_time_activate = Date.now();
var start = Date.now();

/* TORUS PARTICLES */
const geometry = new THREE.TorusGeometry(10, 3, 20, 100);
const material = new THREE.PointsMaterial({ 
    size: 0.005});
const torus  =new THREE.Points(geometry, material);
torus.position.setZ(-30);
scene.add(torus);


/* PARTICLES */
var MathUtils = {
    getRandomInt: function(min, max)
    {
        return Math.floor(Math.random() * (max - min)) + min;
    },
    getDegree: function(radian)
    {
        return radian / Math.PI * 180;
    },
    getRadian: function(degrees)
    {
        return degrees * Math.PI / 180;
    },
    getSpherical: function(rad1, rad2, r)
    {
        var x = Math.cos(rad1) * Math.cos(rad2) * r;
        var y = Math.sin(rad1) * r;
        var z = Math.cos(rad1) * Math.sin(rad2) * r;

        return [x, y, z];
    }
};

class Mover {
    constructor() {
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.anchor = new THREE.Vector3();
        this.mass = 1;
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 1;
        this.time = 0;
        this.isActive = false;
    }
    init(vector) {
        this.position = vector.clone();
        this.velocity = vector.clone();
        this.anchor = vector.clone();
        this.acceleration.set(0, 0, 0);
        this.a = 1;
        this.time = 0;
    }
    updatePosition() {
        this.position.copy(this.velocity);
    }
    updateVelocity() {
        this.acceleration.divideScalar(this.mass);
        this.velocity.add(this.acceleration);
    }
    applyForce(vector) {
        this.acceleration.add(vector);
    }
    activate() {
        this.isActive = true;
    }
    inactivate() {
        this.isActive = false;
    }
};

var moversCount = 50000;
var movers = [];
var pointsGeometry = null;
var pointsMaterial = null;
var pointsGeometry2 = null;
var pointsMaterial2 = null;
var points = null;
var points2  =null;

var drawCount = 25000;

var antiGravity = new THREE.Vector3(0, 5, 0);

var activateMover = function()
{
    var count = 0;
    for(var i = 0; i < movers.length; i++)
    {
        var mover = movers[i];
        if(mover.isActive) continue;
        mover.activate();
        mover.velocity.y = -300;
        count++;
        if(count >= 90) break;
    }
};

var buildPoints = function()
{
    pointsGeometry = new THREE.BufferGeometry();
    pointsMaterial = new THREE.PointsMaterial({
        color: 0x77ffaa,
        size: 0.01,
        depthTest: false,
        blending: THREE.AdditiveBlending
    });

    pointsGeometry2 = new THREE.BufferGeometry();
    pointsMaterial2 = new THREE.PointsMaterial({
        color: 0x77ffaa,
        size: 0.01,
        depthTest: false,
        blending: THREE.AdditiveBlending
    });
    var vertices = [];
    var vertices2 = [];
    for(var i = 0; i < moversCount; i++)
    {
        var mover = new Mover();
        var range = (1 - Math.log(MathUtils.getRandomInt(2, 256)) / Math.log(256)) * 500;
        var rad = MathUtils.getRadian(MathUtils.getRandomInt(0, 360));
        var x = Math.cos(rad) * range;
        var z = Math.sin(rad) * range;
        mover.init(new THREE.Vector3(x, 1000, z));
        mover.mass = MathUtils.getRandomInt(300, 500) / 100;
        movers.push(mover);

        if(i % 2 === 0)
        {
            vertices.push(mover.position.x, mover.position.y, mover.position.z);
        }
        else
        {
            vertices2.push(mover.position.x, mover.position.y, mover.position.z);
        }
    }

    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    pointsGeometry.setDrawRange(0, drawCount);
    pointsGeometry.computeBoundingSphere();
    pointsGeometry2.setAttribute('position', new THREE.Float32BufferAttribute(vertices2, 3));
    pointsGeometry2.setDrawRange(0, drawCount);
    pointsGeometry2.computeBoundingSphere();
    
    points = new THREE.Points(pointsGeometry, pointsMaterial);
    points2 = new THREE.Points(pointsGeometry2, pointsMaterial2);
    scene.add(points);
    scene.add(points2);
};

var updatePoints = function()
{
    var pointsVertices = [];
    var pointsVertices2 = [];

    for(var i = 0; i < movers.length; i++)
    {
        var mover = movers[i];
        if(mover.isActive)
        {
            mover.applyForce(antiGravity);
            mover.updateVelocity();
            mover.updatePosition();

            if(mover.position.y > 500)
            {
                var range = (1 - Math.log(MathUtils.getRandomInt(2, 256)) / Math.log(256)) * 500;
                var rad = MathUtils.getRadian(MathUtils.getRandomInt(0, 360));
                var x = Math.cos(rad) * range;
                var z = Math.sin(rad) * range;
                mover.init(new THREE.Vector3(x, -300, z));
                mover.mass = MathUtils.getRandomInt(300, 500) / 100;
            }
        }
        if(i % 2 === 0)
        {
            pointsVertices.push(mover.position.x, mover.position.y, mover.position.z);
        }
        else
        {
            pointsVertices2.push(mover.position.x, mover.position.y, mover.position.z);
        }
    }
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVertices, 3));
    points.geometry.attributes.position.needsUpdate = true;
    points.geometry.computeBoundingBox();
    points.geometry.computeBoundingSphere();

    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVertices2, 3));
    points2.geometry.attributes.position.needsUpdate = true;
    points2.geometry.computeBoundingBox();
    points2.geometry.computeBoundingSphere();
};


/* MAIN SPHERE */
var sphereGeometry = new THREE.IcosahedronGeometry( 10, 64 );
var sphereMaterial = new THREE.ShaderMaterial({
    vertexShader: RotatingSphereVS,
    fragmentShader: RotatingSphereFS,
    uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.15 },
        uNoiseDensity: { value: 2 },
        uNoiseStrength: { value: 0.3 },
        uFreq: { value: 3 },
        uAmp: { value: 6 },
        uHue: { value: 0.4 },
        uOffset: { value: Math.PI * 2 },
        red: { value: 0 },
        green: { value: 0 },
        blue: { value: 0 },
        uAlpha: { value: 1.0 },
      },
      defines: {
        PI: Math.PI
      },
      transparent: true,
});
var sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphereMesh.position.setX(45);
sphereMesh.position.setZ(85);

sphereMesh.rotation.set(0.4, 1.0, -0.4);
scene.add(sphereMesh);

/* SECOND SPHERE */
var sSphereGeometry = new THREE.IcosahedronGeometry( 5, 64 );
var sSphereMaterial = new THREE.ShaderMaterial({
    vertexShader: RotatingSphereVS,
    fragmentShader: RotatingSphereFS,
    uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.5 },
        uNoiseDensity: { value: 3 },
        uNoiseStrength: { value: 0.5 },
        uFreq: { value: 3 },
        uAmp: { value: 6 },
        uHue: { value: 0.9 },
        uOffset: { value: Math.PI * 2 },
        red: { value: 0 },
        green: { value: 0 },
        blue: { value: 0 },
        uAlpha: { value: 1.0 },
      },
      defines: {
        PI: Math.PI
      },
      transparent: true,
});
var sSphereMesh = new THREE.Mesh(sSphereGeometry, sSphereMaterial);
sSphereMesh.position.setX(25);
sSphereMesh.position.setZ(47);
sSphereMesh.rotation.set(0.4, 1.0, -0.4);
scene.add(sSphereMesh);

/* 3D MODELS */
var bust = null;
const loaderBust = new GLTFLoader();
loaderBust.load(
    '../MarbleBustGL/marble_bust_01_4k.gltf',
    function(gltf){
        bust = gltf.scene.children[0];
        bust.scale.set(15, 15, 15);
        bust.position.setX(91);
        bust.position.setY(-4)
        bust.position.setZ(170);
        scene.add(bust);
    },
    function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	},
	// called when loading has errors
	function ( error ) {
		console.log( 'An error happened' );
	}
)

/* LIGHT */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8);
pointLight.position.set(100, 50, 200);
scene.add(pointLight);

//const PointLightHelper = new THREE.PointLightHelper(pointLight);
//const gridHelper = new THREE.GridHelper(200, 50);
//scene.add(gridHelper, PointLightHelper);

//const controls = new OrbitControls(camera, renderer.domElement);



/* MOUSE CONTROLS */
document.addEventListener('mousemove', animateParticles);
var mouseX = 0;
var mouseY = 0;

function animateParticles(event)
{
    mouseX = event.clientX;
    mouseY = event.clientY;
}

window.addEventListener('resize', onWindowResize);
function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function moveCamera()
{
    const t = document.body.getBoundingClientRect().top;

    camera.position.z = t * -0.15;
    camera.position.x = t * -0.08;
    camera.position.y = t * -0.0002;
}

document.body.onscroll = moveCamera;

const clock = new THREE.Clock();
function tick()
{
    const elapsedTime = clock.getElapsedTime();
    var now = Date.now();

    requestAnimationFrame(tick);

    if (now - last_time_activate > 10) {
        activateMover();
        last_time_activate = Date.now();
    }

    updatePoints();
    torus.rotation.x = 0.5 * elapsedTime;
    torus.rotation.y = 0.5 * elapsedTime;

    sphereMaterial.uniforms[ 'uTime' ].value = elapsedTime;
    sSphereMaterial.uniforms[ 'uTime' ].value = elapsedTime;

    bust.rotation.y = 0.5 * elapsedTime;

    //controls.update();
    renderer.render(scene, camera);
}
buildPoints();
tick();