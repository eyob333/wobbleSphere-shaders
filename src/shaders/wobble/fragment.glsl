
varying vec2 Vuv;
varying float vWobble;

uniform vec3 uColorA;
uniform vec3 uColorB;

void main(){

    float colorMix = smoothstep(-1., 1., vWobble);
    csm_DiffuseColor.xyz = mix(uColorA, uColorB, colorMix);

    // Mirror step
    // csm_Metalness = step(.25, colorMix);
    // csm_Roughness = 1. - csm_Metalness;

    // shiny tip
    csm_Roughness = 1. - colorMix;
}