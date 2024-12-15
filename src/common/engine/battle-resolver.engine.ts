import { Player, Stats } from "@models/player.model"
import { Die, PseudoRandomEngine } from "@engine/pseudo-random.engine"

const rand = new PseudoRandomEngine();
const difficulty = 1;

export function autoBattle(hazard: number, resources: number, defenders: Player[] = [], scavengers: Player[] = []): { loot: number, loss: number, net: number } {
  const totalPlayers = defenders.length + scavengers.length

  // generate oponents
  const oponents: Player[] = []
  const assaultTeams: Player[] = []
  for (let i = 0; i < totalPlayers; i++) {
    if (rand.next() < hazard) {
      const stats = randomStats();
      const ennemy = new Player(`Ennemy#${i}`, stats, [], stats.maxHealth);
      if (Die.coin(rand).roll() === 1) {
        oponents.push(ennemy)
      } else {
        assaultTeams.push(ennemy)
      }
    }
  }

  // battles
  round(defenders, assaultTeams)
  round(scavengers, oponents)

  // loot
  const result = {
    loot: Math.floor(25 * totalPlayers * resources * (rand.next() * 1.5 + 0.5)),
    loss: 25 * assaultTeams.length,
    net: 0
  }
  result.net = result.loot - result.loss
  return result
}

function randomStats(): Stats {
  return {
    maxHealth: rand.nextInt(50, difficulty * 100 + 50),
    strength: rand.nextInt(50, difficulty * 100 + 50),
    accuracy: rand.nextInt(50, difficulty * 100 + 50),
    agility: rand.nextInt(50, difficulty * 100 + 50),
    resistance: rand.nextInt(50, difficulty * 100 + 50),
    luck: rand.nextInt(50, difficulty * 100 + 50),
  } as const
}

function round(team1: Player[], team2: Player[]): void {
  const initiative = [...team1, ...team2]
  initiative.sort(() => rand.next() - 0.5)
  while (team1.length > 0 && team2.length > 0) {
    const atk = initiative.shift()!
    initiative.push(atk)
    const defteam = team1.includes(atk) ? team2 : team1
    const def = rand.pick(defteam)
    console.log(`${atk.name} attacks ${def.name}`)
    atkFn(atk, def)
    if (atk.dead) {
      team1.splice(team1.indexOf(atk), 1)
      initiative.splice(initiative.indexOf(atk), 1)
    }
    if (def.dead) {
      team2.splice(team2.indexOf(def), 1)
      initiative.splice(initiative.indexOf(def), 1)
    }
  }
}

function atkFn(atk: Player, def: Player): void {
  const isMelee = Math.floor(Math.random() * 2) == 0
  if (isMelee) {
    const atkAccuracyRoll = Die.d100(rand).roll() + atk.accuracy
    const defAgilityRoll = Die.d100(rand).roll() + def.agility
    if (atkAccuracyRoll > defAgilityRoll) {
      def.hit(atk.strength)
    }
  } else {
    const atkAccuracyRoll = Die.d100(rand).roll() + atk.accuracy
    const defLuckRoll = Die.d100(rand).roll() + def.luck
    if (atkAccuracyRoll > defLuckRoll) {
      def.hit(atk.strength)
    }
  }
}

