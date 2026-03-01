import { prisma } from "../utils/prismaClient";

export const getPackages = async () => {
  try {
    const packages = await prisma.package.findMany();

    return packages;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error obtaining packages");
  }
};

export const getPackage = async (name: string, latestVersion: string) => {
  try {
    const packageRecord = await prisma.package.findUnique({
      where: {
        name_latestVersion: {
          name: name,
          latestVersion: latestVersion,
        },
      },
    });

    return packageRecord;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error obtaining package");
  }
};

export const createPackage = async (packageData: any) => {
  try {
    const newPackage = await prisma.package.create({
      data: packageData,
    });

    return newPackage;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error creating package");
  }
};

export const packageExists = async (name: string, latestVersion: string) => {
  try {
    const existingPackage = await prisma.package.findUnique({
      where: {
        name_latestVersion: {
          name: name,
          latestVersion: latestVersion,
        },
      },
    });

    return !!existingPackage;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error checking package existence");
  }
};

export const updatePackage = async (
  name: string,
  latestVersion: string,
  packageData: any
) => {
  try {
    const updatedPackage = await prisma.package.update({
      where: {
        name_latestVersion: {
          name: name,
          latestVersion: latestVersion,
        },
      },
      data: packageData,
    });

    return updatedPackage;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error updating package");
  }
};

export const deletePackage = async (name: string, latestVersion: string) => {
  try {
    await prisma.package.delete({
      where: {
        name_latestVersion: {
          name: name,
          latestVersion: latestVersion,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error deleting package");
  }
};

export const cleanupOrphanedPackages = async () => {
  try {
    // Get all packages
    const allPackages = await prisma.package.findMany();

    // Get all device packages
    const devicePackages = await prisma.devicePackage.findMany();
    const assignedPackageNames = new Set(devicePackages.map((dp: any) => dp.packageName));

    // Delete packages that are not assigned to any device
    const orphanedPackages = allPackages.filter(
      (pkg: any) => !assignedPackageNames.has(pkg.name)
    );

    for (const pkg of orphanedPackages) {
      await deletePackage(pkg.name, pkg.latestVersion);
    }

    return orphanedPackages.length;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error cleaning up orphaned packages");
  }
};
