import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useRef } from "react";
import { Color, MeshStandardMaterial, Vector3 } from "three";
import CSM from 'three-custom-shader-material'

const originalMaterial = new MeshStandardMaterial({ 
  color: 'white', 
  toneMapped: false,
})

const fragment = /* glsl */ `

/* Credit to Harry Alisavakis, original code author for Unity game engine
// Website: https://halisavakis.com/my-take-on-shaders-teleportation-dissolve/
// Twitter: @HarryAlisavakis
// Copy Right: Harry Alisavakis, 2018 & Rickey Otano, 2023
// License: Free to use and modify, keep this comment in shader code
*/

uniform float uNoiseSize;
uniform float uProgress;
uniform vec3 uDissolveColor;
uniform vec3 uDissolveDirection;
uniform float uDissolveWidth;

in vec2 vUv;
in vec3 vWorldPosition;

// random function

float random(vec2 coords)
{

  return fract( sin( dot( coords, vec2( 12.9898, 78.233 ) ) ) * 43758.5453123 );

}

void main()
{

  // save varying to local

  vec2 uv = vUv;

  // vec3 for transform direction

  vec3 transitionDirection = uDissolveDirection;

  // emission threshold for color increase value

  float emissionThreshold = uDissolveWidth * 0.01;

  float progress = uProgress;

  // calculate the area to clip/hide from view


  float clipTest = ( ( dot( vWorldPosition, vec3( 0., 1., 0. ) ) + 1. ) / 2. ) - progress;

  // generate square pattern

  float squares =  random( floor( uv * uNoiseSize ) );
  float squaresStep = step( squares * progress, clipTest );


  // discard fragments that are less than 0.0

  if( squaresStep < 0.01 ) discard;

  

  // create cliped ring

  float emissionRing = step( squares, progress );


  // create color out of emission ring

  vec4 emissionColor = vec4( vec3( emissionRing ), 1.0);

  emissionColor *= vec4( uDissolveColor, 1.0 );



  vec4 color = mix( csm_DiffuseColor.rgba, emissionColor, emissionRing );

  csm_DiffuseColor = color;

}

`

const vertex = /* glsl */ `

uniform float uNoiseSize;
uniform float uProgress;
uniform vec3 uDissolveColor;
uniform float uDissolveWidth;

out vec2 vUv;
out vec3 vWorldPosition;

float random(vec2 coords)
{

  return fract( sin( dot( coords, vec2( 12.9898, 78.233 ) ) ) * 43758.5453123 );

}

void main()
{

  // save uv as varying

  vUv = uv;
  float progress = uProgress;
  vec3 newPosition = position;

  // world coordinates

  vec4 localPosition = modelMatrix * vec4( position, 1.0 );

  // vec3 worlPosition = localPosition.xyz;

  // vec3 teleportDirection = vec3( 0., 1., 0. );

  vWorldPosition = normalize( localPosition.xyz );

  // float clipTest = ( ( dot( worlPosition, vec3( 0., -1., 0. ) ) + 1. ) / 2. ) - progress;

  // float squaresStep = step(clipTest, random( floor( uv * uNoiseSize ) * progress ) );

  // csm_Position.xyz += teleportDirection * squaresStep * random( newPosition.xy ) * abs( clipTest );



  


  // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

}

`
// direction vectors for animation

const directions =
{
  top: new Vector3( 0, 1, 0 ),
  bottom: new Vector3( 0, -1, 0 ),
  left: new Vector3( 1, 0, 0 ),
  right: new Vector3( -1, 0, 0 )
}

export const Experience = () => 
{

  // controls
  const { Size, Progress, Width, effectColor } = useControls(
    {
      Size: 
      {
        value: 60,
        min: 1,
        max: 150,
        step: 0.001
      },
      Progress:
      {
        value: 3,
        min: -3,
        max: 3,
        step: 0.001
      },
      Width:
      {
        value: 8,
        min: 1,
        max: 20,
        step: 0.001
      },
      effectColor:
      {
        value: '#0082B2'
      }
    }
  )

  const uniforms = useRef(
    {
      uNoiseSize: { value: 60 },
      uProgress: { value: 1 },
      uDissolveColor: { value: new Color('#0082B2').multiplyScalar(15)},
      uDissolveDirection: { value: new Vector3( 0, 1, 0 ) },
      uDissolveWidth: { value: 8 },
    }
  )


  useFrame(( ) =>
  {

    uniforms.current.uNoiseSize.value = Size
    uniforms.current.uProgress.value = Progress
    uniforms.current.uDissolveWidth.value = Width
    uniforms.current.uDissolveColor.value = new Color( effectColor ).multiplyScalar( 15 )

  })

  
  return (
    <>
      
      <mesh
        frustumCulled={ false }
      >
        <icosahedronGeometry
          args={[2,8]}
        />

        <CSM 
          baseMaterial={ originalMaterial }
          vertexShader={ vertex }
          fragmentShader={ fragment }
          uniforms={ uniforms.current }
          transparent
        />
        
      </mesh>
    </>
  );
};
