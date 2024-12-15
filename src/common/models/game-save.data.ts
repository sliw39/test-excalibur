import Yaml from 'yaml';
import { IGameSave } from './game-save.model';

export function save(game: IGameSave) {
    game.date = new Date();
    const yaml = Yaml.stringify(game);
    localStorage.setItem(game.id, yaml);
    const saves = listSaveIds();
    if(!saves.includes(game.id)) {
        saves.push(game.id);
        localStorage.setItem('saves', JSON.stringify(saves));
    }
}
function listSaveIds() {
    let saves = localStorage.getItem('saves');
    if(!saves) {
        localStorage.setItem('saves', '[]');
        saves = '[]';
    }
    return JSON.parse(saves);
}
export function listSave(): {id: string, name: string, date: Date}[] {
    return listSaveIds().map((id: string) => {
        const save = localStorage.getItem(id);
        if(!save) return null;
        const game = JSON.parse(save);
        return {
            id,
            name: game.world.name,
            date: new Date(game.date)
        }
    }).filter((s: any) => s !== null);
}
export function load(id: string): IGameSave {
    return Yaml.parse(localStorage.getItem(id)!);
}
export function deleteSave(id: string) {
    localStorage.removeItem(id);
    const saves = listSaveIds().filter((s: string) => s !== id);
    localStorage.setItem('saves', JSON.stringify(saves));
}