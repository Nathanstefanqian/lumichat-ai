export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'meting-js': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        server?: string;
        type?: string;
        id?: string;
        autoplay?: string;
        order?: string;
        loop?: string;
        theme?: string;
        'list-folded'?: string;
        'list-max-height'?: string;
      }, HTMLElement>;
    }
  }
}
