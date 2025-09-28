/// <reference types="vite/client" />

// Dichiarazioni globali per unplugin-icons
declare module '~icons/*' {
  import { FunctionComponent, SVGProps } from 'react'
  const component: FunctionComponent<SVGProps<SVGSVGElement>>
  export default component
}