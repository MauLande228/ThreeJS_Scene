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
var last_time_activate = Date.now();
var start = Date.now();

/* TORUS PARTICLES */
const geometry = new THREE.TorusGeometry(10, 3, 20, 100);
const material = new THREE.PointsMaterial({ 
    size: 0.005});
const torus  =new THREE.Points(geometry, material);
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
    /*applyFriction() {
        var friction = Force.friction(this.acceleration, 0.1);
        this.applyForce(friction);
    }
    applyDragForce(value) {
        var drag = Force.drag(this.acceleration, value);
        this.applyForce(drag);
    }
    hook(restLength, k) {
        var force = Force.hook(this.velocity, this.anchor, restLength, k);
        this.applyForce(force);
    }*/
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
        //tranparent: true,
        //opacity: 0.5,
        depthTest: false,
        blending: THREE.AdditiveBlending
    });

    pointsGeometry2 = new THREE.BufferGeometry();
    pointsMaterial2 = new THREE.PointsMaterial({
        color: 0x77ffaa,
        size: 0.01,
        //tranparent: true,
        //opacity: 0.5,
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
            //pointsGeometry.vertices.push(mover.positon);
        }
        else
        {
            vertices2.push(mover.position.x, mover.position.y, mover.position.z);
            //pointsGeometry2.vertices.push(mover.positon);
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
    //points.geometry.vertices = pointsVertices;
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVertices, 3));
    points.geometry.attributes.position.needsUpdate = true;
    points.geometry.computeBoundingBox();
    points.geometry.computeBoundingSphere();

    //points2.geometry.vertices = pointsVertices2;
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsVertices2, 3));
    points2.geometry.attributes.position.needsUpdate = true;
    points2.geometry.computeBoundingBox();
    points2.geometry.computeBoundingSphere();
};

/*const particles = new THREE.BufferGeometry();
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
scene.add(particlesMesh);*/


/* SPHERE */
var sphereGeometry = new THREE.IcosahedronGeometry( 10, 64 );
var sphereMaterial = new THREE.ShaderMaterial({
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
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
      // wireframe: true,
      // side: THREE.DoubleSide
      transparent: true,
});
var sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphereMesh.position.setX(50);
sphereMesh.rotation.set(0.4, 1.0, -0.4);
scene.add(sphereMesh);

/* LIGHT */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8);
pointLight.position.set(25, 50, 25);
scene.add(pointLight);

const PointLightHelper = new THREE.PointLightHelper(pointLight);
const gridHelper = new THREE.GridHelper(200, 50);
scene.add(gridHelper, PointLightHelper);

const controls = new OrbitControls(camera, renderer.domElement);



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

const clock = new THREE.Clock();
function tick()
{
    const elapsedTime = clock.getElapsedTime();
    var now = Date.now();
    var bgTime = elapsedTime;

    requestAnimationFrame(tick);

    if (now - last_time_activate > 10) {
        activateMover();
        last_time_activate = Date.now();
    }

    //particlesMesh.rotation.y = -0.1*elapsedTime;
    updatePoints();
    torus.rotation.x = 0.5 * elapsedTime;
    torus.rotation.y = 0.5 * elapsedTime;
//    sphereMaterial.uniforms[ 'uTime' ].value = .00025 * ( Date.now() - start );
    sphereMaterial.uniforms[ 'uTime' ].value = elapsedTime;

    /*if(mouseX > 0)
    {
        particlesMesh.rotation.x = -mouseY * (bgTime * 0.00008);
        particlesMesh.rotation.y = mouseX * (bgTime * 0.00008);
    }*/
    controls.update();
    renderer.render(scene, camera);
}
buildPoints();
tick();