'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WebGLShaderBackgroundProps {
  className?: string;
}

const WebGLShaderBackground: React.FC<WebGLShaderBackgroundProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.Camera;
    renderer?: THREE.WebGLRenderer;
    uniforms?: any;
    startTime?: number;
    animationId?: number;
  }>({});

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { current: state } = sceneRef;

    // Initialize Three.js scene
    state.startTime = Date.now();
    state.camera = new THREE.Camera();
    state.camera.position.z = 1;
    state.scene = new THREE.Scene();

    // Create geometry
    const geometry = new THREE.PlaneGeometry(16, 9);

    // Create uniforms for shader
    state.uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
      colsrows: { type: "v2", value: new THREE.Vector2() }
    };

    // Vertex shader
    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Fragment shader with RevivaTech brand colors
    const fragmentShader = `
      #define TWO_PI 6.28318530718
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 colsrows;

      float HueToRGB(float f1, float f2, float hue) {
        if (hue < 0.0)
          hue += 1.0;
        else if (hue > 1.0)
          hue -= 1.0;
        float res;
        if ((6.0 * hue) < 1.0)
          res = f1 + (f2 - f1) * 6.0 * hue;
        else if ((2.0 * hue) < 1.0)
          res = f2;
        else if ((3.0 * hue) < 2.0)
          res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
        else
          res = f1;
        return res;
      }

      vec3 HSLToRGB(vec3 hsl) {
        vec3 rgb;
        if (hsl.y == 0.0)
          rgb = vec3(hsl.z);
        else {
          float f2;
          if (hsl.z < 0.5)
            f2 = hsl.z * (1.0 + hsl.y);
          else
            f2 = (hsl.z + hsl.y) - (hsl.y * hsl.z);

          float f1 = 2.0 * hsl.z - f2;
          rgb.r = HueToRGB(f1, f2, hsl.x + (1.0/3.0));
          rgb.g = HueToRGB(f1, f2, hsl.x);
          rgb.b= HueToRGB(f1, f2, hsl.x - (1.0/3.0));
        }
        return rgb;
      }

      mat2 rotate2d(float _angle){
        return mat2(cos(_angle),-sin(_angle), sin(_angle),cos(_angle));
      }

      vec2 rotateFrom(vec2 uv, vec2 center, float angle){
        vec2 uv_ = uv - center;
        uv_ = rotate2d(angle) * uv_;
        uv_ = uv_ + center;
        return uv_;
      }

      float random(float value){
        return fract(sin(value) * 43758.5453123);
      }

      float random(vec2 tex){
        return fract(sin(dot(tex.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      vec2 random2D(vec2 uv){
        uv = vec2(dot(uv, vec2(127.1, 311.7)), dot(uv, vec2(269.5, 183.3)));
        return fract(sin(uv) * 43758.5453123);
      }

      vec3 random3D(vec3 uv){
        uv = vec3(dot(uv, vec3(127.1, 311.7, 120.9898)), dot(uv, vec3(269.5, 183.3, 150.457)), dot(uv, vec3(380.5, 182.3, 170.457)));
        return -1.0 + 2.0 * fract(sin(uv) * 43758.5453123);
      }

      float cubicCurve(float value){
        return value * value * (3.0 - 2.0 * value);
      }

      vec2 cubicCurve(vec2 value){
        return value * value * (3.0 - 2.0 * value);
      }

      vec3 cubicCurve(vec3 value){
        return value * value * (3.0 - 2.0 * value);
      }

      float noise(vec2 uv){
        vec2 iuv = floor(uv);
        vec2 fuv = fract(uv);
        vec2 suv = cubicCurve(fuv);

        float dotAA_ = dot(random2D(iuv + vec2(0.0)), fuv - vec2(0.0));
        float dotBB_ = dot(random2D(iuv + vec2(1.0, 0.0)), fuv - vec2(1.0, 0.0));
        float dotCC_ = dot(random2D(iuv + vec2(0.0, 1.0)), fuv - vec2(0.0, 1.0));
        float dotDD_ = dot(random2D(iuv + vec2(1.0, 1.0)), fuv - vec2(1.0, 1.0));

        return mix(
          mix(dotAA_, dotBB_, suv.x),
          mix(dotCC_, dotDD_, suv.x),
          suv.y);
      }

      float noise(vec3 uv){
        vec3 iuv = floor(uv);
        vec3 fuv = fract(uv);
        vec3 suv = cubicCurve(fuv);

        float dotAA_ = dot(random3D(iuv + vec3(0.0)), fuv - vec3(0.0));
        float dotBB_ = dot(random3D(iuv + vec3(1.0, 0.0, 0.0)), fuv - vec3(1.0, 0.0, 0.0));
        float dotCC_ = dot(random3D(iuv + vec3(0.0, 1.0, 0.0)), fuv - vec3(0.0, 1.0, 0.0));
        float dotDD_ = dot(random3D(iuv + vec3(1.0, 1.0, 0.0)), fuv - vec3(1.0, 1.0, 0.0));

        float dotEE_ = dot(random3D(iuv + vec3(0.0, 0.0, 1.0)), fuv - vec3(0.0, 0.0, 1.0));
        float dotFF_ = dot(random3D(iuv + vec3(1.0, 0.0, 1.0)), fuv - vec3(1.0, 0.0, 1.0));
        float dotGG_ = dot(random3D(iuv + vec3(0.0, 1.0, 1.0)), fuv - vec3(0.0, 1.0, 1.0));
        float dotHH_ = dot(random3D(iuv + vec3(1.0, 1.0, 1.0)), fuv - vec3(1.0, 1.0, 1.0));

        float passH0 = mix(
          mix(dotAA_, dotBB_, suv.x),
          mix(dotCC_, dotDD_, suv.x),
          suv.y);

        float passH1 = mix(
          mix(dotEE_, dotFF_, suv.x),
          mix(dotGG_, dotHH_, suv.x),
          suv.y);

        return mix(passH0, passH1, suv.z);
      }

      float rect(vec2 uv, vec2 length, float smooth){
        float dx = abs(uv.x - 0.5);
        float dy = abs(uv.y - 0.5);
        float lenx = 1.0 - smoothstep(length.x - smooth, length.x + smooth, dx);
        float leny = 1.0 - smoothstep(length.y - smooth, length.y + smooth, dy);
        return lenx * leny;
      }

      vec4 addGrain(vec2 uv, float time, float grainIntensity){
        float grain = random(fract(uv * time)) * grainIntensity;
        return vec4(vec3(grain), 1.0);
      }

      vec2 fishey(vec2 uv, vec2 center, float ratio, float dist){
        vec2 puv = uv + vec2(1.0);
        vec2 m = vec2(center.x, center.y/ratio) + vec2(1.0);
        vec2 d = puv - m;
        float r = sqrt(dot(d, d)); 
        float power = ( TWO_PI / (2.0 * sqrt(dot(m, m)))) * mix(0.1, 0.4, pow(dist, 0.75));
        float bind;
        if (power > 0.0) bind = sqrt(dot(m, m));

        vec2 nuv;
        if (power > 0.0)
          nuv = m + normalize(d) * tan(r * power) * bind / tan( bind * power);
        else if (power < 0.0)
         nuv = m + normalize(d) * atan(r * -power * 10.0) * bind / atan(-power * bind * 10.0);
        else 
          nuv = puv;

        return nuv - vec2(1.0);
      }

      float addStreamLine(vec2 uv, float rows, float height, float smooth){
        vec2 uvstream = uv * vec2(1.0, rows);
        float distFromCenter = abs(0.5 - fract(uvstream.y));
        float edge = smoothstep(height - smooth*0.5, height + smooth*0.5, distFromCenter);
        return edge;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 ouv = uv;
        float ratio = resolution.x / resolution.y;
        
        float horizontalGlitch = sin(random(uv.y) * TWO_PI);
        float noiseAmp = noise(vec2(uv.y + time * horizontalGlitch));
        float minAmp = 0.001;
        float maxAmp = 0.005;
        float amp = mix(minAmp, maxAmp, noiseAmp);
        uv.x = fract(uv.x + amp);
        
        uv = fishey(uv, vec2(0.5, 0.5/ratio), 1.0, 2.0);
        uv = rotateFrom(uv, vec2(0.5, 0.5 * ratio), time * 0.01);
        
        float indexCol = floor(uv.x * (colsrows.x * 2.0)/ratio);
        float randColIndex = random(indexCol);
        float orientation = randColIndex * 2.0 - 1.0;
        float minSpeed = 0.1;
        float maxSpeed = 0.5;
        float speed = mix(minSpeed, maxSpeed, randColIndex);
        
        uv.y += time * speed * orientation;
        uv.y += floor(time);
        
        vec2 nuv = uv * vec2(colsrows.x, colsrows.x / ratio);
        vec2 fuv = fract(nuv);
        vec2 iuv = floor(nuv);

        #define OCTAVE 4
        #define SUBDIV 3
        float sub = 0.0;
        for(int i=0; i<OCTAVE; i++){
          float randRatio = random(iuv + floor(time));
          float noiseRatio = sin(noise(vec3(iuv * 0.05, time)) * (TWO_PI * 0.5)) * 0.5;
          if(randRatio + noiseRatio > 0.5){
            nuv = fuv * vec2(SUBDIV);
            fuv = fract(nuv);
            iuv += floor(nuv + float(i));
            sub ++;
          }
        }
        float indexRatio = step(2.0, sub);
        float index = random(iuv);
        float isLight = step(0.5, index) * indexRatio;
            
        float randIndex = random(iuv * 0.01 + floor(time));
        float minSize = 0.05;
        float maxSize = 0.35;
        float size = mix(minSize, maxSize, randIndex);
        
        float shape = rect(fuv, vec2(size), 0.01) * isLight;
        
        float shiftNoiseAnimation = noise(vec2(iuv * time * 0.1)) * 0.25;
        float shiftRandomAnimation = random(vec2(time)) * 0.01;
        vec2 offset = vec2(shiftRandomAnimation + shiftNoiseAnimation, 0.0);
        float shapeRed = rect(fuv - offset, vec2(size), 0.01);
        float shapeGreen = rect(fuv + offset, vec2(size), 0.01);
        float shapeBlue = rect(fuv, vec2(size), 0.01);
        
        // RevivaTech Brand Colors
        // Background: Deep blue-black (#082F49)
        // Primary: Light Blue (#0EA5E9) 
        // Secondary: Teal (#14B8A6)
        // Accent: Light Blue variants (#38BDF8)
        
        float minHue = 0.5;  // Blue range
        float maxHue = 0.6;  // Blue-cyan range
        float hue = mix(minHue, maxHue, randIndex);
        
        float randIndex2 = random(iuv * 0.5 + floor(time));
        float minLightness = 0.4;
        float maxLightness = 0.8;
        float lightness = mix(minLightness, maxLightness, randIndex2);
        
        // RevivaTech background color (deep blue-black)
        vec3 background = vec3(0.032, 0.184, 0.286); // #082F49
        
        // RevivaTech foreground colors (light blue to teal range)
        vec3 foreground = HSLToRGB(vec3(hue, 0.9, lightness));
        
        vec3 shapeShift = vec3(shapeRed, shapeGreen, shapeBlue) * shape;
        vec3 final = mix(background, foreground, shapeShift);
        
        // VFX with reduced intensity for professional look
        float randGrain = random(time * 0.001);
        vec4 grain = addGrain(uv, time, 0.02 + randGrain * 0.02);
        
        vec2 souv = fract(ouv + vec2(0.0, time * 0.05));
        float brightness = sin(souv.y * TWO_PI * 2.0);
        float vhsLines = addStreamLine(souv, 200.0, 0.35, 0.01) * brightness;
    
        gl_FragColor = vec4(final, 1.0) + vhsLines * 0.02 + grain;
      }
    `;

    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms: state.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    // Create mesh and add to scene
    const mesh = new THREE.Mesh(geometry, material);
    state.scene.add(mesh);

    // Create renderer
    state.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    state.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(state.renderer.domElement);

    // Handle resize
    const onWindowResize = () => {
      if (!container || !state.uniforms || !state.renderer) return;
      
      const canvasWidth = container.offsetWidth;
      const canvasHeight = container.offsetHeight;
      
      state.uniforms.resolution.value.x = canvasWidth;
      state.uniforms.resolution.value.y = canvasHeight;
      
      const cols = 3.0;
      const rows = 2.0;
      state.uniforms.colsrows.value.x = cols;
      state.uniforms.colsrows.value.y = rows;
      
      state.renderer.setSize(canvasWidth, canvasHeight);
    };

    // Animation loop
    const animate = () => {
      if (!state.renderer || !state.scene || !state.camera || !state.uniforms || !state.startTime) return;
      
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - state.startTime) / 1000.0;
      state.uniforms.time.value = elapsedSeconds * 1.0;

      state.renderer.render(state.scene, state.camera);
      state.animationId = requestAnimationFrame(animate);
    };

    // Initialize
    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);
    animate();

    // Cleanup function
    return () => {
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
      }
      if (state.renderer && container.contains(state.renderer.domElement)) {
        container.removeChild(state.renderer.domElement);
      }
      window.removeEventListener('resize', onWindowResize);
      
      // Dispose Three.js resources
      if (state.renderer) state.renderer.dispose();
      if (state.scene) {
        state.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};

export default WebGLShaderBackground;