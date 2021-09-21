class PositionalAR {
    /**
     * 
     * @param {object} sceneObj An object that contains the fields scene, camera, and sceneRoot,
     *                     as well as a method animate(dt)
     * @param {boolean} antialias Whether or not to do antialiasing (true by default, but can be turned off
     *                            for performance)
     * @param {boolean} debug     Whether to print information about how many markers were seen
     */
    constructor(sceneObj, antialias, debug) {
        const that = this;
        this.sceneObj = sceneObj;
        this.scene = sceneObj.scene;
        this.camera = sceneObj.camera;
        this.sceneRoot = sceneObj.sceneRoot;

        this.keyboardDebugging = false;
        this.keyboard = new KeyboardHandler();
        if (antialias === undefined) {
            antialias = true;
        }
        if (debug === undefined) {
            debug = false;
        }
        this.debug = debug;
        let canvas = document.querySelector('canvas');
        this.canvas = canvas;
        // Setup three.js WebGL renderer
        this.renderer = new THREE.WebGLRenderer({antialias: antialias, canvas: this.canvas});
        this.renderer.setPixelRatio(Math.floor(window.devicePixelRatio));
        this.clock = new THREE.Clock();
        // Finally, setup the AR tracker
        this.setupTracker();
    }


    onResize() {
        if (!(this.renderer === undefined)) {
            this.arToolkitSource.onResize();
            this.arToolkitSource.copySizeTo(this.renderer.domElement);
            if (this.arToolkitContext.arController !== null) {
                this.arToolkitSource.copySizeTo(this.arToolkitContext.arController.canvas);
            }
        }
        if (!(this.effect === undefined)) {
            this.effect.setSize(window.innerWidth, window.innerHeight);
        }
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    enterFullscreen (el) {
        if (el.requestFullscreen) {
        el.requestFullscreen();
        } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
        } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
        }
    }

    /**
     * Setup the AR system, which is used to track position
     */
    setupTracker() {
        // create this.arToolkitSource
        const that = this;
        this.arToolkitSource = new THREEx.ArToolkitSource({
            sourceType : 'webcam',
        });
        this.arToolkitSource.init(function onReady(){
            that.onResize();
        });
        // handle resize event
        window.addEventListener('resize', function(){
            that.onResize();
        });

        // create arToolkitContext
        const arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: 'data/camera_para.dat',
            detectionMode: 'mono'
        });
        this.arToolkitContext = arToolkitContext;

        // copy projection matrix to camera when initialization complete
        arToolkitContext.init(function onCompleted(){
            that.camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
        });

        const markerRoot = new THREE.Group();
        this.markerRoot = markerRoot;
        this.scene.add(markerRoot);
        const markerControl = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
            type: 'pattern', patternUrl: "data/letterA.patt",
        });
        markerControl.addEventListener("markerFound", (e)=>{
            // TODO: We can do stuff once a marker is found
        });
        markerControl.addEventListener("markerLost", (e)=>{
            // TODO: We can do stuff once a marker is lost
        });
        
        // Tether the scene to this marker
        // TODO: We will want to involve multiple markers somehow
        markerRoot.add(this.sceneRoot);
    }

    /**
     * Perform an animation step, which consists of tracking the AR targets and updating
     * the global AR positions, as well as animating the scene forward in time
     * @param {float} timestamp The current time
     */
    animate(timestamp) {
        if ( this.arToolkitSource.ready !== false ) {
            this.arToolkitContext.update( this.arToolkitSource.domElement );
        }
        let deltaTime = this.clock.getDelta();
        this.sceneObj.animate(deltaTime);

        const arGroup = this.arGroup;
        if (this.keyboardDebugging) {
            const K = this.keyboard;
            if (K.movelr != 0 || K.moveud != 0 || K.movefb != 0) {
                arGroup.position.x -= K.movelr*K.walkspeed*delta/1000;
                arGroup.position.y -= K.moveud*K.walkspeed*delta/1000;
                arGroup.position.z += K.movefb*K.walkspeed*delta/1000;
            }
        }
        else {
            
        }
    }

}