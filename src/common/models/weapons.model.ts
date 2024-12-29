import ak47 from "@art/weapons/ak-47.png?url";
import shotgun from "@art/weapons/shotgun.png?url";
import svd from "@art/weapons/svd.png?url";
import makarov from "@art/weapons/makarov.png?url";

export type FireMode = "auto" | "semi-auto" | "burst";
export interface Firearm {
  name: string;
  rpm: number;
  fireModes: FireMode[];
  caliber: Caliber;
  velocity: number;
  accuracy: number;
  magsize: number;
  reloadTime: number;
  image: string;
}

export type Caliber = "9x18" | "7.62x39" | "12x70" | "5.45x39" | "5.56x45";
export interface BulletModel {
  energy: number;
  caliber: string;
  energyDrop: number,
  maxRange: number,
  submunitions?: number;
}

export const firearms: Record<string, () => Firearm> = {
  "AK-47": () => ({
    name: "AK-47",
    rpm: 600,
    fireModes: ["burst", "semi-auto", "auto"],
    caliber: "5.45x39",
    velocity: 10,
    accuracy: 0.7,
    magsize: 30,
    reloadTime: 3000,
    image: ak47
  }),
  "Makarov": () => ({
    name: "Makarov",
    rpm: 250,
    fireModes: ["semi-auto"],
    caliber: "9x18",
    velocity: 7,
    accuracy: 1,
    magsize: 12,
    reloadTime: 2000,
    image: makarov
  }),
  "Shotgun": () => ({
    name: "Shotgun",
    rpm: 40,
    fireModes: ["semi-auto"],
    caliber: "12x70",
    velocity: 6,
    accuracy: 0.2,
    magsize: 6,
    reloadTime: 6000,
    image: shotgun
  }),
  "SVD": () => ({
    name: "SVD",
    rpm: 600,
    fireModes: ["semi-auto"],
    caliber: "7.62x39",
    velocity: 20,
    accuracy: 1,
    magsize: 10,
    reloadTime: 4000,
    image: svd
  })
} as const

export const bullets: Record<string, BulletModel> = {
  "9x18": {
    caliber: "9x18",
    energy: 40,
    energyDrop: 2,
    maxRange: 500
  },
  "5.45x39": {
    caliber: "5.45x39",
    energy: 75,
    energyDrop: 1,
    maxRange: 1000
  },
  "7.62x39": {
    caliber: "7.62x39",
    energy: 110,
    energyDrop: 0.5,
    maxRange: 4500
  },
  "12x70": {
    caliber: "12x70",
    energy: 20,
    submunitions: 6,
    energyDrop: 0.5,
    maxRange: 400 
  }
} as const

export function energyDrop(bullet: BulletModel, distance: number) {
  if(distance < bullet.maxRange / 2) {
    return bullet.energy;
  }
  const offsetEnergy = bullet.energy * 2;
  return offsetEnergy + bullet.energyDrop * -distance * offsetEnergy / bullet.maxRange; 

}