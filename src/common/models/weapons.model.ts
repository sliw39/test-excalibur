
export type FireMode = "auto" | "semi-auto" | "burst";
export interface Firearm {
  name: string;
  rpm: number;
  fireModes: FireMode[];
  velocity: number;
  accuracy: number;
  magsize: number;
  reloadTime: number;
}

export const firearms: Record<string, () => Firearm> = {
  "AK-47": () => ({
    name: "AK-47",
    rpm: 600,
    fireModes: ["burst", "semi-auto", "auto"],
    velocity: 10,
    accuracy: 1,
    magsize: 30,
    reloadTime: 3
  }),
  "Makarov": () => ({
    name: "Makarov",
    rpm: 250,
    fireModes: ["semi-auto"],
    velocity: 7,
    accuracy: 0.5,
    magsize: 12,
    reloadTime: 2
  }),
  "Shotgun": () => ({
    name: "Shotgun",
    rpm: 40,
    fireModes: ["semi-auto"],
    velocity: 6,
    accuracy: 0.2,
    magsize: 6,
    reloadTime: 10
  }),
  "SVD": () => ({
    name: "SVD",
    rpm: 600,
    fireModes: ["semi-auto"],
    velocity: 20,
    accuracy: 1.5,
    magsize: 10,
    reloadTime: 4
  })
}
