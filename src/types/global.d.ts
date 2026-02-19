// Global module shims for packages without types or when type packages are not installed
declare module "sonner";
declare module "lucide-react";
declare module "recharts";
declare module "react-router-dom";
declare module "next-themes";
declare module "input-otp";
declare module "react-day-picker";
declare module "vaul";
// Provide a minimal React namespace for JSX & Form event types when @types/react is not installed
declare module "react" {
  // minimal (and permissive) definitions to avoid build-time type errors if @types/react isn't installed
  export function useState<S = any>(
    initialState: S | (() => S),
  ): [S, (s: S) => void];
  export function useEffect(
    effect: () => void | (() => void),
    deps?: any[],
  ): void;
  export function useRef<T = any>(initial?: T): { current: T };
  export function useCallback<T extends (...args: any[]) => any>(
    cb: T,
    deps?: any[],
  ): T;
  export function useMemo<T>(cb: () => T, deps?: any[]): T;
  export const Fragment: any;
  export default {} as any;
  export type ReactNode = any;
}
declare namespace React {
  interface FormEvent<T = Element> extends Event {
    currentTarget: any;
    target: any;
  }
  interface ChangeEvent<T = Element> extends Event {
    target: any;
  }
  type FC<P = {}> = (props: P) => any;
  type HTMLAttributes<T = any> = { [attr: string]: any };
  type ImgHTMLAttributes<T = any> = HTMLAttributes<T> & {
    src?: string;
    alt?: string;
  };
  type InputHTMLAttributes<T = any> = HTMLAttributes<T> & {
    name?: string;
    value?: any;
  };
  type MouseEvent<T = any> = any;
}

// Minimal JSX intrinsic elements to stop JSX errors when type definitions are missing
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// shim for react/jsx-runtime module which TypeScript wants for automatic runtime
declare module "react/jsx-runtime" {
  export function jsx(type: any, props?: any, key?: any): any;
  export function jsxs(type: any, props?: any, key?: any): any;
  export function jsxDEV(type: any, props?: any, key?: any): any;
}
// Pagination result type
interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
