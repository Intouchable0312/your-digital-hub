declare global {
  interface Window {
    eel?: {
      commander_aliexpress: (items: any[], adresse: object) => void;
    };
  }
}

export {};
