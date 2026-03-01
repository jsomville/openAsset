import { Request, Response, NextFunction } from "express";
import { getPackages, getPackage } from "../service/packageService";
import { getDevicePackages } from "../service/devicePackageService";

export const getAllPackages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const packages = await getPackages();

        return res.status(200).json(packages);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        return next(error);
    }
};

export const getPackagesByDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hostname = String(req.params.hostname);
        
        // Get all device package associations for this device
        const devicePackages = await getDevicePackages();
        const filteredAssociations = devicePackages.filter((dp: any) => dp.hostname === hostname);

        if (filteredAssociations.length === 0) {
            return res.status(200).json([]);
        }

        // Get package details for each association
        const packageNames = filteredAssociations.map((dp: any) => dp.packageName);
        const allPackages = await getPackages();
        const packages = allPackages.filter((pkg: any) => packageNames.includes(pkg.name));

        return res.status(200).json(packages);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        return next(error);
    }
};
