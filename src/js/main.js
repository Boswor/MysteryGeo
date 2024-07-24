import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';


let camera, scene, renderer, controls, compass;
let rot = 0;
let sphere;
let scaleIndex = 1;
let animatedScale = 1;
let scaleArray = [0.8, 1, 1.5, 2, 3, 4];

function init() {
    let canvas = document.querySelector(".challenge");
    if (!canvas) return;

    let loader = document.createElement("div");
    loader.classList.add("loader");
    document.body.appendChild(loader);

    compass = document.querySelector(".compass");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0.1, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = -0.25 / scaleArray[scaleIndex];
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.update();

    // Sphère
    const geometry = new THREE.SphereGeometry(10, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const urlParams = new URLSearchParams(window.location.search);
    let limitBandwidthMode = urlParams.get('limitBandwidthMode') == 'false' ? false : true;
    const texture = textureLoader.load(limitBandwidthMode && typeof linkLimitBandwidthMode != 'undefined' && linkLimitBandwidthMode != '' ? linkLimitBandwidthMode : imgPath, function (e) {
        render();
        controls.update();

        let loader = document.querySelector(".loader");
        if (loader) loader.remove();

    });
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1;
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
    });
    material.transparent = true;
    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    updateCompass();
    animateDamping();
    controls.dampingFactor = 0.2;

    render();

    controls.addEventListener('change', (e) => {
        render();
        updateCompass();
    });


    window.addEventListener('resize', onWindowResize, false);


    canvas.addEventListener('wheel', (e) => {
        let dir = Math.sign(e.deltaY);

        if (dir == -1) {
            zoomIn();
        } else {
            zoomOut();
        }
    });
}

function animateZoom() {

    if (Math.abs(animatedScale - scaleArray[scaleIndex]) > 0.001) {
        animatedScale = (animatedScale * 9 + scaleArray[scaleIndex]) / 10;
    } else {
        animatedScale = scaleArray[scaleIndex];
    }
    camera.zoom = animatedScale;
    camera.updateProjectionMatrix();
    render();
    if (animatedScale != scaleArray[scaleIndex]) requestAnimationFrame(animateZoom);
}

function zoomIn() {
    scaleIndex += 1;
    zoom();
}

function zoomOut() {
    scaleIndex -= 1;
    zoom();
}

function zoom() {
    if (scaleIndex >= scaleArray.length) scaleIndex = scaleArray.length - 1;
    if (scaleIndex < 0) scaleIndex = 0;

    camera.zoom = scaleArray[scaleIndex];
    camera.updateProjectionMatrix();
    controls.rotateSpeed = -0.5 / scaleArray[scaleIndex];
    animateZoom();
}

function animateDamping() {
    controls.update();
    requestAnimationFrame(animateDamping);
}

function render() {
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.update();
    render();
}

function updateCompass() {
    if (compass) {
        var vector = new THREE.Vector3();
        var center = new THREE.Vector3();
        var spherical = new THREE.Spherical();
        vector.copy(camera.position).sub(center);
        spherical.setFromVector3(vector);
        rot = THREE.MathUtils.radToDeg(spherical.theta) + (northLocation - 90);
        compass.style.transform = "rotate(" + rot + "deg)";
    }
}


window.addEventListener('load', (e) => {
    init();

    const zoomInEl = document.querySelector(".zoom-in");
    const zoomOutEl = document.querySelector(".zoom-out");

    if (zoomInEl && zoomOutEl) {

        zoomInEl.addEventListener('click', (e) => {
            zoomIn();
        });

        zoomOutEl.addEventListener('click', (e) => {
            zoomOut();
        });
    }

    function closeAllPopups() {
        const openedPopups = document.querySelectorAll(".popup.is-active");
        openedPopups.forEach(openedPopup => {
            openedPopup.classList.remove("is-active");
        });

    }

    const popupTriggerElements = document.querySelectorAll(".has-popup");

    popupTriggerElements.forEach(popupTriggerElement => {
        popupTriggerElement.addEventListener("click", (e) => {
            closeAllPopups();

            let popup = popupTriggerElement.querySelector(".popup");
            if (popup) {
                popup.classList.add("is-active");
            }
            let btnClosePopup = popupTriggerElement.querySelector(".close-popup");
            if (btnClosePopup) {
                btnClosePopup.addEventListener("click", (e) => {
                    closeAllPopups();
                    e.stopPropagation();
                });
            }

            let popupContainer = popupTriggerElement.querySelector(".popup-container");
            if (popupContainer) {
                popup.addEventListener("click", (e) => {
                    if (!popupContainer.contains(e.target)) {
                        closeAllPopups();
                    }
                    e.stopPropagation();
                });
            }
            e.stopPropagation();
        });
    });

    const carte = document.querySelector(".map-container");
    if (carte) {
        var macarte = L.map('map').setView([47.297398, -1.393941], 6);
        var attr_osm = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
        L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
            attribution: [attr_osm].join(', '),
            minZoom: 1,
            maxZoom: 30
        }).addTo(macarte);

        const coordinates = document.querySelector(".coordinates");

        if (coordinates) {
            var theMarker = {};
            macarte.on('click', function (e) {
                let lat = e.latlng.lat;
                let lon = e.latlng.lng;

                let coorectedLat = e.latlng.wrap().lat;
                let coorectedLon = e.latlng.wrap().lng;

                coordinates.innerText = convertCoordinates(coorectedLat, true) + " " + convertCoordinates(coorectedLon, false)

                //Clear existing marker, 
                if (theMarker != undefined) {
                    macarte.removeLayer(theMarker);
                };

                //Add a marker to show where you clicked.
                theMarker = L.marker([lat, lon]).addTo(macarte);
            });
        }

        carte.addEventListener("click", (e) => {
            carte.classList.add("is-scaled");
            macarte.invalidateSize();
            e.stopPropagation();
        });

        window.addEventListener("click", (e) => {
            if (carte.classList.contains("is-scaled")) {
                if (!carte.contains(e.target)) {

                    carte.classList.remove("is-scaled");
                    macarte.invalidateSize();
                    e.stopPropagation();
                }
            }

        });

        carte.addEventListener("mouseenter", (e) => {
            carte.classList.add("is-scaled");
            macarte.invalidateSize();
            e.stopPropagation();
        });

        const resizeMapBtn = document.querySelector(".scale-map");
        if (resizeMapBtn) {
            resizeMapBtn.addEventListener("click", (e) => {
                carte.classList.toggle("is-scaled");
                macarte.invalidateSize();
                e.stopPropagation();
            });
        }
    }

    function convertCoordinates(coord, isLat) {
        let degrees = Math.trunc(coord);
        let minutes = (Math.abs(coord) - Math.abs(degrees)) * 60;
        let sign = Math.sign(degrees);
        let letter = '';
        if (sign == 1) {
            letter = isLat ? "N" : "E";
        } else {
            letter = isLat ? "S" : "W";
        }
        return letter + ("" + Math.abs(degrees)).padStart(isLat ? 2 : 3, '0') + "°" + (("" + minutes.toFixed(3)).padStart(6, '0'));
    }
})