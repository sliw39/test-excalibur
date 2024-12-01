import Yaml from 'yaml';
import { IWorld, IWorldLocation, IWorldPath } from './world.model';

export async function fromYamlFile(file: string): Promise<IWorld> {
    const yaml = Yaml.parse(await fetch(file).then((response) => response.text()));
    const locationsByName: Record<string, IWorldLocation> = Object.fromEntries(
        yaml.locations.map((loc: any) => [
            loc.name,
            { ...loc, paths: [] }
        ])
    );

    const world: IWorld = {
        locations: Object.values(locationsByName),
        paths: [],
        map: yaml.map,
        name: yaml.name,
        start: locationsByName[yaml.start]
    }

    // we need to link locations to paths and vice versa
    yaml.paths.forEach((path: any) => {
        const from = locationsByName[path.from];
        const to = locationsByName[path.to];
        if (from && to) {
            const p: IWorldPath = { from, to, kind: path.kind };
            from.paths = from.paths ?? [];
            from.paths.push(p);
            to.paths = to.paths ?? [];
            to.paths.push(p);
            world.paths.push(p);
        }   
    })

    return world;
}