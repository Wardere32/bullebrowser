declare module '*.svg' {
  const url: import('next').StaticImageData | string;
  export default url;
}
declare module '*.png' {
  const url: import('next').StaticImageData | string;
  export default url;
}

declare module '@bullebrowser/brand-tokens/logo.svg' {
  const url: import('next').StaticImageData;
  export default url;
}
declare module '@bullebrowser/brand-tokens/wordmark.png' {
  const url: import('next').StaticImageData;
  export default url;
}
declare module '@bullebrowser/brand-tokens/wordmark-light.png' {
  const url: import('next').StaticImageData;
  export default url;
}
