import { Loadable } from "excalibur"

export const resources: Loadable<any>[] = []

export function registerResource<T>(resource: Loadable<T>): Loadable<T> {
    resources.push(resource)
    return resource;
}