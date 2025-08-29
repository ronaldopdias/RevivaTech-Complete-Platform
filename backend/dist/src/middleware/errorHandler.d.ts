import { Request, Response, NextFunction } from 'express';
interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}
export declare const errorHandler: (error: CustomError, req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map