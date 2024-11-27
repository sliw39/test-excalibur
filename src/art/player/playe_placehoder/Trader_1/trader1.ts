import { ImageSource, SpriteSheet } from "excalibur";
import approvalUrl from "./Approval.png?url";
import dialogUrl from "./Dialogue.png?url";
import idleUrl from "./Idle.png?url";
import { registerResource } from "../../../../utils/assets.util";

const resources = {
    approval: new ImageSource(approvalUrl),
    dialog: new ImageSource(dialogUrl),
    idle: new ImageSource(idleUrl),
}
Object.values(resources).forEach(r => registerResource(r))

export const trader1 = {
    idle: SpriteSheet.fromImageSource({
        image: resources.idle,
        grid: {
            rows: 1,
            columns: 6,
            spriteWidth: 128,
            spriteHeight: 128
        }
    })
}