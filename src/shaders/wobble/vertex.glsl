#include '../includes/simplexNoise4d.glsl'

attribute vec4 tangent;

uniform float uTime;
uniform float uTimeFrequency;
uniform float uPositionFrequency;
uniform float uStrength;
uniform float uWrapTimeFrequency;
uniform float uWrapPositionFrequency;
uniform float uWrapStrength;

varying vec2 Vuv;


float getWobble( vec3 position){

    vec3 warppedPosition = position;
    warppedPosition += simplexNoise4d( 
        vec4(position * uWrapPositionFrequency, 
            uTime * uWrapTimeFrequency) * uWrapStrength);

    return simplexNoise4d(
        vec4(warppedPosition * uPositionFrequency, uTime * uTimeFrequency)) 
        * uStrength;
}

void main(){
    // bitangent 
    vec3 bitangent = cross(normal, tangent.xyz);
    
    // distance for neighbors positions
    float shift = .01;
    vec3 positionA = csm_Position + tangent.xyz * shift;
    vec3 positionB = csm_Position + bitangent * shift;

    float wobble = getWobble(csm_Position);   
    csm_Position += wobble * normal;
    positionA += getWobble(positionA) * normal;
    positionB += getWobble(positionB) * normal;
    
    // compute normal
    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);

    csm_Normal = cross(toA, toB);

 

    //varying
    Vuv= uv;
}