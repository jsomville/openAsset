import { Request, Response, NextFunction } from "express";
import { createDevice, deleteDevice, deviceExists, getDevice, getDevices, updateDevice } from "../service/deviceService";

export const getAllDevices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.error("@@ Getting all devices @@", { path: req.path, method: req.method });
        const devices = await getDevices(); 

        return res.status(200).json(devices);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        return next(error);
    }
};

export const getOneDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        const device = await getDevice(id);
        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        return res.status(200).json(device);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        return next(error);
    }
};

export const addDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Adding device", req.body);
        const deviceData = req.body;

        //check if device exists
        if (await deviceExists(deviceData.hostname)) {
            return res.status(400).json({ message: "Device already exists" });
        }   

        const devices = await createDevice(deviceData);

        return res.status(201).json(devices);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        return next(error);
    }
};

export const modifyDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {    
        console.log("Modifying device", req.body);

        const id = String(req.params.id);
        const deviceData = req.body;

        if (id !== deviceData.hostname) {
            return res.status(400).json({ message: "Hostname in URL and body must match" });
        }

        const devices = await updateDevice(id, deviceData);

        return res.status(201).json(devices);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        return next(error);
    }
};

export const removeDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = String(req.params.id);
        await deleteDevice(id);

        return res.status(201).json({ message: "Device deleted successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        return next(error);
    }
};

