import { prisma } from "../utils/prismaClient";

export const getDevicePackages = async () => {
  try {
    const devicePackages = await prisma.devicePackage.findMany();

    return devicePackages;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error obtaining device packages");
  }
};

export const getDevicePackage = async (hostname: string, packageName: string) => {
  try {
    const devicePackage = await prisma.devicePackage.findUnique({
      where: {
        hostname_packageName: {
          hostname: hostname,
          packageName: packageName,
        },
      },
    });

    return devicePackage;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error obtaining device package");
  }
};

export const createDevicePackage = async (devicePackageData: any) => {
  try {
    const newDevicePackage = await prisma.devicePackage.create({
      data: devicePackageData,
    });

    return newDevicePackage;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error creating device package");
  }
};

export const devicePackageExists = async (hostname: string, packageName: string) => {
  try {
    const existingDevicePackage = await prisma.devicePackage.findUnique({
      where: {
        hostname_packageName: {
          hostname: hostname,
          packageName: packageName,
        },
      },
    });

    return !!existingDevicePackage;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error checking device package existence");
  }
};

export const updateDevicePackage = async (
  hostname: string,
  packageName: string,
  devicePackageData: any
) => {
  try {
    const updatedDevicePackage = await prisma.devicePackage.update({
      where: {
        hostname_packageName: {
          hostname: hostname,
          packageName: packageName,
        },
      },
      data: devicePackageData,
    });

    return updatedDevicePackage;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error updating device package");
  }
};

export const deleteDevicePackage = async (hostname: string, packageName: string) => {
  try {
    await prisma.devicePackage.delete({
      where: {
        hostname_packageName: {
          hostname: hostname,
          packageName: packageName,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error deleting device package");
  }
};

export const getPackagesByDevice = async (hostname: string) => {
  try {
    const devicePackages = await prisma.devicePackage.findMany({
      where: {
        hostname: hostname,
      },
    });

    return devicePackages;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error obtaining packages for device");
  }
};

export const deleteAllDevicePackages = async (hostname: string) => {
  try {
    await prisma.devicePackage.deleteMany({
      where: {
        hostname: hostname,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    throw new Error("Error deleting device packages");
  }
};
