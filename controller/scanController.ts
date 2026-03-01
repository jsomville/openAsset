import { Request, Response, NextFunction } from "express";
import { createScan } from "../service/scanService"; 


export const addScan = async (req: Request, res: Response, next: NextFunction) => {
    try {

        console.log("Adding scan", req.body);

        const scan = "some scan";

        await createScan(scan);

        return res.status(201).json({"message": "Scan created"});
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        return next(error);
    }
};