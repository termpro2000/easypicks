/// <reference types="vite/client" />

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          zonecode: string;
          addressType?: string;
          bname?: string;
          buildingName?: string;
        }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}
