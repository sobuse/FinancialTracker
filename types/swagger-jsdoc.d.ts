declare module 'swagger-jsdoc' {
  export interface Options {
    definition: {
      openapi: string;
      info: {
        title: string;
        version: string;
        description?: string;
      };
      servers?: {
        url: string;
        description?: string;
      }[];
      components?: {
        securitySchemes?: Record<string, any>;
        schemas?: Record<string, any>;
      };
      security?: Record<string, any>[];
      [key: string]: any;
    };
    apis: string[];
  }

  export default function swaggerJSDoc(options: Options): any;
}