import { Request, Response, NextFunction } from "express";
import { createDevice, deviceExists, updateDevice } from "../service/deviceService";
import { createPackage, packageExists, cleanupOrphanedPackages } from "../service/packageService";
import { createDevicePackage, deleteAllDevicePackages, batchCreateDevicePackages } from "../service/devicePackageService";


export const addScan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scan = req.body;

        // Validate required fields
        if (!scan.hostname) {
            return res.status(400).json({ message: "Hostname is required" });
        }

        if (!scan.packages || !Array.isArray(scan.packages)) {
            return res.status(400).json({ message: "Packages array is required" });
        }

        // Prepare device data
        const deviceData = {
            hostname: scan.hostname,
            host: scan.host || "",
            os: scan.os || "",
            kernel: scan.kernel || "",
            ram: scan.ram || "",
            cpu: scan.cpu || "",
            type: scan.type || "",
            status: scan.status || "",
            uptime: scan.uptime || "",
            packagesCount: scan.packages.length,
        };

        // Create or update device
        const exists = await deviceExists(scan.hostname);
        if (!exists) {
            await createDevice(deviceData);
        } else {
            // Update device with new package count and other info
            await updateDevice(scan.hostname, deviceData);
        }

        // Delete all previous device package assignments
        await deleteAllDevicePackages(scan.hostname);

        // Collect packages to create and device packages to associate
        const packagesToCreate = [];
        const devicePackagesToCreate = [];
        const processedPackageNames = new Set<string>();

        for (const pkg of scan.packages) {
            if (!pkg.package || !pkg.version) {
                continue; // Skip packages without name or version
            }

            // Track processed packages to avoid duplicates
            if (processedPackageNames.has(pkg.package)) {
                continue;
            }
            processedPackageNames.add(pkg.package);

            const packageData = {
                name: pkg.package,
                type: pkg.type || "",
                latestVersion: pkg.version,
                link: pkg.link || "",
            };

            packagesToCreate.push(packageData);

            // Device package association
            devicePackagesToCreate.push({
                hostname: scan.hostname,
                packageName: pkg.package,
            });
        }

        // Batch create packages (with upsert to handle duplicates)
        if (packagesToCreate.length > 0) {
            await Promise.all(
                packagesToCreate.map(pkg =>
                    createPackage(pkg).catch(() => {
                        // Ignore duplicates
                    })
                )
            );
        }

        // Batch create device package associations
        if (devicePackagesToCreate.length > 0) {
            await batchCreateDevicePackages(devicePackagesToCreate);
        }

        // Clean up orphaned packages (packages not assigned to any device)
        const cleanedCount = await cleanupOrphanedPackages();

        return res.status(201).json({ 
            message: "Scan created successfully",
            packagesProcessed: devicePackagesToCreate.length,
            orphanedPackagesCleaned: cleanedCount
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, error);
        return next(error);
    }
};