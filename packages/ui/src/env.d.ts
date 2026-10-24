declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module '*.css';

declare module 'onnxruntime-web' {
  export const env: {
    wasm: {
      wasmPaths?: string | Record<string, string>;
      numThreads?: number;
      proxy?: boolean;
    };
    webgpu: Record<string, unknown>;
  };
}
